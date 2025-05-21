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
        res.status(401).json({message: "Not Authenticated"})
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
