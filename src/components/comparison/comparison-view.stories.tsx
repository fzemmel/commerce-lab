import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ComparisonProvider } from "@/components/comparison/comparison-provider";
import { ComparisonView } from "@/components/comparison/comparison-view";
import { products as localProducts } from "@/data/products";
import { apiProductFixture, storyProducts } from "@/test/fixtures/products";
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

const remoteProducts: Product[] = Array.from({ length: 4 }, (_, index) => ({
  ...apiProductFixture,
  id: `remote-${index + 1}`,
  slug: `remote-product-${index + 1}`,
  name: `Remote Product ${index + 1}`,
}));

const productsWithoutImages = localProducts.slice(0, 4);

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

export const WithImages: Story = {
  args: {
    products: remoteProducts,
    initialProducts: remoteProducts.map(({ id }) => ({ id })),
  },
};

export const MixedImages: Story = {
  args: {
    initialProducts: storyProducts.map(({ id }) => ({ id })),
  },
};

export const WithoutImages: Story = {
  args: {
    products: productsWithoutImages,
    initialProducts: productsWithoutImages.map(({ id }) => ({ id })),
  },
};

export const FailedImage: Story = {
  args: {
    products: [
      {
        ...apiProductFixture,
        image: "https://cdn.dummyjson.com/product-images/missing-product/thumbnail.webp",
      },
    ],
    initialProducts: [{ id: apiProductFixture.id }],
  },
};

export const NarrowViewport: Story = {
  args: {
    initialProducts: storyProducts.map(({ id }) => ({ id })),
  },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
};
