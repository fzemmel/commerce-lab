import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Commerce Search Lab",
  description:
    "A focused Next.js product discovery app for search, filters, and URL-driven commerce state.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-stone-50 text-slate-950">
        <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <Link href="/" className="font-semibold tracking-tight">
              Commerce Search Lab
            </Link>
            <nav aria-label="Primary navigation" className="flex items-center gap-5 text-sm font-medium text-slate-600">
              <Link href="/products" className="transition hover:text-slate-950">
                Products
              </Link>
              <a href="https://nextjs.org" className="transition hover:text-slate-950">
                Next.js
              </a>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
