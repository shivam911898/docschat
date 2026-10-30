import { NextResponse } from "next/server";
import { ready } from "../../../lib/boot";
import { aiEnabled, llmModel, provider } from "../../../lib/llm";

export const dynamic = "force-dynamic";

// Public, no secrets: lets you confirm a deploy is up, seeded and which storage/provider/model it runs on.
export async function GET() {
  try {
    const s = await ready();
    const [{ docs }] = await s.all<{ docs: number }>("SELECT COUNT(*) AS docs FROM documents");
    return NextResponse.json({ ok: true, docs, storage: s.kind, mode: aiEnabled() ? "ai" : "demo-extractive", provider: provider(), model: llmModel(), adminConfigured: !!process.env.ADMIN_PASSWORD });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
