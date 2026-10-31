import type { Metadata } from "next";
import { Inter_Tight, Space_Grotesk } from "next/font/google";
import "./globals.css";

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

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

