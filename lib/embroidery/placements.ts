import type { EmbroideryView } from "./types";

export type EmbroideryPlacement = {
  id: string;
  label: string;
  view: EmbroideryView;
  left: string;
  top: string;
  width: string;
  zIndex?: number;
  enabled?: boolean;
  /** Preset spot for guided back placement mode. */
  spot?: boolean;
  /** How the overlay is anchored to left/top (default: center). */
  anchor?: "center" | "bottom";
  /** Distance from preview bottom when anchor is bottom (overrides top for overlay). */
  bottom?: string;
};

export const EMBROIDERY_PLACEMENTS: Record<EmbroideryView, EmbroideryPlacement[]> = {
  front: [
    {
      id: "front-left-chest",
      label: "Left chest",
      view: "front",
      left: "40%",
      top: "50%",
      width: "15%",
    },
    {
      id: "front-right-chest",
      label: "Right chest",
      view: "front",
      left: "67%",
      top: "50%",
      width: "15%",
    },
    {
      id: "front-pocket",
      label: "Pocket",
      view: "front",
      left: "70%",
      top: "37%",
      width: "12%",
    },
  ],
  back: [
    {
      id: "back-upper-center",
      label: "Back center",
      view: "back",
      left: "50%",
      top: "21%",
      width: "18%",
      spot: true,
    },
    {
      id: "back-bottom",
      label: "Bottom back",
      view: "back",
      left: "50%",
      top: "97%",
      bottom: "3.6%",
      width: "50%",
      anchor: "bottom",
      spot: true,
    },
  ],
};

export function getEmbroideryPlacementById(
  view: EmbroideryView,
  placementId?: string
): EmbroideryPlacement | undefined {
  if (!placementId) return undefined;
  return EMBROIDERY_PLACEMENTS[view].find(
    (placement) => placement.id === placementId && placement.enabled !== false
  );
}

export function getBackSpotPlacements(): EmbroideryPlacement[] {
  return EMBROIDERY_PLACEMENTS.back.filter(
    (placement) => placement.spot === true && placement.enabled !== false
  );
}

export function getFreeBackPlacement(): EmbroideryPlacement | undefined {
  return EMBROIDERY_PLACEMENTS.back.find(
    (placement) => placement.id === "back-upper-center" && placement.enabled !== false
  );
}
