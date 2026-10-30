# Fiverr gig and Upwork copy: DocsChat

Replace `https://docschat-one.vercel.app` with the deployed URL and `[LOOM LINK]` with the demo video before publishing. Pricing and positioning follow `freelance_biz/research/competitors-chatbot.md` (sections 3 and 4), written for a brand-new seller with zero reviews.

## Gig title (74 characters, limit 80)

**I will build an AI chatbot trained on your PDFs and website with citations**

Other titles to test (swap in after the first impressions data, one at a time):
- I will build a RAG chatbot that answers only from your documents (64 characters)
- I will create a custom website chatbot from your docs with lead capture (71 characters)

## Pricing tiers (launch prices, zero reviews)

| | **Basic - $99** | **Standard - $249** | **Premium - $549** |
|---|---|---|---|
| Package name | Starter Bot | Website Bot | Business Bot |
| Summary | AI chatbot trained on your documents, shareable chat link | Chatbot on your website with lead capture, deployed for you | Fully branded bot with lead sync, custom domain and training |
| Documents (PDF, TXT, MD) | Up to 10 (about 100 pages) | Up to 50 | Up to 200 |
| Website pages converted into documents by me | - | Up to 10 | Up to 30 |
| Answers only from your documents, with source labels and an "I don't know" fallback | Yes | Yes | Yes |
| Shareable full-page chat link | Yes | Yes | Yes |
| Embeddable website widget (one line of code) | - | Yes, 1 website | Yes, 1 website |
| Lead capture (name, email, company, message) + admin dashboard | - | Yes | Yes |
| Leads appended to a Google Sheet | - | - | Yes |
| Email or webhook notification for new leads | - | - | Yes |
| Branding | Bot name only | Name, colours, welcome message | Name, logo, colours, tone of voice, suggested questions |
| Password-protected admin to upload and delete documents | Yes | Yes | Yes |
| Hosting setup | Written deployment guide (you deploy it, about 15 minutes) | I deploy to your own Vercel + Turso accounts with your Groq or Gemini key | Same as Standard, plus your custom domain |
| Test report on your documents | 10 real questions | 20 real questions | 40 real questions + list of unanswered questions |
| 30-minute walkthrough call | - | Yes | Yes |
| 15-minute admin training video | - | - | Yes |
| Post-delivery support | - | 14 days | 30 days |
| Source code (MIT licence) | Yes | Yes | Yes |
| Revisions | 1 | 2 | 4 |
| Delivery time | 5 days | 7 days | 10-12 days |

### Raise to (price ladder)

| Stage | Basic | Standard | Premium |
|---|---|---|---|
| Launch (0 reviews) | $99 | $249 | $549 |
| After 5 reviews at 4.9+ | $129 | $329 | $699 |
| After about 15 reviews (target; the previous draft) | $150 | $400 | $900 |
| Then test | $199 | $499 | $1,100 |

- Upwork catalog (Starter / Standard / Advanced), same scope as the tiers above: $150 / $400 / $800 from day one.
- Contra service: from $450 (single "from" price, no tiers).
- Raise rule: about 25% each time you add 5 five-star reviews, and whenever orders arrive faster than you want to deliver them.

### Gig extras

| Extra | Price |
|---|---|
| Human hand-off form (visitor asks for a person; request goes to you) | +$40 |
| Extra 50 documents | +$30 |
| Second language for the bot's fixed messages and lead-flow keywords | +$25 |
| 48-hour delivery | +$60 |
| WhatsApp or Slack channel | Custom quote: message me |

### Notes for the seller

- The demo app already includes everything in Basic and Standard. In Premium, the Google Sheet sync is built in (`GOOGLE_SERVICE_ACCOUNT_JSON`, `SHEET_ID`); the email or webhook notification is a small add-on written per order, so confirm the target (an email address or one webhook URL) before accepting.
- Not in the app, so always custom work and quoted separately: human hand-off form, WhatsApp, Slack, appointment booking, a second language. The app has a "Request a callback" button and a rule-based quote/callback/demo lead flow, nothing more. Its fixed messages and lead keywords are English only.
- Basic is deliver-and-guide: you run the 10 test questions on a local copy with the buyer's documents, send the report and the code, and the buyer deploys from DEPLOY.md. If a buyer wants you to deploy, point them to Standard. The shareable link exists once they have deployed.
- Documents: scanned image-only PDFs cannot be read (no OCR); each file is capped at 5 MB, about 4.5 MB on Vercel (larger files get split). The README says retrieval reads every chunk per question, comfortable for hundreds of pages. Before you accept a Premium order with 200 long documents, load them and check the answer speed.
- Test report: run the questions on the provider the buyer will use. With Groq, search is keyword-based (BM25) and can miss a question that shares no words with the document; Gemini adds semantic search. Record pass/fail, the source shown, and every question the bot could not answer.
- AI usage fees (Groq or Gemini) and hosting are paid by the buyer directly. Vercel's free Hobby plan is for personal, non-commercial use (DEPLOY.md, "Notes for client projects"): for a business site, tell the buyer up front that Vercel Pro or another Node host is the right choice. Check Vercel's current terms and price before publishing FAQ 3.
- Free sample: run it on a local copy (`npm run dev`) with the buyer's PDF, not on the public demo, and delete their file afterwards. Reply with the question, the bot's answer and the source chip. If the PDF has no text layer, say so.
- Fiverr takes 20% of every order including extras, so a $99 Basic nets about $79. If 48-hour delivery is not realistic for Premium, enable it for Basic and Standard only.
- Why these prices: 13 of 18 Fiverr RAG/PDF chatbot gigs seen start at $125 or less, and the $200-$300 gigs have 24-186 reviews. The previous $150 / $400 / $900 draft is fine for Upwork and Contra but high for a zero-review Fiverr launch.

