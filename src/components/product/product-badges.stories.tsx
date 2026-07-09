import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ProductBadges } from "@/components/product/product-badges";

const meta = {
  title: "Product/ProductBadges",
  component: ProductBadges,
} satisfies Meta<typeof ProductBadges>;

export default meta;

type Story = StoryObj<typeof meta>;

export const New: Story = {
  args: {
    isNew: true,
  },
};

export const Sale: Story = {
  args: {
    isSale: true,
  },
};

export const NewAndSale: Story = {
  args: {
    isNew: true,
    isSale: true,
  },
};
