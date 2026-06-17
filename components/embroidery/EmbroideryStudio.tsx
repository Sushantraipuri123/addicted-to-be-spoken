"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BlazerLayerStack } from "./BlazerLayerStack";
import { EmbroideryPicker } from "./EmbroideryPicker";
import { EMBROIDERY_DESIGNS } from "@/lib/embroidery/designs";
import type { EmbroideryDesign } from "@/lib/embroidery/designs";
import {
  loadBlazerDraft,
  saveEmbroiderySelection,
} from "@/lib/embroidery/storage";
import type { BlazerDraft } from "@/lib/embroidery/types";

const STEPS = ["Fabric", "Style", "Accents", "Embroidery"] as const;

export function EmbroideryStudio() {
  const [draft, setDraft] = useState<BlazerDraft | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<"front" | "back">("front");

  useEffect(() => {
    setDraft(loadBlazerDraft());
    setLoaded(true);
  }, []);

  const handleSelect = useCallback(
    (design: EmbroideryDesign) => {
      const updated = saveEmbroiderySelection(view, {
        designId: design.id,
        src: design.src,
      });
      if (updated) setDraft(updated);
    },
    [view]
  );

  const handleClear = useCallback(() => {
    const updated = saveEmbroiderySelection(view, undefined);
    if (updated) setDraft(updated);
  }, [view]);

  if (!loaded) {
    return (
      <div className="embroidery-empty">
        <p>Loading your blazer…</p>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="embroidery-empty">
        <h1>No blazer design found</h1>
        <p>
          Customize your jacket through Fabric, Style, and Accents first, then
          continue to embroidery.
        </p>
        <Link href="/men/custom-jackets/personalize">Start customizing</Link>
      </div>
    );
  }

  const layers = view === "front" ? draft.layers.front : draft.layers.back;
  const embroidery = draft.embroidery?.[view];
  const selectedId = embroidery?.designId;

  return (
    <div className="embroidery-studio">
      <header className="embroidery-studio__header">
        <Link href="/men/custom-jackets/personalize" className="embroidery-studio__logo">
          <img src="/logoADTB.png" alt="ADTB" width={115} height={30} />
        </Link>
        <nav className="embroidery-studio__steps" aria-label="Customization steps">
          {STEPS.map((label, index) => {
            const isActive = label === "Embroidery";
            const isDone = index < STEPS.length - 1;
            return (
              <span
                key={label}
                className={`embroidery-studio__step${isActive ? " is-active" : ""}${isDone ? " is-done" : ""}`}
              >
                {label}
              </span>
            );
          })}
        </nav>
      </header>

      <div className="embroidery-studio__main">
        <EmbroideryPicker
          designs={EMBROIDERY_DESIGNS}
          selectedId={selectedId}
          onSelect={handleSelect}
          onClear={handleClear}
        />

        <section className="embroidery-preview">
          <div className="embroidery-preview__frame">
            <BlazerLayerStack
              layers={layers}
              embroidery={embroidery}
              view={view}
            />
          </div>
          <p className="embroidery-preview__hint">
            {view === "front"
              ? "Front view — jacket only. Select a design to place on the chest."
              : "Back view. Select a design for the upper back."}
          </p>
        </section>

        <aside className="embroidery-controls">
          <span className="embroidery-controls__label">View</span>
          <button
            type="button"
            className={`embroidery-controls__btn${view === "front" ? " is-active" : ""}`}
            onClick={() => setView("front")}
          >
            Front
          </button>
          <button
            type="button"
            className={`embroidery-controls__btn${view === "back" ? " is-active" : ""}`}
            onClick={() => setView("back")}
          >
            Back
          </button>
          <Link
            href="/men/custom-jackets/personalize"
            className="embroidery-controls__back"
          >
            Back to customize
          </Link>
        </aside>
      </div>
    </div>
  );
}
