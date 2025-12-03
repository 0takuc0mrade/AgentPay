import { createConfig, http } from 'wagmi';
import { avalancheFuji } from 'wagmi/chains';
import { getDefaultConfig } from 'connectkit';
import { type Chain } from 'viem';


const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;


const chains = [avalancheFuji] as const;

export const config = createConfig(
  getDefaultConfig({

    walletConnectProjectId: projectId,

    appName: "AgentPay Explorer",

    chains,
    transports: {
      [avalancheFuji.id]: http(),
    },

    // appDescription: "The Trust Layer for AI Agents",
    // appUrl: "https://agentpay.com",
    // appIcon: "https://family.co/logo.png",
  })
);