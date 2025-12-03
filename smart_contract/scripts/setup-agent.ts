import { network } from "hardhat";
import { isAddress, encodeAbiParameters } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

// Edit these constants or set via env before running
const CONTRACT_ADDRESS = "0x49846bac01d20c2b8a0e5647b48974fbf990a103";
const AGENT_WORKER_ADDRESS = "0xc25d9ac0e2030c0f011494608126ebc5fa07dd1a";

const { viem, networkName } = await network.connect();
const client = await viem.getPublicClient();

console.log(`\n🚀 Setting up Agent on ${networkName}...`);

// Validate inputs
if (!isAddress(CONTRACT_ADDRESS)) {
  console.error("❌ ERROR: CONTRACT_ADDRESS is not a valid Ethereum address.");
  console.error("   Set CONTRACT_ADDRESS env var or edit the script.");
  process.exit(1);
}

if (!isAddress(AGENT_WORKER_ADDRESS)) {
  console.error("❌ ERROR: AGENT_WORKER_ADDRESS is not a valid Ethereum address.");
  console.error("   Set AGENT_WORKER_ADDRESS env var or edit the script.");
  process.exit(1);
}

// get deployer wallet client
const [deployerClient] = await viem.getWalletClients();
console.log("Deployer address:", deployerClient.account.address);

// Check if contract exists (ensure it's deployed at CONTRACT_ADDRESS)
console.log("\nChecking if contract is deployed at", CONTRACT_ADDRESS);
const code = await client.getCode({ address: CONTRACT_ADDRESS as `0x${string}` });
if (!code || code === "0x") {
  console.error("❌ ERROR: No contract found at", CONTRACT_ADDRESS);
  console.error("   Ensure CONTRACT_ADDRESS is correct and contract is deployed.");
  process.exit(1);
}
console.log("✓ Contract code verified at", CONTRACT_ADDRESS);

// Connect to already-deployed contract
console.log("Attaching to AgentProtocol...");
const agentProtocol = await viem.getContractAt("AgentProtocol", CONTRACT_ADDRESS);

// 1) Register the agent
console.log("\n📝 1) Registering agent (identity)");
const metadataURI = process.env.AGENT_METADATA || "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";

let agentId: bigint = 0n;

try {
  const txReg = await agentProtocol.write.registerAgent([
    deployerClient.account.address,
    metadataURI,
  ], { account: deployerClient.account.address });

  console.log("Transaction sent:", txReg);
  console.log("Waiting for registerAgent tx to confirm...");
  const receipt = await client.waitForTransactionReceipt({ hash: txReg, confirmations: 1 });

  // Extract agentId from Transfer event (ERC721 mint)
  if (receipt && receipt.logs && receipt.logs.length > 0) {
    for (let i = 0; i < receipt.logs.length; i++) {
      const log = receipt.logs[i];
      // Transfer event signature: 0xddf252ad1be2c89b69c2b068fc378daf8d499b1a6db0a9f3c3de45e3a04e40f
      if (log.topics[0] === "0xddf252ad1be2c89b69c2b068fc378daf8d499b1a6db0a9f3c3de45e3a04e40f") {
        if (log.topics[3]) {
          agentId = BigInt(log.topics[3]);
          console.log(`✅ Agent registered! ID extracted from Transfer event: ${agentId}`);
          break;
        }
      }
    }
  }

  // Fallback: if still 0, try querying balanceOf
  if (agentId === 0n) {
    console.warn("⚠ Could not extract from Transfer event, checking balanceOf...");
    try {
      const balance = await agentProtocol.read.balanceOf([deployerClient.account.address]);
      if (balance > 0n) {
        agentId = balance - 1n;
        console.log(`✅ Using agentId: ${agentId} (based on owner's balance)`);
      } else {
        console.warn("⚠ Could not determine agentId. Using agentId = 0");
        agentId = 0n;
      }
    } catch (e) {
      console.warn("⚠ Could not query balanceOf. Using agentId = 0");
      agentId = 0n;
    }
  }
} catch (error) {
  console.error("❌ Error during registerAgent:", error instanceof Error ? error.message : error);
  process.exit(1);
}

// 2) Set worker address
console.log("\n👤 2) Setting worker address for agentId", agentId.toString());
try {
  const txWorker = await agentProtocol.write.setWorkerAddress([agentId, AGENT_WORKER_ADDRESS as `0x${string}`], { account: deployerClient.account.address });
  console.log("Transaction sent:", txWorker);
  await client.waitForTransactionReceipt({ hash: txWorker, confirmations: 1 });
  console.log("✅ Worker address set to", AGENT_WORKER_ADDRESS);
} catch (error) {
  console.error("❌ Error setting worker address:", error instanceof Error ? error.message : error);
  process.exit(1);
}

// 3) Add a service
console.log("\n📦 3) Adding a service to the agent");
const serviceName = "Premium Weather API";
const servicePrice = BigInt(Number(process.env.SERVICE_PRICE_UNITS || "100000")); // default 100000 units (0.1 USDC with 6 decimals)

try {
  const txService = await agentProtocol.write.addService([agentId, serviceName, servicePrice], { account: deployerClient.account.address });
  console.log("Transaction sent:", txService);
  await client.waitForTransactionReceipt({ hash: txService, confirmations: 1 });
  console.log("✅ Service added:", serviceName, "| price units:", servicePrice.toString());
} catch (error) {
  console.error("❌ Error adding service:", error instanceof Error ? error.message : error);
  process.exit(1);
}

// 4) Read back services
console.log("\n📋 4) Reading services for agent", agentId.toString());
try {
  const services = await agentProtocol.read.getServices([agentId]);
  console.log("✓ Current services for agent:");
  for (let i = 0; i < services.length; i++) {
    const s = services[i];
    console.log(`   [${i}] name="${s.name}" | price=${s.price} units | active=${s.active}`);
  }
} catch (error) {
  console.error("❌ Error reading services:", error instanceof Error ? error.message : error);
  process.exit(1);
}

console.log("\n🎉 Setup complete! Agent is ready for operations.");
console.log("Summary:");
console.log("  Network:", networkName);
console.log("  Contract:", CONTRACT_ADDRESS);
console.log("  Agent ID:", agentId.toString());
console.log("  Worker:", AGENT_WORKER_ADDRESS);

export {};
