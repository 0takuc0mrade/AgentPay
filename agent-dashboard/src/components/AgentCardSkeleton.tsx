import { Bot } from "lucide-react";

const AgentCardSkeleton = () => {
  return (
    <div className="group relative w-full max-w-sm">
      <div className="relative glass border border-primary/20 p-4 animate-pulse">
        {/* Corner brackets */}
        <div className="absolute -top-1 -left-1 w-6 h-6 border-l-2 border-t-2 border-primary/50" />
        <div className="absolute -top-1 -right-1 w-6 h-6 border-r-2 border-t-2 border-primary/50" />
        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-l-2 border-b-2 border-primary/50" />
        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-r-2 border-b-2 border-primary/50" />

        {/* Header */}
        <div className="border-b border-primary/10 pb-4">
          <div className="h-3 w-2/5 bg-primary/10 rounded mb-2" />
          <div className="h-8 w-3/5 bg-primary/10 rounded" />
        </div>

        {/* Body */}
        <div className="py-4 flex gap-4">
          <div className="w-24 h-24 bg-primary/10 rounded flex items-center justify-center">
            <Bot className="w-8 h-8 text-primary/30 animate-spin" />
          </div>
          <div className="flex-1 space-y-4">
            <div className="h-4 bg-primary/10 rounded" />
            <div className="h-4 bg-primary/10 rounded" />
            <div className="h-4 bg-primary/10 rounded w-5/6" />
          </div>
        </div>

        {/* Services */}
        <div className="border-t border-primary/10 pt-4 space-y-3">
          <div className="h-4 bg-primary/10 rounded" />
          <div className="h-4 bg-primary/10 rounded w-4/5" />
        </div>

        {/* Footer */}
        <div className="mt-4 text-center">
          <p className="text-primary/50 text-xs tracking-widest animate-pulse">
            SCANNING...
          </p>
        </div>
      </div>
    </div>
  );
};

export default AgentCardSkeleton;