export type JournalEntry = {
  readonly date: string;
  readonly tools: readonly string[];
  readonly event: string;
};

export type JournalSnapshot = {
  readonly schemaVersion: 2;
  readonly sourceRevision: string | null;
  readonly entries: readonly JournalEntry[];
};

export type JournalManifest = {
  readonly url: string;
  readonly sha256: string;
  readonly entryCount: number;
  readonly latestDate: string;
  readonly sourceRevision: string | null;
};
