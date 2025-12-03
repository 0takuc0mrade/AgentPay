import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import StatsBar from "@/components/StatsBar";
import AgentShowcase from "@/components/AgentShowcase";
import LiveSettlementFeed from "@/components/LiveSettlementFeed";

const Index = () => {
  return (
    <div className="min-h-screen bg-background bg-grid relative overflow-hidden scanlines">
      {/* Ambient glow effects */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary/5 blur-[150px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-terminal-blue/5 blur-[150px] pointer-events-none" />
      
      <Header />
      <main>
        <HeroSection />
        <StatsBar />
        <AgentShowcase />
        <LiveSettlementFeed />
      </main>

      {/* Bottom border line */}
      <div className="fixed bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    </div>
  );
};

export default Index;
