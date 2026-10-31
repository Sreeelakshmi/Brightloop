import Link from "next/link";
import { Repeat } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-brightloop-bg flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <Link
            href="/"
            className="w-12 h-12 rounded-lg bg-brightloop-coral flex items-center justify-center text-white shadow-card hover:bg-brightloop-coral-hover transition-colors"
            title="Brightloop Home"
          >
            <Repeat className="w-6 h-6" />
          </Link>
          <h2 className="text-2xl font-extrabold uppercase tracking-wider text-brightloop-text">
            Brightloop
          </h2>
          <p className="text-xs font-semibold uppercase tracking-wider text-brightloop-sage">
            Subscription Control System
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
