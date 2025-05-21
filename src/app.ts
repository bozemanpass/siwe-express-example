import {ethers} from "ethers";
import express, {Request, Response} from 'express';
import session, {MemoryStore} from 'express-session';
import path from 'path';
import {generateNonce } from "simple-siwe";
import { fileURLToPath } from 'url';

import {sameNetwork, addressListedInContract} from "./checks/eth-checks.js";
import {matchSessionNonce} from "./checks/nonce-checks.js";
import {authenticatedUser, currentSession} from "./authjs-middleware.js";
import {SiweAuth, SiweAuthOptions} from "./siwe-auth-provider.js";

declare module 'express-session' {
    interface SessionData {
        nonce: string;
    }
}

const app = express();

// Shared Ethereum provider
const ethProvider = new ethers.JsonRpcProvider(
    process.env.ETHEREUM_RPC_URL || "http://localhost:8545"
);

// Configure session
const sessionStore = new MemoryStore();
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

// Specify SiwE authentication checks and options
const authOptions: SiweAuthOptions = {
    messageChecks: [
        // Check that the message nonce is the same as the one tied to this session.
        matchSessionNonce(sessionStore)
    ],
    signinChecks: [
        // Check that the SiwE message chain ID is the same as our provider's chain ID.
        sameNetwork(ethProvider),

        // Check that the address has been whitelisted in the specified contract.
        addressListedInContract(
            process.env.WHITELIST_CONTRACT_ADDRESS || "0x2B6AFbd4F479cE4101Df722cF4E05F941523EaD9",
            ethProvider
        )
    ],
    userLoader: async (uid: string) => {
        // This is where you would load the user from your database, but we'll just simulate that here.
        return {
            id: uid,
            name: uid,
            email: `${uid}@example.com`,
        }
    }
};

// Keep res.locals.session updated.
app.use(currentSession(authOptions));

// Attach the SiweAuth handler for all the authentication routes (signin, signout, etc.)
app.use("/siwe/auth/*", SiweAuth(authOptions));

// Home route
app.get('/', (req: Request, res: Response) => {
    res.render("index.ejs", { user: res.locals.session?.user.id });
});

// Protected route (to demonstrate a route requiring authentication)
app.get('/protected', authenticatedUser(authOptions), (req: Request, res: Response) => {
    res.render("protected.ejs", { user: res.locals.session?.user.id });
});

// nonce route (needs to be called by the client before signing the SiwE message)
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
