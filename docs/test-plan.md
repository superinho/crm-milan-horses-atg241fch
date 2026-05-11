# CRM Milan Horses Test Plan

## Supabase setup

1. Create or select a Supabase project.
2. Apply the migrations in `supabase/migrations`.
3. Deploy the Edge Functions:

```bash
supabase functions deploy sync-smartleiloes
supabase functions deploy process-campaigns
supabase functions deploy send-contact-email
```

4. Configure secrets:

```bash
supabase secrets set SMARTLEILOES_API_KEY=...
supabase secrets set SMARTLEILOES_API_SECRET=...
```

5. Configure frontend environment:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

For local Smart Leilões imports, add the Supabase secret key to `.env.local`
as `SUPABASE_SECRET_KEY`. Do not expose it in frontend code.

## Manual test flow

1. Start the app with `npm run dev`.
2. Create a user or sign in with Supabase Auth.
3. Open `/leiloes`.
4. Click `Sincronizar Smart Leilões`.
5. Confirm the summary card shows imported clients, events, lots, bids, contracts, and revenues.
6. Open the dashboard home page and confirm the monetary/RFMV dashboard is populated.
7. Open contacts and verify Smart Leilões contacts appear with purchases/lances in the contact details.
8. Create a campaign using an RFMV/segment audience and process it.
