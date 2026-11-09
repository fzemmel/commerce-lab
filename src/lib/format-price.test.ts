import { describe, expect, it } from "vitest";

import { formatPrice } from "@/lib/format-price";

describe("formatPrice", () => {
  it("formats values as EUR without fractional digits", () => {
    expect(formatPrice(39)).toBe("€39");
    expect(formatPrice(129.49)).toBe("€129");
  });

  it("supports fractional digits for decimal price bounds", () => {
    expect(formatPrice(39.99, 2)).toBe("€39.99");
    expect(formatPrice(129.5, 2)).toBe("€129.50");
  });
});
