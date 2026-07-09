import Image from "next/image";

import { cn } from "@/lib/cn";
import type { Product } from "@/types/product";

type ProductImageProps = {
  product: Product;
  image?: string;
  className?: string;
  sizes: string;
  priority?: boolean;
};

function isRemoteImageUrl(value: string) {
  return value.startsWith("https://") || value.startsWith("http://");
}

export function ProductImage({ product, image = product.image, className, sizes, priority = false }: ProductImageProps) {
  const alt = `${product.name} by ${product.brand}`;

  if (isRemoteImageUrl(image)) {
    return (
      <div className={cn("relative overflow-hidden rounded-2xl border border-white/70 bg-white/60", className)}>
        <Image src={image} alt={alt} fill sizes={sizes} priority={priority} className="object-contain p-4" />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex items-end justify-center rounded-2xl border border-white/70 bg-white/50 p-6 text-center text-xs font-semibold uppercase tracking-[0.22em] text-slate-500",
        className,
      )}
    >
      {image}
    </div>
  );
}
