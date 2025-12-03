import { AgentPaySDK } from "./index.js";
import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

// --- 1. CONFIGURATION ---
// Paste your Deployed Contract Address here
const CONTRACT_ADDRESS = "0x49846bac01d20c2b8a0e5647b48974fbf990a103";

// Agent ID (Must be an ID you registered via setup-agent.ts)
// Use the agentId from setup-agent.ts output, or set via env var
const AGENT_ID = Number(process.env.AGENT_ID || "1");

// --- 2. WALLETS ---
// A. Facilitator: Needs AVAX to pay gas for the settlement transaction
const FACILITATOR_KEY = (process.env.PRIVATE_KEY || "").trim().replace(/;$/, "");

// B. Worker: The Agent's Wallet (Must match what you set in setWorkerAddress)
// For this test, you can paste the private key of the wallet you authorized as the worker
const AGENT_WORKER_KEY = (process.env.WORKER_KEY || "").trim().replace(/;$/, "");

// C. User: Needs USDC on Fuji to pay
// You can generate a random one, but you must send it Testnet USDC first!
const USER_KEY = (process.env.USER_KEY || "").trim().replace(/;$/, "");

async function run() {
    console.log("🚀 Starting AgentPay Integration Test...");

    // Initialize SDK with Facilitator (Gas Payer)
    const sdk = new AgentPaySDK(FACILITATOR_KEY, CONTRACT_ADDRESS);

    // --- STEP 1: CLIENT SIDE (User + Agent) ---
    // Simulates the User authorizing payment and Agent authorizing review
    console.log("\n1. ✍️  Generating Off-Chain Signatures...");

    // Note: We use "100000" (0.1 USDC) because Fuji USDC has 6 decimals
    const header = await AgentPaySDK.generatePaymentHeader(
        USER_KEY,
        AGENT_WORKER_KEY,
        CONTRACT_ADDRESS,
        AGENT_ID,
        "100000", // 0.1 USDC
        "weather-service" // Category tag
    );

    console.log("   Payload generated successfully!");
    console.log("   Header length:", header.length, "chars");

    // --- STEP 2: SERVER SIDE (Facilitator) ---
    // Simulates the API Gateway receiving the header and submitting to blockchain
    console.log("\n2. 🔗 Submitting to Avalanche Fuji...");

    try {
        const txHash = await sdk.settlePayment(header);
        console.log(`\n✅ SUCCESS! Transaction Confirmed.`);
        console.log(`🔎 View on Snowtrace: https://testnet.snowtrace.io/tx/${txHash}`);
    } catch (error) {
        console.error("\n❌ TEST FAILED:", error);
    }
}

run();