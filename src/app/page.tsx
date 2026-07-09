import Link from "next/link";

import { ProductGrid } from "@/components/product/product-grid";
import { ProductImage } from "@/components/product/product-image";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { getProductCatalog } from "@/lib/products-api";

export default async function Home() {
  const catalog = await getProductCatalog();
  const featuredProducts = catalog.products.filter((product) => product.isNew || product.isSale).slice(0, 4);

  return (
    <main>
      <section className="relative overflow-hidden border-b border-slate-200 bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.22),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(45,212,191,0.16),_transparent_30%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-28">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-amber-100">
              Product discovery with App Router
            </p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
              A commerce search lab built around React architecture.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Using Next.js patterns: Server Components, URL-based filters, TypeScript domain models, and Tailwind UI.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/products" className={buttonVariants({ variant: "primary", size: "lg" })}>
                Explore products
              </Link>
              <Link
                href="/products?q=mascara&category=beauty&sort=price-asc"
                className={buttonVariants({ variant: "secondary", size: "lg" })}
              >
                Try URL filters
              </Link>
            </div>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur">
            <div className="rounded-[1.5rem] bg-stone-50 p-4 text-slate-950">
              <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Live query</p>
                  <p className="font-semibold">?q=mascara&category=beauty</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                  Server filtered
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {featuredProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <ProductImage product={product} className="mb-3 h-24 rounded-xl" sizes="(min-width: 640px) 220px, 50vw" />
                    <p className="text-sm text-slate-500">{product.brand}</p>
                    <p className="font-semibold">{product.name}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Featured catalog sample</h2>
            <p className="mt-2 max-w-2xl text-slate-600">
              The same product cards are used on the listing route, backed by the server-loaded product catalog.
            </p>
          </div>
          <Link href="/products" className={cn(buttonVariants({ variant: "ghost" }), "self-start sm:self-auto")}>
            View all products
          </Link>
        </div>
        <ProductGrid products={featuredProducts} />
      </section>
    </main>
  );
}
