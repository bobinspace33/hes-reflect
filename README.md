# HES Reflection

An interactive site that presents a collection of personal/academic documents as
softly floating pages, lets visitors explore them by theme, and gathers reflections
on a public wall.

- **Stack:** Next.js 15 (App Router), TypeScript, Tailwind, Framer Motion, `pdfjs-dist` / `react-pdf`.
- **DB:** Vercel Postgres (Neon) via `@vercel/postgres`.
- **LLM:** OpenAI (`gpt-5.2` by default).
- **File storage (admin uploads):** Vercel Blob.

## What's in the box

- `documents/` — your source `.docx` files (the initial 8 are already here).
- `scripts/ingest-documents.ts` — local CLI that converts every `.docx` → PDF (in `public/pdfs/`) and extracts per-page text into `data/seed-documents.json`.
- `scripts/db-init.ts` — creates Postgres schema.
- `scripts/db-seed.ts` — upserts `seed-documents.json` into Postgres.
- `src/app/` — Next.js app routes. Public site at `/`, admin at `/admin`.
- `src/components/` — UI: floating page array, focus overlay, theme buttons, search bar, reflection modal, admin screens.
- `src/lib/llm.ts` — theme extraction + LLM-driven search.

## First-time setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment** — copy `.env.local.example` to `.env.local` and fill in:
   - `POSTGRES_URL` and the rest of the Vercel Postgres / Neon connection strings.
     - In Vercel: Storage → Create database → Postgres (Neon). Open the project and pull credentials with `vercel env pull .env.local`.
   - `OPENAI_API_KEY`. Set `OPENAI_MODEL` if you want to override `gpt-5.2`.
   - `ADMIN_PASSWORD` — anything you want; it's how you log into `/admin`.
   - `ADMIN_SESSION_SECRET` — a random 32+ char string.
   - `BLOB_READ_WRITE_TOKEN` — only required for admin doc uploads. From Vercel → Storage → Blob.

3. **Initialize the database**
   ```bash
   npm run db:init
   ```

4. **Convert documents → PDFs and extract text**
   ```bash
   npm run ingest
   ```
   This launches a headless Chromium (bundled with Puppeteer) to render each `.docx` as a Letter-sized PDF and produces per-page plain text. Output: `public/pdfs/*.pdf` + `data/seed-documents.json`.

5. **Seed the database from the ingest output**
   ```bash
   npm run db:seed
   ```

6. **Run the site**
   ```bash
   npm run dev
   ```
   Open <http://localhost:3000>.

7. **Generate themes** — go to `/admin`, log in with your `ADMIN_PASSWORD`, click **Analyze themes**. Wait ~10–30s. Then fill in your personal reflections for each theme.

8. (Optional) **Replace a background image** — drop a new image into `public/backgrounds/`. The site picks the first one it finds from a small priority list — edit `src/components/Background.tsx` to change the order or set an explicit `src`.

## Deploying to Vercel

1. `vercel link` to attach this folder to a project.
2. From Vercel Dashboard: Storage → Create → **Neon Postgres** + **Blob**.
3. Pull env to local: `vercel env pull .env.local` (so local dev points at the same DB), then add `OPENAI_API_KEY`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET` in the Vercel dashboard.
4. Locally: `npm run db:init`, `npm run ingest`, `npm run db:seed`. The PDFs in `public/pdfs/` are committed and shipped with the deploy.
5. `vercel --prod` to deploy.

> After deploy: go to `https://your-domain/admin`, log in, click **Analyze themes**.

## How the UI works

- **Browse mode:** documents arrange in a centered, wrapping array. Each gently bobs with a per-card phase. Hover scales the card; mouse wheel over a card adds extra magnification temporarily. Click reorders via drag-and-drop.
- **Click a page:** smoothly zooms to full screen with a shared-layout transition. In zoomed mode, click anywhere on the page to advance, arrow keys / wheel to zoom, `Esc` to exit.
- **Multi-page docs:** right-click a card to step backwards; left-click advances.
- **Theme buttons:** frosted glass, in two rows, color-coded. Click → source pages emphasize, target passages highlight, and the reflection modal slides in from the top right after a short pause.
- **Search:** type any term or phrase; an LLM call returns 0–3 verbatim passages per document that match in letter or meaning. Highlights appear in the default yellow color.
- **Reflection modal:** top half is your pre-written reflection; bottom half is the visitor wall + a form to add a new thought (instant post, optional name).

## Architecture notes

- **Highlight rendering** maps each LLM-returned quote to its location in the pdf.js text layer using a fuzzy substring walk (`src/components/PdfPage.tsx`). Quotes must be verbatim substrings of the per-page plain text we stored at ingest time; quotes that don't match are silently dropped, so a re-analyze is cheap and safe.
- **LLM output is JSON-only** (`response_format: { type: "json_object" }`) and validated with Zod.
- **Personal reflections are preserved** across re-analyses by matching themes on normalized label.
- **Admin uploads** use `@sparticuz/chromium` + `puppeteer-core` in production (Vercel functions) and full `puppeteer` locally.

## Customizing the look

- Color tokens, fonts, and animations live in `tailwind.config.ts` and `src/app/globals.css`.
- Theme highlight colors and accent colors are defined in `src/lib/colors.ts` (`THEME_PALETTE`).
- Edit `DOC_CSS` in `scripts/ingest-documents.ts` and `src/app/api/admin/documents/upload/route.ts` to change how `.docx` files get rendered as PDFs.

## Troubleshooting

- **"Database not configured" on the homepage** — `POSTGRES_URL` is missing/wrong. Run `vercel env pull .env.local`.
- **"No themes have been generated" after Analyze** — check the server logs; usually it's `OPENAI_API_KEY` missing or model name unrecognized. Override with `OPENAI_MODEL=gpt-4o-mini` to test.
- **Highlights don't show** — the quote returned by the LLM didn't match the page text verbatim. Re-run Analyze; the prompt insists on verbatim substrings and quotes are filtered server-side. Worst case, see browser console for the text-layer state.
- **Local ingest fails on Puppeteer install** — `npm install puppeteer` downloads a bundled Chromium (~170MB). If your machine blocks the download, set `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true` and point `PUPPETEER_EXECUTABLE_PATH` at a local Chrome.
# hes-reflect
