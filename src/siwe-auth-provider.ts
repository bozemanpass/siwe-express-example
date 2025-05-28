import Credentials, { CredentialsConfig } from "@auth/core/providers/credentials";
import {AccessDenied} from "@auth/core/errors";
import {AuthError, ExpressAuth, ExpressAuthConfig, User} from "@auth/express";
import {parseMessage, SiweMessage, verify} from "simple-siwe"
import {SessionData, Store} from "express-session";
import cookie from "cookie";

/**
 * Load a user by their unique identifier (UID).
 */
export type UserLoader = {
    name: string,
    load: (uid: string) => Promise<User>
}

/**
 * Perform a sign-in check based on the SiwE message.
 */
export type SiweCheck = {
    name: string,
    check: (message: SiweMessage) => Promise<boolean>;
}


/**
 * Auth options for SiwE (Sign-in with Ethereum) authentication.
 */
export type SiweAuthOptions = Partial<ExpressAuthConfig> & {
    signinChecks?: SiweCheck[];
    userLoader?: UserLoader;
    sessionStore: Store;
}

/**
 * Custom error for SiwE access denied scenarios.
 * Extends the AccessDenied error from Auth.js.
 */
export class SiweAccessDenied extends AccessDenied {
    messageToShowUser: string | undefined;
    constructor(name: string, messageToShowUser?: string) {
        super(messageToShowUser || name);
        this.name = name;
        this.messageToShowUser = messageToShowUser;
    }
}

/**
 * Parses and verifies a SiwE message and signature.
 * @param message - The SiwE message to parse.
 * @param signature - The signature to verify.
 * @returns The parsed SiwE message.
 * @throws Error if the message is invalid or the signature is invalid.
 */
async function parseAndVerifyMessage(message: string, signature: string): Promise<SiweMessage> {
    const parsedMessage = parseMessage(message);
    if (!parsedMessage) {
        throw new Error("Invalid message");
    }

    const isValid = await verify({message, signature});
    if (!isValid) {
        throw new Error("Invalid signature");
    }

    return parsedMessage;
}


/**
 * SiwE auth provider for Auth.js
 * @param options - SiweAuthOptions
 * @returns CredentialsConfig
 */
export function SiweAuthProvider(options: SiweAuthOptions): CredentialsConfig {
    return Credentials({
        name: "SIWE",
        credentials: {
            message: {label: "Message", type: "text", placeholder: "0x0"},
            signature: {label: "Signature", type: "text", placeholder: "0x0"},
            session: {label: "", type: "object", placeholder: ""},
            sid: {label: "", type: "text", placeholder: ""},
        },
        async authorize(credentials, req) {
            if (credentials.session) {
                throw new AuthError("Session should not be provided in credentials, it will be extracted from the request.");
                return null;
            }

            const { message, signature } = credentials as { message: string; signature: string };
            const parsedMessage = await parseAndVerifyMessage(message, signature);
            const sid = getSessionIdFromRequest(req);
            const session = await getSessionBySessionId(sid!, options.sessionStore);

            const nonce = session.nonce;
            if (nonce !== parsedMessage.nonce) {
                if (sid) {
                    await saveErrorInSession(sid, session, options.sessionStore, new SiweAccessDenied('nonce'));
                }
                return null;
            }

            credentials.session = session;
            credentials.sid = sid;

            return {
                id: `${parsedMessage.chainId}:${parsedMessage.address}`,
            }
        },
    })
}


/**
 * SiwE auth configuration for Auth.js
 * @param options - SiweAuthOptions
 * @returns ExpressAuthConfig
 */
export function makeAuthConfig(options: SiweAuthOptions): ExpressAuthConfig {
    return {
        ...options,
        providers: [
            SiweAuthProvider(options)
        ],
        secret: process.env.AUTH_SECRET || "your-secret-key",
        session: {
            strategy: "jwt",
        },
        callbacks: {
            async signIn({credentials}) {
                const { message, signature, session, sid } = credentials as
                    { message: string; signature: string; session: SessionData; sid: string };
                const parsedMessage = await parseAndVerifyMessage(message, signature);

                if (options?.signinChecks) {
                    try {
                        for (const checker of options.signinChecks) {
                            if (!await checker.check(parsedMessage)) {
                                await saveErrorInSession(sid, session, options.sessionStore, new SiweAccessDenied(checker.name));
                                return false;
                            }
                        }
                    } catch (e) {
                       console.error(e);
                       return false;
                    }
                }

                return true;
            },
            async session({session, token}) {
                let user: User;
                if (options?.userLoader) {
                    user = await options?.userLoader.load(token.sub!);
                    console.log("Loaded user:", user);
                } else {
                    user = {
                        id: token.sub!,
                    }
                    console.log("Constructed user:", user);
                }
                // @ts-expect-error  tsc is flummoxed by our simplified user object, but it is fine for this purpose.
                session.user = user;
                return session;
            },
        }
    };
}


/**
 * SiwE auth handler for Express
 * @param options - SiweAuthOptions
 * @returns ExpressAuth
 */
export function SiweAuth(options: SiweAuthOptions) {
    return ExpressAuth(makeAuthConfig(options));
}


// These are utility functions to handle session ID extraction and session management.

/**
 * Retrieves a session by its session ID from the session store.
 * @param sessionId
 * @param sessionStore
 */
function getSessionBySessionId(sessionId: string, sessionStore: Store): Promise<SessionData> {
    return new Promise((resolve, reject) => {
        sessionStore.get(sessionId, (err: Error, session: SessionData | null | undefined) => {
            if (err) {
                reject(err);
            } else if (!session) {
                reject(new Error("Session not found"));
            } else {
                resolve(session);
            }
        });
    });
}

/**
 * Get the session ID from the request (eg, by parsing the cookie).
 * @param req
 */
function getSessionIdFromRequest(req: Request): string | null {
    const cookies = req.headers.get('cookie');
    if (!cookies) return null;

    const parsedCookies = cookie.parse(cookies);
    const connectSid = parsedCookies['connect.sid'];
    if (connectSid) {
        return connectSid.startsWith('s:') ? connectSid.slice(2).split('.')[0] : connectSid;
    }
    return null;
}

/**
 * Saves an error in the session data and updates the session store.
 * @param sid
 * @param session
 * @param sessionStore
 * @param error
 */
function saveErrorInSession(
    sid: string,
    session: SessionData,
    sessionStore: Store,
    error: Error,
): Promise<SessionData> {
    return new Promise((resolve, reject) => {
        session.error = error;
        sessionStore.set(sid, session, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(session);
            }
        });
    });
}