"use client";

import { useState, useEffect, useCallback } from "react";

export interface NetworkState {
  isOnline: boolean;
  wasOffline: boolean;
  effectiveType?: string;
  saveData?: boolean;
}

export function useNetworkStatus(): NetworkState {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window !== "undefined" && typeof navigator !== "undefined") {
      return navigator.onLine;
    }
    return true;
  });

  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [connectionDetails, setConnectionDetails] = useState<{
    effectiveType?: string;
    saveData?: boolean;
  }>({});

  const updateConnectionInfo = useCallback(() => {
    if (typeof navigator !== "undefined" && "connection" in navigator) {
      const conn = (navigator as unknown as { connection?: { effectiveType?: string; saveData?: boolean } }).connection;
      if (conn) {
        setConnectionDetails({
          effectiveType: conn.effectiveType,
          saveData: conn.saveData,
        });
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      setIsOnline(true);
      updateConnectionInfo();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    updateConnectionInfo();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [updateConnectionInfo]);

  return {
    isOnline,
    wasOffline,
    effectiveType: connectionDetails.effectiveType,
    saveData: connectionDetails.saveData,
  };
}

