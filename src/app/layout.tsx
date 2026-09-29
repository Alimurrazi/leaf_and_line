import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Leaf & Line", template: "%s · Leaf & Line" },
  description: "A library of graphic novels to read online.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
