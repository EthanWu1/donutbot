# Donut Index

A Discord bot for DonutSMP — player stats, leaderboards, auction house, and
Discord↔IGN account linking.

## Commands
- `/stats [username] [user]` — player statistics with 24h deltas and a balance-history chart
- `/link <username>` — link your Discord account to a DonutSMP IGN
- `/unlink` — remove your link
- `/leaderboard <type> [page]` — DonutSMP leaderboards
- `/ah [search] [page] [sort]` — browse the auction house
- `/worth <item> [amount]` — item value lookup (requires `data/prices.json`)

## Setup
1. `npm install`
2. Copy `.env.example` to `.env` and fill in `BOT_TOKEN`, `CLIENT_ID`, and
   `DONUTSMP_API_KEYS` (comma-separated for a larger rate-limit budget).
   Leave `GUILD_ID` blank for global (multi-server) commands; set it to a test
   server id for instant command updates during development.
3. `npm run deploy` — register slash commands.
4. `npm start` — run the bot (or `pm2 start ecosystem.config.js`).

## Notes
- DonutSMP API: 250 requests/min per key; the bot pools multiple keys and caches
  responses. Get a key with `/api` in-game.
- 24h deltas and the history chart are computed from snapshots stored in
  `data/donut.sqlite`; history accumulates after the bot has run for a while.
