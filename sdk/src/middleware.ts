import { AgentPaySDK } from "./index.js";

/**
 * Creates an Express/Connect compatible middleware function.
 * * @param sdk - An initialized instance of AgentPaySDK
 * @param options - Configuration for the protected resource
 */
export const createAgentPayMiddleware = (
    sdk: AgentPaySDK,
    options: {
        agentId: number;
        price: string;
        serviceName: string;
    }
) => {
    return async (req: any, res: any, next: any) => {
        const paymentHeader = req.headers["x-payment"];

        // ---------------------------------------------------------
        // SCENARIO 1: NO PAYMENT PROVIDED (The Handshake)
        // ---------------------------------------------------------
        if (!paymentHeader) {
            console.log("⚠ AgentPay: No Payment Header Provided.");
            return res.status(402).json({
                error: "Payment Required",
                details: {
                    protocol: "AgentPay-v1",
                    facilitator: "AgentPay",
                    currency: "USDC",
                    chainId: 43113,
                    cost: options.price,
                    recipientAgentId: options.agentId,
                    serviceName: options.serviceName
                }
            });
        }

        try {
            console.log("⚡ AgentPay: Processing Payment Header...");

            // Call your SDK core to verify signatures & execute on-chain
            const txHash = await sdk.settlePayment(paymentHeader);

            console.log(`AgentPay: Payment Confirmed! Tx: ${txHash}`);

            req.agentPayReceipt = {
                success: true,
                txHash: txHash,
                agentId: options.agentId,
                timestamp: Date.now()
            };

            next();

        } catch (error: any) {
            console.error("❌ AgentPay: Settlement Failed:", error.message);

            return res.status(403).json({
                error: "Payment Verification Failed",
                message: error.message || "Invalid signature or insufficient funds"
            });
        }
    };
};