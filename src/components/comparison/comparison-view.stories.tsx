import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ComparisonProvider } from "@/components/comparison/comparison-provider";
import { ComparisonView } from "@/components/comparison/comparison-view";
import { products as localProducts } from "@/data/products";
import { storyProducts } from "@/test/fixtures/products";
import type { CompareProduct } from "@/lib/comparison";
import type { Product } from "@/types/product";

type ComparisonViewStoryProps = {
  products: Product[];
  initialProducts: CompareProduct[];
};

function ComparisonViewStory({ products, initialProducts }: ComparisonViewStoryProps) {
  return (
    <ComparisonProvider initialProducts={initialProducts} restoreFromSessionStorage={false}>
      <ComparisonView products={products} />
    </ComparisonProvider>
  );
}

const meta = {
  title: "Comparison/ComparisonView",
  component: ComparisonViewStory,
  parameters: {
    layout: "padded",
  },
  args: {
    products: storyProducts,
    initialProducts: [],
  },
} satisfies Meta<typeof ComparisonViewStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Partial: Story = {
  args: {
    initialProducts: storyProducts.map(({ id }) => ({ id })),
  },
};

export const Full: Story = {
  args: {
    products: localProducts.slice(0, 4),
    initialProducts: localProducts.slice(0, 4).map(({ id }) => ({ id })),
  },
};
