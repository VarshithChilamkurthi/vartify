import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

import { AudioPlayerRoot } from "@/components/AudioPlayerRoot";
import { AppShell } from "@/components/layout/AppShell";
import { PlayerBar } from "@/components/player/PlayerBar";
import { PlayerExpanded } from "@/components/player/PlayerExpanded";
import { NowPlayingQueuePanel } from "@/components/player/NowPlayingQueuePanel";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Vartify",
  description: "Vartify is a music streaming platform that allows you to stream music from your favorite artists.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AudioPlayerRoot />
        <div className="flex h-screen flex-col overflow-hidden bg-neutral-950">
          {/* Top Workspace: Main Content + Sliding Queue */}
          <div className="flex flex-1 overflow-hidden relative">
            <AppShell>{children}</AppShell>
            <NowPlayingQueuePanel />
          </div>
          
          {/* Bottom Anchor: Player Bar stays full width */}
          <PlayerBar />
        </div>
        <PlayerExpanded />
      </body>
    </html>
  );
}
