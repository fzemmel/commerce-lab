import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ProductCard } from "@/components/product/product-card";
import { apiProductFixture, localProductFixture } from "@/test/fixtures/products";

const meta = {
  title: "Product/ProductCard",
  component: ProductCard,
  parameters: {
    layout: "padded",
  },
  args: {
    product: apiProductFixture,
  },
} satisfies Meta<typeof ProductCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ApiProduct: Story = {};

export const LocalFallbackProduct: Story = {
  args: {
    product: localProductFixture,
  },
};
