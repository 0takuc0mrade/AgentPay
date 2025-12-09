import { network } from "hardhat";

async function main() {
  const { viem, networkName } = await network.connect();
  const publicClient = await viem.getPublicClient();

  console.log(`\nDeploying AgentProtocol to ${networkName}...`);

  // --- CONFIGURATION ---
  const FUJI_USDC_ADDRESS = "0x5425890298aed601595a70ab815c96711a31bc65";
  const TREASURY_ADDRESS = "0x50502b7ef7c8c488861178db892318c76c5e8c3f"; // Your Wallet

  // Log deployer info
  const [deployerClient] = await viem.getWalletClients();
  console.log("Deployer address:", deployerClient.account.address);

  // --- DEPLOYMENT ---
  console.log("\nDeploying AgentProtocol...");
  // Pass BOTH arguments: [USDC, TREASURY]
  const agentProtocol = await viem.deployContract("AgentProtocol", [
    FUJI_USDC_ADDRESS,
    TREASURY_ADDRESS
  ]);

  console.log("✅ AgentProtocol address:", agentProtocol.address);

  // --- VERIFICATION ---
  console.log("\nVerifying Constructor Args...");

  // 1. Check USDC
  const storedUsdc = await agentProtocol.read.usdcToken();
  if (storedUsdc.toLowerCase() === FUJI_USDC_ADDRESS.toLowerCase()) {
    console.log("✓ USDC token set correctly");
  } else {
    throw new Error(`❌ USDC Mismatch! Expected ${FUJI_USDC_ADDRESS}, got ${storedUsdc}`);
  }

  // 2. Check Treasury
  const storedTreasury = await agentProtocol.read.treasury();
  if (storedTreasury.toLowerCase() === TREASURY_ADDRESS.toLowerCase()) {
    console.log("✓ Treasury set correctly");
  } else {
    throw new Error(`❌ Treasury Mismatch! Expected ${TREASURY_ADDRESS}, got ${storedTreasury}`);
  }

  // 3. Check Owner
  const owner = await agentProtocol.read.owner();
  console.log("✓ Owner set to:", owner);

  console.log("\n=== Deployment Summary ===");
  console.log("Network:", networkName);
  console.log("Contract:", agentProtocol.address);
  console.log("Treasury:", TREASURY_ADDRESS);
  console.log("Fee Logic:", "Active on Registration (5 USDC)");
  console.log("\nDeployment successful!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });