import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "minread — What did I miss?",
  description: "Catch up on conversations with tasks, deadlines, summaries, and supporting evidence.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
