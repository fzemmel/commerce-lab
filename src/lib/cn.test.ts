import { describe, expect, it } from "vitest";

import { cn } from "@/lib/cn";

describe("cn", () => {
  it("joins truthy class names with spaces", () => {
    expect(cn("rounded", "bg-white", "text-slate-950")).toBe("rounded bg-white text-slate-950");
  });

  it("filters false, null, and undefined values", () => {
    expect(cn("base", false, null, undefined, "active")).toBe("base active");
  });
});
