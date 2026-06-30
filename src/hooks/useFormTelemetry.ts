"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormTelemetry } from "@/lib/scoring";

export function useFormTelemetry(totalFields: number) {
  const startedAt = useRef(Date.now());
  const focusCount = useRef(0);
  const [stepCount, setStepCount] = useState(1);

  const onFieldFocus = useCallback(() => {
    focusCount.current += 1;
  }, []);

  const onStepChange = useCallback((step: number) => {
    setStepCount((s) => Math.max(s, step + 1));
  }, []);

  const buildTelemetry = useCallback(
    (fieldsFilled: number): FormTelemetry => ({
      startedAt: startedAt.current,
      submittedAt: Date.now(),
      durationMs: Date.now() - startedAt.current,
      fieldFocusCount: focusCount.current,
      stepCount,
      fieldsFilled,
      fieldsTotal: totalFields,
    }),
    [stepCount, totalFields]
  );

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  return { onFieldFocus, onStepChange, buildTelemetry };
}

export type FormColorMode = "light" | "dark";

export function useFormTheme(defaultMode: FormColorMode | "system" = "system") {
  const [mode, setMode] = useState<FormColorMode>("dark");

  useEffect(() => {
    const stored = localStorage.getItem("tl-form-theme") as FormColorMode | null;
    if (stored === "light" || stored === "dark") {
      setMode(stored);
      return;
    }
    if (defaultMode === "light" || defaultMode === "dark") {
      setMode(defaultMode);
      return;
    }
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setMode(prefersDark ? "dark" : "light");
  }, [defaultMode]);

  const toggle = useCallback(() => {
    setMode((m) => {
      const next = m === "dark" ? "light" : "dark";
      localStorage.setItem("tl-form-theme", next);
      return next;
    });
  }, []);

  return { mode, toggle, setMode };
}
