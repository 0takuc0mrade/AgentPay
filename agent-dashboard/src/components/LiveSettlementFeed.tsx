import { useState, useEffect, useRef } from "react";
import { ExternalLink, Radio } from "lucide-react";

interface Settlement {
  id: string;
  timestamp: string;
  agentId: string;
  amount: string;
  userAddress: string;
  txHash: string;
  isNew: boolean;
}

const generateRandomSettlement = (): Settlement => {
  const agentIds = ["0042", "1337", "0187", "0099", "2048", "0777", "1024", "0256"];
  const amounts = ["0.10", "0.05", "0.25", "0.02", "0.50", "1.00", "0.08", "0.15"];
  const addresses = [
    "0xAB12...3F4E",
    "0x7a25...88D",
    "0xdAC1...1ec7",
    "0x6B17...0C55",
    "0x1f98...C2Fe",
    "0xC02a...cC2",
    "0x5C69...1682",
    "0x68b3...5a2D",
  ];

  const now = new Date();
  const timestamp = now.toISOString().replace("T", " ").split(".")[0];

  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp,
    agentId: agentIds[Math.floor(Math.random() * agentIds.length)],
    amount: amounts[Math.floor(Math.random() * amounts.length)],
    userAddress: addresses[Math.floor(Math.random() * addresses.length)],
    txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
    isNew: true,
  };
};

const LiveSettlementFeed = () => {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [isPulsing, setIsPulsing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize with some settlements
  useEffect(() => {
    const initial = Array.from({ length: 8 }, () => ({
      ...generateRandomSettlement(),
      isNew: false,
    }));
    setSettlements(initial);
  }, []);

  // Add new settlements periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 300);

      setSettlements((prev) => {
        const newSettlement = generateRandomSettlement();
        const updated = prev.map((s) => ({ ...s, isNew: false }));
        return [newSettlement, ...updated].slice(0, 15);
      });
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, []);

  // Remove "new" status after animation
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSettlements((prev) => prev.map((s) => ({ ...s, isNew: false })));
    }, 600);
    return () => clearTimeout(timeout);
  }, [settlements]);

  return (
    <section className="container mx-auto px-6 py-20">
      {/* Section Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="flex items-center gap-2">
          <Radio className={`w-4 h-4 text-primary ${isPulsing ? "animate-ping" : ""}`} />
          <span className="text-muted-foreground text-xs tracking-widest">LIVE_SETTLEMENT_FEED</span>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </div>

      {/* Terminal Container */}
      <div
        className={`relative border border-primary/30 bg-black/80 overflow-hidden transition-all duration-300 ${
          isPulsing ? "border-primary/60 shadow-[0_0_30px_rgba(0,255,65,0.1)]" : ""
        }`}
      >
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-primary/20 bg-black/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-destructive/80" />
              <div className="w-3 h-3 rounded-full bg-terminal-orange/80" />
              <div className="w-3 h-3 rounded-full bg-primary/80" />
            </div>
            <span className="text-primary/60 text-xs">settlement_monitor.sh</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-primary/40 tracking-wider">AVALANCHE_MAINNET</span>
            <div className={`w-2 h-2 rounded-full bg-primary ${isPulsing ? "animate-pulse" : ""}`} />
          </div>
        </div>

        {/* Terminal Body */}
        <div
          ref={containerRef}
          className="p-4 h-[400px] overflow-hidden font-mono text-sm"
          style={{
            background: `linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,20,0,0.95) 100%)`,
          }}
        >
          {/* Scanlines overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(0, 255, 65, 0.015) 2px,
                rgba(0, 255, 65, 0.015) 4px
              )`,
            }}
          />

          {/* Settlement rows */}
          <div className="space-y-1 relative">
            {settlements.map((settlement, index) => (
              <div
                key={settlement.id}
                className={`flex items-start gap-2 py-1.5 px-2 transition-all duration-500 hover:bg-primary/5 group ${
                  settlement.isNew
                    ? "animate-[fadeSlideIn_0.5s_ease-out] bg-primary/10"
                    : ""
                }`}
                style={{
                  opacity: 1 - index * 0.05,
                }}
              >
                {/* Timestamp */}
                <span className="text-muted-foreground/60 text-xs whitespace-nowrap">
                  [{settlement.timestamp}]
                </span>

                {/* Arrow */}
                <span className="text-terminal-blue">{">>"}</span>

                {/* Content */}
                <span className="flex-1">
                  <span className="text-terminal-orange font-bold">SETTLEMENT</span>
                  <span className="text-primary/50"> :: </span>
                  <span className="text-primary">
                    Agent #{settlement.agentId}
                  </span>
                  <span className="text-primary/70"> received </span>
                  <span className="text-terminal-blue font-bold">
                    {settlement.amount} USDC
                  </span>
                  <span className="text-primary/70"> from User </span>
                  <span className="text-muted-foreground">{settlement.userAddress}</span>
                  <span className="text-primary/50"> :: </span>
                  <span className="text-primary/80">REPUTATION_LOGGED</span>
                </span>

                {/* Verify Link */}
                <a
                  href={`https://snowtrace.io/tx/${settlement.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-terminal-blue hover:text-terminal-blue/80"
                  title="Verify on Snowtrace"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>

          {/* Cursor blink */}
          <div className="mt-4 flex items-center gap-2">
            <span className="text-primary/60">$</span>
            <span className="text-primary">_</span>
            <span className="w-2 h-4 bg-primary animate-[blink_1s_step-end_infinite]" />
          </div>
        </div>

        {/* Bottom status bar */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-primary/20 bg-black/50 text-[10px]">
          <span className="text-muted-foreground/50">
            PROTOCOL: AgentPay_v1.0.0
          </span>
          <span className="text-primary/50">
            {settlements.length} settlements in buffer
          </span>
          <span className="text-muted-foreground/50">
            CHAIN_ID: 43114
          </span>
        </div>

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-primary/60" />
        <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-primary/60" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-primary/60" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-primary/60" />
      </div>
    </section>
  );
};

export default LiveSettlementFeed;
