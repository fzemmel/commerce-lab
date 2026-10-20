"use client";

import { useEffect, useId, useRef, useState } from "react";

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
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const panelId = useId();
  const searchInputId = useId();
  const filteredOptions = options.filter((option) => option.label.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const triggerLabel = selectedValues.length > 0 ? `${label} (${selectedValues.length})` : label;

  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus();
    }
  }, [isOpen]);

  function closePanel() {
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <fieldset className="min-w-0">
      <legend className="text-sm font-semibold text-slate-700">{label}</legend>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((open) => !open)}
        className="mt-2 flex h-11 w-full items-center justify-between rounded-2xl border border-slate-300 bg-white px-4 text-left text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
      >
        <span>{triggerLabel}</span>
        <span aria-hidden="true">{isOpen ? "Hide options" : "Show options"}</span>
      </button>
      {isOpen ? (
        <div
          id={panelId}
          className="mt-2 w-full max-h-[calc(100dvh-12rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              closePanel();
            }
          }}
        >
          <label htmlFor={searchInputId} className="mb-1.5 block text-sm font-medium text-slate-700">Search {label} options</label>
          <div className="flex gap-2">
            <input
              ref={searchInputRef}
              id={searchInputId}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-4 focus:ring-amber-100"
            />
            <button
              type="button"
              onClick={() => setSearch("")}
              disabled={search.length === 0}
              className="h-11 rounded-2xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear {label} search
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-700">{label} options</p>
            {selectedValues.length > 0 ? (
              <button type="button" onClick={onClear} className="text-sm font-semibold text-amber-700 hover:text-amber-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500">
                Clear selected {label}
              </button>
            ) : null}
          </div>
          {filteredOptions.length > 0 ? (
            <div className="mt-2 space-y-2" role="group" aria-label={`${label} options`}>
              {filteredOptions.map((option) => (
                <label key={option.value} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 has-checked:border-amber-500 has-checked:bg-amber-100 has-checked:text-amber-950">
                  <input
                    name={name}
                    type="checkbox"
                    value={option.value}
                    checked={selectedValues.includes(option.value)}
                    onChange={() => onChange(option.value)}
                    className="size-4 accent-amber-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          ) : <p className="mt-3 text-sm text-slate-600">No matching options.</p>}
        </div>
      ) : null}
    </fieldset>
  );
}
