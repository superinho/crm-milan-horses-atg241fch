# Smart Leilões Sync

The Smart Leilões API credentials must be configured as Supabase Edge Function
secrets, not as frontend environment variables.

Required secrets:

```bash
supabase secrets set SMARTLEILOES_API_KEY=...
supabase secrets set SMARTLEILOES_API_SECRET=...
```

For local Edge Function testing, `supabase/.env.local` contains these two
Smart Leilões variables and is ignored by Git.

The frontend also needs the regular public Supabase variables:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

For local imports, use a server-side key only in ignored local env files:

```bash
SUPABASE_SECRET_KEY=...
```

The sync button calls the `sync-smartleiloes` Edge Function. The function stores
raw API payloads in `smartleiloes_raw_records` and normalizes data into
`contacts`, `smartleiloes_auctions`, `smartleiloes_lots`, `bids`, and
`purchases`.

Money values from the Smart Leilões API use decimal dots, for example
`11000.00`. The import and sync code parse that as `11000`, not as a Brazilian
thousands separator. Contract rows are only counted as purchases when
`situacaoComercialContrato` is `VENDIDO`; canceled contracts remain available in
raw payloads but do not enter RFMV monetary totals.

The API currently needs `limite=5000` for full local sync. With `limite=1000`,
contracts, clients, and bids can be truncated.

If historical local data needs to be checked or repaired after parser changes,
run:

```bash
npm run repair:smartleiloes-values
```
