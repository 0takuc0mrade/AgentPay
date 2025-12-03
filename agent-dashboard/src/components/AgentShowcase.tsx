import AgentCard from "./AgentCard";

const AgentShowcase = () => {
  const sampleAgents = [
    {
      agentId: 1,
    },    {
      agentId: 1337,
    },
  ];

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
        {sampleAgents.map((agent) => (
          <AgentCard key={agent.agentId} agentId={agent.agentId} />
        ))}
      </div>
    </section>
  );
};

export default AgentShowcase;
