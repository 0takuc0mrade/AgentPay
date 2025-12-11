import express from "express";
import { AgentPaySDK, createAgentPayMiddleware } from "../src/index.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = 3001;

const sdk = new AgentPaySDK(
    process.env.PRIVATE_KEY!,
    "0x63e914bfb9d50f7ff0064454c88693e65d9df5f2"
);

const paywall = createAgentPayMiddleware(sdk, {
    agentId: 1,
    price: "200000",
    serviceName: "Alpha Premium Sports Feed"
});

app.get("/sports", paywall, (req: any, res) => {
    res.json({
        status: "success",
        data: "Chelsea won the match 3-1! ⚽🏆",
        receipt: req.agentPayReceipt
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Try accessing http://localhost:${PORT}/sports`);
});