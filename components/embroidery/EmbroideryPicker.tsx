/* eslint-disable @next/next/no-img-element */
"use client";

import type { EmbroideryDesign } from "@/lib/embroidery/designs";
import { MAX_EMBROIDERY_BY_VIEW } from "@/lib/embroidery/limits";
import type { EmbroideryView } from "@/lib/embroidery/types";

type EmbroideryPickerProps = {
  designs: EmbroideryDesign[];
  selectedId?: string;
  placementCount: number;
  view: EmbroideryView;
  onSelect: (design: EmbroideryDesign) => void;
  onClear: () => void;
};

export function EmbroideryPicker({
  designs,
  selectedId,
  placementCount,
  view,
  onSelect,
  onClear,
}: EmbroideryPickerProps) {
  const maxPlacements = MAX_EMBROIDERY_BY_VIEW[view];
  const viewLabel = view === "front" ? "front" : "back";

  return (
    <aside className="embroidery-picker">
      <div className="embroidery-picker__header">
        <h2>Embroidery</h2>
        <p>Choose a design, then tap a marker on the blazer.</p>
        <p className="embroidery-picker__counter">
          {placementCount} of {maxPlacements} {viewLabel} placement
          {maxPlacements === 1 ? "" : "s"} used
        </p>
      </div>
      <div className="embroidery-picker__grid">
        {designs.map((design) => {
          const isSelected = selectedId === design.id;
          return (
            <button
              key={design.id}
              type="button"
              className={`embroidery-picker__item${isSelected ? " is-selected" : ""}`}
              onClick={() => onSelect(design)}
              aria-pressed={isSelected}
              aria-label={design.label}
              title={design.label}
            >
              <img src={design.src} alt={design.label} />
              <span>{design.label}</span>
            </button>
          );
        })}
      </div>
      {placementCount > 0 ? (
        <button
          type="button"
          className="embroidery-picker__clear"
          onClick={onClear}
        >
          Remove all embroidery ({viewLabel})
        </button>
      ) : null}
    </aside>
  );
}
