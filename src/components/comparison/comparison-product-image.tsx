"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/cn";
import type { Product } from "@/types/product";

const COMPARISON_IMAGE_SIZES = "160px";

function getConfiguredImageUrl(value: string | undefined): string | null {
  if (!value?.trim()) {
    return null;
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "https:" || url.hostname !== "cdn.dummyjson.com") {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

type ComparisonProductImageProps = {
  product: Product;
  className?: string;
};

export function ComparisonProductImage({ product, className }: ComparisonProductImageProps) {
  const [hasError, setHasError] = useState(false);
  const imageUrl = getConfiguredImageUrl(product.image);
  const alt = `${product.name} by ${product.brand}`;
  const imageClassName = cn("h-32 w-40 overflow-hidden rounded-2xl border", className);

  if (imageUrl && !hasError) {
    return (
      <div className={cn(imageClassName, "relative border-slate-200 bg-slate-50")}>
        <Image
          src={imageUrl}
          alt={alt}
          fill
          sizes={COMPARISON_IMAGE_SIZES}
          className="object-contain p-3"
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={alt}
      className={cn(
        imageClassName,
        "flex items-center justify-center border-dashed border-slate-300 bg-slate-50 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500",
      )}
    >
      <span aria-hidden="true">No image</span>
    </div>
  );
}
