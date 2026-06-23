"use client";
import { useEffect } from "react";

export function BmcButton() {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js";
    script.setAttribute("data-name", "bmc-button");
    script.setAttribute("data-slug", "rowpkee");
    script.setAttribute("data-color", "#5F7FFF");
    script.setAttribute("data-emoji", "");
    script.setAttribute("data-font", "Cookie");
    script.setAttribute("data-text", "Don't be a prick");
    script.setAttribute("data-outline-color", "#000000");
    script.setAttribute("data-font-color", "#ffffff");
    script.setAttribute("data-coffee-color", "#FFDD00");
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);
  return null;
}
