import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ProductFilters } from "@/components/filters/product-filters";

const meta = {
  title: "Filters/ProductFilters",
  component: ProductFilters,
  parameters: {
    layout: "padded",
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/products",
      },
    },
  },
  args: {
    brandOptions: [
      { value: "Northline", label: "Northline" },
      { value: "Motion Lab", label: "Motion Lab" },
      { value: "Carry Studio", label: "Carry Studio" },
    ],
    categoryOptions: [
      { value: "apparel", label: "Apparel" },
      { value: "footwear", label: "Footwear" },
      { value: "accessories", label: "Accessories" },
    ],
    query: { q: "", brands: [], categories: [], sort: "name-asc", page: 1 },
  },
} satisfies Meta<typeof ProductFilters>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NoSelection: Story = {};

export const SingleSelection: Story = {
  args: {
    query: { q: "", brands: ["Northline"], categories: ["apparel"], sort: "name-asc", page: 1 },
  },
};

export const MultipleSelections: Story = {
  args: {
    query: {
      q: "",
      brands: ["Northline", "Motion Lab"],
      categories: ["apparel", "footwear"],
      sort: "price-asc",
      page: 1,
    },
  },
};
