import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Input } from "@/components/ui/input";

const meta = {
  title: "UI/Input",
  component: Input,
  args: {
    placeholder: "Search products",
  },
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Search: Story = {
  render: (args) => (
    <label className="grid w-80 gap-2 text-sm font-semibold text-slate-700">
      Search query
      <Input {...args} />
    </label>
  ),
};

export const WithValue: Story = {
  args: {
    defaultValue: "mascara",
  },
  render: Search.render,
};
