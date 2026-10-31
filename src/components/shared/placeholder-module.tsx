import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { GitBranch, User, Layers, ArrowLeft } from "lucide-react";

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              Module Placeholder
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
              Ready for Implementation
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Overview
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              Module Scope & Planned Capabilities
            </CardTitle>
            <CardDescription>
              This section is reserved for {assignedMember}. No business logic or mock data has been added yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {plannedFeatures.map((feature, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 rounded-lg border p-3 bg-muted/40 text-sm"
                >
                  <span className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="rounded-lg border border-dashed p-4 text-xs text-muted-foreground bg-muted/20">
              <p className="font-semibold text-foreground mb-1">Architectural Boundary Reminder:</p>
              Per hackathon guidelines, all database tables, API handlers, and interactive state for this module must be developed inside the assigned feature branch.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-primary" />
              Ownership
            </CardTitle>
            <CardDescription>Git workflow for this area</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Assigned Team Member
              </span>
              <div className="flex items-center gap-2 font-medium text-foreground">
                <User className="w-4 h-4 text-muted-foreground" />
                {assignedMember}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Feature Branch
              </span>
              <div className="font-mono text-xs bg-muted px-2.5 py-1.5 rounded-md border text-primary font-medium break-all">
                {branch}
              </div>
            </div>

            <div className="pt-2 border-t">
              <span className="text-xs text-muted-foreground">Checkout command:</span>
              <pre className="font-mono text-[11px] bg-slate-900 text-slate-100 p-2 rounded mt-1 overflow-x-auto">
                git checkout {branch}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
