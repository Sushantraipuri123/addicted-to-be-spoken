/* eslint-disable @next/next/no-img-element */
"use client";

import type { EmbroideryDesign } from "@/lib/embroidery/designs";

type EmbroideryPickerProps = {
  designs: EmbroideryDesign[];
  selectedId?: string;
  onSelect: (design: EmbroideryDesign) => void;
  onClear: () => void;
};

export function EmbroideryPicker({
  designs,
  selectedId,
  onSelect,
  onClear,
}: EmbroideryPickerProps) {
  return (
    <aside className="embroidery-picker">
      <div className="embroidery-picker__header">
        <h2>Embroidery</h2>
        <p>Choose a design to place on your blazer.</p>
      </div>
      <div className="embroidery-picker__grid">
        {designs.map((design) => (
          <button
            key={design.id}
            type="button"
            className={`embroidery-picker__item${selectedId === design.id ? " is-selected" : ""}`}
            onClick={() => onSelect(design)}
            aria-pressed={selectedId === design.id}
            aria-label={design.label}
          >
            <img src={design.src} alt={design.label} />
            <span>{design.label}</span>
          </button>
        ))}
      </div>
      {selectedId ? (
        <button
          type="button"
          className="embroidery-picker__clear"
          onClick={onClear}
        >
          Remove embroidery
        </button>
      ) : null}
    </aside>
  );
}
