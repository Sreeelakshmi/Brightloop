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
      className={cn("shrink-0 text-[#1F2622]", className)}
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
      <circle cx="16" cy="18" r="1.5" fill="#F27B4B" />
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
      subtitle: "text-[9px]",
    },
    default: {
      icon: "w-7 h-7",
      title: "text-lg font-black tracking-tight",
      subtitle: "text-[10px]",
    },
    lg: {
      icon: "w-9 h-9",
      title: "text-2xl font-black tracking-tight",
      subtitle: "text-xs",
    },
  };

  const selectedSize = sizeClasses[size];

  const content = (
    <div className={cn("inline-flex items-center gap-2.5 group select-none", className)}>
      <HexagonClusterIcon className={cn(selectedSize.icon, "text-[#1F2622]")} />
      <div className="flex flex-col leading-none">
        <span
          className={cn(
            "font-black text-[#1F2622] uppercase tracking-tight group-hover:text-[#F27B4B] transition-colors",
            selectedSize.title
          )}
        >
          Brightloop
        </span>
        {showSubtitle && (
          <span
            className={cn(
              "font-medium text-[#8C9B8E] tracking-tight mt-0.5",
              selectedSize.subtitle
            )}
          >
            Subscription Control System
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
