# Deploying DocsChat (Vercel + Turso, free tier)

Result: a stable public URL such as `https://docschat-yourname.vercel.app` that keeps its documents and leads between restarts.

Why this combination: Vercel hosts the Next.js app for free, but its filesystem is read-only/ephemeral, so the SQLite file cannot live there. [Turso](https://turso.tech) is hosted SQLite (libSQL) with a free tier; DocsChat switches to it automatically when `TURSO_DATABASE_URL` is set. No code changes are needed.

Time needed: about 15 minutes. You need free accounts on GitHub, Turso and Vercel. An AI key (Groq or Gemini) is optional.

## 1. Put the code on GitHub

1. Go to <https://github.com/new>, name the repository `docs-chatbot`, choose **Private**, leave everything else unticked, click **Create repository**.
2. In a terminal inside the project folder:

   ```bash
   git init
   git add .
   git commit -m "DocsChat"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/docs-chatbot.git
   git push -u origin main
   ```
3. On the GitHub repository page, confirm there is **no `.env` file** and no `node_modules` or `.next` folder (the `.gitignore` already excludes them).

## 2. Create the Turso database

1. Open <https://turso.tech> and click **Sign Up**. Choose **Continue with GitHub**.
2. In the dashboard click **Create Database**.
3. Name: `docschat`. Pick the location closest to where your visitors are (for the US, an `us-east` option). Click **Create Database**.
4. Open the new database. Copy the **URL**; it looks like `libsql://docschat-yourname.aws-us-east-1.turso.io`. This is `TURSO_DATABASE_URL`.
5. Click **Generate Token** (or **Create Token**). Choose **Read & Write** and no expiration, then copy the token. This is `TURSO_AUTH_TOKEN`. It is shown only once.

   CLI alternative: `turso db create docschat`, then `turso db show docschat --url`, then `turso db tokens create docschat`.

You do not create any tables. DocsChat creates them on first start.

## 3. (Optional) Get an AI key (Groq or Gemini)

**Groq (recommended default, fast, free tier):**

1. Open <https://console.groq.com/keys> and sign in.
2. Click **Create API Key**, copy it. This is `GROQ_API_KEY`.

**Gemini (optional, adds semantic embeddings):**

1. Open <https://aistudio.google.com/apikey> and sign in with a Google account.
2. Click **Create API key**, copy it. This is `GEMINI_API_KEY`.

Without a key the app still works in demo mode (best-matching text with a visible banner). With a key, answers become conversational. If both keys are set, Groq is used unless you set `LLM_PROVIDER=gemini`. The free tiers have rate limits and may return 429/503 under load; DocsChat retries automatically with backoff and, if the model stays unavailable, still shows the best-matching text from your documents.

## 4. Deploy on Vercel

1. Open <https://vercel.com/signup> and choose **Continue with GitHub**.
2. Click **Add New...** then **Project**.
3. Find `docs-chatbot` in the list and click **Import**. (If it is missing, click **Adjust GitHub App Permissions** and grant access to the repository.)
4. Leave **Framework Preset** as **Next.js** and all build settings at their defaults.
5. Expand **Environment Variables** and add these (name on the left, value on the right):

   | Name | Value |
   |---|---|
   | `ADMIN_PASSWORD` | a long password you choose (this protects `/admin`) |
   | `TURSO_DATABASE_URL` | the `libsql://...` URL from step 2 |
   | `TURSO_AUTH_TOKEN` | the token from step 2 |
   | `GROQ_API_KEY` | optional, from step 3 (default AI provider) |
   | `GEMINI_API_KEY` | optional, from step 3 (only if you want Gemini instead) |
   | `LLM_PROVIDER` | optional: `groq`, `gemini` or `none`; leave unset to auto-pick from the keys |
   | `BUSINESS_NAME` | optional, e.g. `Northwind Supply Co.` |
   | `BUSINESS_CONTACT` | optional, a support email shown in "I don't know" replies |

6. Click **Deploy** and wait about a minute. When it shows **Congratulations**, click **Continue to Dashboard**, then **Visit**.

## 5. Check it works

1. Open `https://YOUR-APP.vercel.app/api/health`. You should see something like:

   ```json
   {"ok":true,"docs":4,"storage":"turso","mode":"ai","provider":"groq","model":"openai/gpt-oss-120b","adminConfigured":true}
   ```

   `docs: 4` means the sample documents were auto-seeded. `storage` must say `turso`; if it says `sqlite`, the two Turso variables are missing or misspelled (fix them, then redeploy). `provider` is `groq`, `gemini` or `none` (with `none`, `mode` is `demo-extractive` and `model` is `null`).
2. Open `/chat` and ask "How much is the Business plan?".
3. Open `/admin`, log in with `ADMIN_PASSWORD`.
4. Optional automated check from your computer:

   ```bash
   ADMIN_PASSWORD=your-password node scripts/verify.mjs https://YOUR-APP.vercel.app
   ```

   (PowerShell: `$env:ADMIN_PASSWORD="your-password"; node scripts/verify.mjs https://YOUR-APP.vercel.app`.) The last check deliberately triggers the rate limiter, so wait a minute before running it again.

## 6. Day-to-day

- **Update the app:** `git push` to `main`; Vercel redeploys automatically.
- **Change an environment variable:** Vercel project, **Settings**, **Environment Variables**, edit, then **Deployments**, the three dots on the latest deployment, **Redeploy**.
- **Add your own documents:** log in at `/admin` and upload. Delete the Northwind samples when you go live. They are only re-seeded if the database has zero documents; set `AUTO_SEED=0` to disable that completely.
- **Custom domain:** Vercel project, **Settings**, **Domains**, **Add**, and follow the DNS instructions.
- **Closer to your Turso region:** Vercel project, **Settings**, **Functions**, **Function Region**, pick the region nearest the Turso location.
- **Leads:** shown in `/admin`. To also get them in a Google Sheet, create a Google Cloud service account, enable the Sheets API, download its JSON key, put the whole JSON in `GOOGLE_SERVICE_ACCOUNT_JSON`, put the sheet ID (the long string in the sheet URL) in `SHEET_ID`, and share the sheet with the service-account email as Editor.

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `ADMIN_PASSWORD` | yes | Admin is locked if empty. |
| `TURSO_DATABASE_URL` | yes on Vercel | Without it the app falls back to a temporary SQLite file in `/tmp` that is wiped regularly. |
| `TURSO_AUTH_TOKEN` | yes on Vercel | Read & write token. |
| `LLM_PROVIDER` | no | `groq`, `gemini` or `none`. Empty = Groq if `GROQ_API_KEY` is set, else Gemini if `GEMINI_API_KEY` is set, else none. |
| `GROQ_API_KEY` | no | Enables conversational answers via Groq (keyword retrieval, no embeddings). |
| `GROQ_MODEL` | no | Default `openai/gpt-oss-120b` (alternative: `openai/gpt-oss-20b`). |
| `GROQ_BASE_URL` | no | Default `https://api.groq.com/openai/v1`. Only for proxies or tests. |
| `GEMINI_API_KEY` | no | Enables conversational answers and semantic embeddings via Gemini. |
| `GEMINI_MODEL` | no | Default `gemini-3.1-flash-lite`. |
| `BUSINESS_NAME`, `BUSINESS_CONTACT` | no | Branding and fallback contact. |
| `PUBLIC_URL` | no | Only if the embed snippet shows the wrong host. Auto-detected otherwise. |
| `SESSION_SECRET` | no | Extra secret for the admin cookie signature. |
| `RATE_LIMIT_PER_MIN` | no | Default 20. |
| `AUTO_SEED` | no | `0` disables the first-start sample documents. |
| `GOOGLE_SERVICE_ACCOUNT_JSON`, `SHEET_ID` | no | Append leads to a Google Sheet. |

## Notes for client projects

- Vercel's free **Hobby** plan is for personal, non-commercial use. A portfolio demo fits; a client's production site should run on the client's own Vercel account (Pro) or on any Node host.
- Any Node host works: `npm ci && npm run build && npm start`. On a VPS or Render/Railway/Fly with a persistent disk, leave `TURSO_*` empty and set `DATA_DIR` to the disk path to keep the SQLite file.
- The in-memory rate limiter is per server instance. For heavy public traffic add a shared limiter (for example Upstash Redis).
- Vercel limits request bodies to about 4.5 MB, so document uploads through the admin page are effectively capped there. Larger files can be split, or upload from a self-hosted instance.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `/admin` says "Admin is locked" | `ADMIN_PASSWORD` is not set in Vercel; add it and redeploy. |
| `/api/health` shows `"storage":"sqlite"` | Turso variables missing or misspelled. |
| `/api/health` returns `ok:false` with an auth error | Wrong `TURSO_AUTH_TOKEN`, or the token is for a different database. |
| Answers always say "Demo mode" | No key is set (`/api/health` shows `"provider":"none"`): add `GROQ_API_KEY` (or `GEMINI_API_KEY`) and redeploy. Also check that `LLM_PROVIDER`, if set, names a provider whose key is present. |
| Answers are plain document text although a key is set | The model call failed after retries (bad key, quota, wrong `GROQ_MODEL`). See the function logs in Vercel; `/api/health` still shows the provider. |
| Chat shows "Too many requests" | The 20/min/IP limiter; wait a minute. |
| Upload fails with 413 | File above the platform limit (about 4.5 MB on Vercel). |
