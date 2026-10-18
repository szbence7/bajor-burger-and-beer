# Database (Supabase)

Schema, Row Level Security, booking rules and the launch content for the self-hosted
Supabase instance.

| Path                                        | What                                                                       |
| ------------------------------------------- | -------------------------------------------------------------------------- |
| `migrations/0001_content.sql`               | Menu, beers, gallery, opening hours, site settings; RLS                    |
| `migrations/0002_reservations.sql`          | Reservations, booking rules (trigger), `available_slots()`; RLS            |
| `migrations/0003_reservation_retention.sql` | 12-month GDPR cleanup, scheduled daily with pg_cron                        |
| `seed.sql`                                  | Launch content (the mock data). Idempotent: never overwrites existing rows |
| `tests/booking_test.sql`                    | pgTAP tests: slots, capacity, RLS, retention                               |
| `config.toml`                               | Local stack for development and tests (Supabase CLI)                       |

## Local development

Needs Docker. The CLI runs through `bunx`, no install needed.

```sh
bun run db:start   # local stack; applies migrations + seed. Prints the URL and anon key
bun run test:db    # pgTAP tests
bun run db:reset   # drop everything and re-apply migrations + seed
bun run db:stop
```

Put the printed API URL (`http://127.0.0.1:54321`) and anon key into `.env` as
`SUPABASE_URL` / `SUPABASE_ANON_KEY`, then `bun run dev`. Studio: http://127.0.0.1:54323.

## Applying to the real instance

Test every new migration locally first (`bun run db:reset && bun run test:db`). Then pick
**one** of the two ways and stick with it:

- **CLI over an SSH tunnel:** open the tunnel, set `SUPABASE_DB_URL` in `.env` (local only),
  then `set -a; source .env; set +a; bun run db:push`. It applies only migrations not yet
  applied (tracked in `supabase_migrations.schema_migrations`) and runs `seed.sql`.
- **Studio SQL editor:** paste each migration in number order, then `seed.sql`. Nothing tracks
  which ones ran, so keep a note, and keep applying later migrations by hand.

## Rules worth knowing

- **Roles.** Visitors use the anon key, through the app's server only. They can read active
  content and settings, can `INSERT` reservations (only the guest columns), and can never read
  reservations. Admins are Auth users with `app_metadata.role = 'admin'` (set with the service
  key or in Studio → Authentication) and can do everything. Admins, the service role and
  direct database sessions skip the booking rules (phone bookings).
- **Booking rules** live in `site_settings` (`booking_*` columns: slot length, dining duration,
  capacity, max party size, days ahead, minimum notice, hold time). The trigger
  `private.check_reservation()` enforces them on every public insert and raises a stable code
  (`slot_full`, `invalid_slot`, `too_late`, `date_out_of_range`, `party_too_large`,
  `consent_required`); the app maps the codes to Hungarian messages.
- **Capacity** counts pending and confirmed bookings. Each booking occupies
  `duration_minutes` (snapshotted from the setting when it was made); a new one is accepted
  only if every overlapping slot-length window stays within `booking_capacity`.
- **Times** are Europe/Budapest wall-clock. A booking must end by closing time and start on
  its own date (no after-midnight starts). Closing at or before opening means after midnight.
- **Images**: `menu_items.image`, `beers.image` and `gallery_images.url` hold either a key from
  `src/data/images.ts` (e.g. `burgerHero`) or an absolute URL.

## GDPR cleanup

`private.purge_old_reservations()` deletes reservations whose visit date is more than 12
months ago and returns the number deleted. Migration 0003 schedules it with pg_cron at 03:30
UTC daily (job `bajor-purge-old-reservations`; check with `select * from cron.job;`).

If pg_cron is unavailable (the migration then prints a notice), run it daily some other way,
e.g. a cron job on the VPS:

```sh
psql "$SUPABASE_DB_URL" -c "select private.purge_old_reservations();"
```
