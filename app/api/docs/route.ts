import { NextResponse } from "next/server";
import { ready } from "../../../lib/boot";
import { ingest } from "../../../lib/rag";
import { extractText } from "../../../lib/extract";
import { isAdmin } from "../../../lib/auth";
import { ALLOWED_UPLOAD, MAX_FILES_PER_UPLOAD, MAX_UPLOAD_BYTES } from "../../../lib/config";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function POST(req: Request) {
  if (!(await isAdmin())) return unauthorized();
  // Reject oversized bodies before buffering them.
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_UPLOAD_BYTES * MAX_FILES_PER_UPLOAD + 100_000) {
    return NextResponse.json({ error: `Upload too large (max ${MAX_UPLOAD_BYTES / 1024 / 1024} MB per file)` }, { status: 413 });
  }
  await ready();
  const files = (await req.formData()).getAll("files").filter((f): f is File => typeof f !== "string");
  if (!files.length) return NextResponse.json({ error: "No files" }, { status: 400 });
  if (files.length > MAX_FILES_PER_UPLOAD) return NextResponse.json({ error: `Max ${MAX_FILES_PER_UPLOAD} files per upload` }, { status: 400 });

  const results: { name: string; chunks?: number; error?: string }[] = [];
  for (const f of files) {
    const name = f.name.replace(/^.*[\\/]/, "").slice(0, 100);
    if (!ALLOWED_UPLOAD.test(name)) { results.push({ name, error: "Unsupported type - only PDF, TXT and MD are allowed" }); continue; }
    if (f.size > MAX_UPLOAD_BYTES) { results.push({ name, error: `Too large - max ${MAX_UPLOAD_BYTES / 1024 / 1024} MB` }); continue; }
    try {
      const text = (await extractText(name, Buffer.from(await f.arrayBuffer()))).trim();
      if (!text) { results.push({ name, error: "No extractable text (scanned PDF?)" }); continue; }
      results.push({ name, chunks: await ingest(name, text) });
    } catch (e) {
      results.push({ name, error: "Could not read file: " + (e as Error).message.slice(0, 120) });
    }
  }
  return NextResponse.json({ results });
}

export async function DELETE(req: Request) {
  if (!(await isAdmin())) return unauthorized();
  const name = new URL(req.url).searchParams.get("name") ?? "";
  const s = await ready();
  await s.batch([["DELETE FROM chunks WHERE doc_name=?", [name]], ["DELETE FROM documents WHERE name=?", [name]]]);
  return NextResponse.json({ ok: true });
}
