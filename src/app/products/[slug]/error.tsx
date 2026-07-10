"use client";

import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";

export default function ProductDetailError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-700">Product error</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">This product detail page could not be rendered.</h1>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button type="button" onClick={reset}>
            Try again
          </Button>
          <Link href="/products" className={buttonVariants({ variant: "outline" })}>
            Back to listing
          </Link>
        </div>
      </div>
    </main>
  );
}
