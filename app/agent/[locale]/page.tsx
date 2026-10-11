import { notFound } from "next/navigation";
import { AgentDirectory } from "../../../src/agent/AgentDirectory";
import { getAgentMetadata, readAgentLocale } from "../../../src/agent/content";
import { readJournalSnapshot } from "../../../src/journal/server";
import { heroLocales } from "../../../src/preferences/locale";

type AgentPageProps = { readonly params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return heroLocales.map((locale) => ({ locale }));
}

// Explicit notFound avoids Next 16.2.10's dynamicParams=false error logging (#90537).
async function readLocale(params: AgentPageProps["params"]) {
  const locale = readAgentLocale((await params).locale);
  if (!locale) notFound();
  return locale;
}

export async function generateMetadata({ params }: AgentPageProps) {
  return getAgentMetadata(await readLocale(params));
}

export default async function Page({ params }: AgentPageProps) {
  const locale = await readLocale(params);
  return (
    <AgentDirectory locale={locale} snapshot={await readJournalSnapshot()} />
  );
}
