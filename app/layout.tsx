import type { Metadata } from "next";
import { BmcButton } from "@/components/bmc-button";
import "../desktop.css";

export const metadata: Metadata = {
  title: "Timmy Tickle's One-Ball Bonanza",
  description: "Live, authoritative standings for the World Cup sweepstake.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <BmcButton />
      </body>
    </html>
  );
}
