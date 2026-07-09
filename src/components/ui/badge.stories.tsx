import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Badge } from "@/components/ui/badge";

const meta = {
  title: "UI/Badge",
  component: Badge,
  args: {
    children: "Sale",
  },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sale: Story = {
  args: {
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
};

export const New: Story = {
  args: {
    children: "New",
    className: "border-teal-200 bg-teal-50 text-teal-800",
  },
};
