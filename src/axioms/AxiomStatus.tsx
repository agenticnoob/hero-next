import type { HeroLocale } from "../preferences/locale";
import {
  axiomStatusLabel,
  axiomsStatusCopy,
  axiomsStatuses,
  type AxiomsStatus,
} from "./status";

export function AxiomStatus({
  status,
  locale,
}: {
  readonly status?: AxiomsStatus | null;
  readonly locale: HeroLocale;
}) {
  const label = axiomStatusLabel(status, locale);
  const copy = axiomsStatusCopy[locale];
  return (
    <span
      className="hero-axiom-status"
      data-axiom-status={status ?? "unassigned"}
      aria-label={label || copy.unassigned}
      title={axiomsStatuses.map((value) => copy[value]).join(" / ")}
    >
      {label || "—"}
    </span>
  );
}
