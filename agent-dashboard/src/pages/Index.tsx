import { useState, useCallback } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import StatsBar from "@/components/StatsBar";
import AgentShowcase from "@/components/AgentShowcase";
import LiveSettlementFeed from "@/components/LiveSettlementFeed";
import { AgentServiceNode } from "@/utils/ai-search";
import AgentDataLoader from "@/components/AgentDataLoader";

// In a real app, this would come from a registry contract or an API
const ALL_AGENT_IDS = [1, 42, 1337];

const Index = () => {
  const [allAgentServices, setAllAgentServices] = useState<AgentServiceNode[]>([]);
  const [filteredAgentIds, setFilteredAgentIds] = useState<number[] | null>(null);

  const handleDataLoaded = useCallback((nodes: AgentServiceNode[]) => {
    setAllAgentServices(prev => {
      const existingIds = new Set(prev.map(n => `${n.agentId}-${n.serviceName}`));
      const newNodes = nodes.filter(n => !existingIds.has(`${n.agentId}-${n.serviceName}`));
      return [...prev, ...newNodes];
    });
  }, []);

  const handleSearchResults = (ids: number[]) => {
    if (ids.length > 0) {
      setFilteredAgentIds(ids);
    } else {
      // If search returns no results, show the "not found" message
      setFilteredAgentIds([]);
    }
  };

  const displayAgentIds = filteredAgentIds === null ? ALL_AGENT_IDS : filteredAgentIds;

  return (
    <div className="min-h-screen bg-background bg-grid relative overflow-hidden scanlines">
      {/* Ambient glow effects */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary/5 blur-[150px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-terminal-blue/5 blur-[150px] pointer-events-none" />

      {/* Data Loaders - these render null but fetch data */}
      {ALL_AGENT_IDS.map(id => <AgentDataLoader key={id} agentId={id} onDataLoaded={handleDataLoaded} />)}

      <Header />
      <main>
        <HeroSection allAgents={allAgentServices} onSearchResults={handleSearchResults} />
        <StatsBar />
        <AgentShowcase agentIds={displayAgentIds} />
        <LiveSettlementFeed />
      </main>

      {/* Bottom border line */}
      <div className="fixed bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    </div>
  );
};

export default Index;
