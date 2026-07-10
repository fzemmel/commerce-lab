import { describe, expect, it } from "vitest";

import { formatPrice } from "@/lib/format-price";

describe("formatPrice", () => {
  it("formats values as EUR without fractional digits", () => {
    expect(formatPrice(39)).toBe("€39");
    expect(formatPrice(129.49)).toBe("€129");
  });
});
