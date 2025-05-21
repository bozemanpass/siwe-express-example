import cookie from "cookie";
import {Store} from "express-session";
import {SiweMessage} from "simple-siwe";

import {MessageChecker} from "../siwe-auth-provider.js";

function parseSessionId(connectSid: string): string {
    if (connectSid.startsWith('s:')) {
        return connectSid.slice(2).split('.')[0]; // Remove 's:' and split to get the session ID
    }
    return connectSid;
}

function getSessionIdFromRequest(req: Request): string | null {
    const cookies = req.headers.get('cookie');
    if (!cookies) return null;

    const parsedCookies = cookie.parse(cookies);
    const connectSid = parsedCookies['connect.sid'];
    return connectSid ? parseSessionId(connectSid) : null;
}

/**
 * Makes sure that the nonce in the SiwE message matches the nonce stored in the session.
 * @param sessionStore - The session store to use for retrieving the session.
 * @returns a function that checks the nonce.
 */
export function matchSessionNonce(sessionStore: Store): MessageChecker {
    return (message: SiweMessage, req: Request) => {
        const sessionId = getSessionIdFromRequest(req);
        if (!sessionId) {
            throw new Error("Session ID not found in request");
        }
        return new Promise((resolve, reject) => {
            sessionStore.get(sessionId, (err, session) => {
                if (err) {
                    reject(err);
                } else if (!session) {
                    reject(new Error("Session not found"));
                } else {
                    const nonce = session.nonce;
                    if (nonce !== message.nonce) {
                        console.log(`Nonce MISMATCH: expected ${nonce}, got ${message.nonce}`);
                        resolve(false);
                    } else {
                        console.log(`Nonce match: ${nonce}`);
                        resolve(true);
                    }
                }
            });
        });
    }
}