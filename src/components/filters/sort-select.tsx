import type { ChangeEventHandler } from "react";

import { Select } from "@/components/ui/select";
import { sortLabels, type ProductSort } from "@/lib/product-query";

type SortSelectProps = {
  value: ProductSort;
  onChange: ChangeEventHandler<HTMLSelectElement>;
};

const sortOptions = Object.entries(sortLabels) as Array<[ProductSort, string]>;

export function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <label className="block" htmlFor="product-sort">
      <span className="mb-2 block text-sm font-semibold text-slate-700">Sort by</span>
      <Select id="product-sort" name="sort" value={value} onChange={onChange}>
        {sortOptions.map(([optionValue, label]) => (
          <option key={optionValue} value={optionValue}>
            {label}
          </option>
        ))}
      </Select>
    </label>
  );
}
