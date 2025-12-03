import { ConnectKitButton } from "connectkit";
import { Cpu, Wallet } from "lucide-react";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-primary/20">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border border-primary/50 flex items-center justify-center glow-green">
            <span className="text-primary text-xs font-bold">AP</span>
          </div>
          <span className="text-primary font-bold tracking-wider glitch text-glow-green">
            AGENTPAY_PROTOCOL
          </span>
        </div>

        {/* Connect Wallet Button */}
        <ConnectKitButton.Custom>
          {({ isConnected, show, truncatedAddress, ensName }) => {
            return (
              <button
                onClick={show}
                className="group relative px-6 py-2 border border-primary/50 glass-blue hover:border-primary/80 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <Wallet className="w-4 h-4 text-primary" />
                  ) : (
                    <Cpu className="w-4 h-4 text-primary" />
                  )}
                  <span className="text-primary text-sm font-medium tracking-wide">
                    {isConnected ? ensName || truncatedAddress : "CONNECT_WALLET"}
                  </span>
                </div>
                {/* Microchip corner accents */}
                <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-primary/80" />
                <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-primary/80" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-primary/80" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-primary/80" />
              </button>
            );
          }}
        </ConnectKitButton.Custom>
      </div>
    </header>
  );
};

export default Header;
