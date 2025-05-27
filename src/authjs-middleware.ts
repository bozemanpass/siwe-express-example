import { getSession } from "@auth/express"
import type { NextFunction, Request, Response } from "express"

import {makeAuthConfig, SiweAuthOptions} from "./siwe-auth-provider.js";

// This middleware checks if the user is authenticated and redirects to an "Access Denied" page if not.
export function authenticatedUser(authOptions: SiweAuthOptions) {
    const authConfig = makeAuthConfig(authOptions);
    return async ( req: Request, res: Response, next: NextFunction) => {
        const session = res.locals.session ?? (await getSession(req, authConfig)) ?? undefined
        res.locals.session = session
        if (session) {
            return next()
        }
        res.redirect("/siwe/auth/error?error=AccessDenied");
    }
}

// This middleware makes sure the session is available at res.locals.session
export function currentSession(authOptions: SiweAuthOptions) {
    const authConfig = makeAuthConfig(authOptions);
    return async (req: Request, res: Response, next: NextFunction) => {
        const session = (await getSession(req, authConfig)) ?? undefined
        res.locals.session = session
        return next()
    }
}
