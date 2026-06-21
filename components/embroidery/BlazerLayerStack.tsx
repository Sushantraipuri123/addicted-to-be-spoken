/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type {
  BlazerLayer,
  EmbroiderySelection,
  EmbroideryView,
} from "@/lib/embroidery/types";
import { filterJacketOnlyLayers } from "@/lib/embroidery/jacket-only-layers";
import { getOccupiedPlacementIds } from "@/lib/embroidery/limits";
import {
  EMBROIDERY_PLACEMENTS,
  getEmbroideryPlacementById,
} from "@/lib/embroidery/placements";
import { MirrorLayerImg } from "./MirrorLayerImg";

type BlazerLayerStackProps = {
  layers: BlazerLayer[];
  embroideries: EmbroiderySelection[];
  view: EmbroideryView;
  hasDesignSelected: boolean;
  activePlacementId?: string;
  onHotspotSelect: (placementId: string) => void;
  onBackAdjust: (
    placementId: string,
    custom: { left: string; top: string; width: string }
  ) => void;
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

function resolveGeometry(
  view: EmbroideryView,
  embroidery: EmbroiderySelection
): Geometry | undefined {
  const placement = getEmbroideryPlacementById(view, embroidery.placementId);
  if (!placement) return undefined;

  const fallback = {
    left: parsePercent(placement.left),
    top: parsePercent(placement.top),
    width: parsePercent(placement.width),
  };

  if (view !== "back" || !embroidery.custom) {
    return fallback;
  }

  return {
    left: parsePercent(embroidery.custom.left),
    top: parsePercent(embroidery.custom.top),
    width: parsePercent(embroidery.custom.width),
  };
}

type BackEmbroideryOverlayProps = {
  embroidery: EmbroiderySelection;
  geometry: Geometry;
  zIndex: number;
  isActive: boolean;
  frameRef: React.RefObject<HTMLDivElement | null>;
  onAdjust: (custom: { left: string; top: string; width: string }) => void;
};

function BackEmbroideryOverlay({
  embroidery,
  geometry,
  zIndex,
  isActive,
  frameRef,
  onAdjust,
}: BackEmbroideryOverlayProps) {
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

  const [localGeometry, setLocalGeometry] = useState<Geometry>(() =>
    clampGeometry(geometry)
  );

  useEffect(() => {
    const next = clampGeometry(geometry);
    setLocalGeometry((previous) =>
      geometryEquals(previous, next) ? previous : next
    );
  }, [geometry]);

  const handleDragPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isActive || !frameRef.current) return;
    event.preventDefault();
    dragStartRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      initial: localGeometry,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleDragPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current || !frameRef.current) return;
    if (dragStartRef.current.pointerId !== event.pointerId) return;

    const rect = frameRef.current.getBoundingClientRect();
    const dxPct =
      ((event.clientX - dragStartRef.current.startX) / rect.width) * 100;
    const dyPct =
      ((event.clientY - dragStartRef.current.startY) / rect.height) * 100;
    setLocalGeometry(
      clampGeometry({
        ...dragStartRef.current.initial,
        left: dragStartRef.current.initial.left + dxPct,
        top: dragStartRef.current.initial.top + dyPct,
      })
    );
  };

  const finishDrag = (
    event: ReactPointerEvent<HTMLDivElement>,
    geometrySnapshot: Geometry
  ) => {
    if (!dragStartRef.current) return;
    if (dragStartRef.current.pointerId !== event.pointerId) return;
    dragStartRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    onAdjust({
      left: toPercent(geometrySnapshot.left),
      top: toPercent(geometrySnapshot.top),
      width: toPercent(geometrySnapshot.width),
    });
  };

  const handleDragPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    finishDrag(event, localGeometry);
  };

  const handleResizePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!isActive || !frameRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    resizeStartRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      initial: localGeometry,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleResizePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!resizeStartRef.current || !frameRef.current) return;
    if (resizeStartRef.current.pointerId !== event.pointerId) return;
    const rect = frameRef.current.getBoundingClientRect();
    const dxPct =
      ((event.clientX - resizeStartRef.current.startX) / rect.width) * 100;
    const dyPct =
      ((event.clientY - resizeStartRef.current.startY) / rect.height) * 100;
    const delta = Math.max(dxPct, dyPct);
    setLocalGeometry(
      clampGeometry({
        ...resizeStartRef.current.initial,
        width: resizeStartRef.current.initial.width + delta,
      })
    );
  };

  const finishResize = (
    event: ReactPointerEvent<HTMLButtonElement>,
    geometrySnapshot: Geometry
  ) => {
    if (!resizeStartRef.current) return;
    if (resizeStartRef.current.pointerId !== event.pointerId) return;
    resizeStartRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    onAdjust({
      left: toPercent(geometrySnapshot.left),
      top: toPercent(geometrySnapshot.top),
      width: toPercent(geometrySnapshot.width),
    });
  };

  const handleResizePointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    finishResize(event, localGeometry);
  };

  return (
    <div
      className={`embroidery-preview__overlay-wrap is-draggable${isActive ? " is-active" : ""}`}
      style={{
        zIndex,
        left: toPercent(localGeometry.left),
        top: toPercent(localGeometry.top),
        width: toPercent(localGeometry.width),
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
      {isActive ? (
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
  );
}

export function BlazerLayerStack({
  layers,
  embroideries,
  view,
  hasDesignSelected,
  activePlacementId,
  onHotspotSelect,
  onBackAdjust,
}: BlazerLayerStackProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);

  const visibleLayers =
    view === "back" ? filterJacketOnlyLayers(layers) : layers;
  const sorted = [...visibleLayers].sort((a, b) => a.zIndex - b.zIndex);
  const maxLayerZ = useMemo(
    () => sorted.reduce((max, layer) => Math.max(max, layer.zIndex), 0),
    [sorted]
  );
  const embroideryBaseZ = maxLayerZ + 10;

  const placements = EMBROIDERY_PLACEMENTS[view].filter(
    (placement) => placement.enabled !== false
  );
  const occupiedPlacementIds = getOccupiedPlacementIds(embroideries);

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
      {embroideries.map((embroidery, index) => {
        const placement = getEmbroideryPlacementById(view, embroidery.placementId);
        const geometry = resolveGeometry(view, embroidery);
        if (!placement || !geometry) return null;

        const zIndex = embroideryBaseZ + index;

        if (view === "back") {
          return (
            <BackEmbroideryOverlay
              key={embroidery.id}
              embroidery={embroidery}
              geometry={geometry}
              zIndex={zIndex}
              isActive={
                activePlacementId === embroidery.placementId ||
                (!activePlacementId && index === embroideries.length - 1)
              }
              frameRef={frameRef}
              onAdjust={(custom) => onBackAdjust(embroidery.placementId, custom)}
            />
          );
        }

        return (
          <div
            key={embroidery.id}
            className="embroidery-preview__overlay-wrap"
            style={{
              zIndex,
              left: toPercent(geometry.left),
              top: toPercent(geometry.top),
              width: toPercent(geometry.width),
            }}
          >
            <img
              src={embroidery.src}
              alt="Embroidery overlay"
              className="embroidery-preview__overlay"
              draggable={false}
            />
          </div>
        );
      })}
      <div className="embroidery-preview__hotspots" aria-label="Placement markers">
        {placements.map((placement) => {
          const isOccupied = occupiedPlacementIds.has(placement.id);
          const isSelected = placement.id === activePlacementId;
          return (
            <button
              key={placement.id}
              type="button"
              className={`embroidery-preview__hotspot${isSelected ? " is-selected" : ""}${isOccupied ? " is-occupied" : ""}`}
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
    </div>
  );
}
