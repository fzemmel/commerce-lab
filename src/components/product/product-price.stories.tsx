import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ProductPrice } from "@/components/product/product-price";

const meta = {
  title: "Product/ProductPrice",
  component: ProductPrice,
  args: {
    price: 39,
  },
} satisfies Meta<typeof ProductPrice>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Regular: Story = {};

export const Sale: Story = {
  args: {
    price: 9.99,
    originalPrice: 12.99,
  },
};
