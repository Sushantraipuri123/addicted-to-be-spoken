export type BlazerLayer = {
  src: string;
  zIndex: number;
  className?: string;
};

export type EmbroideryView = "front" | "back";

export type EmbroiderySelection = {
  id: string;
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
  version: 3;
  savedAt: number;
  current: Record<string, unknown>;
  layers: {
    front: BlazerLayer[];
    back: BlazerLayer[];
  };
  embroidery?: {
    front?: EmbroiderySelection[];
    back?: EmbroiderySelection[];
  };
};

export const BLAZER_DRAFT_KEY = "atbs_blazer_draft";

export function createEmbroiderySelectionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `emb-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
