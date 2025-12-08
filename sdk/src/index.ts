import { ethers, Contract, Wallet, JsonRpcProvider, BaseContract } from "ethers";

// Users can import { ethers } from "@agentpay/sdk" directly
export { ethers } from "ethers";

// --- CONFIGURATION ---
const USDC_CONFIG = {
    name: "USD Coin",
    version: "2",
    chainId: 43113, // Avalanche Fuji
    verifyingContract: "0x5425890298aed601595a70ab815c96711a31bc65"
};

const EIP3009_TYPES = {
    TransferWithAuthorization: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "validAfter", type: "uint256" },
        { name: "validBefore", type: "uint256" },
        { name: "nonce", type: "bytes32" },
    ],
};

// Expanded ABI to include Creator Tools
const AGENT_PROTOCOL_ABI = [
    "function settleAndLog((address payer, uint256 amount, bytes32 paymentNonce, uint256 validAfter, uint256 validBefore, uint8 v, bytes32 r, bytes32 s) payData, uint256 agentId, uint8 score, bytes repSignature, bytes32 tag2, string fileuri) public",
    "function registerAgent(address creator, string memory metadataURI) public returns (uint256)",
    "function addService(uint256 agentId, string memory name, uint256 price) public"
];

// --- INTERFACES ---
interface AgentPayContract extends BaseContract {
    settleAndLog: (
        payData: any, agentId: number, score: number, repSignature: string, tag2: string, fileuri: string
    ) => Promise<ethers.ContractTransactionResponse>;
    registerAgent: (creator: string, metadataURI: string) => Promise<ethers.ContractTransactionResponse>;
    addService: (agentId: number, name: string, price: bigint) => Promise<ethers.ContractTransactionResponse>;
}

export class AgentPaySDK {
    private provider: JsonRpcProvider;
    private facilitatorWallet: Wallet;
    private contract: AgentPayContract;

    constructor(
        facilitatorPrivateKey: string,
        contractAddress: string,
        rpcUrl: string = "https://api.avax-test.network/ext/bc/C/rpc"
    ) {
        this.provider = new JsonRpcProvider(rpcUrl);
        this.facilitatorWallet = new Wallet(facilitatorPrivateKey, this.provider);

        this.contract = new Contract(contractAddress, AGENT_PROTOCOL_ABI, this.facilitatorWallet) as unknown as AgentPayContract;
    }

    // --- HELPER: ZERO-CONFIG SIGNER ---
    private static getSigner(
        signerOrKey: ethers.Signer | string,
        rpcUrl: string = "https://api.avax-test.network/ext/bc/C/rpc"
    ): ethers.Signer {
        if (typeof signerOrKey === 'string') {
            const provider = new JsonRpcProvider(rpcUrl);
            return new Wallet(signerOrKey, provider);
        }
        return signerOrKey;
    }

    // ==========================================================
    // CREATOR TOOLS (Register & Sell)
    // ==========================================================

    static async registerAgent(
        signerOrKey: ethers.Signer | string,
        contractAddress: string,
        metadataURI: string,
        rpcUrl?: string
    ) {
        const signer = AgentPaySDK.getSigner(signerOrKey, rpcUrl);
        const contract = new Contract(contractAddress, AGENT_PROTOCOL_ABI, signer) as unknown as AgentPayContract;

        console.log("📝 Registering Agent Identity...");
        const creatorAddr = await signer.getAddress();
        const tx = await contract.registerAgent(creatorAddr, metadataURI);

        console.log(`✅ Tx Sent: ${tx.hash}`);
        return await tx.wait();
    }

    static async addService(
        signerOrKey: ethers.Signer | string,
        contractAddress: string,
        agentId: number,
        serviceName: string,
        priceInWei: string,
        rpcUrl?: string
    ) {
        const signer = AgentPaySDK.getSigner(signerOrKey, rpcUrl);
        const contract = new Contract(contractAddress, AGENT_PROTOCOL_ABI, signer) as unknown as AgentPayContract;

        console.log(`📦 Adding Service: ${serviceName}...`);
        const tx = await contract.addService(agentId, serviceName, BigInt(priceInWei));

        console.log(`✅ Tx Sent: ${tx.hash}`);
        return await tx.wait();
    }

    // ==========================================================
    // CLIENT SIDE: Generates the Payment Header
    // ==========================================================
    static async generatePaymentHeader(
        userPrivateKey: string,
        agentPrivateKey: string,
        contractAddress: string,
        agentId: number,
        amount: string,
        serviceCategory: string = "general"
    ) {
        const userWallet = new Wallet(userPrivateKey);
        const agentWallet = new Wallet(agentPrivateKey);

        const paymentNonce = ethers.hexlify(ethers.randomBytes(32));
        const validAfter = 0;
        const validBefore = Math.floor(Date.now() / 1000) + 3600;

        // EIP-3009 Authorization
        const paymentValue = {
            from: userWallet.address,
            to: agentWallet.address, // Direct transfer (No Fee Model)
            value: amount,
            validAfter,
            validBefore,
            nonce: paymentNonce,
        };

        const paymentSig = await userWallet.signTypedData(USDC_CONFIG, EIP3009_TYPES, paymentValue);
        const split = ethers.Signature.from(paymentSig);

        const score = 100;
        const repHash = ethers.solidityPackedKeccak256(
            ["uint256", "uint8", "bytes32"],
            [agentId, score, paymentNonce]
        );
        const repSignature = await agentWallet.signMessage(ethers.getBytes(repHash));

        return JSON.stringify({
            payer: userWallet.address,
            amount: amount,
            paymentNonce,
            validAfter,
            validBefore,
            v: split.v,
            r: split.r,
            s: split.s,
            agentId,
            score,
            repSignature,
            tag2: ethers.id(serviceCategory),
            fileuri: ""
        });
    }

    // ==========================================================
    // SERVER SIDE: Settle
    // ==========================================================
    async settlePayment(paymentHeaderString: string) {
        try {
            const data = JSON.parse(paymentHeaderString);
            console.log("⚡ Submitting Atomic Settlement...");

            const payData = {
                payer: data.payer,
                amount: data.amount,
                paymentNonce: data.paymentNonce,
                validAfter: data.validAfter,
                validBefore: data.validBefore,
                v: data.v,
                r: data.r,
                s: data.s
            };

            const tx = await this.contract.settleAndLog(
                payData, data.agentId, data.score, data.repSignature, data.tag2, data.fileuri
            );

            console.log(`✅ Tx Sent: ${tx.hash}`);
            await tx.wait();
            console.log(`🎉 Confirmed!`);
            return tx.hash;

        } catch (error: any) {
            console.error("❌ Settlement Failed:", error.reason || error.message);
            throw error;
        }
    }
}

export * from "./middleware.js";