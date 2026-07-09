import { afterEach, describe, expect, it, vi } from "vitest";

import { products as localProducts } from "@/data/products";
import { getProductCatalog, mapDummyProductToProduct } from "@/lib/products-api";

describe("mapDummyProductToProduct", () => {
  it("maps DummyJSON product data to the app product type", () => {
    const product = mapDummyProductToProduct({
      id: 42,
      title: "Modern Table Lamp",
      description: "A warm lamp for desks and shelves.",
      category: "home-decoration",
      price: 80,
      discountPercentage: 20,
      rating: 4.6,
      brand: "Bright Home",
      sku: "HOME-LAMP-042",
      stock: 12,
      availabilityStatus: "In Stock",
      thumbnail: "https://cdn.dummyjson.com/product-images/home-decoration/lamp/thumbnail.webp",
      images: ["https://cdn.dummyjson.com/product-images/home-decoration/lamp/1.webp"],
    });

    expect(product).toMatchObject({
      id: "dummy-42",
      slug: "modern-table-lamp-42",
      name: "Modern Table Lamp",
      brand: "Bright Home",
      category: "home-decoration",
      price: 80,
      originalPrice: 100,
      image: "https://cdn.dummyjson.com/product-images/home-decoration/lamp/thumbnail.webp",
      rating: 4.6,
      isSale: true,
      source: "api",
      attributes: {
        availability: "In Stock",
        stock: "12",
        sku: "HOME-LAMP-042",
      },
    });
    expect(product.images).toEqual([
      "https://cdn.dummyjson.com/product-images/home-decoration/lamp/thumbnail.webp",
      "https://cdn.dummyjson.com/product-images/home-decoration/lamp/1.webp",
    ]);
  });
});

describe("getProductCatalog", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns mapped API products when the API responds successfully", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            products: [
              {
                id: 1,
                title: "Essence Mascara Lash Princess",
                description: "Volumizing mascara.",
                category: "beauty",
                price: 9.99,
                rating: 4.94,
                brand: "Essence",
                thumbnail: "https://cdn.dummyjson.com/product-images/beauty/mascara/thumbnail.webp",
              },
            ],
          }),
          { status: 200 },
        ),
      ),
    );

    const catalog = await getProductCatalog();

    expect(catalog.source).toBe("api");
    expect(catalog.products).toHaveLength(1);
    expect(catalog.products[0]).toMatchObject({
      slug: "essence-mascara-lash-princess-1",
      category: "beauty",
      source: "api",
    });
  });

  it("falls back to local products when the API request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 500 })));

    const catalog = await getProductCatalog();

    expect(catalog.source).toBe("fallback");
    expect(catalog.products).toHaveLength(localProducts.length);
    expect(catalog.products[0].source).toBe("local");
  });
});
