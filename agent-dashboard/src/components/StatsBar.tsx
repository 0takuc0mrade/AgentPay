import { useEffect, useState } from "react";
import { DollarSign, Bot, FileText } from "lucide-react";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  color: "green" | "blue" | "orange";
  delay?: number;
}

const StatCard = ({ icon, label, value, prefix = "", suffix = "", color, delay = 0 }: StatCardProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const stepDuration = duration / steps;

    const interval = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(interval);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [value, isVisible]);

  const colorClasses = {
    green: {
      border: "border-primary/30 hover:border-primary/50",
      icon: "text-primary",
      value: "text-primary text-glow-green",
      glow: "hover:glow-green",
    },
    blue: {
      border: "border-terminal-blue/30 hover:border-terminal-blue/50",
      icon: "text-terminal-blue",
      value: "text-terminal-blue text-glow-blue",
      glow: "hover:glow-blue",
    },
    orange: {
      border: "border-terminal-orange/30 hover:border-terminal-orange/50",
      icon: "text-terminal-orange",
      value: "text-terminal-orange",
      glow: "hover:glow-orange",
    },
  };

  const colors = colorClasses[color];

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <div
      className={`glass p-6 ${colors.border} ${colors.glow} transition-all duration-500 relative group ${
        isVisible ? "animate-fade-in-up opacity-100" : "opacity-0"
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Corner accents */}
      <div className={`absolute top-0 left-0 w-3 h-3 border-l border-t ${colors.border}`} />
      <div className={`absolute top-0 right-0 w-3 h-3 border-r border-t ${colors.border}`} />
      <div className={`absolute bottom-0 left-0 w-3 h-3 border-l border-b ${colors.border}`} />
      <div className={`absolute bottom-0 right-0 w-3 h-3 border-r border-b ${colors.border}`} />

      <div className="flex items-start justify-between mb-4">
        <div className={`p-2 border ${colors.border}`}>
          {icon}
        </div>
        <span className="text-muted-foreground/50 text-xs">[LIVE]</span>
      </div>

      <div className="space-y-2">
        <p className="text-muted-foreground text-xs tracking-wider uppercase">{label}</p>
        <p className={`text-3xl md:text-4xl font-bold ${colors.value} tracking-tight`}>
          {prefix}{formatNumber(displayValue)}{suffix}
        </p>
      </div>

      {/* Animated underline */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-30 transition-opacity" />
    </div>
  );
};

const StatsBar = () => {
  return (
    <section className="container mx-auto px-6 py-20">
      <div className="mb-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <span className="text-muted-foreground text-xs tracking-widest">PROTOCOL_METRICS</span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={<DollarSign className="w-5 h-5 text-primary" />}
          label="Total Volume (USDC)"
          value={847293651}
          prefix="$"
          color="green"
          delay={0}
        />
        <StatCard
          icon={<Bot className="w-5 h-5 text-terminal-blue" />}
          label="Verified Agents"
          value={12847}
          color="blue"
          delay={200}
        />
        <StatCard
          icon={<FileText className="w-5 h-5 text-terminal-orange" />}
          label="Reputation Logs"
          value={3429871}
          color="orange"
          delay={400}
        />
      </div>
    </section>
  );
};

export default StatsBar;
