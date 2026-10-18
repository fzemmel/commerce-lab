// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { ComparisonProvider } from "@/components/comparison/comparison-provider";
import { ComparisonView } from "@/components/comparison/comparison-view";
import { apiProductFixture, localProductFixture } from "@/test/fixtures/products";

describe("ComparisonView", () => {
  afterEach(cleanup);

  it("renders an empty state without selected products", () => {
    render(<ComparisonProvider restoreFromSessionStorage={false}><ComparisonView products={[localProductFixture]} /></ComparisonProvider>);

    expect(screen.getByRole("heading", { name: "No products selected" })).toBeTruthy();
  });

  it("removes products and clears the comparison", async () => {
    const user = userEvent.setup();
    render(
      <ComparisonProvider restoreFromSessionStorage={false} initialProducts={[{ id: localProductFixture.id }, { id: apiProductFixture.id }]}>
        <ComparisonView products={[localProductFixture, apiProductFixture]} />
      </ComparisonProvider>,
    );

    await user.click(screen.getByRole("button", { name: `Remove ${localProductFixture.name}` }));
    expect(screen.queryByRole("link", { name: localProductFixture.name })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Clear comparison" }));
    expect(screen.getByRole("heading", { name: "No products selected" })).toBeTruthy();
  });

  it("renders not available for missing attributes", () => {
    render(
      <ComparisonProvider restoreFromSessionStorage={false} initialProducts={[{ id: localProductFixture.id }, { id: apiProductFixture.id }]}>
        <ComparisonView products={[{ ...localProductFixture, attributes: {} }, apiProductFixture]} />
      </ComparisonProvider>,
    );

    expect(screen.getAllByText("Not available").length).toBeGreaterThan(0);
  });
});
