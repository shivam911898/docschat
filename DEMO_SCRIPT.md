# Loom demo script (60-90 seconds)

Goal: a buyer watches this and thinks "that is exactly what my website needs". Keep it tight, no setup talk, no mistakes shown.

## Before you hit record

- Record the **live deployed URL**, not localhost. Ideally with an AI key (`GROQ_API_KEY` or `GEMINI_API_KEY`) set so answers are conversational; the script works in demo mode too.
- Use a clean browser window (1280x800), zoom 110%, bookmarks bar hidden, notifications off.
- Open tab 1: the landing page `/`. Open tab 2: `/admin`, already logged in.
- Check the lead table in `/admin` is empty or tidy (delete test leads by redeploying with a fresh Turso database if needed).
- Have one small PDF ready on the desktop (a one-page price list or menu) for the optional upload beat.
- Do a dry run first, because the chat rate limit allows 20 messages a minute (this script uses about 10).

## Script

| Time | What you do (exact clicks) | What you say |
|---|---|---|
| 0:00-0:10 | Tab 1, landing page. Slowly scroll so the headline and the three bullets are visible. | "Hi, this is DocsChat, an AI chatbot trained on *your own* documents. Here it is loaded with a sample store's price list and policies. It answers customer questions 24/7, never makes things up, and captures leads. Let me show you." |
| 0:10-0:12 | Click **Try the demo**. | |
| 0:12-0:25 | Click the suggested question **How much is the Business plan?** (or type it). Pause 2 seconds on the answer, point at the **Source: pricing.md** line. | "Question one, pricing. It answers straight from the uploaded price list, and shows which document the answer came from." |
| 0:25-0:35 | Type: **What is your return policy?** and send. | "Question two, policy. Thirty days, free return label for defects, all from their returns document." |
| 0:35-0:47 | Type: **Do you sell kayaks?** and send. Pause on the answer. | "Question three is the important one. Kayaks are not in the documents, so instead of inventing an answer it says it can't find it and offers a human follow-up. That is what protects your brand." |
| 0:47-1:10 | Type: **I'd like a quote for 200 water bottles**. Then, one message at a time: **Jane Cooper**, **jane@acme-outfitters.com**, **Acme Outfitters**, **200 bottles, delivery by March**, then **yes**. Pause on the green confirmation bubble. | "Question four: a buyer asks for a quote. The bot collects name, email, company and details, reads them back, asks to confirm, and saves the lead." |
| 1:10-1:20 | Switch to tab 2 (`/admin`) and refresh. Point at **Leads (1)** with Jane's row. | "The lead lands in the dashboard instantly, and can also be appended to a Google Sheet." |
| 1:20-1:30 | Scroll to **Embed on your website**; point at the one-line snippet. | "And it goes on your website with a single line of code. Documents, branding and hosting setup are all included when I build yours. Message me and let's get started." |

## Optional 10-second beat (if you are under 80 seconds)

In `/admin` under **Knowledge base**, click **Choose Files**, pick the small PDF, click **Upload & index**. Say: "Updating the bot is just uploading a new file." Then ask one question about that PDF in the chat.

## The 4 questions (cheat sheet)

1. How much is the Business plan?
2. What is your return policy?
3. Do you sell kayaks? (shows it refuses to guess)
4. I'd like a quote for 200 water bottles (starts lead capture)

## Recording tips

- Narrate at a relaxed pace; about 150 words in total fits in 80 seconds.
- Say once, in the first line, that the documents are from a sample store (Northwind Supply Co.), so nobody mistakes the demo for a real client project.
- End on the embed snippet or your call to action, then stop the recording. No outro.
- Set the Loom thumbnail to the chat window with the green "lead saved" bubble.
