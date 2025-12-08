import { useReadContract } from 'wagmi';
import { useMemo } from 'react';

const CONTRACT_ADDRESS = '0x49846bac01d20c2b8a0e5647b48974fbf990a103';

// 1. THE EXACT ABI FROM YOUR JSON FILE
const ABI = [
  {
    "inputs": [{ "internalType": "uint256", "name": "agentId", "type": "uint256" }],
    "name": "getServices",
    "outputs": [
      {
        "components": [
          { "internalType": "string", "name": "name", "type": "string" },
          { "internalType": "uint256", "name": "price", "type": "uint256" },
          { "internalType": "bool", "name": "active", "type": "bool" }
        ],
        "internalType": "struct AgentProtocol.Service[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "agentTxCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "tokenURI",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "agentWorkers",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export interface Service {
  name: string;
  price: string;
  active: boolean;
}

export function useAgentData(agentId: number) {
  const id = BigInt(agentId);
  const address = CONTRACT_ADDRESS as `0x${string}`;

  // 2. Individual Hooks (No "Excessively Deep" Errors)

  const { data: txCountData, isLoading: countLoading } = useReadContract({
    address,
    abi: ABI,
    functionName: 'agentTxCount',
    args: [id],
  });

  const { data: servicesData, isLoading: servicesLoading } = useReadContract({
    address,
    abi: ABI,
    functionName: 'getServices',
    args: [id],
  });

  const { data: uriData, isLoading: uriLoading } = useReadContract({
    address,
    abi: ABI,
    functionName: 'tokenURI',
    args: [id],
  });

  const { data: workerData, isLoading: workerLoading } = useReadContract({
    address,
    abi: ABI,
    functionName: 'agentWorkers',
    args: [id],
  });

  // 3. Normalize Data
  const isLoading = countLoading || servicesLoading || uriLoading || workerLoading;

  const txCount = txCountData ? Number(txCountData) : 0;

  // Memoize the services array to prevent re-renders if the data is the same.
  const services: Service[] = useMemo(() => {
    return Array.isArray(servicesData)
      ? (servicesData as any[]).map((s) => ({
          name: s.name,
          price: s.price.toString(),
          active: s.active,
        }))
      : [];
  }, [servicesData]);

  const tokenUri = typeof uriData === 'string' ? uriData : null;
  const workerAddress = typeof workerData === 'string' ? workerData : '0x00...';

  // Mocked Metrics (Calculated off-chain for UI display)
  const reputationScore = Math.min(txCount * 10 + 50, 100); // Start at 50, grow to 100
  const status = txCount > 0 ? 'verified' : 'new';

  return {
    txCount,
    services,
    tokenUri,
    reputationScore,
    workerAddress,
    status,
    isLoading,
    error: null
  };
}

export default useAgentData;