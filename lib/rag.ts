import { store } from "./db";
import { ai, provider } from "./llm";

const EMBED_MODEL = "gemini-embedding-001";

/* ---------- chunking: heading-aware, so each FAQ answer / policy section stays together ---------- */
function packSentences(para: string, size: number): string[] {
  if (para.length <= size) return [para];
  const parts = para.includes("\n") ? para.split("\n") : para.split(/(?<=[.!?])\s+/);
  const out: string[] = [];
  let cur = "";
  for (const p of parts) {
    if (cur && cur.length + p.length + 1 > size) { out.push(cur); cur = ""; }
    cur += (cur ? (para.includes("\n") ? "\n" : " ") : "") + p;
  }
  if (cur) out.push(cur);
  return out.flatMap((o) => (o.length > size * 2 ? o.match(new RegExp(`[\\s\\S]{1,${size}}`, "g")) ?? [o] : [o]));
}

export function chunkText(raw: string, size = 900): string[] {
  const lines = raw.replace(/\r/g, "").replace(/^﻿/, "").split("\n");
  const sections: { heading: string; lines: string[] }[] = [{ heading: "", lines: [] }];
  for (const line of lines) {
    if (/^#{1,6}\s/.test(line)) sections.push({ heading: line.trim(), lines: [] });
    else sections[sections.length - 1].lines.push(line);
  }
  const out: string[] = [];
  for (const s of sections) {
    const paras = s.lines.join("\n").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).flatMap((p) => packSentences(p, size));
    let cur = "";
    const flush = () => { if (cur) out.push(s.heading ? `${s.heading}\n${cur}` : cur); cur = ""; };
    for (const p of paras) {
      if (cur && cur.length + p.length > size) flush();
      cur += (cur ? "\n\n" : "") + p;
    }
    flush();
  }
  return out;
}

/* ---------- embeddings (Gemini only: Groq has no embeddings endpoint, so it uses BM25 below) ---------- */
async function embed(texts: string[]): Promise<number[][] | null> {
  if (provider() !== "gemini") return null;
  try {
    const res = await ai(30000).models.embedContent({ model: EMBED_MODEL, contents: texts });
    return res.embeddings!.map((e) => e.values!);
  } catch (e) { console.warn("embedding failed, using TF-IDF fallback:", (e as Error).message); return null; }
}

export async function ingest(name: string, text: string) {
  const s = await store();
  const chunks = chunkText(text);
  const vecs: (number[] | null)[] = [];
  for (let i = 0; i < chunks.length; i += 50) {
    const v = await embed(chunks.slice(i, i + 50));
    chunks.slice(i, i + 50).forEach((_, j) => vecs.push(v ? v[j] : null));
  }
  await s.batch([["DELETE FROM chunks WHERE doc_name=?", [name]], ["DELETE FROM documents WHERE name=?", [name]]]);
  const { lastId } = await s.run("INSERT INTO documents(name) VALUES(?)", [name]);
  if (chunks.length) {
    await s.batch(chunks.map((c, i) => ["INSERT INTO chunks(doc_id,doc_name,text,embedding) VALUES(?,?,?,?)", [lastId, name, c, vecs[i] ? JSON.stringify(vecs[i]) : null]] as [string, unknown[]]));
  }
  return chunks.length;
}

