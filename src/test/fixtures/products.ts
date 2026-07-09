import type { Product } from "@/types/product";

export const apiProductFixture: Product = {
  id: "dummy-1",
  slug: "essence-mascara-lash-princess-1",
  name: "Essence Mascara Lash Princess",
  brand: "Essence",
  category: "beauty",
  description:
    "A popular mascara known for its volumizing and lengthening effects, mapped from the external product API.",
  price: 9.99,
  originalPrice: 12.99,
  image: "https://cdn.dummyjson.com/product-images/beauty/essence-mascara-lash-princess/thumbnail.webp",
  images: ["https://cdn.dummyjson.com/product-images/beauty/essence-mascara-lash-princess/1.webp"],
  rating: 4.6,
  isSale: true,
  source: "api",
  attributes: {
    availability: "In Stock",
    stock: "99",
    sku: "BEA-ESS-ESS-001",
  },
};

export const localProductFixture: Product = {
  id: "p-001",
  slug: "atlas-organic-cotton-tee",
  name: "Atlas Organic Cotton Tee",
  brand: "Northline",
  category: "apparel",
  description: "A lightweight everyday shirt from the local fallback catalog.",
  price: 39,
  image: "cotton tee",
  rating: 4.7,
  isNew: true,
  source: "local",
  attributes: { color: "Stone", size: "S-XL", material: "Organic cotton" },
};

export const storyProducts = [apiProductFixture, localProductFixture];
