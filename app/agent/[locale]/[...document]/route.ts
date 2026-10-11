import { readAgentLocale } from "../../../../src/agent/content";
import {
  getAgentDocumentParams,
  renderAgentDocument,
} from "../../../../src/agent/markdown";
import { readJournalSnapshot } from "../../../../src/journal/server";

export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams() {
  return getAgentDocumentParams(await readJournalSnapshot());
}

export async function GET(
  _request: Request,
  {
    params,
  }: { readonly params: Promise<{ locale: string; document: string[] }> },
) {
  const { locale: requestedLocale, document } = await params;
  const locale = readAgentLocale(requestedLocale);
  const body = locale
    ? renderAgentDocument(locale, document, await readJournalSnapshot())
    : undefined;
  if (body === undefined || locale === undefined)
    return new Response("Not found\n", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      Link: '</llms.txt>; rel="describedby"',
    },
  });
}