/* ---------- retrieval ---------- */
const STOP = new Set(("a about all also am an and any are as at be been but by can could did do does for from get got had has have how i if in into is it its just like me my of on or our please so than that the their them then there these they this to us was we were what when where which who why will with would you your tell know need want much many sell offer long take").split(" "));
// Tiny synonym groups so "cost" finds "price", "delivery" finds "shipping", etc. (applied to docs and queries alike).
const SYN: Record<string, string> = {
  cost: "price", fee: "price", charge: "price", rate: "price", cheap: "price", expensive: "price",
  deliver: "ship", delivery: "ship", arrive: "ship", send: "ship",
  refund: "return", exchange: "return", reimburse: "return",
  phone: "contact", call: "contact", email: "contact", reach: "contact",
  guarantee: "warranty", sale: "discount", coupon: "discount", off: "discount",
};
const stem = (w: string) => {
  if (w.length > 4 && w.endsWith("ies")) w = w.slice(0, -3) + "y";
  else if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) w = w.slice(0, -1);
  if (w.length > 5) w = w.replace(/(ing|ed)$/, "");
  if (w.length > 3 && w.endsWith("e")) w = w.slice(0, -1);
  if (w.length > 3 && /(.)\1$/.test(w) && !w.endsWith("ss")) w = w.slice(0, -1);
  return w;
};
const SYN_STEMMED = new Map(Object.entries(SYN).map(([k, v]) => [stem(k), stem(v)]));
const tokens = (s: string) =>
  (s.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((w) => !STOP.has(w)).map((w) => { const t = stem(w); return SYN_STEMMED.get(t) ?? t; });
const cosine = (a: number[], b: number[]) => {
  let d = 0, x = 0, y = 0;
  for (let i = 0; i < a.length; i++) { d += a[i] * b[i]; x += a[i] ** 2; y += b[i] ** 2; }
  return d / (Math.sqrt(x * y) || 1);
};

export type Hit = { doc_name: string; text: string; score: number; coverage?: number };
type ChunkRow = { id: number; doc_name: string; text: string; embedding: string | null };

// Embed chunks that were indexed before a Gemini key existed (e.g. demo seeded keyless, key added later).
let backfilling: Promise<boolean> | null = null;
async function backfill(rows: ChunkRow[]): Promise<boolean> {
  const missing = rows.filter((r) => !r.embedding);
  const s = await store();
  for (let i = 0; i < missing.length; i += 50) {
    const batch = missing.slice(i, i + 50);
    const v = await embed(batch.map((r) => r.text));
    if (!v) return false;
    await s.batch(batch.map((r, j) => ["UPDATE chunks SET embedding=? WHERE id=?", [JSON.stringify(v[j]), r.id]] as [string, unknown[]]));
    batch.forEach((r, j) => (r.embedding = JSON.stringify(v[j])));
  }
  return true;
}

export async function search(query: string, k = 4): Promise<Hit[]> {
  const s = await store();
  const rows = await s.all<ChunkRow>("SELECT id,doc_name,text,embedding FROM chunks");
  if (!rows.length) return [];

  if (provider() === "gemini") {
    if (rows.some((r) => !r.embedding)) {
      backfilling ??= backfill(rows).finally(() => { backfilling = null; });
      await backfilling;
    }
    const fresh = rows.every((r) => r.embedding) ? rows : await s.all<ChunkRow>("SELECT id,doc_name,text,embedding FROM chunks");
    const qv = fresh.every((r) => r.embedding) ? await embed([query]) : null;
    if (qv) {
      return fresh
        .map((r) => ({ doc_name: r.doc_name, text: r.text, score: cosine(qv[0], JSON.parse(r.embedding!)) }))
        .sort((a, b) => b.score - a.score).slice(0, k).filter((h) => h.score > 0);
    }
  }

  // Local BM25 (Groq, no key, or the Gemini embedding call failed). Heading words count double.
  const docs = rows.map((r) => {
    const t = tokens(r.text);
    const first = r.text.split("\n")[0];
    return /^#{1,6}\s/.test(first) ? t.concat(tokens(first)) : t;
  });
  const df = new Map<string, number>();
  docs.forEach((t) => new Set(t).forEach((w) => df.set(w, (df.get(w) ?? 0) + 1)));
  const q = [...new Set(tokens(query))];
  if (!q.length) return [];
  const N = rows.length;
  const avgLen = docs.reduce((a, t) => a + t.length, 0) / N || 1;
  const idf = (w: string) => Math.log(1 + (N - (df.get(w) ?? 0) + 0.5) / ((df.get(w) ?? 0) + 0.5));
  const totalW = q.reduce((a, w) => a + idf(w), 0);
  const K1 = 1.2, B = 0.5;
  const scored: Hit[] = rows.map((r, i) => {
    const tf = new Map<string, number>();
    docs[i].forEach((w) => tf.set(w, (tf.get(w) ?? 0) + 1));
    let sc = 0, matched = 0;
    for (const w of q) {
      const f = tf.get(w);
      if (!f) continue;
      sc += idf(w) * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * docs[i].length) / avgLen)));
      matched += idf(w);
    }
    // coverage = share of the question's (idf-weighted) terms found in this chunk; unknown words count against it
    return { doc_name: r.doc_name, text: r.text, score: sc, coverage: matched / totalW };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, k).filter((h) => h.score > 0);
}

/* ---------- extractive answer (demo mode, or when the model is unavailable) ---------- */
const MIN_COVERAGE = 0.5; // at least about half of the question's meaningful words must appear in the chunk

export function cleanMarkdown(text: string): string {
  const out: string[] = [];
  let inTable = false;
  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();
    if (/^\s*\|[\s:|-]+\|?\s*$/.test(line)) continue; // table separator row
    if (line.trim().startsWith("|")) {
      const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
      out.push((inTable ? "• " : "") + cells.join(" — "));
      inTable = true;
      continue;
    }
    inTable = false;
    out.push(line.replace(/^#{1,6}\s*/, "").replace(/\*\*(.+?)\*\*/g, "$1").replace(/^\s*[-*]\s+/, "• "));
  }
  return out.join("\n").trim();
}

function trimTo(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const at = Math.max(cut.lastIndexOf("\n"), cut.lastIndexOf(". "), cut.lastIndexOf("; "));
  return (at > max * 0.5 ? cut.slice(0, at + 1) : cut).trimEnd() + " …";
}

/** Returns the best-matching text, or null when nothing in the docs is relevant enough. */
export function extractiveAnswer(hits: Hit[]): { reply: string; sources: string[] } | null {
  const top = hits[0];
  if (!top || (top.coverage !== undefined && top.coverage < MIN_COVERAGE)) return null;
  const parts = [trimTo(cleanMarkdown(top.text), 900)];
  const sources = [top.doc_name];
  // A second chunk is added only when it is almost as relevant and the first answer is short.
  const second = hits[1];
  if (second && parts[0].length < 450 && second.score >= top.score * 0.92 && (second.coverage === undefined || second.coverage >= MIN_COVERAGE)) {
    parts.push(trimTo(cleanMarkdown(second.text), 1000 - parts[0].length));
    sources.push(second.doc_name);
  }
  return { reply: parts.join("\n\n"), sources: [...new Set(sources)] };
}
