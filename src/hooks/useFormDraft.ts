"use client";

import { useEffect, useRef } from "react";
import type { RdLocationValues } from "@/components/forms/RdLocationFields";

export interface FormDraft {
  formValues: Record<string, string>;
  multiValues: Record<string, string[]>;
  locationValues: RdLocationValues;
  step: number;
  startedAt: number;
  focusCount: number;
  maxStep: number;
  fileMeta: Record<string, { name: string; size: number }>;
}

const DRAFT_VERSION = 1;

function storageKey(slug: string) {
  return `tl-draft-${slug}`;
}

export function loadFormDraft(slug: string): FormDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FormDraft & { v?: number };
    if (parsed.v !== DRAFT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearFormDraft(slug: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(storageKey(slug));
}

export function useFormDraft(
  slug: string,
  draft: FormDraft,
  onHydrate: (loaded: FormDraft) => void,
  enabled = true,
) {
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    const saved = loadFormDraft(slug);
    if (saved) onHydrate(saved);
  }, [slug, onHydrate]);

  useEffect(() => {
    if (!enabled) return;
    const payload = { ...draft, v: DRAFT_VERSION };
    localStorage.setItem(storageKey(slug), JSON.stringify(payload));
  }, [slug, draft, enabled]);
}
