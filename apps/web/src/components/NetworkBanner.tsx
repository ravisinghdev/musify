"use client";

import { useEffect, useState } from "react";
import { useNetworkStatus } from "../lib/useNetworkStatus";
import { WifiOff, Wifi } from "lucide-react";

export function NetworkBanner() {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowRestored(true);
      const timer = setTimeout(() => {
        setShowRestored(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (isOnline && !showRestored) {
    return null;
  }

  return (
    <aside
      aria-label="Network status banner"
      className="fixed top-[max(env(safe-area-inset-top,0px),12px)] left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2.5 px-4 py-2 rounded-full border shadow-xl backdrop-blur-xl animate-fade-in transition-all text-xs font-medium select-none pointer-events-none"
      style={{
        backgroundColor: isOnline
          ? "rgba(18, 20, 28, 0.88)"
          : "rgba(26, 29, 40, 0.92)",
        borderColor: isOnline
          ? "rgba(112, 214, 160, 0.35)"
          : "rgba(233, 187, 115, 0.35)",
        color: "#F5F5F7",
        boxShadow: isOnline
          ? "0 8px 32px -4px rgba(112, 214, 160, 0.15)"
          : "0 8px 32px -4px rgba(233, 187, 115, 0.15)",
      }}
    >
      {isOnline ? (
        <>
          <span className="flex h-2 w-2 rounded-full bg-[#70D6A0] animate-pulse" />
          <Wifi className="w-3.5 h-3.5 text-[#70D6A0]" />
          <span>Back online — Connection restored</span>
        </>
      ) : (
        <>
          <span className="flex h-2 w-2 rounded-full bg-[#E9BB73] animate-pulse" />
          <WifiOff className="w-3.5 h-3.5 text-[#E9BB73]" />
          <span>You&apos;re offline — Playing downloaded tracks</span>
        </>
      )}
    </aside>
  );
}

export default NetworkBanner;

