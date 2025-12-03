import { Search, ArrowRight } from "lucide-react";
import { useState } from "react";

const HeroSection = () => {
  const [searchValue, setSearchValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-20 relative">
      {/* Decorative elements */}
      <div className="absolute top-32 left-10 text-muted-foreground/30 text-xs">
        {"// TRUST_LAYER v1.0.0"}
      </div>
      <div className="absolute top-40 right-10 text-muted-foreground/30 text-xs">
        {"[PROTOCOL_ACTIVE]"}
      </div>

      {/* Main headline */}
      <div className="text-center mb-12 space-y-6">
        <div className="text-muted-foreground text-sm tracking-[0.3em] mb-4">
          {">>> INITIALIZING TRUST PROTOCOL"}
        </div>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-primary text-glow-green tracking-tight leading-tight">
          THE TRUST LAYER
          <br />
          <span className="text-terminal-blue text-glow-blue">FOR AUTONOMOUS AGENTS.</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
          Verify agent credentials. Track transaction hashes. Monitor reputation scores in real-time.
        </p>
      </div>

      {/* Massive search input */}
      <div className={`relative w-full max-w-3xl transition-all duration-500 ${isFocused ? 'scale-[1.02]' : ''}`}>
        <div className={`absolute inset-0 ${isFocused ? 'glow-green' : ''} transition-all duration-300`} />
        <div className={`relative glass border ${isFocused ? 'border-primary/60' : 'border-primary/30'} p-1 pulse-border`}>
          <div className="flex items-center">
            <div className="px-4 py-4 border-r border-primary/20">
              <Search className="w-6 h-6 text-primary" />
            </div>
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="ENTER AGENT ID or TX HASH..."
              className="flex-1 bg-transparent px-6 py-4 text-primary placeholder:text-muted-foreground/50 focus:outline-none text-lg tracking-wide"
            />
            <button className="px-6 py-4 bg-primary/10 border-l border-primary/20 hover:bg-primary/20 transition-colors group">
              <div className="flex items-center gap-2 text-primary">
                <span className="text-sm font-medium">SCAN</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
          {/* Corner decorations */}
          <div className="absolute -top-1 -left-1 w-4 h-4 border-l-2 border-t-2 border-primary" />
          <div className="absolute -top-1 -right-1 w-4 h-4 border-r-2 border-t-2 border-primary" />
          <div className="absolute -bottom-1 -left-1 w-4 h-4 border-l-2 border-b-2 border-primary" />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 border-r-2 border-b-2 border-primary" />
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-8 flex items-center gap-6 text-xs text-muted-foreground">
        <span className="hover:text-primary cursor-pointer transition-colors">[SAMPLE_AGENT]</span>
        <span className="text-primary/30">|</span>
        <span className="hover:text-primary cursor-pointer transition-colors">[RECENT_TX]</span>
        <span className="text-primary/30">|</span>
        <span className="hover:text-primary cursor-pointer transition-colors">[DOCS]</span>
      </div>
    </section>
  );
};

export default HeroSection;
