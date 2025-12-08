import { GoogleGenerativeAI } from "@google/generative-ai";
import { AgentPaySDK, ethers } from "sdk";
import * as readline from "readline";
import dotenv from "dotenv";

dotenv.config();

// --- CONFIGURATION ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const ATLAS_PRIVATE_KEY = process.env.ATLAS_PRIVATE_KEY!;
const WORKER_KEY = process.env.WORKER_KEY!; // Agent 1's Key (Seller)
const CONTRACT_ADDRESS = "0x49846bac01d20c2b8a0e5647b48974fbf990a103";

// The "Vending Machine" URL (Your test-server.ts)
const SERVICE_ENDPOINT = "http://localhost:3000/weather";

const PROVIDER = new ethers.JsonRpcProvider("https://api.avax-test.network/ext/bc/C/rpc");
const READ_ABI = [
    "function getServices(uint256 agentId) view returns (tuple(string name, uint256 price, bool active)[])"
];

// --- DYNAMIC REGISTRY ---
interface AgentService {
    id: number;
    name: string;
    price: string;
    tags: string[];
}

let LIVE_REGISTRY: AgentService[] = [];

// --- 1. INDEXER: FIND SERVICES ON-CHAIN ---
async function fetchServicesFromChain() {
    console.log("📡 Atlas: Scanning Avalanche Blockchain for services...");
    const contract = new ethers.Contract(CONTRACT_ADDRESS, READ_ABI, PROVIDER);
    const SCAN_LIMIT = 5;
    const foundServices: AgentService[] = [];

    for (let i = 0; i < SCAN_LIMIT; i++) {
        try {
            const services = await contract.getServices(i);
            if (services && services.length > 0) {
                services.forEach((s: any) => {
                    if (s.active) {
                        foundServices.push({
                            id: i,
                            name: s.name,
                            price: ethers.formatUnits(s.price, 6),
                            tags: s.name.toLowerCase().split(" ")
                        });
                    }
                });
            }
        } catch (e) { }
    }
    console.log(`✅ Atlas: Found ${foundServices.length} active services on-chain.`);
    return foundServices;
}

// --- 2. BRAIN: GEMINI ---
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Or gemini-2.0-flash

function getSystemPrompt() {
    return `
You are Atlas, an autonomous buyer.
You have a crypto wallet. Your job is to find and buy data services.

AVAILABLE SERVICES (ON-CHAIN):
${JSON.stringify(LIVE_REGISTRY, null, 2)}

INSTRUCTIONS:
1. Analyze user request.
2. Match it to a service in the list.
3. Output JSON ONLY:
   { "action": "PAY", "agentId": 1, "amount": "0.1", "serviceName": "Weather Data" }
`;
}

// --- 3. LOOP ---
async function processInput(userInput: string) {
    const result = await model.generateContent([
        { text: getSystemPrompt() },
        { text: `User says: "${userInput}"` }
    ]);
    const responseText = result.response.text();

    try {
        const cleanJson = responseText.replace(/```json|```/g, "").trim();
        if (cleanJson.startsWith("{")) {
            const command = JSON.parse(cleanJson);
            if (command.action === "PAY") {
                console.log(`\n🤖 Atlas: "Match found: ${command.serviceName}."`);
                console.log(`   "Buying data from Agent #${command.agentId}..."`);
                await executePayment(command);
                return;
            }
        }
    } catch (e) { }

    console.log(`\n🤖 Atlas: ${responseText}`);
}

// --- 4. EXECUTION (REAL PAYMENT) ---
async function executePayment(cmd: any) {
    console.log(`   - Wallet: Connecting...`);

    // We convert the AI's price (0.1) back to Wei (100000)
    const amountWei = ethers.parseUnits(cmd.amount, 6).toString();

    console.log(`   - SDK: Generating Atomic Payment Header...`);

    // Generate the "Cheque"
    const header = await AgentPaySDK.generatePaymentHeader(
        ATLAS_PRIVATE_KEY, // Payer
        WORKER_KEY,        // Seller (Agent #1)
        CONTRACT_ADDRESS,
        cmd.agentId,
        amountWei,
        cmd.serviceName
    );

    console.log(`   - Network: Sending HTTP Request to Service...`);

    try {
        // HIT THE REAL SERVER
        const response = await fetch(SERVICE_ENDPOINT, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "x-payment": header // <--- The Magic Header
            }
        });

        const data = await response.json();

        if (response.status === 200) {
            console.log(`\n✅ SUCCESS! Data Purchased & Retrieved.`);
            console.log(`-----------------------------------------------`);
            console.log(`📦 DATA PAYLOAD: "${data.data}"`);
            console.log(`-----------------------------------------------`);
            console.log(`🔗 Blockchain Proof: https://testnet.snowtrace.io/tx/${data.receipt.txHash}`);
        } else {
            console.error(`❌ Server Rejected Payment: ${JSON.stringify(data)}`);
        }

    } catch (error: any) {
        console.error(`❌ Connection Error: Is the server running on localhost:3000?`);
        console.error(error.message);
    }
}

// --- INIT ---
async function start() {
    LIVE_REGISTRY = await fetchServicesFromChain();
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    console.log("============================================");
    console.log("🤖 ATLAS AGENT ONLINE.");
    console.log("   Target: Real HTTP Server (localhost:3000)");
    console.log("============================================");

    function ask() {
        rl.question("\nYou: ", async (input) => {
            if (input.toLowerCase() === "exit") process.exit(0);
            await processInput(input);
            ask();
        });
    }
    ask();
}

start();