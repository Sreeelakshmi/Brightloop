import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeading } from "@/components/ui/page-heading";
import { GitBranch, User, Layers, ArrowLeft, CheckCircle2 } from "lucide-react";

interface PlaceholderModuleProps {
  title: string;
  description: string;
  assignedMember: string;
  branch: string;
  plannedFeatures: string[];
}

export function PlaceholderModule({
  title,
  description,
  assignedMember,
  branch,
  plannedFeatures,
}: PlaceholderModuleProps) {
  return (
    <div className="space-y-6">
      <PageHeading
        title={title}
        description={description}
        badge={
          <div className="flex items-center gap-2">
            <Badge variant="coral">Module Workspace</Badge>
            <Badge variant="sage">Feature Branch</Badge>
          </div>
        }
        actions={
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brightloop-sage hover:text-brightloop-text transition-colors bg-white px-3 py-1.5 rounded-md border border-border shadow-subtle"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-bold uppercase tracking-wider flex items-center gap-2 text-brightloop-text">
              <Layers className="w-4 h-4 text-brightloop-coral" />
              Module Scope & Planned Capabilities
            </CardTitle>
            <CardDescription>
              This section is allocated to <strong className="text-brightloop-text">{assignedMember}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {plannedFeatures.map((feature, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 rounded-md border border-border p-3 bg-brightloop-bg/20 text-xs font-medium text-brightloop-text"
                >
                  <CheckCircle2 className="h-4 w-4 text-brightloop-coral mt-0.5 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="rounded-md border border-border bg-brightloop-bg/40 p-4 text-xs text-brightloop-text space-y-1">
              <p className="font-bold uppercase tracking-wider text-[11px] text-brightloop-sage">
                Architectural Boundary Guidelines
              </p>
              <p className="text-brightloop-text/90">
                All database tables, API handlers, and UI workflows for this feature should remain scoped to the assigned branch. Use the shared theme components (`Card`, `Button`, `PageHeading`, `KPICard`, `Badge`, `Table`) for visual consistency.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold uppercase tracking-wider flex items-center gap-2 text-brightloop-text">
              <GitBranch className="w-4 h-4 text-brightloop-coral" />
              Ownership & Git
            </CardTitle>
            <CardDescription>Branch allocation details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-brightloop-sage uppercase tracking-wider">
                Assigned Team Member
              </span>
              <div className="flex items-center gap-2 font-semibold text-brightloop-text bg-brightloop-bg/30 p-2 rounded-md border border-border">
                <User className="w-4 h-4 text-brightloop-coral" />
                {assignedMember}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-brightloop-sage uppercase tracking-wider">
                Feature Branch
              </span>
              <div className="font-mono text-xs bg-white px-3 py-2 rounded-md border border-border text-brightloop-coral font-bold break-all shadow-subtle">
                {branch}
              </div>
            </div>

            <div className="pt-2 border-t border-border">
              <span className="text-[11px] font-bold text-brightloop-sage uppercase tracking-wider">
                Checkout Command
              </span>
              <pre className="font-mono text-[11px] bg-brightloop-text text-white p-2.5 rounded-md mt-1 overflow-x-auto">
                git checkout {branch}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
