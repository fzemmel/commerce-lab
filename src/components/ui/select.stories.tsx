import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Select } from "@/components/ui/select";

const meta = {
  title: "UI/Select",
  component: Select,
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Category: Story = {
  args: {
    defaultValue: "beauty",
  },
  render: (args) => (
    <label className="grid w-72 gap-2 text-sm font-semibold text-slate-700">
      Category
      <Select {...args}>
        <option value="all">All categories</option>
        <option value="beauty">Beauty</option>
        <option value="fragrances">Fragrances</option>
        <option value="furniture">Furniture</option>
      </Select>
    </label>
  ),
};
