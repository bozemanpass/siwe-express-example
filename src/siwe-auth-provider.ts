import Credentials, { CredentialsConfig } from '@auth/core/providers/credentials';
import {ExpressAuth, ExpressAuthConfig, User} from "@auth/express";
import {parseMessage, SiweMessage, verify} from 'simple-siwe'

export interface SiweProviderOptions {
    messageChecks?: MessageChecker[];
    signinChecks?: SigninChecker[];
    userLoader?: UserLoader;
}

export interface SiweAuthConfigOptions extends SiweProviderOptions {}


export type MessageChecker = (message: SiweMessage, req: Request) => Promise<boolean>;
export type UserLoader = (id: string) => Promise<User>;
export type SigninChecker = (address: string, chainId: number) => Promise<boolean>;

async function parseAndVerifyMessage(message: string, signature: string): Promise<SiweMessage> {
    const parsedMessage = parseMessage(message);
    if (!parsedMessage) {
        throw new Error('Invalid message');
    }

    const isValid = await verify({message, signature});
    if (!isValid) {
        throw new Error('Invalid signature');
    }

    return parsedMessage;
}

export function SiweAuthProvider(options?: SiweProviderOptions): CredentialsConfig {
    return Credentials({
        name: 'SIWE',
        credentials: {
            message: {label: 'Message', type: 'text', placeholder: '0x0'},
            signature: {label: 'Signature', type: 'text', placeholder: '0x0'},
        },
        async authorize(credentials, req) {
            const { message, signature } = credentials as { message: string; signature: string };
            const parsedMessage = await parseAndVerifyMessage(message, signature);

            if (options?.messageChecks) {
                for (const check of options.messageChecks) {
                    if (!await check(parsedMessage, req)) {
                        throw new Error('Message check failed');
                    }
                }
            }

            return {
                id: `${parsedMessage.chainId}:${parsedMessage.address}`
            }
        },
    })
}


export function SiweAuthConfig(options?: SiweAuthConfigOptions): ExpressAuthConfig {
    return {
        providers: [
            SiweAuthProvider(options)
        ],
        secret: process.env.AUTH_SECRET || 'your-secret-key',
        session: {
            strategy: "jwt",
        },
        callbacks: {
            async signIn({user, credentials}) {
                const { message, signature } = credentials as { message: string; signature: string };
                const parsedMessage = await parseAndVerifyMessage(message, signature);

                const { address, chainId } = parsedMessage;
                if (options?.signinChecks) {
                    for (const check of options.signinChecks) {
                        if (!await check(address, chainId)) {
                            console.log(`Sign-in for address ${address} and chainId ${chainId} was REJECTED`);
                            return false;
                        }
                    }
                }

                return true;
            },
            async session({session, token}) {
                let user;
                if (options?.userLoader) {
                    user = await options?.userLoader(token.sub!);
                    console.log("User loaded:", user);
                } else {
                    user = {
                        id: token.sub!,
                        name: token.sub!,
                        email: token.sub!,
                    }
                }
                // @ts-ignore
                session.user = {
                    emailVerified: null,
                    ...user,
                }
                return session;
            },
        }
    };
}


export function SiweAuth(options?: SiweAuthConfigOptions) {
    return ExpressAuth(SiweAuthConfig(options));
}