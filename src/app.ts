import {ethers} from "ethers";
import express, {Request, Response} from 'express';
import session, {MemoryStore} from 'express-session';
import path from 'path';
import {generateNonce } from "simple-siwe";
import { fileURLToPath } from 'url';

import {authenticatedUser, currentSession} from "./authjs-middleware.js";
import {SiweAuth, SiweAuthConfigOptions} from "./siwe-auth-provider.js";
import {matchSessionNonce} from "./nonce-util.js";
import {matchAddressInContract} from "./address-in-contract.js";

declare module 'express-session' {
    interface SessionData {
        nonce: string;
    }
}

const app = express();
const sessionStore = new MemoryStore();

// Configure session
app.use(
    session({
        secret: process.env.SESSION_SECRET_KEY || 'your-secret-key',
        resave: false,
        saveUninitialized: false,
        store: sessionStore,
    })
);

// Set the view engine to EJS
app.set('views', path.join(path.dirname(fileURLToPath(import.meta.url)), 'views'));
app.set('view engine', 'ejs');

const authOptions: SiweAuthConfigOptions = {
    messageChecks: [
        // Check that the message nonce is tied to this session.
        matchSessionNonce(sessionStore)
    ],
    signinChecks: [
        // Check that the address has been whitelisted in the contract.
        matchAddressInContract(
            process.env.WHITELIST_CONTRACT_ADDRESS || "0x2B6AFbd4F479cE4101Df722cF4E05F941523EaD9",
            new ethers.JsonRpcProvider(
                process.env.ETHEREUM_RPC_URL || "http://localhost:8545"
            )
        )
    ],
    userLoader: async (id: string) => {
        // Simulate a user lookup
        const name = id.split("0x")[1];
        return {
            id, name, email: name + "@example.com"
        }
    }
};

app.use(currentSession(authOptions));
app.use("/siwe/auth/*", SiweAuth(authOptions));

// Home route
app.get('/', (req: Request, res: Response) => {
    res.render("index.ejs", { user: res.locals.session?.user.id });
});

// Protected route
app.get('/protected', authenticatedUser(authOptions), (req: Request, res: Response) => {
    res.render("protected.ejs", { user: res.locals.session?.user.id });
});

// nonce route
app.get('/siwe/nonce', (req: Request, res: Response) => {
    const nonce = generateNonce();
    req.session.nonce = nonce;
    res.json({nonce});
});

// Start the server
const PORT = process.env.PORT || 3200;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
