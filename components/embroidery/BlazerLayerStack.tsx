/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { BlazerLayer, EmbroiderySelection } from "@/lib/embroidery/types";
import { filterJacketOnlyLayers } from "@/lib/embroidery/jacket-only-layers";
import {
  EMBROIDERY_PLACEMENTS,
  getEmbroideryPlacementById,
} from "@/lib/embroidery/placements";
import { MirrorLayerImg } from "./MirrorLayerImg";

type BlazerLayerStackProps = {
  layers: BlazerLayer[];
  embroidery?: EmbroiderySelection;
  view: "front" | "back";
  hasDesignSelected: boolean;
  onHotspotSelect: (placementId: string) => void;
  onBackAdjust: (custom: { left: string; top: string; width: string }) => void;
};

type Geometry = {
  left: number;
  top: number;
  width: number;
};

const BACK_BOUNDS = {
  minLeft: 19,
  maxLeft: 81,
  minTop: 16,
  maxTop: 89,
  minWidth: 8,
  maxWidth: 38,
  edgePadding: 1.5,
};

function parsePercent(raw: string): number {
  return Number.parseFloat(raw.replace("%", ""));
}

function toPercent(value: number): string {
  return `${Number(value.toFixed(2))}%`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clampGeometry(geometry: Geometry): Geometry {
  const width = clamp(geometry.width, BACK_BOUNDS.minWidth, BACK_BOUNDS.maxWidth);
  const halfWidth = width / 2;
  const minLeft = BACK_BOUNDS.minLeft + halfWidth + BACK_BOUNDS.edgePadding;
  const maxLeft = BACK_BOUNDS.maxLeft - halfWidth - BACK_BOUNDS.edgePadding;
  const minTop = BACK_BOUNDS.minTop + halfWidth + BACK_BOUNDS.edgePadding;
  const maxTop = BACK_BOUNDS.maxTop - halfWidth - BACK_BOUNDS.edgePadding;
  return {
    width,
    left: clamp(geometry.left, minLeft, maxLeft),
    top: clamp(geometry.top, minTop, maxTop),
  };
}

function geometryEquals(a: Geometry | null, b: Geometry | null): boolean {
  if (!a || !b) return a === b;
  return a.left === b.left && a.top === b.top && a.width === b.width;
}

export function BlazerLayerStack({
  layers,
  embroidery,
  view,
  hasDesignSelected,
  onHotspotSelect,
  onBackAdjust,
}: BlazerLayerStackProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    initial: Geometry;
  } | null>(null);
  const resizeStartRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    initial: Geometry;
  } | null>(null);

  const visibleLayers =
    view === "back" ? filterJacketOnlyLayers(layers) : layers;
  const sorted = [...visibleLayers].sort((a, b) => a.zIndex - b.zIndex);
  const placements = EMBROIDERY_PLACEMENTS[view].filter(
    (placement) => placement.enabled !== false
  );
  const selectedPlacement = getEmbroideryPlacementById(
    view,
    embroidery?.placementId
  );
  const baseGeometry = useMemo<Geometry | undefined>(() => {
    if (!selectedPlacement) return undefined;
    const fallback = {
      left: parsePercent(selectedPlacement.left),
      top: parsePercent(selectedPlacement.top),
      width: parsePercent(selectedPlacement.width),
    };
    if (view !== "back" || !embroidery?.custom) return fallback;
    return {
      left: parsePercent(embroidery.custom.left),
      top: parsePercent(embroidery.custom.top),
      width: parsePercent(embroidery.custom.width),
    };
  }, [embroidery?.custom, selectedPlacement, view]);

  const [backGeometry, setBackGeometry] = useState<Geometry | null>(null);

  useEffect(() => {
    if (view !== "back" || !baseGeometry) {
      setBackGeometry((previous) => (previous ? null : previous));
      return;
    }
    const next = clampGeometry(baseGeometry);
    setBackGeometry((previous) => (geometryEquals(previous, next) ? previous : next));
  }, [baseGeometry, view]);

  const interactiveGeometry =
    view === "back" && backGeometry ? backGeometry : baseGeometry;

  const handleDragPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (view !== "back" || !interactiveGeometry || !frameRef.current) return;
    event.preventDefault();
    dragStartRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      initial: interactiveGeometry,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleDragPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current || !frameRef.current || view !== "back") return;
    if (dragStartRef.current.pointerId !== event.pointerId) return;

    const rect = frameRef.current.getBoundingClientRect();
    const dxPct = ((event.clientX - dragStartRef.current.startX) / rect.width) * 100;
    const dyPct = ((event.clientY - dragStartRef.current.startY) / rect.height) * 100;
    setBackGeometry(
      clampGeometry({
        ...dragStartRef.current.initial,
        left: dragStartRef.current.initial.left + dxPct,
        top: dragStartRef.current.initial.top + dyPct,
      })
    );
  };

  const handleDragPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;
    if (dragStartRef.current.pointerId !== event.pointerId) return;
    dragStartRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    if (view === "back" && backGeometry && embroidery && selectedPlacement) {
      onBackAdjust({
        left: toPercent(backGeometry.left),
        top: toPercent(backGeometry.top),
        width: toPercent(backGeometry.width),
      });
    }
  };

  const handleResizePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (view !== "back" || !interactiveGeometry || !frameRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    resizeStartRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      initial: interactiveGeometry,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleResizePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!resizeStartRef.current || !frameRef.current || view !== "back") return;
    if (resizeStartRef.current.pointerId !== event.pointerId) return;
    const rect = frameRef.current.getBoundingClientRect();
    const dxPct = ((event.clientX - resizeStartRef.current.startX) / rect.width) * 100;
    const dyPct = ((event.clientY - resizeStartRef.current.startY) / rect.height) * 100;
    const delta = Math.max(dxPct, dyPct);
    setBackGeometry(
      clampGeometry({
        ...resizeStartRef.current.initial,
        width: resizeStartRef.current.initial.width + delta,
      })
    );
  };

  const handleResizePointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!resizeStartRef.current) return;
    if (resizeStartRef.current.pointerId !== event.pointerId) return;
    resizeStartRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    if (view === "back" && backGeometry && embroidery && selectedPlacement) {
      onBackAdjust({
        left: toPercent(backGeometry.left),
        top: toPercent(backGeometry.top),
        width: toPercent(backGeometry.width),
      });
    }
  };

  return (
    <div className="embroidery-preview__stack" aria-label="Blazer preview" ref={frameRef}>
      {sorted.map((layer, index) => (
        <MirrorLayerImg
          key={`${layer.zIndex}-${index}-${layer.src}`}
          initialSrc={layer.src}
          className={`embroidery-preview__layer${layer.className ? ` ${layer.className}` : ""}`}
          style={{ zIndex: layer.zIndex }}
        />
      ))}
      {!(view === "back" && embroidery) ? (
        <div className="embroidery-preview__hotspots" aria-label="Placement markers">
          {placements.map((placement) => {
            const isSelected = placement.id === embroidery?.placementId;
            return (
              <button
                key={placement.id}
                type="button"
                className={`embroidery-preview__hotspot${isSelected ? " is-selected" : ""}`}
                style={{ left: placement.left, top: placement.top }}
                onClick={() => onHotspotSelect(placement.id)}
                aria-label={`Place embroidery on ${placement.label}`}
                title={placement.label}
                disabled={!hasDesignSelected}
              >
                <span aria-hidden>{placement.label.slice(0, 1)}</span>
              </button>
            );
          })}
        </div>
      ) : null}
      {embroidery && selectedPlacement && interactiveGeometry ? (
        <div
          className={`embroidery-preview__overlay-wrap${view === "back" ? " is-draggable" : ""}`}
          style={{
            zIndex: selectedPlacement.zIndex ?? 1000,
            left: toPercent(interactiveGeometry.left),
            top: toPercent(interactiveGeometry.top),
            width: toPercent(interactiveGeometry.width),
          }}
          onPointerDown={handleDragPointerDown}
          onPointerMove={handleDragPointerMove}
          onPointerUp={handleDragPointerUp}
          onPointerCancel={handleDragPointerUp}
        >
          <img
            src={embroidery.src}
            alt="Embroidery overlay"
            className="embroidery-preview__overlay"
            draggable={false}
          />
          {view === "back" ? (
            <button
              type="button"
              className="embroidery-preview__resize"
              aria-label="Resize embroidery"
              onPointerDown={handleResizePointerDown}
              onPointerMove={handleResizePointerMove}
              onPointerUp={handleResizePointerUp}
              onPointerCancel={handleResizePointerUp}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
