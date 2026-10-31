import Link from "next/link";
import { Repeat } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <Link
            href="/"
            className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-md hover:scale-105 transition-transform"
          >
            <Repeat className="w-6 h-6" />
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Brightloop
          </h2>
          <p className="text-xs text-muted-foreground">
            Subscription Management Platform
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
