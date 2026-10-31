import React from "react";
import Link from "next/link";
import { getMockDb } from "@/lib/mock/db";
import { PageHeader } from "@/components/ui-shared/PageHeader";
import { EmptyState } from "@/components/ui-shared/EmptyState";
import { Mail, ExternalLink, Clock, ShieldAlert } from "lucide-react";
import { formatDate } from "@/lib/formatters";

export const dynamic = "force-dynamic";

export default function DevMailboxPage() {
  const isDev = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";
  const db = getMockDb();
  const emails = db.emails || [];

  if (!isDev) {
    return (
      <div className="min-h-screen bg-[#E4EEE4] flex items-center justify-center p-4">
        <div className="p-6 bg-white border border-[#B9CBB9] rounded-[3px] text-center space-y-2">
          <ShieldAlert className="w-8 h-8 text-[#F57B4A] mx-auto" />
          <h2 className="text-sm font-bold text-[#2B302B] uppercase">Development Feature Only</h2>
          <p className="text-xs text-[#8A968A]">This mailbox is disabled in production.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E4EEE4] p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/login"
            className="text-xs font-mono font-bold text-[#8A968A] hover:text-[#2B302B] transition-colors"
          >
            ← BACK TO LOGIN
          </Link>
          <span className="text-[10px] font-mono px-2 py-0.5 bg-[#D3E3D3] text-[#2B302B] border border-[#B9CBB9] rounded-[2px] font-bold">
            MOCK DISPATCH QUEUE // {emails.length} EMAILS
          </span>
        </div>

        <PageHeader
          title="DEV MAILBOX"
          subtitle="Simulated Local Mail Delivery (Forgot Password & System Alerts)"
          logDate="31.10.2026"
          showHexagonMark
        />

        {emails.length === 0 ? (
          <div className="bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] p-8">
            <EmptyState
              title="No Dispatched Emails"
              description="Trigger a password recovery request from /forgot-password to inspect outgoing mock emails here."
            />
          </div>
        ) : (
          <div className="space-y-4">
            {emails.map((email) => (
              <div
                key={email.id}
                className="bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] overflow-hidden shadow-none"
              >
                <div className="bg-[#D3E3D3] px-4 py-2.5 border-b border-[#B9CBB9] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-[#2B302B]" />
                    <span className="text-xs font-bold text-[#2B302B] font-mono">
                      TO: {email.to}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#8A968A]">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(email.createdAt, "short")} {new Date(email.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>

                <div className="p-4 sm:p-5 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A968A] font-mono block">
                      SUBJECT
                    </span>
                    <span className="text-sm font-bold text-[#2B302B]">
                      {email.subject}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A968A] font-mono block mb-1">
                      MESSAGE BODY
                    </span>
                    <pre className="text-xs font-mono bg-[#E4EEE4]/50 border border-[#B9CBB9] p-3 rounded-[2px] whitespace-pre-wrap text-[#2B302B] leading-relaxed">
                      {email.body}
                    </pre>
                  </div>

                  {email.resetUrl && (
                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[#8A968A]">
                        SINGLE-USE TOKEN EXPIRING IN 30 MINUTES
                      </span>
                      <Link
                        href={email.resetUrl}
                        className="inline-flex items-center gap-1.5 h-8 px-4 bg-[#2B302B] hover:bg-black text-white text-xs font-mono font-bold uppercase rounded-[2px] transition-colors"
                      >
                        <span>OPEN RESET LINK</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

