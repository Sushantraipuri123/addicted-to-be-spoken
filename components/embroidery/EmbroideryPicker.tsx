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
  spotsMode?: boolean;
  awaitingSpot?: boolean;
  activeSpotLabel?: string;
  onSelect: (design: EmbroideryDesign) => void;
  onClear: () => void;
};

export function EmbroideryPicker({
  designs,
  selectedId,
  placementCount,
  view,
  spotsMode = false,
  awaitingSpot = false,
  activeSpotLabel,
  onSelect,
  onClear,
}: EmbroideryPickerProps) {
  const maxPlacements = MAX_EMBROIDERY_BY_VIEW[view];
  const viewLabel = view === "front" ? "front" : "back";

  return (
    <aside className="embroidery-picker">
      <div className="embroidery-picker__header">
        <h2>Embroidery</h2>
        {spotsMode ? (
          <p>
            {awaitingSpot
              ? "Select a spot on the blazer to see designs for that area."
              : activeSpotLabel
                ? `Designs for ${activeSpotLabel}. Tap one to place it automatically.`
                : "Choose a spot, then pick a design."}
          </p>
        ) : (
          <p>Choose a design, then tap a marker on the blazer.</p>
        )}
        <p className="embroidery-picker__counter">
          {placementCount} of {maxPlacements} {viewLabel} placement
          {maxPlacements === 1 ? "" : "s"} used
        </p>
      </div>
      {awaitingSpot ? (
        <div className="embroidery-picker__empty">
          <p>Select a spot on the blazer to see its designs.</p>
        </div>
      ) : (
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
      )}
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
