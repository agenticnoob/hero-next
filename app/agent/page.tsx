import { AgentDirectory } from "../../src/agent/AgentDirectory";
import { getAgentMetadata } from "../../src/agent/content";
import { readJournalSnapshot } from "../../src/journal/server";

export const metadata = getAgentMetadata("zh");

export default async function Page() {
  return <AgentDirectory locale="zh" snapshot={await readJournalSnapshot()} />;
}
