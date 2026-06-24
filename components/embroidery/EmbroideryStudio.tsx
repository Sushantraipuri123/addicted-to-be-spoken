"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BlazerLayerStack } from "./BlazerLayerStack";
import { EmbroideryPicker } from "./EmbroideryPicker";
import {
  EMBROIDERY_DESIGNS,
  findEmbroideryDesignById,
  getBackSpotDesigns,
} from "@/lib/embroidery/designs";
import type { EmbroideryDesign } from "@/lib/embroidery/designs";
import {
  canPlaceEmbroidery,
  MAX_EMBROIDERY_BY_VIEW,
} from "@/lib/embroidery/limits";
import {
  clearEmbroideryView,
  loadBlazerDraftWithMeta,
  updateEmbroideryCustom,
  upsertEmbroideryAtPlacement,
} from "@/lib/embroidery/storage";
import { getEmbroideryPlacementById } from "@/lib/embroidery/placements";
import type { BlazerDraft, BackEmbroideryMode, EmbroideryView } from "@/lib/embroidery/types";

export function EmbroideryStudio() {
  const [draft, setDraft] = useState<BlazerDraft | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<EmbroideryView>("front");
  const [backMode, setBackMode] = useState<BackEmbroideryMode>("free");
  const [selectedDesignByView, setSelectedDesignByView] = useState<
    Partial<Record<EmbroideryView, string>>
  >({});
  const [activePlacementId, setActivePlacementId] = useState<string | undefined>();
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const { draft: loadedDraft, resetPlacementViews } = loadBlazerDraftWithMeta();
    setDraft(loadedDraft);
    if (resetPlacementViews.length > 0) {
      setNotice(
        `Saved embroidery placement was reset on ${resetPlacementViews.join(" and ")} because that hotspot is no longer available.`
      );
    }
    setLoaded(true);
  }, []);

  const embroideries = draft?.embroidery?.[view] ?? [];
  const placementCount = embroideries.length;
  const maxPlacements = MAX_EMBROIDERY_BY_VIEW[view];
  const selectedId = selectedDesignByView[view];
  const viewLabel = view === "front" ? "front" : "back";

  const pickerDesigns = useMemo(() => {
    if (view === "front" || (view === "back" && backMode === "free")) {
      return EMBROIDERY_DESIGNS;
    }
    if (activePlacementId) {
      return getBackSpotDesigns(activePlacementId);
    }
    return [];
  }, [view, backMode, activePlacementId]);

  const resetBackSpotSelection = useCallback(() => {
    setActivePlacementId(undefined);
    setSelectedDesignByView((current) => ({ ...current, back: undefined }));
    setNotice(null);
  }, []);

  const handleBackModeChange = useCallback(
    (mode: BackEmbroideryMode) => {
      setBackMode(mode);
      resetBackSpotSelection();
    },
    [resetBackSpotSelection]
  );

  const handleSelect = useCallback(
    (design: EmbroideryDesign) => {
      setNotice(null);
      setSelectedDesignByView((current) => ({ ...current, [view]: design.id }));

      if (view === "back" && backMode === "spots") {
        if (!activePlacementId) return;

        const check = canPlaceEmbroidery(
          view,
          design.id,
          activePlacementId,
          embroideries
        );
        if (!check.ok) {
          setNotice(check.reason);
          return;
        }

        const updated = upsertEmbroideryAtPlacement(view, {
          designId: design.id,
          src: design.src,
          placementId: activePlacementId,
        });
        if (updated) setDraft(updated);
        return;
      }

      if (!activePlacementId) return;

      const check = canPlaceEmbroidery(
        view,
        design.id,
        activePlacementId,
        embroideries
      );
      if (!check.ok) {
        setNotice(check.reason);
        return;
      }

      const updated = upsertEmbroideryAtPlacement(view, {
        designId: design.id,
        src: design.src,
        placementId: activePlacementId,
      });
      if (updated) setDraft(updated);
    },
    [activePlacementId, backMode, embroideries, view]
  );

  const handleClear = useCallback(() => {
    const updated = clearEmbroideryView(view);
    if (updated) {
      setDraft(updated);
      setSelectedDesignByView((current) => ({ ...current, [view]: undefined }));
      setActivePlacementId(undefined);
      setNotice(null);
    }
  }, [view]);

  const handlePlace = useCallback(
    (placementId: string) => {
      setNotice(null);
      setActivePlacementId(placementId);

      if (view === "back" && backMode === "spots") {
        setSelectedDesignByView((current) => ({ ...current, back: undefined }));
        return;
      }

      const designId = selectedDesignByView[view];
      if (!designId) return;

      const design = findEmbroideryDesignById(designId);
      if (!design) return;

      const check = canPlaceEmbroidery(view, designId, placementId, embroideries);
      if (!check.ok) {
        setNotice(check.reason);
        return;
      }

      const updated = upsertEmbroideryAtPlacement(view, {
        designId,
        src: design.src,
        placementId,
      });
      if (updated) setDraft(updated);
    },
    [backMode, embroideries, selectedDesignByView, view]
  );

  const handleBackAdjust = useCallback(
    (placementId: string, custom: { left: string; top: string; width: string }) => {
      const updated = updateEmbroideryCustom(view, placementId, custom);
      if (updated) setDraft(updated);
    },
    [view]
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
  const activePlacementLabel = getEmbroideryPlacementById(
    view,
    activePlacementId
  )?.label;

  const hint =
    view === "back" && backMode === "spots"
      ? !activePlacementId
        ? "Tap Back center or Bottom back on the blazer to choose a spot."
        : !selectedId
          ? `Choose a design for ${activePlacementLabel ?? "this spot"} — it will be placed automatically.`
          : activePlacementId === "back-upper-center"
            ? "Back center design placed — drag to move or use the corner handle to resize."
            : `Design placed on ${activePlacementLabel}. Tap another spot or pick a different design to replace.`
      : !selectedId
        ? `Select a design first, then tap a marker on the ${viewLabel}.`
        : placementCount >= maxPlacements && !activePlacementId
          ? `All ${viewLabel} placements are full. Tap a marker to replace that spot.`
          : activePlacementId
            ? `Tap "${activePlacementLabel}" again or choose another marker to place your design.`
            : view === "back"
              ? "Tap the upper-back marker to place your design. Drag to adjust after placing."
              : "Tap a chest or pocket marker to place your design.";

  return (
    <div className="embroidery-studio">
      <header className="embroidery-studio__header">
        <Link href="/men/custom-jackets/personalize" className="embroidery-studio__logo">
          <Image src="/logoADTB.png" alt="ADTB" width={115} height={30} priority />
        </Link>
        <h1 className="embroidery-studio__title">Embroidery</h1>
      </header>

      <div className="embroidery-studio__main">
        <EmbroideryPicker
          designs={pickerDesigns}
          selectedId={selectedId}
          placementCount={placementCount}
          view={view}
          spotsMode={view === "back" && backMode === "spots"}
          awaitingSpot={view === "back" && backMode === "spots" && !activePlacementId}
          activeSpotLabel={activePlacementLabel}
          onSelect={handleSelect}
          onClear={handleClear}
        />

        <section className="embroidery-preview">
          {notice ? (
            <p className="embroidery-preview__notice" role="status">
              {notice}
            </p>
          ) : null}
          {view === "back" ? (
            <div className="embroidery-preview__mode" role="group" aria-label="Back placement mode">
              <span className="embroidery-preview__mode-label">Placement</span>
              <div className="embroidery-preview__mode-toggle">
                <button
                  type="button"
                  className={`embroidery-preview__mode-btn${backMode === "free" ? " is-active" : ""}`}
                  onClick={() => handleBackModeChange("free")}
                  aria-pressed={backMode === "free"}
                >
                  Free
                </button>
                <button
                  type="button"
                  className={`embroidery-preview__mode-btn${backMode === "spots" ? " is-active" : ""}`}
                  onClick={() => handleBackModeChange("spots")}
                  aria-pressed={backMode === "spots"}
                >
                  Spots
                </button>
              </div>
            </div>
          ) : null}
          <div className="embroidery-preview__frame">
            <BlazerLayerStack
              layers={layers}
              embroideries={embroideries}
              view={view}
              backMode={view === "back" ? backMode : undefined}
              hasDesignSelected={Boolean(selectedId)}
              activePlacementId={activePlacementId}
              onHotspotSelect={handlePlace}
              onBackAdjust={handleBackAdjust}
            />
          </div>
          <p className="embroidery-preview__hint">{hint}</p>
        </section>

        <aside className="embroidery-controls">
          <span className="embroidery-controls__label">View</span>
          <button
            type="button"
            className={`embroidery-controls__btn${view === "front" ? " is-active" : ""}`}
            onClick={() => {
              setView("front");
              setActivePlacementId(undefined);
              setNotice(null);
            }}
          >
            Front
          </button>
          <button
            type="button"
            className={`embroidery-controls__btn${view === "back" ? " is-active" : ""}`}
            onClick={() => {
              setView("back");
              setActivePlacementId(undefined);
              setNotice(null);
            }}
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
