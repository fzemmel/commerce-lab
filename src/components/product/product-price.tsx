import { formatPrice } from "@/lib/format-price";

type ProductPriceProps = {
  price: number;
  originalPrice?: number;
};

export function ProductPrice({ price, originalPrice }: ProductPriceProps) {
  const hasDiscount = originalPrice !== undefined && originalPrice > price;

  return (
    <div className="flex items-baseline gap-2">
      <span className="text-lg font-semibold text-slate-950">
        <span className="sr-only">Current price: </span>
        {formatPrice(price)}
      </span>
      {hasDiscount ? (
        <span className="text-sm text-slate-500 line-through">
          <span className="sr-only">Original price: </span>
          {formatPrice(originalPrice)}
        </span>
      ) : null}
    </div>
  );
}
