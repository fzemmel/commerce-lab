import type { ChangeEventHandler } from "react";

import { Input } from "@/components/ui/input";

type SearchInputProps = {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
};

export function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <label className="block" htmlFor="product-search">
      <span className="mb-2 block text-sm font-semibold text-slate-700">Search</span>
      <Input
        id="product-search"
        name="q"
        value={value}
        onChange={onChange}
        placeholder="Search name, brand, or description"
        type="search"
      />
    </label>
  );
}
