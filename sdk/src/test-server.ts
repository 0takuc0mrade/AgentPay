import express from "express";
import { AgentPaySDK, createAgentPayMiddleware } from "./index.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = 3000;

const sdk = new AgentPaySDK(
    process.env.PRIVATE_KEY!,
    "0x49846bac01d20c2b8a0e5647b48974fbf990a103"
);

const paywall = createAgentPayMiddleware(sdk, {
    agentId: 1,
    price: "100000",
    serviceName: "premium-weather"
});

app.get("/weather", paywall, (req: any, res) => {
    res.json({
        status: "success",
        data: "It is sunny in Avalanche City ☀️",
        receipt: req.agentPayReceipt
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Try accessing http://localhost:${PORT}/weather`);
});