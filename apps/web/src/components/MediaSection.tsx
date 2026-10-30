"use client";

import React from "react";

export interface MediaSectionProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  onAction?: () => void;
  children: React.ReactNode;
  layout?: "grid" | "carousel";
  className?: string;
}

export function MediaSection({
  title,
  subtitle,
  actionText = "See all",
  onAction,
  children,
  layout = "grid",
  className = "",
}: MediaSectionProps) {
  return (
    <section className={`mt-10 select-none ${className}`}>
      {/* Section Header */}
      <div className="flex items-end justify-between mb-4 px-1">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight sm:text-xl">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>
          )}
        </div>

        {onAction && (
          <button
            onClick={onAction}
            className="text-xs font-semibold text-zinc-400 hover:text-white transition"
          >
            {actionText}
          </button>
        )}
      </div>

      {/* Grid or Carousel Container */}
      {layout === "grid" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {children}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar scroll-smooth [&>*]:shrink-0 [&>*]:w-[160px] [&>*]:sm:w-[190px] [&>*]:md:w-[200px]">
          {children}
        </div>
      )}
    </section>
  );
}

