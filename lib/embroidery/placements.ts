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
      label: "Upper back",
      view: "back",
      left: "50%",
      top: "23%",
      width: "16%",
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
