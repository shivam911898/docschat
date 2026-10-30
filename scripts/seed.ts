// npm run seed - (re)load the sample docs into the configured database.
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

async function main() {
  const { seedSamples } = await import("../lib/boot");
  const { SAMPLE_DOCS } = await import("../lib/sample-docs.generated");
  const { provider } = await import("../lib/llm");
  const n = await seedSamples();
  const p = provider();
  console.log(`Seeded ${SAMPLE_DOCS.length} docs (${n} chunks).`, p === "gemini" ? "Embeddings: Gemini" : `Provider: ${p}. Keyword (BM25) retrieval, no embeddings`);
}
main().catch((e) => { console.error(e); process.exit(1); });
