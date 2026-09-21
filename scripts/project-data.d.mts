export interface ProjectContent {
  title: string;
  summary: string;
  sections: { id: string; title: string; paragraphs: string[] }[];
}
export interface GeneratedProject {
  id: number;
  slug: string;
  repository: string;
  url: string;
  readmeSha: string;
  sourceCommit: string;
  sourceDigest: string;
  updatedAt: string;
  topics: string[];
  language: string | null;
  content: { zh: ProjectContent; en: ProjectContent };
}
export interface ProjectSnapshot {
  version: 1;
  projects: GeneratedProject[];
}
export function validateProjectSnapshot(value: unknown): ProjectSnapshot;
export function validateContent(value: unknown): GeneratedProject["content"];
export function object(
  value: unknown,
  keys: string[],
  label: string,
): Record<string, unknown>;
export function text(value: unknown, limit: number, label: string): string;
