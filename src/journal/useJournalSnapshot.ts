import { useCallback, useEffect, useState } from "react";
import type { JournalManifest, JournalSnapshot } from "./model";
import { loadJournalSnapshot } from "./load";

type JournalRequestResult = { readonly requestId: string } & (
  { readonly snapshot: JournalSnapshot } | { readonly error: string }
);

const emptyEntries = [] as const;

export function useJournalSnapshot(
  manifest: JournalManifest | undefined,
  enabled: boolean,
) {
  const { url, sha256, entryCount, latestDate, sourceRevision } =
    manifest ?? {};
  const available = manifest !== undefined;
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<JournalRequestResult>();
  const requestId = JSON.stringify({
    url,
    sha256,
    entryCount,
    latestDate,
    sourceRevision,
    attempt,
  });

  useEffect(() => {
    if (!available || !enabled || result?.requestId === requestId) return;
    const controller = new AbortController();
    void loadJournalSnapshot(
      { url, sha256, entryCount, latestDate, sourceRevision },
      controller.signal,
    )
      .then((snapshot) => {
        if (!controller.signal.aborted) setResult({ requestId, snapshot });
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setResult({
            requestId,
            error:
              cause instanceof Error ? cause.message : "Journal request failed",
          });
        }
      });
    return () => controller.abort();
  }, [
    available,
    enabled,
    url,
    sha256,
    entryCount,
    latestDate,
    sourceRevision,
    requestId,
    result,
  ]);

  // A changed publication never exposes the previous publication's rows or error.
  const current =
    available && result?.requestId === requestId ? result : undefined;
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  return {
    entries:
      current && "snapshot" in current
        ? current.snapshot.entries
        : emptyEntries,
    error: current && "error" in current ? current.error : undefined,
    retry,
    available,
  };
}
