import { AgentPaySDK, ethers } from "../dist/index.js";
import dotenv from "dotenv";
dotenv.config();

// --- CONFIGURATION FOR ALPHA ---
// 1. Generate a NEW wallet for Alpha so he has his own "cash register"
// Run: node -e "console.log(require('ethers').Wallet.createRandom().address)"
// OR just use another random address you control.
const WORKER_ADDRESS = "0x8c62474dc7cf702a6fe5e0376a7c422d47ee934c";

// 2. Metadata for Alpha (Sports Agent)
const METADATA = "ipfs://alpha-sports-metadata-hash";

// 3. Creator Key (Pays the 5 USDC fee)
const CREATOR_KEY = process.env.PRIVATE_KEY!;

// Events for log parsing
const AGENT_EVENTS = [
    "event AgentRegistered(uint256 indexed agentId, address indexed creator, string metadataURI)"
];

async function main() {
    console.log("🚀 Initializing Alpha (Sports Agent) Registration...");

    const provider = new ethers.JsonRpcProvider("https://api.avax-test.network/ext/bc/C/rpc");
    const creatorWallet = new ethers.Wallet(CREATOR_KEY, provider);

    // --- STEP 1: REGISTER ---
    console.log("\n1. Registering Identity...");

    // SDK automatically handles the 5 USDC approval & transfer
    const receipt = await AgentPaySDK.registerAgent(
        creatorWallet,
        METADATA
    );

    if (!receipt) throw new Error("Transaction Failed");
    console.log(`✅ Transaction Mined: ${receipt.hash}`);

    // --- STEP 2: PARSE LOGS (Find Alpha's ID) ---
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
                console.log(`🎯 FOUND NEW AGENT ID: ${agentId}`);
                break;
            }
        } catch (e) { }
    }

    if (agentId === null) throw new Error("❌ ID not found in logs");

    // --- STEP 3: LINK WORKER ---
    console.log(`\n2. Linking Worker Wallet to Agent #${agentId}...`);

    await AgentPaySDK.setWorkerAddress(
        creatorWallet,
        agentId,
        WORKER_ADDRESS
    );
    console.log(`✅ Worker Linked!`);

    // --- STEP 4: ADD SERVICE ---
    console.log("\n3. Adding 'Alpha Sports Feed' Service...");

    await AgentPaySDK.addService(
        creatorWallet,
        agentId,
        "Alpha Premium Sports Feed", // <--- Updated Name
        "200000" // 0.2 USDC (Cheaper than Zeta!)
    );

    console.log(`\n🎉 Alpha (Agent #${agentId}) is LIVE!`);
    console.log(`   Service: Sports Feed`);
    console.log(`   Price: 0.2 USDC`);
}

main().catch(console.error);