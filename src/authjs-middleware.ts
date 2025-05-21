// @ts-nocheck
import { getSession } from "@auth/express"
import type { NextFunction, Request, Response } from "express"

import {SiweAuthConfig, SiweAuthConfigOptions} from "./siwe-auth-provider.js";

export function authenticatedUser(authOptions: SiweAuthConfigOptions) {
    const authConfig = SiweAuthConfig(authOptions);
    return async ( req: Request, res: Response, next: NextFunction) => {
        const session = res.locals.session ?? (await getSession(req, authConfig)) ?? undefined
        res.locals.session = session
        if (session) {
            return next()
        }
        res.redirect("/siwe/auth/error?error=AccessDenied");
    }
}

export function currentSession(authOptions: SiweAuthConfigOptions) {
    const authConfig = SiweAuthConfig(authOptions);
    return async (req: Request, res: Response, next: NextFunction) => {
        const session = (await getSession(req, authConfig)) ?? undefined
        res.locals.session = session
        return next()
    }
}
