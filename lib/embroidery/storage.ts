import type { BlazerDraft, EmbroiderySelection } from "./types";
import { BLAZER_DRAFT_KEY } from "./types";
import { getEmbroideryPlacementById } from "./placements";

type LegacyEmbroiderySelection = {
  designId: string;
  src: string;
};

type LegacyBlazerDraft = Omit<BlazerDraft, "version" | "embroidery"> & {
  version: 1;
  embroidery?: {
    front?: LegacyEmbroiderySelection;
    back?: LegacyEmbroiderySelection;
  };
};

export type LoadBlazerDraftResult = {
  draft: BlazerDraft | null;
  resetPlacementViews: Array<"front" | "back">;
};

function getPlacementIdIfPresent(selection: unknown): string | undefined {
  if (!selection || typeof selection !== "object") return undefined;
  const value = (selection as { placementId?: unknown }).placementId;
  return typeof value === "string" ? value : undefined;
}

function getCustomPlacementIfPresent(
  selection: unknown
): EmbroiderySelection["custom"] | undefined {
  if (!selection || typeof selection !== "object") return undefined;
  const custom = (selection as { custom?: unknown }).custom;
  if (!custom || typeof custom !== "object") return undefined;
  const left = (custom as { left?: unknown }).left;
  const top = (custom as { top?: unknown }).top;
  const width = (custom as { width?: unknown }).width;
  if (
    typeof left === "string" &&
    typeof top === "string" &&
    typeof width === "string"
  ) {
    return { left, top, width };
  }
  return undefined;
}

export function saveBlazerDraft(draft: BlazerDraft): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BLAZER_DRAFT_KEY, JSON.stringify(draft));
}

function normalizeToV2(
  rawDraft: BlazerDraft | LegacyBlazerDraft
): LoadBlazerDraftResult {
  if (!rawDraft.layers?.front || !rawDraft.layers?.back) {
    return { draft: null, resetPlacementViews: [] };
  }

  const resetPlacementViews: Array<"front" | "back"> = [];
  const nextEmbroidery: BlazerDraft["embroidery"] = {};
  const embroidery = rawDraft.embroidery ?? {};

  for (const view of ["front", "back"] as const) {
    const maybeSelection = embroidery[view];
    if (!maybeSelection) continue;

    const placementId = getPlacementIdIfPresent(maybeSelection);
    if (!placementId || !getEmbroideryPlacementById(view, placementId)) {
      resetPlacementViews.push(view);
      continue;
    }

    nextEmbroidery[view] = {
      designId: maybeSelection.designId,
      src: maybeSelection.src,
      placementId,
      custom: getCustomPlacementIfPresent(maybeSelection),
    };
  }

  const draft: BlazerDraft = {
    ...rawDraft,
    version: 2,
    embroidery: nextEmbroidery,
  };
  return { draft, resetPlacementViews };
}

export function loadBlazerDraftWithMeta(): LoadBlazerDraftResult {
  if (typeof window === "undefined") {
    return { draft: null, resetPlacementViews: [] };
  }
  try {
    const raw = window.localStorage.getItem(BLAZER_DRAFT_KEY);
    if (!raw) return { draft: null, resetPlacementViews: [] };
    const parsed = JSON.parse(raw) as BlazerDraft | LegacyBlazerDraft;

    if (parsed?.version !== 1 && parsed?.version !== 2) {
      return { draft: null, resetPlacementViews: [] };
    }

    const normalized = normalizeToV2(parsed);
    if (!normalized.draft) return normalized;

    // Keep storage self-healing when migrating from v1 or stale placement ids.
    const shouldRewrite =
      parsed.version !== 2 || normalized.resetPlacementViews.length > 0;
    if (shouldRewrite) {
      saveBlazerDraft(normalized.draft);
    }

    return normalized;
  } catch {
    return { draft: null, resetPlacementViews: [] };
  }
}

export function loadBlazerDraft(): BlazerDraft | null {
  return loadBlazerDraftWithMeta().draft;
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

  const updated: BlazerDraft = { ...draft, savedAt: Date.now(), embroidery };
  saveBlazerDraft(updated);
  return updated;
}
