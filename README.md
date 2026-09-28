# AI Resume + Portfolio Builder

Next.js + Supabase resume and portfolio builder. This package is prepared for Netlify deployment and preserves the recovered architecture: Supabase Auth/database, server-side AI route, resume editor, templates, portfolio publishing, and print/PDF.

## Netlify
1. Import this folder/ZIP into Netlify.
2. Build command: `npm run build`.
3. Netlify's Next.js plugin is configured in `netlify.toml`.
4. Add environment variables from `.env.example` in Netlify. Use your existing Supabase URL and publishable/anon key. Add `OPENAI_API_KEY` only if AI features are required.
5. The existing Supabase database should remain the source of truth; do not recreate it if your existing project already contains the migrations.
