# TripSync

AI group trip planner built at HackCU. Everyone in the group enters their own budget and preferences privately, and TripSync plans one trip that works for all of them.

**Live demo:** https://trip-sync-ashen.vercel.app

## The problem

Group trips fall apart on money. Nobody wants to say their budget out loud, so plans get built around the loudest person and someone ends up priced out. TripSync keeps each person's budget private and plans around the whole group instead.

## How it works

1. **Create a trip** and invite your group.
2. **Each member adds private inputs.** Budget, interests, and travel preferences. Type them or say them out loud with voice input. No one else in the group sees them.
3. **Gemini builds a group profile** from everyone's inputs.
4. **Destinations get filtered in code** so nothing above the lowest member's budget makes the list.
5. **Gemini writes a day by day itinerary** grounded with Google Search, so places and details come from real results.
6. **Every person gets a budget check** against their own number, with savings tips if a day runs over.
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

**Budgets stay private.** Row level security in Supabase means each member can only read their own preferences. The model sees everyone's inputs. Other members never do.

**Hard limits live in code, not the prompt.** The budget filter runs in TypeScript before and after generation, so the model can't talk its way past the lowest budget.

**Model output is validated.** Gemini returns structured JSON. If a response comes back malformed or missing fields, TripSync retries instead of rendering a broken plan.

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

Create a `.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GEMINI_API_KEY=
ELEVENLABS_API_KEY=
```

Database schema is in the `supabase` folder.

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
