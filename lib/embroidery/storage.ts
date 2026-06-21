import type { BlazerDraft, EmbroiderySelection, EmbroideryView } from "./types";
import { BLAZER_DRAFT_KEY, createEmbroiderySelectionId } from "./types";
import { getEmbroideryPlacementById } from "./placements";

type LegacyEmbroiderySelection = {
  designId: string;
  src: string;
  placementId?: string;
  id?: string;
  custom?: EmbroiderySelection["custom"];
};

type LegacyBlazerDraftV1 = Omit<BlazerDraft, "version" | "embroidery"> & {
  version: 1;
  embroidery?: {
    front?: LegacyEmbroiderySelection;
    back?: LegacyEmbroiderySelection;
  };
};

type LegacyBlazerDraftV2 = Omit<BlazerDraft, "version" | "embroidery"> & {
  version: 2;
  embroidery?: {
    front?: LegacyEmbroiderySelection;
    back?: LegacyEmbroiderySelection;
  };
};

type RawBlazerDraft = LegacyBlazerDraftV1 | LegacyBlazerDraftV2 | BlazerDraft;

export type LoadBlazerDraftResult = {
  draft: BlazerDraft | null;
  resetPlacementViews: EmbroideryView[];
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

function normalizeSelection(
  view: EmbroideryView,
  maybeSelection: LegacyEmbroiderySelection
): EmbroiderySelection | null {
  const placementId = getPlacementIdIfPresent(maybeSelection);
  if (!placementId || !getEmbroideryPlacementById(view, placementId)) {
    return null;
  }

  return {
    id:
      typeof maybeSelection.id === "string"
        ? maybeSelection.id
        : createEmbroiderySelectionId(),
    designId: maybeSelection.designId,
    src: maybeSelection.src,
    placementId,
    custom: getCustomPlacementIfPresent(maybeSelection),
  };
}

function normalizeViewSelections(
  view: EmbroideryView,
  value: unknown,
  resetPlacementViews: EmbroideryView[]
): EmbroiderySelection[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    const next: EmbroiderySelection[] = [];
    for (const item of value) {
      if (!item || typeof item !== "object") continue;
      const normalized = normalizeSelection(view, item as LegacyEmbroiderySelection);
      if (normalized) {
        next.push(normalized);
      }
    }
    return next;
  }

  const normalized = normalizeSelection(view, value as LegacyEmbroiderySelection);
  if (!normalized) {
    resetPlacementViews.push(view);
    return [];
  }
  return [normalized];
}

function normalizeToV3(rawDraft: RawBlazerDraft): LoadBlazerDraftResult {
  if (!rawDraft.layers?.front || !rawDraft.layers?.back) {
    return { draft: null, resetPlacementViews: [] };
  }

  const resetPlacementViews: EmbroideryView[] = [];
  const embroidery = rawDraft.embroidery ?? {};
  const nextEmbroidery: BlazerDraft["embroidery"] = {};

  for (const view of ["front", "back"] as const) {
    const normalized = normalizeViewSelections(
      view,
      embroidery[view],
      resetPlacementViews
    );
    if (normalized.length > 0) {
      nextEmbroidery[view] = normalized;
    }
  }

  const draft: BlazerDraft = {
    ...rawDraft,
    version: 3,
    embroidery: nextEmbroidery,
  };

  return { draft, resetPlacementViews };
}

export function saveBlazerDraft(draft: BlazerDraft): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BLAZER_DRAFT_KEY, JSON.stringify(draft));
}

export function loadBlazerDraftWithMeta(): LoadBlazerDraftResult {
  if (typeof window === "undefined") {
    return { draft: null, resetPlacementViews: [] };
  }
  try {
    const raw = window.localStorage.getItem(BLAZER_DRAFT_KEY);
    if (!raw) return { draft: null, resetPlacementViews: [] };
    const parsed = JSON.parse(raw) as RawBlazerDraft;

    if (parsed?.version !== 1 && parsed?.version !== 2 && parsed?.version !== 3) {
      return { draft: null, resetPlacementViews: [] };
    }

    const normalized = normalizeToV3(parsed);
    if (!normalized.draft) return normalized;

    const shouldRewrite =
      parsed.version !== 3 || normalized.resetPlacementViews.length > 0;
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

export function upsertEmbroideryAtPlacement(
  view: EmbroideryView,
  selection: Omit<EmbroiderySelection, "id"> & { id?: string }
): BlazerDraft | null {
  const draft = loadBlazerDraft();
  if (!draft) return null;

  const current = [...(draft.embroidery?.[view] ?? [])];
  const index = current.findIndex(
    (item) => item.placementId === selection.placementId
  );
  const nextSelection: EmbroiderySelection = {
    ...selection,
    id: selection.id ?? current[index]?.id ?? createEmbroiderySelectionId(),
  };

  if (index >= 0) {
    current[index] = nextSelection;
  } else {
    current.push(nextSelection);
  }

  const embroidery = { ...(draft.embroidery ?? {}), [view]: current };
  const updated: BlazerDraft = { ...draft, savedAt: Date.now(), embroidery };
  saveBlazerDraft(updated);
  return updated;
}

export function removeEmbroideryAtPlacement(
  view: EmbroideryView,
  placementId: string
): BlazerDraft | null {
  const draft = loadBlazerDraft();
  if (!draft) return null;

  const current = (draft.embroidery?.[view] ?? []).filter(
    (item) => item.placementId !== placementId
  );

  const embroidery = { ...(draft.embroidery ?? {}) };
  if (current.length > 0) {
    embroidery[view] = current;
  } else {
    delete embroidery[view];
  }

  const updated: BlazerDraft = { ...draft, savedAt: Date.now(), embroidery };
  saveBlazerDraft(updated);
  return updated;
}

export function clearEmbroideryView(view: EmbroideryView): BlazerDraft | null {
  const draft = loadBlazerDraft();
  if (!draft) return null;

  const embroidery = { ...(draft.embroidery ?? {}) };
  delete embroidery[view];

  const updated: BlazerDraft = { ...draft, savedAt: Date.now(), embroidery };
  saveBlazerDraft(updated);
  return updated;
}

export function updateEmbroideryCustom(
  view: EmbroideryView,
  placementId: string,
  custom: EmbroiderySelection["custom"]
): BlazerDraft | null {
  const draft = loadBlazerDraft();
  if (!draft) return null;

  const current = draft.embroidery?.[view];
  if (!current?.length) return null;

  const index = current.findIndex((item) => item.placementId === placementId);
  if (index < 0) return null;

  const next = [...current];
  next[index] = { ...next[index], custom };

  const embroidery = { ...(draft.embroidery ?? {}), [view]: next };
  const updated: BlazerDraft = { ...draft, savedAt: Date.now(), embroidery };
  saveBlazerDraft(updated);
  return updated;
}
