"use client";

import React, { useEffect } from "react";
import { Icon } from "./Icons";

export interface ToastMessage {
  id: string;
  type?: "success" | "info" | "heart";
  message: string;
  subtext?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  return (
    <div className="fixed bottom-24 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 3200);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      role="status"
      className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/10 bg-black/70 px-4 py-3 shadow-[0_10px_35px_rgba(0,0,0,0.6)] backdrop-blur-xl animate-fade-in transition-all duration-300"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
        {toast.type === "heart" ? (
          <Icon name="heart-filled" size={14} className="text-rose-500" />
        ) : toast.type === "success" ? (
          <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
        ) : (
          <Icon name="sparkles" size={14} className="text-indigo-400" />
        )}
      </div>

      <div className="min-w-0 pr-2">
        <p className="text-xs font-semibold text-white tracking-tight">
          {toast.message}
        </p>
        {toast.subtext && (
          <p className="truncate text-[11px] text-zinc-400">{toast.subtext}</p>
        )}
      </div>

      <button
        onClick={() => onDismiss(toast.id)}
        className="ml-auto text-zinc-500 hover:text-white transition p-0.5"
        aria-label="Dismiss notification"
      >
        <Icon name="close" size={13} />
      </button>
    </div>
  );
}

