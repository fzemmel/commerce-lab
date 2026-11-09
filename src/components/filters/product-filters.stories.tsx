import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ReactElement } from "react";
import { expect, fireEvent } from "storybook/test";

import { ProductFilters } from "@/components/filters/product-filters";
import { formatPrice } from "@/lib/format-price";
import { positionToPrice, priceToPosition } from "@/lib/price-scale";

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
    priceBounds: { min: 38, max: 189, step: 1 },
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

export const PriceRangeMinimumOnly: Story = {
  args: {
    query: { q: "", brands: [], categories: [], price: { min: 50 }, sort: "name-asc", page: 1 },
  },
};

export const PriceRangeMaximumOnly: Story = {
  args: {
    query: { q: "", brands: [], categories: [], price: { max: 120 }, sort: "name-asc", page: 1 },
  },
};

export const PriceRangeSelected: Story = {
  args: {
    query: { q: "", brands: [], categories: [], price: { min: 50, max: 120 }, sort: "name-asc", page: 1 },
  },
};

export const PriceRangeKeyboard: Story = {
  play: async ({ canvas, userEvent }) => {
    const minimum = canvas.getByRole("slider", { name: "Minimum price" }) as HTMLInputElement;
    const maximum = canvas.getByRole("slider", { name: "Maximum price" }) as HTMLInputElement;

    minimum.focus();
    await userEvent.keyboard("{PageUp}");
    maximum.focus();
    await userEvent.keyboard("{PageDown}");

    await expect(minimum).toHaveValue("100");
    await expect(maximum).toHaveValue("900");
    await expect(canvas.getByText("€45 to €161")).toBeVisible();
  },
};

export const PriceRangeCoincidentMaximum: Story = {
  args: {
    query: { q: "", brands: [], categories: [], price: { min: 189, max: 189 }, sort: "name-asc", page: 1 },
  },
  play: async ({ canvas, userEvent }) => {
    const minimum = canvas.getByRole("slider", { name: "Minimum price" }) as HTMLInputElement;
    const maximum = canvas.getByRole("slider", { name: "Maximum price" }) as HTMLInputElement;

    await expect(Number(minimum.style.zIndex)).toBeGreaterThan(Number(maximum.style.zIndex));

    minimum.focus();
    await userEvent.keyboard("{PageDown}");

    await expect(minimum).toHaveValue("900");
    await expect(maximum).toHaveValue("1000");
    await expect(canvas.getByText("€161 to €189")).toBeVisible();
  },
};

export const PriceRangeCoincidentMinimum: Story = {
  args: {
    query: { q: "", brands: [], categories: [], price: { min: 38, max: 38 }, sort: "name-asc", page: 1 },
  },
  play: async ({ canvas, userEvent }) => {
    const minimum = canvas.getByRole("slider", { name: "Minimum price" }) as HTMLInputElement;
    const maximum = canvas.getByRole("slider", { name: "Maximum price" }) as HTMLInputElement;

    await expect(Number(maximum.style.zIndex)).toBeGreaterThan(Number(minimum.style.zIndex));

    maximum.focus();
    await userEvent.keyboard("{PageUp}");

    await expect(minimum).toHaveValue("0");
    await expect(maximum).toHaveValue("100");
    await expect(canvas.getByText("€38 to €45")).toBeVisible();
  },
};

export const PriceRangeProductionBounds: Story = {
  args: {
    priceBounds: { min: 0.79, max: 36999.99, step: 0.01 },
  },
  play: async ({ canvas }) => {
    const bounds = { min: 0.79, max: 36999.99, step: 0.01 };
    const lowPosition = priceToPosition(1, bounds);
    const highPosition = priceToPosition(30000, bounds);
    const minimum = canvas.getByRole("slider", { name: "Minimum price" }) as HTMLInputElement;
    const maximum = canvas.getByRole("slider", { name: "Maximum price" }) as HTMLInputElement;

    await expect(minimum).toHaveAttribute("aria-valuetext", "€0.79, minimum price");
    await expect(maximum).toHaveAttribute("aria-valuetext", "€36,999.99, maximum price");
    await expect(canvas.getByText("€0.79 to €36,999.99")).toBeVisible();

    fireEvent.change(maximum, { target: { value: String(lowPosition) } });

    await expect(
      canvas.getByText(`€0.79 to ${formatPrice(positionToPrice(lowPosition, bounds), 2)}`),
    ).toBeVisible();

    fireEvent.change(minimum, { target: { value: String(highPosition) } });
    fireEvent.change(maximum, { target: { value: "1000" } });

    await expect(
      canvas.getByText(`${formatPrice(positionToPrice(highPosition, bounds), 2)} to €36,999.99`),
    ).toBeVisible();
  },
};

export const PriceRangeNarrowViewport: Story = {
  decorators: narrowViewportDecorator,
  args: {
    query: { q: "", brands: [], categories: [], price: { min: 50, max: 120 }, sort: "name-asc", page: 1 },
  },
  play: async ({ canvas }) => {
    const minimum = canvas.getByRole("slider", { name: "Minimum price" });
    const maximum = canvas.getByRole("slider", { name: "Maximum price" });
    const priceRange = canvas.getByRole("group", { name: "Price range" });

    await expect(minimum).toBeVisible();
    await expect(maximum).toBeVisible();
    await expect(canvas.getByText("Catalog prices €38 to €189")).toBeVisible();
    await expect(canvas.getByText("€50 to €120")).toBeVisible();
    await expect(priceRange.scrollWidth).toBeLessThanOrEqual(priceRange.clientWidth);
  },
};
