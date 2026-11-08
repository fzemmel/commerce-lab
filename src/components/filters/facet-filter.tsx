type FacetOption = {
  value: string;
  label: string;
};

type FacetFilterProps = {
  label: string;
  name: string;
  options: FacetOption[];
  selectedValues: string[];
  onChange: (value: string) => void;
  onClear: () => void;
};

export function FacetFilter({ label, name, options, selectedValues, onChange, onClear }: FacetFilterProps) {
  return (
    <fieldset className="min-w-0">
      <legend className="text-sm font-semibold text-slate-700">{label}</legend>
      <div className="mb-2 flex justify-end">
        {selectedValues.length > 0 ? (
          <button type="button" onClick={onClear} className="text-sm font-semibold text-amber-700 hover:text-amber-800">
            Clear
          </button>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          return (
            <label
              key={option.value}
              className="cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 has-checked:border-amber-500 has-checked:bg-amber-100 has-checked:text-amber-950"
            >
              <input
                name={name}
                type="checkbox"
                value={option.value}
                checked={selectedValues.includes(option.value)}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
