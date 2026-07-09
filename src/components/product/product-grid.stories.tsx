import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ProductGrid } from "@/components/product/product-grid";
import { storyProducts } from "@/test/fixtures/products";

const meta = {
  title: "Product/ProductGrid",
  component: ProductGrid,
  parameters: {
    layout: "padded",
  },
  args: {
    products: storyProducts,
  },
} satisfies Meta<typeof ProductGrid>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
