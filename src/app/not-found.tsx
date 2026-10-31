import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
        <FileQuestion className="w-8 h-8" />
      </div>
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Page Not Found</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          The requested Brightloop module or route does not exist in this project skeleton.
        </p>
      </div>
      <div className="flex items-center gap-3 pt-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
