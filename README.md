# GrantMatch Houston

GrantMatch Houston is an explainable funding navigator for new businesses and
early-stage startups in Houston. It compares a confirmed founder profile
against curated local programs and live Grants.gov results, explains why an
opportunity does or does not fit, identifies missing documents, and turns a
selected match into an application plan.

## Judge experience

The complete demo works without an account:

1. Open the landing page and choose **Try the demo**.
2. Select the **HoustonAI Health** scenario.
3. Analyze the fictional documents and optionally change the funding need.
4. Run GrantMatch and inspect both recommended and ruled-out opportunities.
5. Open a match, review requirement evidence, and generate an action plan.
6. Preview Gmail and Calendar actions. When sandbox credentials are configured,
   the safe demo can create fixed external objects in a project-owned account.

Demo businesses, documents, and demo-only opportunities are visibly labelled
as fictional. Public funding resources retain official source links.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Copy `.env.example` to `.env.local` only when configuring optional services.
The guest demo and bundled opportunity catalog work without environment
variables.

## Architecture

- Next.js App Router and TypeScript
- React client session provider for the no-login judge journey
- Deterministic eligibility, fit, and readiness scoring
- Optional OpenAI profile extraction with a conservative local fallback
- Bundled Houston/Texas catalog with optional Supabase persistence
- Live Grants.gov Search2 integration
- Incremental Google OAuth for:
  - per-file Drive Picker access
  - unsent Gmail draft creation
  - Calendar event creation

Supabase schema and row-level-security policies are in
`supabase/migrations/001_initial_schema.sql`.

## Google setup

Create a Google Cloud OAuth web client and enable:

- Google Drive API
- Google Picker API
- Gmail API
- Google Calendar API

For local development, register:

```text
http://localhost:3000/api/google/callback
```

For production, register only the stable deployed callback:

```text
https://YOUR-DOMAIN/api/google/callback
```

Use the narrow scopes already defined in `src/lib/google.ts`. Keep the OAuth
app in Testing for the hackathon and explicitly allowlist accounts that need
the real-user path. Unknown judges can still use the entire guest demo.

The dedicated demo refresh token must belong to a disposable project account,
not a personal inbox or calendar.

## Deployment

1. Push this repository to GitHub.
2. Import it into Vercel.
3. Add the environment values documented in `.env.example`.
4. Deploy from the stable production branch.
5. Add the resulting production callback URL to Google Cloud.
6. Redeploy after enabling Google credentials.

Without service credentials, the deployed application remains fully usable in
guest mode and reports integrations as previews rather than claiming a live
external write.

## Important disclaimer

GrantMatch is an informational screening tool. Recommendation scores are not
funding decisions, and users must confirm final eligibility, program status,
deadlines, and permitted uses with the funding organization.
