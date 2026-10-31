/**
 * Brightloop Visual Theme Configuration (Sage Green, Charcoal & Orange)
 *
 * Exporting Tailwind class constants with arbitrary values so Member 4 can
 * swap them for design system tokens later without editing shared configs.
 */

import type { SubscriptionStatus } from "@/types/subscription";

export const THEME = {
  // Page background: #E4ECE1
  pageBackground: "bg-[#E4ECE1] min-h-screen text-[#1F2622]",

  // Card surface: #FFFFFF with 1px border #D5DDD2 and rounded-xl
  card: "bg-white border border-[#D5DDD2] rounded-xl shadow-sm text-[#1F2622]",

  // Primary dark (headings, primary buttons, active states): #1F2622
  primaryDark: {
    heading: "text-[#1F2622] font-bold tracking-tight uppercase",
    button:
      "bg-[#1F2622] text-white hover:bg-[#2f3a34] transition-colors rounded-lg font-medium shadow-sm disabled:opacity-50",
    text: "text-[#1F2622]",
  },

  // Secondary button (white with a border)
  secondaryButton:
    "bg-white border border-[#D5DDD2] text-[#1F2622] hover:bg-[#F3F7F2] transition-colors rounded-lg font-medium shadow-sm disabled:opacity-50",

  // Muted sage (secondary surfaces, table header, subheadings): #8C9B8E
  mutedSage: {
    surface: "bg-[#DDE5DB]",
    tableHeader:
      "bg-[#DDE5DB] text-[#1F2622] font-bold text-xs uppercase tracking-wider border-b border-[#D5DDD2]",
    text: "text-[#657367]",
    border: "border-[#D5DDD2]",
  },

  // Accent orange (attention only: overdue, warnings, confirmations): #F27B4B
  accentOrange: {
    button:
      "bg-[#F27B4B] text-white hover:bg-[#de6432] transition-colors rounded-lg font-medium shadow-sm",
    badge:
      "bg-[#FDEEE7] text-[#D95522] border border-[#F27B4B] font-semibold uppercase tracking-wider",
    text: "text-[#F27B4B]",
    border: "border-[#F27B4B]",
  },

  // Standard input elements
  input:
    "h-9 px-3 rounded-lg border border-[#D5DDD2] bg-white text-[#1F2622] text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-[#1F2622]",

  // Table wrapper
  tableWrapper: "bg-white rounded-xl border border-[#D5DDD2] overflow-hidden shadow-sm",
} as const;

/**
 * Subscription status pills, small, rounded, uppercase:
 * - draft = light gray with dark text
 * - quotation = light sage with dark text
 * - confirmed = muted sage with white text
 * - active = dark charcoal with white text
 * - paused = white with an orange border and orange text
 * - closed = light gray with muted text
 */
export function getStatusPillClasses(status: SubscriptionStatus): string {
  const base =
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider";

  switch (status) {
    case "draft":
      return `${base} bg-[#E5E9E4] text-[#1F2622]`;
    case "quotation":
      return `${base} bg-[#D3DFD2] text-[#1F2622]`;
    case "confirmed":
      return `${base} bg-[#8C9B8E] text-white`;
    case "active":
      return `${base} bg-[#1F2622] text-white`;
    case "paused":
      return `${base} bg-white border border-[#F27B4B] text-[#F27B4B]`;
    case "closed":
      return `${base} bg-[#E5E9E4] text-[#8C9B8E]`;
    default:
      return `${base} bg-[#E5E9E4] text-[#1F2622]`;
  }
}
