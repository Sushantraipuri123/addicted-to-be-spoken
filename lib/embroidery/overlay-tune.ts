/**
 * Per-design calibration for bottom-back overlays.
 * Styles are applied via CSS using [data-design-id] selectors in embroidery.css.
 */
export type BottomOverlayTune = {
  zIndex: number;
  left: string;
  bottom: string;
  width: string;
};

export const BOTTOM_OVERLAY_TUNING: Record<string, BottomOverlayTune> = {
  "back-bottom-1": {
    zIndex: 192,
    left: "53%",
    bottom: "2%",
    width: "55%",
  },
  "back-bottom-2": {
    zIndex: 192,
    left: "52%",
    bottom: "0%",
    width: "54%",
  },
};

export function getBottomOverlayTune(designId: string): BottomOverlayTune | undefined {
  return BOTTOM_OVERLAY_TUNING[designId];
}
