"use client";

import React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordChecklistProps {
  password: string;
  className?: string;
}

export function PasswordChecklist({ password = "", className }: PasswordChecklistProps) {
  const checks = [
    {
      label: "More than 8 characters (9+ chars)",
      valid: password.length > 8,
    },
    {
      label: "At least one uppercase letter (A–Z)",
      valid: /[A-Z]/.test(password),
    },
    {
      label: "At least one lowercase letter (a–z)",
      valid: /[a-z]/.test(password),
    },
    {
      label: "At least one special character (!@#$%...)",
      valid: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password),
    },
  ];

  return (
    <div className={cn("p-3 bg-[#E4EEE4]/50 border border-[#B9CBB9] rounded-[2px] space-y-1.5", className)}>
      <div className="text-[10px] font-bold uppercase tracking-wider text-[#8A968A] font-mono">
        PASSWORD SECURITY REQUIREMENTS
      </div>
      <div className="grid grid-cols-1 gap-1">
        {checks.map((c, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            {c.valid ? (
              <span className="w-3.5 h-3.5 rounded-full bg-[#2B302B] text-white flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5" />
              </span>
            ) : (
              <span className="w-3.5 h-3.5 rounded-full border border-[#8A968A] flex items-center justify-center shrink-0">
                <span className="w-1 h-1 rounded-full bg-[#8A968A]" />
              </span>
            )}
            <span
              className={cn(
                "text-[11px] font-mono transition-colors",
                c.valid ? "text-[#2B302B] font-bold" : "text-[#8A968A]"
              )}
            >
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

