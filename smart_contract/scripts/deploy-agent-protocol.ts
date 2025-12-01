import { network } from "hardhat";

const { viem, networkName } = await network.connect();
const publicClient = await viem.getPublicClient();

console.log(`Deploying AgentProtocol to ${networkName}...`);

// Use the official Circle USDC address on Avalanche Fuji testnet
const FUJI_USDC_ADDRESS = "0x5425890298aed601595a70ab815c96711a31bc65";

// Log deployer info
const [deployerClient] = await viem.getWalletClients();
console.log("Deployer address:", deployerClient.account.address);

// Deploy AgentProtocol with the real USDC address
console.log("Deploying AgentProtocol with USDC address:", FUJI_USDC_ADDRESS);
const agentProtocol = await viem.deployContract("AgentProtocol", [FUJI_USDC_ADDRESS]);
console.log("AgentProtocol address:", agentProtocol.address);

// Verify deployment by reading the usdcToken address
console.log("Verifying AgentProtocol.usdcToken()...");
const usdcTokenAddress = await agentProtocol.read.usdcToken();
console.log("AgentProtocol.usdcToken():", usdcTokenAddress);

if (usdcTokenAddress.toLowerCase() === FUJI_USDC_ADDRESS.toLowerCase()) {
  console.log("✓ USDC token address matches FUJI USDC address");
} else {
  throw new Error("USDC token address mismatch!");
}

// Get the contract owner (deployer)
console.log("Reading AgentProtocol.owner()...");
const owner = await agentProtocol.read.owner();
console.log("AgentProtocol owner:", owner);

console.log("\n=== Deployment Summary ===");
console.log("Network:", networkName);
console.log("AgentProtocol address:", agentProtocol.address);
console.log("USDC used:", FUJI_USDC_ADDRESS);
console.log("AgentProtocol owner:", owner);
console.log("\nDeployment successful!");
