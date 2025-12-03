import { useState, useEffect } from "react";
import { Shield, ShieldAlert, Activity, Hash, Wallet, Zap } from "lucide-react";
import useAgentData from "@/hooks/useAgentData";
import AgentCardSkeleton from "./AgentCardSkeleton";
import { formatUnits } from "viem";

interface AgentMetadata {
  name: string;
  description: string;
  image: string;
}

interface AgentCardProps {
  agentId: number;
}

const AgentCard = ({ agentId }: AgentCardProps) => {
  const {
    txCount,
    services,
    tokenUri,
    isLoading,
    status,
    reputationScore,
    workerAddress,
  } = useAgentData(agentId);

  const [metadata, setMetadata] = useState<AgentMetadata | null>(null);

  useEffect(() => {
    if (tokenUri) {
      // In a real app, you'd want to resolve IPFS gateways properly
      const url = tokenUri.replace("ipfs://", "https://ipfs.io/ipfs/");
      fetch(url)
        .then((res) => res.json())
        .then(setMetadata);
    }
  }, [tokenUri]);

  const isVerified = status === "verified";

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <>
      {isLoading && <AgentCardSkeleton />}
      {!isLoading && (

    <div className="group relative w-full max-w-sm">
      {/* Outer glow effect on hover */}
      <div
        className={`absolute -inset-0.5 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500 ${
          isVerified ? "bg-primary/30" : "bg-destructive/30"
        }`}
      />

      {/* Main card */}
      <div
        className={`relative glass border transition-all duration-500 ${
          isVerified
            ? "border-primary/30 group-hover:border-primary/60"
            : "border-destructive/30 group-hover:border-destructive/60"
        }`}
      >
        {/* Corner brackets */}
        <div className={`absolute -top-1 -left-1 w-6 h-6 border-l-2 border-t-2 ${isVerified ? "border-primary" : "border-destructive"}`} />
        <div className={`absolute -top-1 -right-1 w-6 h-6 border-r-2 border-t-2 ${isVerified ? "border-primary" : "border-destructive"}`} />
        <div className={`absolute -bottom-1 -left-1 w-6 h-6 border-l-2 border-b-2 ${isVerified ? "border-primary" : "border-destructive"}`} />
        <div className={`absolute -bottom-1 -right-1 w-6 h-6 border-r-2 border-b-2 ${isVerified ? "border-primary" : "border-destructive"}`} />

        {/* Header */}
        <div className="p-4 border-b border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-[10px] tracking-[0.3em] mb-1">
                {">>> AGENT_IDENTITY"}
              </p>
              <h2 className={`text-xl font-bold tracking-wider ${isVerified ? "text-primary text-glow-green" : "text-destructive"}`}>
                AGENT ID: #{agentId}
              </h2>
            </div>

            {/* Status Badge */}
            <div
              className={`relative px-3 py-1.5 border ${
                isVerified
                  ? "border-primary/50 bg-primary/10"
                  : "border-destructive/50 bg-destructive/10"
              }`}
            >
              <div className="flex items-center gap-1.5">
                {isVerified ? (
                  <Shield className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5 text-destructive" />
                )}
                <span
                  className={`text-xs font-bold tracking-wider ${
                    isVerified ? "text-primary" : "text-destructive"
                  }`}
                >
                  {isVerified ? "VERIFIED" : "ROGUE"}
                </span>
              </div>
              {/* Animated pulse for verified */}
              {isVerified && (
                <div className="absolute inset-0 border border-primary/50 animate-ping opacity-30" />
              )}
            </div>
          </div>
        </div>

        {/* PFP and Metrics Section */}
        <div className="p-4 flex gap-4">
          {/* PFP with CRT effect */}
          <div className="relative w-24 h-24 flex-shrink-0">
            <div className="absolute inset-0 border border-primary/30 bg-muted overflow-hidden">
              {metadata?.image ? (
                <img
                  src={metadata.image.replace("ipfs://", "https://ipfs.io/ipfs/")}
                  alt={metadata.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-terminal-blue/20 flex items-center justify-center">
                  <span className="text-3xl font-bold text-primary/50">?</span>
                </div>
              )}
              {/* CRT Scanline overlay */}
              <div className="absolute inset-0 pointer-events-none crt-overlay" />
              {/* Horizontal scanlines */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 2px,
                    rgba(0, 255, 65, 0.03) 2px,
                    rgba(0, 255, 65, 0.03) 4px
                  )`,
                }}
              />
              {/* Vignette effect */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)`,
                }}
              />
            </div>
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-primary/60" />
            <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-primary/60" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-primary/60" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-primary/60" />
          </div>

          {/* Metrics Grid */}
          <div className="flex-1 space-y-3">
            {/* Reputation Score */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-terminal-blue" />
                <span className="text-[10px] text-muted-foreground tracking-wider">REP_SCORE</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-terminal-blue text-glow-blue">{reputationScore}</span>
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
            </div>

            {/* Progress bar for reputation */}
            <div className="h-1 bg-muted overflow-hidden">
              <div
                className="h-full bg-terminal-blue transition-all duration-1000"
                style={{ width: `${reputationScore}%` }}
              />
            </div>

            {/* TX Count */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <Hash className="w-3.5 h-3.5 text-terminal-orange" />
                <span className="text-[10px] text-muted-foreground tracking-wider">TX_COUNT</span>
              </div>
              <span className="text-sm font-bold text-terminal-orange">{txCount.toLocaleString()}</span>
            </div>

            {/* Worker Address */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground tracking-wider">WORKER</span>
              </div>
              <span className="text-xs font-mono text-primary/80">{truncateAddress(workerAddress)}</span>
            </div>
          </div>
        </div>

        {/* Services Menu */}
        <div className="border-t border-primary/20">
          <div className="px-4 py-2 border-b border-primary/10 flex items-center gap-2">
            <Zap className="w-3 h-3 text-terminal-orange" />
            <span className="text-[10px] text-muted-foreground tracking-[0.2em]">SERVICES_OFFERED</span>
          </div>
          <div className="divide-y divide-primary/10">
            {services.map((service, index) => (
              <div
                key={index}
                className="px-4 py-2.5 flex items-center justify-between hover:bg-primary/5 transition-colors cursor-pointer"
              >
                <span className="text-xs text-foreground/80">{service.name}</span>
                <span className="text-xs font-bold text-primary">
                  {formatUnits(BigInt(service.price), 6)} USDC
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-primary/20 flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground/50 tracking-wider">
            PROTOCOL_v2.4.1
          </span>
          <span className="text-[9px] text-muted-foreground/50">
            [LAST_SYNC: {new Date().toISOString().split("T")[0]}]
          </span>
        </div>
      </div>
    </div>
      )}
    </>
  );
};

export default AgentCard;
