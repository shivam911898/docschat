import type { Metadata } from "next";
import ChatClient from "./ChatClient";
import { aiEnabled } from "../../lib/llm";
import { businessName, DEMO_BANNER } from "../../lib/config";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Chat - DocsChat demo" };

export default function ChatPage() {
  return <ChatClient demo={!aiEnabled()} business={businessName()} banner={DEMO_BANNER} />;
}
