import type { HeroLocale } from "../preferences/locale";

export const axiomsStatuses = ["method", "testing", "revised"] as const;
export type AxiomsStatus = (typeof axiomsStatuses)[number];

export const axiomsStatusCopy = {
  zh: {
    method: "已成为方法",
    testing: "仍在验证",
    revised: "已被修正",
    unassigned: "状态未指定",
  },
  en: {
    method: "Adopted as a method",
    testing: "Still being tested",
    revised: "Revised",
    unassigned: "Status unassigned",
  },
} as const;

export function axiomStatusLabel(
  status: AxiomsStatus | null | undefined,
  locale: HeroLocale,
): string {
  return status ? axiomsStatusCopy[locale][status] : "";
}
