import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Initialize GoogleGenerativeAI
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error("VITE_GEMINI_API_KEY is not set. AI search will be disabled.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

// 2. Define AgentServiceNode interface
export interface AgentServiceNode {
  agentId: number;
  serviceName: string;
  price: string;
}

/**
 * Performs a semantic search over a list of agent services using Google Gemini.
 * @param userQuery The user's natural language search query.
 * @param availableServices A list of all available agent services.
 * @returns A promise that resolves to an array of matched agent IDs.
 */
export async function semanticSearch(
  userQuery: string,
  availableServices: AgentServiceNode[]
): Promise<number[]> {
  if (!apiKey) {
    return [];
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const servicesString = availableServices
      .map(s => `(ID: ${s.agentId}, Service: "${s.serviceName}")`)
      .join(", ");

    const prompt = `
      You are a "Marketplace Matchmaker" AI for a decentralized agent protocol. Your task is to find relevant agents based on a user's search query.

      Here is a list of available services provided by different agents:
      [${servicesString}]

      User's search query: "${userQuery}"

      Based on the user's query, identify the agents that offer the most relevant services. If the user asks for 'weather', match services containing 'weather'. If they ask for 'stocks', match services related to 'finance' or 'price oracles'.

      Return a single, minified JSON object of the format { "matchedIds": number[] } containing the unique IDs of agents that offer services relevant to the user's intent. Do not return any other text, explanations, or markdown formatting.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Clean up potential markdown code blocks
    const jsonString = responseText.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(jsonString);

    return parsed.matchedIds || [];
  } catch (error) {
    console.error("Error during semantic search:", error);
    return [];
  }
}