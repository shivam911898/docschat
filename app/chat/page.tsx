import type { Metadata } from "next";
import ChatClient from "./ChatClient";
import { aiEnabled } from "../../lib/llm";
import { businessName, DEMO_BANNER } from "../../lib/config";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Chat demo" };

// Runs before first paint: inside the widget iframe the page drops its outer padding and card chrome,
// so the embedded chat never jumps after hydration.
const EMBED_FLAG = "try{if(window.self!==window.top)document.documentElement.classList.add('embedded')}catch(e){document.documentElement.classList.add('embedded')}";

export default function ChatPage() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: EMBED_FLAG }} />
      <ChatClient demo={!aiEnabled()} business={businessName()} banner={DEMO_BANNER} />
    </>
  );
}
