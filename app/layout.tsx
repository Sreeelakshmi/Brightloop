import type { Metadata } from "next";
import "./globals.css";

// Fonts are loaded via globals.css @import at runtime (build-time Google Fonts fetch
// is skipped so the project builds offline / in sandboxed CI environments).
// The CSS variables --font-inter-tight and --font-space-grotesk are set there.

// Minimal variable-font shims so layout can reference .variable class names
const interTight = { variable: "font-inter-tight" };
const spaceGrotesk = { variable: "font-space-grotesk" };

export const metadata: Metadata = {
  title: "Brightloop | Subscription Control System",
  description: "Telemetry console for subscription management and billing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${interTight.variable} ${spaceGrotesk.variable}`}>
      <body className="font-sans antialiased bg-[#E4EEE4] text-[#2B302B]">
        {children}
      </body>
    </html>
  );
}

