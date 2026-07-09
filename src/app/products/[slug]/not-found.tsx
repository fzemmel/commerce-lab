import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function ProductNotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Product not found</h1>
        <p className="mt-4 text-slate-600">The requested product slug does not exist in the local catalog.</p>
        <Link href="/products" className={buttonVariants({ variant: "primary", className: "mt-6" })}>
          Back to products
        </Link>
      </div>
    </main>
  );
}
