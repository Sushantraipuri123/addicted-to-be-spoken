export type BlazerLayer = {
  src: string;
  zIndex: number;
  className?: string;
};

export type EmbroideryView = "front" | "back";

export type EmbroiderySelection = {
  designId: string;
  src: string;
  placementId: string;
  custom?: {
    left: string;
    top: string;
    width: string;
  };
};

export type BlazerDraft = {
  version: 2;
  savedAt: number;
  current: Record<string, unknown>;
  layers: {
    front: BlazerLayer[];
    back: BlazerLayer[];
  };
  embroidery?: {
    front?: EmbroiderySelection;
    back?: EmbroiderySelection;
  };
};

export const BLAZER_DRAFT_KEY = "atbs_blazer_draft";
