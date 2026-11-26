# TripSync

AI group trip planner built at HackCU. Everyone in the group enters their own budget and preferences privately, and TripSync plans one trip that works for all of them.

**Live demo:** https://trip-sync-ashen.vercel.app

## The problem

Group trips fall apart on money. Nobody wants to say their budget out loud, so plans get built around the loudest person and someone ends up priced out. TripSync keeps each person's budget private and plans around the whole group instead.

## How it works

1. **Create a trip** and invite your group.
2. **Each member adds private inputs.** Budget, interests, and travel preferences. Type them or say them out loud with voice input. No one else in the group sees them.
3. **Gemini builds a group profile** from everyone's inputs.
4. **Destinations get filtered in code.** Gemini scores a fixed list of 20 US destinations, then TypeScript drops any whose estimated cost is above the lowest member's budget.
5. **Gemini writes a day by day itinerary** with Google Search grounding turned on, so hotels, restaurants and prices can be checked against search results.
6. **Every person gets a budget check** against their own number, done in code. If anyone is over, the plan is sent back to Gemini once to fix it, and the better of the two plans is kept. Anything still over budget is flagged, with savings tips.
7. **The plan shows up as a map and charts.** Stops on a Leaflet map, costs in Recharts views, and the itinerary can be read back with ElevenLabs voice.

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | Next.js (App Router), React, TypeScript, Tailwind CSS |
| Maps and charts | Leaflet, Recharts |
| Voice | Web Speech API (input), ElevenLabs (spoken output) |
| AI | Gemini in JSON mode with Google Search grounding |
| Database and auth | Supabase (Postgres, Auth, row level security) |
| Hosting | Vultr VPS (Ubuntu 24.04) with pm2, plus Vercel |

## Design decisions

**Budgets stay private.** Row level security in Supabase means each member can only read their own preferences row. The leader's server routes read everyone's through the service role key after checking the caller is the leader, and the model sees everyone's inputs. A member's page only ever loads their own budget, and prompts tell the model not to state anyone's exact budget. That last part is an instruction to the model, not a guarantee.

**Hard limits live in code, not the prompt.** The destination filter and the per-person budget check both run in TypeScript on the model's output, so the model can't quietly skip them. The check can't force the model to produce a cheaper plan, so a plan can still come back over budget. It is then flagged instead of hidden.

**Model output is validated.** Gemini returns JSON, and each response is checked against a schema (zod) for the fields the app reads. A response that is malformed JSON or fails the check is retried up to 2 times, then the request fails with an error instead of rendering a broken plan.

## Data model

Six tables in Supabase:

- `users`
- `trips`
- `trip_members`
- `preferences` (private, per member)
- `location_recommendations`
- `itineraries` (stored as JSONB)

## Running locally

```bash
git clone https://github.com/Arsh624/TripSync.git
cd TripSync
npm install
npm run dev
```

Open http://localhost:3000.

Copy `.env.example` to `.env.local` and fill it in. `SUPABASE_SERVICE_ROLE_KEY` is required: the leader routes use it to read every member's preferences, and trip deletion uses it too. Keep it on the server only.

The database schema is in `supabase/schema.sql`. If you created your database from an older copy of that file, run `supabase/migrations/20261126_private_preferences.sql` once in the Supabase SQL editor to make preferences private.

## Tests

```bash
npm test          # unit tests for the budget rules, response validation and Gemini retries
npm run typecheck
```

CI runs the type check, the tests and a production build on every push and pull request. `npm run lint` currently reports errors (mostly `any` types) that predate this and is not part of CI.

## Known limitations

- The itinerary shows every member's estimated cost. Budgets are not shown, but the model is told to keep each person under their budget, so the estimates track them.
- Any signed-in user can still read the `trips` and `trip_members` tables, including each trip's share code. Tightening that needs a change to how joining works.
- The group profile is returned to the browser and sent back to the next step, rather than stored.
- Gemini's cost estimates are not independent of the model. The code checks them against budgets but cannot verify them.
- The Gemini model is a preview model named in `src/lib/gemini.ts` and may need updating.
- Any signed-in user can call the text to speech and narration routes, which spend ElevenLabs and Gemini quota. There is no rate limit yet.

## Deploying

On the server:

```bash
git pull origin main
npm install
npm run build
pm2 restart tripsync
```

## Built at

HackCU
