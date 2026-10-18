// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ComparisonProvider, useComparison } from "@/components/comparison/comparison-provider";

function ComparisonState() {
  const { products, dispatch } = useComparison();

  return (
    <>
      <output>{products.map((product) => product.id).join(",")}</output>
      <button type="button" onClick={() => dispatch({ type: "product-added", product: { id: "p-003" } })}>Add product</button>
    </>
  );
}

describe("ComparisonProvider", () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(cleanup);

  it("restores a validated ID-only selection from session storage", async () => {
    sessionStorage.setItem("commerce-lab-comparison", JSON.stringify(["p-001", "p-001", "p-002", "p-003", "p-004", "p-005"]));
    render(<ComparisonProvider><ComparisonState /></ComparisonProvider>);

    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("p-001,p-002,p-003,p-004"));
    expect(sessionStorage.getItem("commerce-lab-comparison")).toBe(JSON.stringify(["p-001", "p-002", "p-003", "p-004"]));
  });

  it("ignores malformed stored data safely", async () => {
    sessionStorage.setItem("commerce-lab-comparison", "not-json");
    render(<ComparisonProvider><ComparisonState /></ComparisonProvider>);

    await waitFor(() => expect(screen.getByRole("status").textContent).toBe(""));
  });

  it("persists IDs without product objects", async () => {
    const user = userEvent.setup();
    render(<ComparisonProvider restoreFromSessionStorage={false}><ComparisonState /></ComparisonProvider>);

    await user.click(screen.getByRole("button", { name: "Add product" }));

    await waitFor(() => expect(sessionStorage.getItem("commerce-lab-comparison")).toBe(JSON.stringify(["p-003"])));
  });
});
