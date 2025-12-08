import AgentCard from "./AgentCard";
import { AlertTriangle } from "lucide-react";

interface AgentShowcaseProps {
  agentIds: number[];
}

const AgentShowcase = ({ agentIds }: AgentShowcaseProps) => {
  return (
    <section className="container mx-auto px-6 py-20">
      <div className="mb-12 text-center">
        <p className="text-muted-foreground text-xs tracking-[0.3em] mb-4">
          {">>> SCANNING AGENT_REGISTRY"}
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-primary text-glow-green mb-4">
          AGENT IDENTITY CARDS
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto text-sm">
          Each autonomous agent is issued a unique ERC-721 identity.
          Verify credentials before initiating transactions.
        </p>
      </div>

      {agentIds.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
          {agentIds.map((id) => (
            <AgentCard key={id} agentId={id} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 glass border border-destructive/30 max-w-lg mx-auto">
           <div className="flex flex-col items-center gap-4">
              <AlertTriangle className="w-12 h-12 text-destructive" />
              <h3 className="text-2xl font-bold text-destructive tracking-wider">NO NODES FOUND</h3>
              <p className="text-muted-foreground text-sm">The network returned no agents matching your query.</p>
           </div>
        </div>
      )}
    </section>
  );
};

export default AgentShowcase;