## Gig description (about 800 characters)

Answers only from your documents, shows the source file, and says "I don't know" instead of inventing prices or policies.
Live demo: https://docschat-one.vercel.app/chat
Free sample: send one PDF and a question; I reply with the bot's cited answer, free.

I build a chatbot trained only on your PDF, TXT or Markdown files, plus website pages I convert. A visitor who asks for a quote or callback leaves their name, email and message, saved to your dashboard.

What you get:
- One-line widget for WordPress, Shopify, Wix, Webflow or plain HTML
- Password-protected admin to upload documents
- Lead capture (Google Sheet in Premium)
- Deployed by me in your own accounts
- Full source code, MIT licence

No subscription to me: it runs in your own free accounts (see the hosting FAQ). AI usage on your own key is usually free-tier for a small site.

Walkthrough video: [LOOM LINK]

## FAQ (7 questions)

**1. What kinds of documents can the chatbot learn from?**
PDF, plain text and Markdown files with a real text layer, for example FAQs, price lists, shipping and returns policies, product catalogues, onboarding guides and manuals. Scanned image-only PDFs need to be converted to text first. Each file can be up to 5 MB (about 4.5 MB when hosted on Vercel); I split larger ones. For website content, send me the page URLs and I turn them into documents (included in Standard and Premium).

**2. Will the bot make things up?**
It is built not to. It is instructed to answer only from the passages retrieved from your documents, and when the answer is not there it says so, shows a "Not in the documents" notice with your contact details, and offers a callback request. Each answer shows its source file, so you can check it. No chatbot is perfect, and keyword search can miss a question worded very differently from your documents, so I run a test report on your real questions before handover (10, 20 or 40 questions depending on the package). Medical, legal and financial answers should always link to a person.

**3. Do I have to pay for the AI? What about hosting?**
There is no subscription to me. The AI runs on your own key (Groq by default, Gemini optional), and Groq and Gemini both have free tiers with rate limits. As an estimate, not a quote: a small site with a few hundred chats a month usually stays on the free tier or costs a few dollars a month. Turso (the database) has a free tier. Vercel's free Hobby plan is for personal, non-commercial use, so for a business site the right plan is Vercel Pro (about $20 a month, billed to you by Vercel; check their current pricing) or another Node host. I set everything up in your own accounts either way, so you stay in control and nothing depends on me.

**4. Which website platforms does the widget work on?**
Any platform that lets you add a script tag: WordPress, Shopify, Wix, Webflow or plain HTML. You paste one line of code and a chat button appears. If you cannot add code, you can share the full-page chat link instead.

**5. Who owns the code and my data?**
You do. You receive the full source code under the MIT licence, the documents and leads live in your own database and accounts, and I keep no copy of your data after delivery.

**6. Can I see it working on MY documents before I order?**
Yes. Send me one PDF and a question in a message. I run the bot on your file and reply with its cited answer, free. I delete your file afterwards. You can also try the live demo first: https://docschat-one.vercel.app/chat

**7. What about WhatsApp, Slack or appointment booking?**
The base bot is your website (one-line widget) plus a shareable chat link. WhatsApp, Slack and appointment booking are not part of any package; they are custom work, so message me with what you need and I will quote it. A human hand-off form is a +$40 extra, and the bot's lead flow already covers quote, callback and demo requests.

## Search tags (5)

1. rag chatbot
2. pdf chatbot
3. custom ai chatbot
4. website chatbot
5. knowledge base chatbot

## Upwork portfolio blurb

**DocsChat - AI chatbot that answers only from your documents and cites sources.** A Next.js app: upload PDF, TXT or Markdown files and visitors get answers with the source file shown, or a plain "I don't know" with your contact details when the answer is not there. A rule-based flow captures quote and callback leads into a password-protected admin dashboard, optionally a Google Sheet. One-line website widget, and the admin uploads and deletes documents any time. Groq by default, Gemini optional. Free-tier deploy on Vercel + Turso, MIT licence. Live demo: https://docschat-one.vercel.app

## Launch checklist

- [ ] Record the Loom from `DEMO_SCRIPT.md`, paste the link over `[LOOM LINK]`, and add it as the gig video.
- [ ] Open `/api/health` on the live demo and confirm `provider` is `groq` or `gemini` (with `none` the demo shows the demo-mode banner).
- [ ] Screenshots in `docs/` are current (`screenshot-landing.png`, `screenshot-chat-answer.png`, `screenshot-chat-lead.png`, `screenshot-admin.png`, `screenshot-mobile-chat.png`).
- [ ] Thumbnail: split screen. Left, a PDF page with one paragraph highlighted. Right, the chat answer with a "Source: pricing.md" chip. Headline "Chatbot that cites its sources". No price, no stock robots, readable at thumbnail size.
- [ ] Gallery image 2: a refusal bubble ("Not in the documents"). Gallery image 3: the tier comparison table.
- [ ] Paste the widget line into a free WordPress page and a Wix or Webflow page and confirm it opens, before relying on the platform list in the FAQ.
- [ ] Set the three Fiverr tiers to $99 / $249 / $549, add the gig extras, and add the five tags.
- [ ] Upwork catalog at $150 / $400 / $800 and Contra service at "from $450".
- [ ] Pin the live demo link and the free sample offer in the first message template.
