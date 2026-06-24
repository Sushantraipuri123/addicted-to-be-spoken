import { EMBROIDERY_PLACEMENTS } from "./placements";
import type { EmbroiderySelection, EmbroideryView } from "./types";

export const MAX_EMBROIDERY_BY_VIEW: Record<EmbroideryView, number> = {
  front: 3,
  back: 2,
};

export function getOccupiedPlacementIds(
  selections: EmbroiderySelection[]
): Set<string> {
  return new Set(selections.map((selection) => selection.placementId));
}

export type PlaceEmbroideryResult =
  | { ok: true }
  | { ok: false; reason: string };

export function canPlaceEmbroidery(
  view: EmbroideryView,
  _designId: string,
  placementId: string,
  selections: EmbroiderySelection[]
): PlaceEmbroideryResult {
  const placement = EMBROIDERY_PLACEMENTS[view].find(
    (item) => item.id === placementId && item.enabled !== false
  );
  if (!placement) {
    return { ok: false, reason: "That placement is not available." };
  }

  const existingAtPlacement = selections.find(
    (selection) => selection.placementId === placementId
  );

  if (!existingAtPlacement && selections.length >= MAX_EMBROIDERY_BY_VIEW[view]) {
    const viewLabel = view === "front" ? "front" : "back";
    return {
      ok: false,
      reason: `Maximum ${MAX_EMBROIDERY_BY_VIEW[view]} embroidery placement${MAX_EMBROIDERY_BY_VIEW[view] === 1 ? "" : "s"} on the ${viewLabel}. Remove one to add another.`,
    };
  }

  return { ok: true };
}
