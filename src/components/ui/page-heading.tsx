import React from "react";
import { cn } from "@/lib/utils";
import { Hexagon } from "lucide-react";

export interface PageHeadingProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  showAccentBar?: boolean;
  showHexagon?: boolean;
  className?: string;
}

export function PageHeading({
  title,
  description,
  badge,
  actions,
  showAccentBar = true,
  showHexagon = true,
  className,
}: PageHeadingProps) {
  return (
    <div className={cn("space-y-4 mb-6 sm:mb-8", className)}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1.5">
          {/* Main bold uppercase heading with geometric hexagon */}
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold uppercase tracking-tight text-brightloop-text">
              {title}
            </h1>
            {showHexagon && (
              <Hexagon className="w-5 h-5 text-brightloop-text shrink-0 stroke-[2.2]" />
            )}
          </div>

          {/* Subtitle / Index label and badge */}
          {(description || badge) && (
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-brightloop-text/80 font-medium">
              {description && <span>{description}</span>}
              {badge && <div className="inline-flex items-center">{badge}</div>}
              <span className="w-6 h-[2px] bg-brightloop-text/60 inline-block rounded-full ml-1" />
            </div>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start sm:self-auto">
            {actions}
          </div>
        )}
      </div>

      {/* Signature Brightloop 3-color segmented bar: Dark Charcoal | Sage Green | Coral Orange */}
      {showAccentBar && (
        <div className="w-full h-1.5 rounded-full overflow-hidden flex bg-brightloop-border">
          <div className="w-1/2 bg-brightloop-text" />
          <div className="w-1/4 bg-brightloop-sage" />
          <div className="w-1/4 bg-brightloop-coral" />
        </div>
      )}
    </div>
  );
}
