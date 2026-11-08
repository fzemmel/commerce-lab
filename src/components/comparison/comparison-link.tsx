"use client";

import Link from "next/link";

import { useComparison } from "@/components/comparison/comparison-provider";

export function ComparisonLink() {
  const { products } = useComparison();

  return (
    <Link href="/compare" className="transition hover:text-slate-950">
      Compare ({products.length})
    </Link>
  );
}
