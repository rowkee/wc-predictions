import type { Metadata } from "next";
import Script from "next/script";
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
        <Script
          src="https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js"
          data-name="bmc-button"
          data-slug="rowpkee"
          data-color="#5F7FFF"
          data-emoji=""
          data-font="Cookie"
          data-text="Don't be a prick"
          data-outline-color="#000000"
          data-font-color="#ffffff"
          data-coffee-color="#FFDD00"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
