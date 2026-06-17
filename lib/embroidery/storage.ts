import type { BlazerDraft, EmbroiderySelection } from "./types";
import { BLAZER_DRAFT_KEY } from "./types";

export function saveBlazerDraft(draft: BlazerDraft): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BLAZER_DRAFT_KEY, JSON.stringify(draft));
}

export function loadBlazerDraft(): BlazerDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(BLAZER_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BlazerDraft;
    if (parsed?.version !== 1 || !parsed.layers?.front || !parsed.layers?.back) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveEmbroiderySelection(
  view: "front" | "back",
  selection: EmbroiderySelection | undefined
): BlazerDraft | null {
  const draft = loadBlazerDraft();
  if (!draft) return null;

  const embroidery = { ...(draft.embroidery ?? {}) };
  if (selection) {
    embroidery[view] = selection;
  } else {
    delete embroidery[view];
  }

  const updated: BlazerDraft = { ...draft, embroidery };
  saveBlazerDraft(updated);
  return updated;
}
