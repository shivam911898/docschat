// Single entry point for server code: opens the DB and, on first start, seeds the sample docs
// so even an ephemeral deploy has something to demo.
import { store, type Store } from "./db";
import { ingest } from "./rag";
import { SAMPLE_DOCS } from "./sample-docs.generated";

export async function seedSamples(): Promise<number> {
  let n = 0;
  for (const d of SAMPLE_DOCS) n += await ingest(d.name, d.text);
  return n;
}

const g = globalThis as unknown as { _ready?: Promise<Store> };
export function ready(): Promise<Store> {
  if (!g._ready) {
    g._ready = (async () => {
      const s = await store();
      const [{ n }] = await s.all<{ n: number }>("SELECT COUNT(*) AS n FROM documents");
      if (n === 0 && process.env.AUTO_SEED !== "0") {
        const chunks = await seedSamples();
        console.log(`[docschat] empty database - seeded ${SAMPLE_DOCS.length} sample docs (${chunks} chunks)`);
      }
      return s;
    })().catch((e) => { g._ready = undefined; throw e; });
  }
  return g._ready;
}
