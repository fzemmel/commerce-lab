import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

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

export const Default: Story = {};

export const Selected: Story = {
  args: {
    query: { q: "", brands: ["Northline", "Motion Lab"], categories: ["apparel"], sort: "price-asc", page: 1 },
  },
};

export const Filtered: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Brand" }));
    await userEvent.type(canvas.getByRole("searchbox", { name: "Search brands" }), "motion");

    await expect(canvas.getByRole("checkbox", { name: "Motion Lab" })).toBeVisible();
    await expect(canvas.queryByRole("checkbox", { name: "Northline" })).toBeNull();
  },
};

export const Empty: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Brand" }));
    await userEvent.type(canvas.getByRole("searchbox", { name: "Search brands" }), "zzz");

    await expect(canvas.getByRole("status")).toHaveTextContent('No brands match "zzz".');
  },
};

export const NarrowViewport: Story = {
  decorators: [
    (Story) => (
      <div className="w-80 max-w-full overflow-x-hidden rounded-3xl bg-slate-100 p-4">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Brand" }));

    await expect(canvas.getByRole("searchbox", { name: "Search brands" })).toBeVisible();
  },
};

export const PriceRangeSelected: Story = {
  args: {
    query: { q: "", brands: [], categories: [], price: { min: 50, max: 120 }, sort: "name-asc", page: 1 },
  },
};

export const InvalidPriceRange: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText("Minimum price"), "120");
    await userEvent.type(canvas.getByLabelText("Maximum price"), "50");
    await userEvent.click(canvas.getByRole("button", { name: "Apply" }));

    await expect(canvas.getByRole("alert")).toHaveTextContent("Minimum price cannot be greater than maximum price.");
  },
};
