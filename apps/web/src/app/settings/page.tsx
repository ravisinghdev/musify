"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/?tab=Settings");
  }, [router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-black text-white">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        <span className="text-sm font-medium text-zinc-400">Opening Musify Studio Settings...</span>
      </div>
    </div>
  );
}
