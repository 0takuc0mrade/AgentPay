import { useEffect } from 'react';
import useAgentData from '@/hooks/useAgentData';
import { AgentServiceNode } from '@/utils/ai-search';

interface AgentDataLoaderProps {
  agentId: number;
  onDataLoaded: (data: AgentServiceNode[]) => void;
}

const AgentDataLoader = ({ agentId, onDataLoaded }: AgentDataLoaderProps) => {
  const { services, isLoading } = useAgentData(agentId);

  useEffect(() => {
    if (!isLoading && services.length > 0) {
      const serviceNodes = services.map(service => ({ agentId, serviceName: service.name, price: service.price }));
      onDataLoaded(serviceNodes);
    }
  }, [isLoading, services, agentId, onDataLoaded]);

  return null; // This component does not render anything
};

export default AgentDataLoader;