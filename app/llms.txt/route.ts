import { renderLlmsIndex } from "../../src/agent/markdown";
import { readJournalSnapshot } from "../../src/journal/server";

export const dynamic = "force-static";

export async function GET() {
  return new Response(renderLlmsIndex(await readJournalSnapshot()), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
