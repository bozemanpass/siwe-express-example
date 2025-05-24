import {ethers} from "ethers";
import express, {Request, Response} from 'express';
import session, {MemoryStore} from 'express-session';
import path from 'path';
import {generateNonce } from "simple-siwe";
import { fileURLToPath } from 'url';

import {sameNetwork, addressListedInContract, minimumBalance, sayYes} from "./checks/eth-checks.js";
import {matchSessionNonce} from "./checks/nonce-checks.js";
import {authenticatedUser, currentSession} from "./authjs-middleware.js";
import {SiweAuth, SiweAuthOptions} from "./siwe-auth-provider.js";

import {faucet, whitelistAddress, blacklistAddress} from "./demo/faucet.js";

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

// Allow for proxies
app.enable('trust proxy');

// Configure middleware to parse JSON.
app.use(express.json());

// Configure static file serving.
app.use(express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), 'public')));

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

const sameNetworkRequired = "false" !== process.env.REQUIRE_SAME_NETWORK;
const whitelistRequired = !!process.env.WHITELIST_CONTRACT_ADDRESS;
const minimumBalanceRequired = BigInt(process.env.MINIMUM_ACCOUNT_BALANCE || "0") > BigInt(0);

// Specify SiwE authentication checks and options
const authOptions: SiweAuthOptions = {
    messageChecks: [
        // Check that the message nonce is the same as the one tied to this session.
        matchSessionNonce(sessionStore)
    ],
    signinChecks: [
        // Check that the SiwE message chain ID is the same as our provider's chain ID.
        sameNetworkRequired ? sameNetwork(ethProvider) : sayYes,

        // Check that the address has been whitelisted in the specified contract (if set).
        whitelistRequired ? addressListedInContract(process.env.WHITELIST_CONTRACT_ADDRESS!, ethProvider) : sayYes,

        // Check that the account has the minimum required balance (<= "0" means no requirement).
        minimumBalanceRequired ?
            minimumBalance(BigInt(process.env.MINIMUM_ACCOUNT_BALANCE!), ethProvider) : sayYes
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
    res.render("index.ejs", {
        user: res.locals.session?.user.id,
        whitelistRequired,
        sameNetworkRequired,
        minimumBalanceRequired,
    });
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


// These routes are simply to make the SiwE demo easy to use.
// They are completely insecure and unauthenticated.
app.post('/faucet/whitelist', async (req: Request, res: Response) => {
    const { address } = req.body;
    if (!address) {
        return res.status(400).json({ error: 'Address is required' });
    }

    try {
        await whitelistAddress(address, ethProvider);
        res.status(200).json({ "ok": true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ "ok": false, error: e });
    }
});

app.post('/faucet/blacklist', async (req: Request, res: Response) => {
    const { address } = req.body;
    if (!address) {
        return res.status(400).json({ error: 'Address is required' });
    }
    try {
        await blacklistAddress(address, ethProvider);
        res.status(200).json({ "ok": true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ "ok": false, error: e });
    }
});

app.post('/faucet/fund', async (req: Request, res: Response) => {
    const { address } = req.body;
    if (!address) {
        return res.status(400).json({ error: 'Address is required' });
    }
    try {
        await faucet(address, ethProvider);
        res.status(200).json({ "ok": true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ "ok": false, error: e });
    }
});

// Start the server
const LISTEN_PORT = parseInt(process.env.LISTEN_PORT || "3200");
const LISTEN_ADDR = process.env.LISTEN_ADDR || "0.0.0.0";
app.listen(LISTEN_PORT, LISTEN_ADDR, () => {
    console.log(`Server is running on http://${LISTEN_ADDR}:${LISTEN_PORT}`);
});
