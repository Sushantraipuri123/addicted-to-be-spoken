"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { BlazerLayerStack } from "./BlazerLayerStack";
import { EmbroideryPicker } from "./EmbroideryPicker";
import { EMBROIDERY_DESIGNS } from "@/lib/embroidery/designs";
import type { EmbroideryDesign } from "@/lib/embroidery/designs";
import {
  loadBlazerDraftWithMeta,
  saveEmbroiderySelection,
} from "@/lib/embroidery/storage";
import { getEmbroideryPlacementById } from "@/lib/embroidery/placements";
import type { BlazerDraft, EmbroideryView } from "@/lib/embroidery/types";

const STEPS = ["Fabric", "Style", "Accents", "Embroidery"] as const;

export function EmbroideryStudio() {
  const [draft, setDraft] = useState<BlazerDraft | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<EmbroideryView>("front");
  const [selectedDesignByView, setSelectedDesignByView] = useState<
    Partial<Record<EmbroideryView, string>>
  >({});
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const { draft: loadedDraft, resetPlacementViews } = loadBlazerDraftWithMeta();
    setDraft(loadedDraft);
    if (loadedDraft) {
      setSelectedDesignByView({
        front: loadedDraft.embroidery?.front?.designId,
        back: loadedDraft.embroidery?.back?.designId,
      });
    }
    if (resetPlacementViews.length > 0) {
      setNotice(
        `Saved embroidery placement was reset on ${resetPlacementViews.join(" and ")} because that hotspot is no longer available.`
      );
    }
    setLoaded(true);
  }, []);

  const handleSelect = useCallback(
    (design: EmbroideryDesign) => {
      setSelectedDesignByView((current) => ({ ...current, [view]: design.id }));
      const currentPlacement = draft?.embroidery?.[view]?.placementId;
      if (!currentPlacement) return;

      const updated = saveEmbroiderySelection(view, {
        designId: design.id,
        src: design.src,
        placementId: currentPlacement,
      });
      if (updated) {
        setDraft(updated);
      }
    },
    [draft, view]
  );

  const handleClear = useCallback(() => {
    const updated = saveEmbroiderySelection(view, undefined);
    if (updated) {
      setDraft(updated);
      setSelectedDesignByView((current) => ({ ...current, [view]: undefined }));
    }
  }, [view]);

  const handlePlace = useCallback(
    (placementId: string) => {
      const designId = selectedDesignByView[view];
      if (!designId) return;

      const design = EMBROIDERY_DESIGNS.find((item) => item.id === designId);
      if (!design) return;

      const updated = saveEmbroiderySelection(view, {
        designId,
        src: design.src,
        placementId,
      });
      if (updated) setDraft(updated);
    },
    [selectedDesignByView, view]
  );

  const handleAdjustBackEmbroidery = useCallback(
    (custom: { left: string; top: string; width: string }) => {
      if (view !== "back") return;
      const current = draft?.embroidery?.back;
      if (!current) return;

      const updated = saveEmbroiderySelection("back", {
        ...current,
        custom,
      });
      if (updated) setDraft(updated);
    },
    [draft, view]
  );

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
  const selectedId = selectedDesignByView[view];
  const selectedPlacementLabel = getEmbroideryPlacementById(
    view,
    embroidery?.placementId
  )?.label;
  const hint = !selectedId
    ? "Select a design first, then tap a marker on the blazer."
    : !embroidery?.placementId
      ? "Tap a marker to place your selected design."
      : view === "back"
        ? "Back view: drag embroidery to adjust position, drag corner handle to resize. It stays within safe blazer bounds."
        : `Placed on ${selectedPlacementLabel}. Tap another marker to reposition.`;

  return (
    <div className="embroidery-studio">
      <header className="embroidery-studio__header">
        <Link href="/men/custom-jackets/personalize" className="embroidery-studio__logo">
          <Image src="/logoADTB.png" alt="ADTB" width={115} height={30} priority />
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
          {notice ? (
            <p className="embroidery-preview__notice" role="status">
              {notice}
            </p>
          ) : null}
          <div className="embroidery-preview__frame">
            <BlazerLayerStack
              layers={layers}
              embroidery={embroidery}
              view={view}
              hasDesignSelected={Boolean(selectedId)}
              onHotspotSelect={handlePlace}
              onBackAdjust={handleAdjustBackEmbroidery}
            />
          </div>
          <p className="embroidery-preview__hint">{hint}</p>
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
