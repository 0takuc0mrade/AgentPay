import { AgentPaySDK, ethers } from "../dist/index.js";
import dotenv from "dotenv";
dotenv.config();

// CONFIGURATION (Only the Agent details, no Infra details)
const WORKER_ADDRESS = "0xc25d9ac0e2030c0f011494608126ebc5fa07dd1a";
const METADATA = "ipfs://bafkreic65g52r56474676435676435676435";
const CREATOR_KEY = process.env.PRIVATE_KEY!;

// Minimal ABI just for parsing the log (SDK hides the contract interactions)
const AGENT_EVENTS = [
    "event AgentRegistered(uint256 indexed agentId, address indexed creator, string metadataURI)"
];

async function main() {
    console.log("🚀 Initializing Zeta Registration (Zero-Config)...");

    // We don't need to pass a Provider anymore if using the raw key string,
    // but since we need to parse logs manually here, we set up a basic provider for utilities.
    const provider = new ethers.JsonRpcProvider("https://api.avax-test.network/ext/bc/C/rpc");
    const creatorWallet = new ethers.Wallet(CREATOR_KEY, provider);

    // --- STEP 1: REGISTER ---
    // Notice: We ONLY pass the Signer and Metadata. The SDK finds the contract.
    console.log("\n1. Registering Identity...");

    const receipt = await AgentPaySDK.registerAgent(
        creatorWallet,
        METADATA
    );

    if (!receipt) throw new Error("Transaction Failed");
    console.log(`✅ Transaction Mined: ${receipt.hash}`);

    // --- STEP 2: PARSE LOGS ---
    // We extract the ID from the receipt
    let agentId: number | null = null;
    const iface = new ethers.Interface(AGENT_EVENTS);

    for (const log of receipt.logs) {
        try {
            const parsedLog = iface.parseLog({
                topics: [...log.topics],
                data: log.data
            });
            if (parsedLog && parsedLog.name === "AgentRegistered") {
                agentId = Number(parsedLog.args.agentId);
                console.log(`🎯 FOUND AGENT ID: ${agentId}`);
                break;
            }
        } catch (e) { }
    }

    if (agentId === null) throw new Error("❌ ID not found in logs");

    // --- STEP 3: LINK WORKER ---
    // No contract address needed here either!
    console.log(`\n2. Linking Worker Wallet to Agent #${agentId}...`);

    await AgentPaySDK.setWorkerAddress(
        creatorWallet,
        agentId,
        WORKER_ADDRESS
    );
    console.log(`✅ Worker Linked!`);

    // --- STEP 4: ADD SERVICE ---
    console.log("\n3. Adding 'Zeta Compute' Service...");

    await AgentPaySDK.addService(
        creatorWallet,
        agentId,
        "Zeta High-Performance Compute",
        "500000" // 0.5 USDC
    );

    console.log(`\n🎉 Zeta (Agent #${agentId}) is LIVE on AgentPay!`);
}

main().catch(console.error);