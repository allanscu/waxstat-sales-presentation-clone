import type { Metadata } from "next";
import { BRAND } from "@/lib/deck";
import "./globals.css";

// The real app loads licensed brand fonts with next/font/local. This one uses
// the system stack — drop your .otf/.woff2 files in app/fonts and swap in
// localFont() here if you want typography of your own.

export const metadata: Metadata = {
  title: BRAND.product,
  description: "Generate an on-brand sales deck for any prospect in minutes.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-paper text-ink">{children}</body>
    </html>
  );
}
