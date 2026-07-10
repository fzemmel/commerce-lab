import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ProductImage } from "@/components/product/product-image";
import { apiProductFixture, localProductFixture } from "@/test/fixtures/products";

const meta = {
  title: "Product/ProductImage",
  component: ProductImage,
  args: {
    product: apiProductFixture,
    className: "h-64 w-80",
    sizes: "320px",
  },
} satisfies Meta<typeof ProductImage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const RemoteImage: Story = {};

export const Placeholder: Story = {
  args: {
    product: localProductFixture,
  },
};
