export type EmbroideryPlacement = {
  left: string;
  top: string;
  width: string;
};

export const EMBROIDERY_PLACEMENTS: Record<"front" | "back", EmbroideryPlacement> = {
  front: { left: "38%", top: "22%", width: "20%" },
  back: { left: "36%", top: "18%", width: "24%" },
};
