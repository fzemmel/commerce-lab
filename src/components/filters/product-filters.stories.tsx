import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ReactElement } from "react";
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

const narrowViewportDecorator = [
  (Story: () => ReactElement) => (
    <div className="relative h-80 w-[375px] max-w-full overflow-hidden rounded-3xl border border-slate-300 bg-slate-100 p-4">
      <Story />
    </div>
  ),
];

async function withFakeViewportHeight(height: number, run: () => Promise<void>) {
  const visualViewport = Object.assign(new EventTarget(), { height, offsetTop: 0 });
  const originalInnerHeight = Object.getOwnPropertyDescriptor(window, "innerHeight");
  const originalVisualViewport = Object.getOwnPropertyDescriptor(window, "visualViewport");

  Object.defineProperty(window, "innerHeight", { configurable: true, value: height });
  Object.defineProperty(window, "visualViewport", { configurable: true, value: visualViewport });

  try {
    await run();
  } finally {
    if (originalInnerHeight) {
      Object.defineProperty(window, "innerHeight", originalInnerHeight);
    } else {
      Reflect.deleteProperty(window, "innerHeight");
    }

    if (originalVisualViewport) {
      Object.defineProperty(window, "visualViewport", originalVisualViewport);
    } else {
      Reflect.deleteProperty(window, "visualViewport");
    }
  }
}

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
  decorators: narrowViewportDecorator,
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole("button", { name: "Brand" });
    const viewportHeight = Math.ceil(trigger.getBoundingClientRect().bottom + 32);

    await withFakeViewportHeight(viewportHeight, async () => {
      await userEvent.click(trigger);

      const search = canvas.getByRole("searchbox", { name: "Search brands" });
      const panel = search.closest<HTMLElement>("[id$='-panel']");

      if (!panel) {
        throw new Error("Expected the facet panel to be rendered.");
      }

      const optionsList = panel.querySelector<HTMLElement>("[data-facet-options]");
      const panelRect = panel.getBoundingClientRect();
      const maxHeight = Number.parseFloat(panel.style.maxHeight);
      const availableAbove = trigger.getBoundingClientRect().top - 16 - 8;

      await expect(panel).toBeVisible();
      await expect(panel.className).toContain("bottom-full");
      await expect(maxHeight).toBeGreaterThan(0);
      await expect(maxHeight).toBeLessThanOrEqual(availableAbove);
      await expect(maxHeight).toBeLessThanOrEqual(viewportHeight);
      await expect(optionsList?.className).toContain("overflow-y-auto");
      await expect(panelRect.top).toBeGreaterThanOrEqual(0);
      await expect(panelRect.bottom).toBeLessThanOrEqual(viewportHeight);
    });
  },
};

export const NarrowViewportSelected: Story = {
  decorators: narrowViewportDecorator,
  args: {
    query: { q: "", brands: ["Northline"], categories: [], sort: "name-asc", page: 1 },
  },
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole("button", { name: "Brand, 1 selected" });
    const viewportHeight = Math.ceil(trigger.getBoundingClientRect().bottom + 32);

    await withFakeViewportHeight(viewportHeight, async () => {
      await userEvent.click(trigger);

      const search = canvas.getByRole("searchbox", { name: "Search brands" });
      const panel = search.closest<HTMLElement>("[id$='-panel']");

      if (!panel) {
        throw new Error("Expected the facet panel to be rendered.");
      }

      const panelRect = panel.getBoundingClientRect();
      const maxHeight = Number.parseFloat(panel.style.maxHeight);

      await expect(canvas.getByRole("button", { name: "Clear selected brands" })).toBeVisible();
      await expect(panel).toBeVisible();
      await expect(panel.className).toContain("bottom-full");
      await expect(maxHeight).toBeGreaterThan(0);
      await expect(panelRect.top).toBeGreaterThanOrEqual(0);
      await expect(panelRect.bottom).toBeLessThanOrEqual(viewportHeight);
    });
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
