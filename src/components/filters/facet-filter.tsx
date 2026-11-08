"use client";

import { useEffect, useId, useRef, useState, type FocusEvent, type KeyboardEvent } from "react";

import { cn } from "@/lib/cn";

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

const VIEWPORT_MARGIN_PX = 16;
const PANEL_GAP_PX = 8;
const MAX_PANEL_HEIGHT_PX = 384;

type PanelPlacement = {
  openUp: boolean;
  maxHeight: number;
};

function measurePanelPlacement(trigger: HTMLElement): PanelPlacement {
  const triggerRect = trigger.getBoundingClientRect();
  const visualViewport = window.visualViewport;
  const viewportTop = visualViewport?.offsetTop ?? 0;
  const viewportBottom = viewportTop + (visualViewport?.height ?? window.innerHeight);
  const spaceBelow = viewportBottom - triggerRect.bottom - VIEWPORT_MARGIN_PX - PANEL_GAP_PX;
  const spaceAbove = triggerRect.top - viewportTop - VIEWPORT_MARGIN_PX - PANEL_GAP_PX;
  const openUp = spaceAbove > spaceBelow;
  const availableSpace = openUp ? spaceAbove : spaceBelow;

  return {
    openUp,
    maxHeight: Math.min(MAX_PANEL_HEIGHT_PX, Math.max(0, availableSpace)),
  };
}

function pluralize(label: string) {
  const lowerLabel = label.toLowerCase();

  return lowerLabel.endsWith("y") ? `${lowerLabel.slice(0, -1)}ies` : `${lowerLabel}s`;
}

export function FacetFilter({ label, name, options, selectedValues, onChange, onClear }: FacetFilterProps) {
  const id = useId();
  const panelId = `${id}-panel`;
  const searchId = `${id}-search`;
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [panelPlacement, setPanelPlacement] = useState<PanelPlacement | null>(null);

  const normalizedSearch = search.trim().toLowerCase();
  const filteredOptions = normalizedSearch
    ? options.filter((option) => option.label.toLowerCase().includes(normalizedSearch))
    : options;
  const optionPluralLabel = pluralize(label);
  const triggerLabel = selectedValues.length > 0 ? `${label}, ${selectedValues.length} selected` : label;
  const selectionSummaryId = `${id}-selection-summary`;
  const selectedLabels = options
    .filter((option) => selectedValues.includes(option.value))
    .map((option) => option.label);

  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleMouseDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    }

    document.addEventListener("mousedown", handleMouseDown);

    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleViewportChange(event: Event) {
      const target = event.target;

      if (target instanceof Node && containerRef.current?.contains(target)) {
        return;
      }

      const trigger = triggerRef.current;

      if (trigger) {
        setPanelPlacement(measurePanelPlacement(trigger));
      }
    }

    const visualViewport = window.visualViewport;

    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
    visualViewport?.addEventListener("resize", handleViewportChange);
    visualViewport?.addEventListener("scroll", handleViewportChange);

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
      visualViewport?.removeEventListener("resize", handleViewportChange);
      visualViewport?.removeEventListener("scroll", handleViewportChange);
    };
  }, [isOpen]);

  function openDropdown() {
    const trigger = triggerRef.current;

    if (trigger) {
      setPanelPlacement(measurePanelPlacement(trigger));
    }

    setSearch("");
    setIsOpen(true);
  }

  function closeDropdown(returnFocus = false) {
    setIsOpen(false);
    setSearch("");

    if (returnFocus) {
      triggerRef.current?.focus();
    }
  }

  function clearSearch() {
    setSearch("");
    searchInputRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      closeDropdown(true);
    }
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (!isOpen) {
      return;
    }

    const nextTarget = event.relatedTarget;

    if (!(nextTarget instanceof Node) || containerRef.current?.contains(nextTarget)) {
      return;
    }

    closeDropdown();
  }

  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">{label}</legend>
      <div ref={containerRef} onKeyDown={handleKeyDown} onBlur={handleBlur}>
        {selectedValues.length > 0 ? (
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              onClick={onClear}
              aria-label={`Clear selected ${optionPluralLabel}`}
              className="rounded-full px-2 py-1 text-sm font-semibold text-amber-700 transition hover:bg-amber-50 hover:text-amber-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
            >
              Clear
            </button>
          </div>
        ) : null}
        <div className="relative">
          <span id={selectionSummaryId} className="sr-only">
            {selectedLabels.length > 0 ? `Selected ${optionPluralLabel}: ${selectedLabels.join(", ")}.` : null}
          </span>
          <button
            ref={triggerRef}
            type="button"
            aria-expanded={isOpen}
            aria-controls={panelId}
            aria-label={triggerLabel}
            aria-describedby={selectedLabels.length > 0 ? selectionSummaryId : undefined}
            onClick={() => (isOpen ? closeDropdown() : openDropdown())}
            className="flex min-h-11 w-full min-w-0 items-center justify-between gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-left shadow-sm transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate text-sm font-semibold text-slate-700">{label}</span>
              {selectedValues.length > 0 ? (
                <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                  {selectedValues.length}
                  <span className="sr-only"> selected</span>
                </span>
              ) : null}
            </span>
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              className={cn("h-5 w-5 shrink-0 text-slate-600 transition-transform", isOpen && "rotate-180")}
            >
              <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {isOpen ? (
            <div
              id={panelId}
              style={{ maxHeight: panelPlacement ? `${panelPlacement.maxHeight}px` : undefined }}
              className={cn(
                "absolute left-0 right-0 z-30 flex w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl sm:w-80 sm:max-w-[calc(100vw-2rem)]",
                panelPlacement?.openUp ? "bottom-full mb-2" : "top-full mt-2",
              )}
            >
              <div className="border-b border-slate-100 p-3">
                <label htmlFor={searchId} className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Search {optionPluralLabel}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    ref={searchInputRef}
                    id={searchId}
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={`Filter ${optionPluralLabel}`}
                    autoComplete="off"
                    className="h-9 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-4 focus:ring-amber-100"
                  />
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="shrink-0 rounded-full px-2 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-50 hover:text-amber-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
                  >
                    Clear search
                  </button>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
                {filteredOptions.length > 0 ? (
                  <div className="space-y-1">
                    {filteredOptions.map((option) => (
                      <label
                        key={option.value}
                        className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 has-checked:bg-amber-50 has-checked:text-amber-950"
                      >
                        <input
                          type="checkbox"
                          name={name}
                          value={option.value}
                          checked={selectedValues.includes(option.value)}
                          onChange={() => onChange(option.value)}
                          className="size-4 shrink-0 rounded border-slate-300 accent-amber-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
                        />
                        <span className="min-w-0 break-words">{option.label}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="px-3 py-6 text-center text-sm text-slate-500" role="status">
                    {search.trim()
                      ? `No ${optionPluralLabel} match "${search.trim()}".`
                      : `No ${optionPluralLabel} available.`}
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </fieldset>
  );
}
