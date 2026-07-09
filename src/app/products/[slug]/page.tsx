import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductBadges } from "@/components/product/product-badges";
import { ProductImage } from "@/components/product/product-image";
import { ProductPrice } from "@/components/product/product-price";
import { buttonVariants } from "@/components/ui/button";
import { formatCategoryLabel, getProductBySlug } from "@/lib/product-query";
import { getProductCatalog } from "@/lib/products-api";

type ProductDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const catalog = await getProductCatalog();

  return catalog.products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const catalog = await getProductCatalog();
  const product = getProductBySlug(slug, catalog.products);

  if (!product) {
    return { title: "Product not found | Commerce Search Lab" };
  }

  return {
    title: `${product.name} | Commerce Search Lab`,
    description: product.description,
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const catalog = await getProductCatalog();
  const product = getProductBySlug(slug, catalog.products);

  if (!product) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/products" className="text-sm font-semibold text-slate-600 transition hover:text-slate-950">
        Back to product list
      </Link>

      <section className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-stone-100 via-amber-50 to-teal-50 p-6 shadow-sm">
          <ProductImage
            product={product}
            image={product.images?.[0] ?? product.image}
            className="min-h-[420px] rounded-[1.5rem]"
            sizes="(min-width: 1024px) 45vw, 100vw"
            priority
          />
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <ProductBadges isNew={product.isNew} isSale={product.isSale} />
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">{product.brand}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{product.name}</h1>
          <p className="mt-4 text-sm font-medium text-slate-500">{formatCategoryLabel(product.category)}</p>
          <p className="mt-6 text-lg leading-8 text-slate-700">{product.description}</p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <ProductPrice price={product.price} originalPrice={product.originalPrice} />
            <span
              className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700"
              aria-label={`Rating: ${product.rating.toFixed(1)} out of 5`}
            >
              Rating {product.rating.toFixed(1)} / 5
            </span>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-8">
            <h2 className="text-lg font-semibold">Attributes</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-3">
              {Object.entries(product.attributes).map(([name, value]) => value ? (
                <div key={name} className="rounded-2xl bg-slate-50 p-4">
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{name}</dt>
                  <dd className="mt-2 font-semibold text-slate-950">{value}</dd>
                </div>
              ) : null)}
            </dl>
          </div>

          <Link href="/products" className={buttonVariants({ variant: "primary", size: "lg", className: "mt-8" })}>
            Back to listing
          </Link>
        </div>
      </section>
    </main>
  );
}
