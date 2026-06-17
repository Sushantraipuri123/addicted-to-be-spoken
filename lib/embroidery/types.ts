export type BlazerLayer = {
  src: string;
  zIndex: number;
  className?: string;
};

export type EmbroiderySelection = {
  designId: string;
  src: string;
};

export type BlazerDraft = {
  version: 1;
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
