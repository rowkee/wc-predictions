import type { Metadata } from "next";
import "../desktop.css";

export const metadata: Metadata = {
  title: "Sweeper — World Cup Pool",
  description: "Live, authoritative standings for the World Cup sweepstake.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
