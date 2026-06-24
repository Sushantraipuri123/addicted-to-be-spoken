export type EmbroideryDesign = {
  id: string;
  label: string;
  src: string;
};

export const EMBROIDERY_DESIGNS: EmbroideryDesign[] = [
  { id: "design-1", label: "Design 1", src: "/embroidery/design-1.png" },
  { id: "design-2", label: "Design 2", src: "/embroidery/design-2.png" },
  { id: "design-3", label: "Design 3", src: "/embroidery/design-3.png" },
  { id: "design-4", label: "Design 4", src: "/embroidery/design-4.png" },
  { id: "design-5", label: "Design 5", src: "/embroidery/design-5.png" },
  { id: "design-6", label: "Design 6", src: "/embroidery/design-6.png" },
];

/** Region-specific designs for guided back spots mode. */
export const BACK_SPOT_DESIGNS: Record<string, EmbroideryDesign[]> = {
  "back-upper-center": [
    { id: "back-center-1", label: "Back center 1", src: "/embroidery/back/back1.png" },
    { id: "back-center-2", label: "Back center 2", src: "/embroidery/back/back2.png" },
  ],
  "back-bottom": [
    {
      id: "back-bottom-1",
      label: "Bottom back 1",
      src: "/embroidery/back-bottom/bottomback1.png",
    },
    {
      id: "back-bottom-2",
      label: "Bottom back 2",
      src: "/embroidery/back-bottom/bottomback2.png",
    },
  ],
};

const ALL_DESIGNS: EmbroideryDesign[] = [
  ...EMBROIDERY_DESIGNS,
  ...Object.values(BACK_SPOT_DESIGNS).flat(),
];

export function findEmbroideryDesignById(id: string): EmbroideryDesign | undefined {
  return ALL_DESIGNS.find((design) => design.id === id);
}

export function getBackSpotDesigns(placementId: string): EmbroideryDesign[] {
  return BACK_SPOT_DESIGNS[placementId] ?? [];
}
