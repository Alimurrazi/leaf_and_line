import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { studioEnabled } from "@/studio/guard";

export const metadata: Metadata = { title: "Studio", robots: { index: false, follow: false } };

// The studio reads and writes repo files: it only exists under `npm run dev`. Production builds serve 404.
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  if (!studioEnabled()) notFound();
  return children;
}
