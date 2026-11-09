import type { PriceBounds } from "@/lib/product-query";

/**
 * Range inputs operate on a normalized 0..1000 scale instead of raw euros.
 * A logarithmic mapping keeps the low-price band usable on catalogs whose
 * prices span several orders of magnitude (for example €0.79 to €36,999.99).
 */
export const PRICE_POSITION_MIN = 0;
export const PRICE_POSITION_MAX = 1000;
export const PRICE_POSITION_STEP = 1;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function clampPricePosition(position: number) {
  if (!Number.isFinite(position)) {
    return PRICE_POSITION_MIN;
  }

  return clamp(position, PRICE_POSITION_MIN, PRICE_POSITION_MAX);
}

export function snapPriceToStep(value: number, bounds: PriceBounds) {
  if (!Number.isFinite(value)) {
    return bounds.min;
  }

  if (bounds.step <= 0) {
    return clamp(value, bounds.min, bounds.max);
  }

  const steps = Math.round((value - bounds.min) / bounds.step);

  return clamp(Number((bounds.min + steps * bounds.step).toFixed(10)), bounds.min, bounds.max);
}

export function priceToPosition(price: number, bounds: PriceBounds) {
  if (!Number.isFinite(price) || bounds.max <= bounds.min) {
    return PRICE_POSITION_MIN;
  }

  const clampedPrice = clamp(price, bounds.min, bounds.max);
  const ratio =
    bounds.min > 0
      ? Math.log(clampedPrice / bounds.min) / Math.log(bounds.max / bounds.min)
      : (clampedPrice - bounds.min) / (bounds.max - bounds.min);

  return clampPricePosition(Math.round(ratio * PRICE_POSITION_MAX));
}

export function positionToPrice(position: number, bounds: PriceBounds) {
  if (bounds.max <= bounds.min) {
    return bounds.min;
  }

  const clampedPosition = clampPricePosition(position);

  if (clampedPosition === PRICE_POSITION_MIN) {
    return bounds.min;
  }

  if (clampedPosition === PRICE_POSITION_MAX) {
    return bounds.max;
  }

  const ratio = clampedPosition / PRICE_POSITION_MAX;
  const price =
    bounds.min > 0
      ? bounds.min * Math.exp(ratio * Math.log(bounds.max / bounds.min))
      : bounds.min + ratio * (bounds.max - bounds.min);

  return snapPriceToStep(price, bounds);
}
