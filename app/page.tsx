import { HeroExperience } from "../src/experience/HeroExperience";
import { readJournalManifest } from "../src/journal/server";

export default async function Page() {
  return <HeroExperience journal={await readJournalManifest()} />;
}
