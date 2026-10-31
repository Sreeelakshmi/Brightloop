import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface LogoProps {
  size?: "sm" | "default" | "lg";
  showSubtitle?: boolean;
  className?: string;
  href?: string;
}

/**
 * HexagonClusterIcon: Distinctive geometric cluster mark
 * Consists of interconnected telemetry hexagons matching the Brightloop identity.
 */
export function HexagonClusterIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 text-[#2B302B]", className)}
      aria-hidden="true"
    >
      {/* Primary Top Hexagon */}
      <polygon
        points="16,3 23,7 23,15 16,19 9,15 9,7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Lower Right Hexagon */}
      <polygon
        points="22,14 29,18 29,26 22,30 15,26 15,18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="none"
        strokeOpacity="0.85"
      />
      {/* Lower Left Hexagon */}
      <polygon
        points="10,14 17,18 17,26 10,30 3,26 3,18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="none"
        strokeOpacity="0.85"
      />
      {/* Center telemetry focal node */}
      <circle cx="16" cy="18" r="1.5" fill="#F57B4A" />
    </svg>
  );
}

/**
 * Brightloop Brand Logo Component
 * Hexagon-cluster mark + "Brightloop" title + "Subscription Control System" subtitle.
 */
export function Logo({
  size = "default",
  showSubtitle = true,
  className,
  href = "/",
}: LogoProps) {
  const sizeClasses = {
    sm: {
      icon: "w-5 h-5",
      title: "text-base tracking-tight",
      subtitle: "text-[9px] -mt-0.5",
    },
    default: {
      icon: "w-7 h-7",
      title: "text-lg font-extrabold tracking-tight",
      subtitle: "text-[10px] -mt-0.5 tracking-tight font-medium",
    },
    lg: {
      icon: "w-9 h-9",
      title: "text-2xl font-black tracking-tight",
      subtitle: "text-xs font-medium tracking-normal",
    },
  }[size];

  const content = (
    <div className={cn("flex items-center gap-2.5 select-none", className)}>
      <HexagonClusterIcon className={sizeClasses.icon} />
      <div className="flex flex-col">
        <span className={cn("font-bold text-[#2B302B] leading-tight", sizeClasses.title)}>
          Brightloop
        </span>
        {showSubtitle && (
          <span className={cn("text-[#8A968A] uppercase font-mono tracking-wider", sizeClasses.subtitle)}>
            Subscription Control System
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex hover:opacity-95 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}

