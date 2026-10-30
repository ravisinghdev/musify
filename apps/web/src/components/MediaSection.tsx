"use client";

import React, { useRef } from "react";
import { Icon } from "./Icons";

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
  layout = "carousel",
  className = "",
}: MediaSectionProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const offset = direction === "left" ? -400 : 400;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <section className={`mt-8 sm:mt-10 select-none ${className}`}>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3.5 px-1">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {layout === "carousel" && (
            <div className="hidden sm:flex items-center gap-1.5 mr-1">
              <button
                onClick={() => scroll("left")}
                aria-label={`Scroll ${title} left`}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-400 transition hover:bg-white/10 hover:text-white active:scale-95"
              >
                <Icon name="chevron-left" size={13} />
              </button>
              <button
                onClick={() => scroll("right")}
                aria-label={`Scroll ${title} right`}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-400 transition hover:bg-white/10 hover:text-white active:scale-95"
              >
                <Icon name="chevron-right" size={13} />
              </button>
            </div>
          )}

          {onAction && (
            <button
              onClick={onAction}
              className="text-xs font-semibold text-zinc-400 hover:text-white transition"
            >
              {actionText}
            </button>
          )}
        </div>
      </div>

      {/* Grid or Carousel Container */}
      {layout === "grid" ? (
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {children}
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 custom-scrollbar snap-x snap-mandatory scroll-smooth [&>*]:shrink-0 [&>*]:w-[155px] [&>*]:sm:w-[185px] [&>*]:md:w-[200px]"
        >
          {children}
        </div>
      )}
    </section>
  );
}
