// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { ComparisonProvider } from "@/components/comparison/comparison-provider";
import { ComparisonView } from "@/components/comparison/comparison-view";
import { apiProductFixture, localProductFixture } from "@/test/fixtures/products";
import type { Product } from "@/types/product";

function selectProducts(products: Product[]) {
  return products.map(({ id }) => ({ id }));
}

describe("ComparisonView", () => {
  afterEach(cleanup);

  it("renders an empty state without selected products", () => {
    render(<ComparisonProvider restoreFromSessionStorage={false}><ComparisonView products={[localProductFixture]} /></ComparisonProvider>);

    expect(screen.getByRole("heading", { name: "No products selected" })).toBeTruthy();
  });

  it("renders remote product images with meaningful alternative text", () => {
    render(
      <ComparisonProvider restoreFromSessionStorage={false} initialProducts={selectProducts([apiProductFixture])}>
        <ComparisonView products={[apiProductFixture]} />
      </ComparisonProvider>,
    );

    const image = screen.getByRole("img", {
      name: `${apiProductFixture.name} by ${apiProductFixture.brand}`,
    });

    expect(image.tagName).toBe("IMG");
    expect(image.getAttribute("alt")).toBe(`${apiProductFixture.name} by ${apiProductFixture.brand}`);
  });

  it("renders a fallback for placeholder images without breaking product details", () => {
    render(
      <ComparisonProvider restoreFromSessionStorage={false} initialProducts={selectProducts([localProductFixture])}>
        <ComparisonView products={[localProductFixture]} />
      </ComparisonProvider>,
    );

    expect(screen.getByText("No image")).toBeTruthy();
    expect(
      screen.getByRole("img", { name: `${localProductFixture.name} by ${localProductFixture.brand}` }),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: localProductFixture.name })).toBeTruthy();
    expect(screen.getByRole("button", { name: `Remove ${localProductFixture.name}` })).toBeTruthy();
  });

  it("falls back when a remote product image fails to load", () => {
    render(
      <ComparisonProvider restoreFromSessionStorage={false} initialProducts={selectProducts([apiProductFixture])}>
        <ComparisonView products={[apiProductFixture]} />
      </ComparisonProvider>,
    );

    fireEvent.error(
      screen.getByRole("img", { name: `${apiProductFixture.name} by ${apiProductFixture.brand}` }),
    );

    expect(screen.getByText("No image")).toBeTruthy();
    expect(screen.getByRole("link", { name: apiProductFixture.name })).toBeTruthy();
    expect(screen.getByRole("button", { name: `Remove ${apiProductFixture.name}` })).toBeTruthy();
  });

  it("renders images for up to four compared products", () => {
    const products = Array.from({ length: 4 }, (_, index) => ({
      ...apiProductFixture,
      id: `compared-${index + 1}`,
      slug: `compared-product-${index + 1}`,
      name: `Compared Product ${index + 1}`,
    }));

    render(
      <ComparisonProvider restoreFromSessionStorage={false} initialProducts={selectProducts(products)}>
        <ComparisonView products={products} />
      </ComparisonProvider>,
    );

    expect(screen.getAllByRole("img", { name: / by Essence$/ })).toHaveLength(4);
    expect(screen.queryByText("No image")).toBeNull();

    for (const product of products) {
      expect(screen.getByRole("link", { name: product.name })).toBeTruthy();
      expect(screen.getByRole("button", { name: `Remove ${product.name}` })).toBeTruthy();
    }
  });

  it("removes products and clears the comparison", async () => {
    const user = userEvent.setup();
    render(
      <ComparisonProvider restoreFromSessionStorage={false} initialProducts={[{ id: localProductFixture.id }, { id: apiProductFixture.id }]}>
        <ComparisonView products={[localProductFixture, apiProductFixture]} />
      </ComparisonProvider>,
    );

    expect(screen.getByRole("img", { name: `${localProductFixture.name} by ${localProductFixture.brand}` })).toBeTruthy();

    await user.click(screen.getByRole("button", { name: `Remove ${localProductFixture.name}` }));
    expect(screen.queryByRole("link", { name: localProductFixture.name })).toBeNull();
    expect(screen.queryByRole("img", { name: `${localProductFixture.name} by ${localProductFixture.brand}` })).toBeNull();
    expect(screen.getByRole("img", { name: `${apiProductFixture.name} by ${apiProductFixture.brand}` })).toBeTruthy();

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
