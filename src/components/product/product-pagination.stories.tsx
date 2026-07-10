import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ProductPagination } from "@/components/product/product-pagination";

const meta = {
  title: "Product/ProductPagination",
  component: ProductPagination,
  parameters: {
    layout: "padded",
  },
  args: {
    query: {
      q: "mascara",
      category: "beauty",
      sort: "price-asc",
      page: 3,
    },
    currentPage: 3,
    totalPages: 9,
  },
} satisfies Meta<typeof ProductPagination>;

export default meta;

type Story = StoryObj<typeof meta>;

export const MiddlePage: Story = {};

export const FirstPage: Story = {
  args: {
    currentPage: 1,
  },
};

export const LastPage: Story = {
  args: {
    currentPage: 9,
  },
};
