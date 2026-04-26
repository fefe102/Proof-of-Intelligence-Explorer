import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Proof-of-Intelligence Explorer",
  description: "Verify encrypted intelligence, persistent memory, compute history, and replayable iNFT behavior."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
