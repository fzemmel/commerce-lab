// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { CompareButton } from "@/components/comparison/compare-button";
import { ComparisonProvider } from "@/components/comparison/comparison-provider";

describe("CompareButton", () => {
  afterEach(cleanup);

  it("adds and removes a product", async () => {
    const user = userEvent.setup();
    render(<ComparisonProvider restoreFromSessionStorage={false}><CompareButton productId="p-001" /></ComparisonProvider>);

    await user.click(screen.getByRole("button", { name: "Add to comparison" }));
    expect(screen.getByRole("button", { name: "Remove from comparison" }).getAttribute("aria-pressed")).toBe("true");

    await user.click(screen.getByRole("button", { name: "Remove from comparison" }));
    expect(screen.getByRole("button", { name: "Add to comparison" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("announces feedback when four products are already selected", async () => {
    const user = userEvent.setup();
    render(
      <ComparisonProvider restoreFromSessionStorage={false} initialProducts={[{ id: "p-001" }, { id: "p-002" }, { id: "p-003" }, { id: "p-004" }]}>
        <CompareButton productId="p-005" />
      </ComparisonProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Add to comparison" }));
    expect(screen.getByRole("alert").textContent).toBe("You can compare up to 4 products.");
  });
});
