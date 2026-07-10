"use client";

import { Button } from "@/components/ui/button";

export default function ProductsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-700">Listing error</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">The product listing could not be rendered.</h1>
        <p className="mt-4 text-slate-600">Please try again or return to the listing later.</p>
        <Button type="button" onClick={reset} className="mt-6">
          Try again
        </Button>
      </div>
    </main>
  );
}
