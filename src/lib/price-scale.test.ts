import { describe, expect, it } from "vitest";

import {
  clampPricePosition,
  positionToPrice,
  priceToPosition,
  PRICE_POSITION_MAX,
  PRICE_POSITION_MIN,
} from "@/lib/price-scale";

const productionBounds = { min: 0.79, max: 36999.99, step: 0.01 };

describe("price-scale", () => {
  it("maps slider endpoints exactly to the catalog bounds", () => {
    expect(positionToPrice(PRICE_POSITION_MIN, productionBounds)).toBe(0.79);
    expect(positionToPrice(PRICE_POSITION_MAX, productionBounds)).toBe(36999.99);
    expect(priceToPosition(0.79, productionBounds)).toBe(PRICE_POSITION_MIN);
    expect(priceToPosition(36999.99, productionBounds)).toBe(PRICE_POSITION_MAX);
  });

  it("round-trips slider positions after snapping to the catalog step", () => {
    [0, 1, 10, 22, 100, 250, 500, 750, 900, 981, 999, 1000].forEach((position) => {
      const roundTrip = priceToPosition(positionToPrice(position, productionBounds), productionBounds);

      expect(Math.abs(roundTrip - position)).toBeLessThanOrEqual(1);
    });
  });

  it("clamps positions and prices to the scale and catalog bounds", () => {
    expect(clampPricePosition(-25)).toBe(PRICE_POSITION_MIN);
    expect(clampPricePosition(4000)).toBe(PRICE_POSITION_MAX);
    expect(clampPricePosition(Number.NaN)).toBe(PRICE_POSITION_MIN);
    expect(priceToPosition(0.1, productionBounds)).toBe(PRICE_POSITION_MIN);
    expect(priceToPosition(50000, productionBounds)).toBe(PRICE_POSITION_MAX);
    expect(positionToPrice(-100, productionBounds)).toBe(0.79);
    expect(positionToPrice(2000, productionBounds)).toBe(36999.99);
  });

  it("falls back to a linear scale when the catalog minimum is not positive", () => {
    const zeroBasedBounds = { min: 0, max: 100, step: 1 };

    expect(priceToPosition(0, zeroBasedBounds)).toBe(0);
    expect(priceToPosition(50, zeroBasedBounds)).toBe(500);
    expect(priceToPosition(100, zeroBasedBounds)).toBe(1000);
    expect(positionToPrice(500, zeroBasedBounds)).toBe(50);
    expect(positionToPrice(250, zeroBasedBounds)).toBe(25);

    const negativeBounds = { min: -50, max: 50, step: 1 };

    expect(priceToPosition(0, negativeBounds)).toBe(500);
    expect(positionToPrice(500, negativeBounds)).toBe(0);
  });

  it("snaps generated prices to the catalog step", () => {
    [1, 37, 123, 456, 789, 999].forEach((position) => {
      const cents = positionToPrice(position, productionBounds) * 100;

      expect(Math.abs(cents - Math.round(cents))).toBeLessThan(1e-6);
    });
  });

  it("returns the catalog minimum for a collapsed range", () => {
    expect(priceToPosition(50, { min: 50, max: 50, step: 1 })).toBe(0);
    expect(positionToPrice(500, { min: 50, max: 50, step: 1 })).toBe(50);
  });

  it("gives the low-price band a meaningful share of the slider", () => {
    expect(priceToPosition(1, productionBounds)).toBeGreaterThanOrEqual(20);
    expect(priceToPosition(1, productionBounds)).toBeLessThan(30);
    expect(priceToPosition(10, productionBounds)).toBeLessThan(300);
  });
});
