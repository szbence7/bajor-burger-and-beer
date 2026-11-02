# Database (Supabase)

Schema, Row Level Security, booking rules and the launch content for the self-hosted
Supabase instance.

| Path                                        | What                                                                          |
| ------------------------------------------- | ----------------------------------------------------------------------------- |
| `migrations/0001_content.sql`               | Menu, beers, gallery, opening hours, site settings; RLS                       |
| `migrations/0002_reservations.sql`          | Reservations, booking rules (trigger), `available_slots()`; RLS               |
| `migrations/0003_reservation_retention.sql` | 12-month GDPR cleanup, scheduled daily with pg_cron                           |
| `migrations/0007_capacity_overflow.sql`     | `capacity_overflow()`: seats over capacity if a booking were re-accepted      |
| `migrations/0006_site_details.sql`          | Restaurant name + company details; `replace_opening_hours()` for the admin    |
| `migrations/0005_admin_users.sql`           | Temporary-password accounts are not admins; account emails in the log         |
| `migrations/0004_admin.sql`                 | 2FA admins, decisions, Hónap ajánlata, PDF menu, email log, Storage, Realtime |
| `seed.sql`                                  | Launch content (the mock data). Idempotent: never overwrites existing rows    |
| `tests/booking_test.sql`                    | pgTAP tests: slots, capacity, RLS, retention                                  |
| `config.toml`                               | Local stack for development and tests (Supabase CLI)                          |

## Local development

Needs Docker. The CLI runs through `bunx`, no install needed.

```sh
bun run db:start   # local stack; applies migrations + seed. Prints the URL and anon key
bun run test:db    # pgTAP tests
bun run db:reset   # drop everything and re-apply migrations + seed
bun run db:stop
```

Put the printed API URL (`http://127.0.0.1:54321`), anon key and service role key into `.env`
as `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`, then `bun run dev`.
Studio: http://127.0.0.1:54323. The local stack also runs Realtime, Storage and Mailpit: set
`SMTP_HOST=127.0.0.1`, `SMTP_PORT=54325` and an `SMTP_FROM`, and every booking email lands in
http://127.0.0.1:54324. Create a local admin with `bun run admin create you@example.com`.

## Applying to the real instance

Test every new migration locally first (`bun run db:reset && bun run test:db`). Then pick
**one** of the two ways and stick with it:

- **CLI over an SSH tunnel:** open the tunnel, set `SUPABASE_DB_URL` in `.env` (local only),
  then `set -a; source .env; set +a; bun run db:push`. It applies only migrations not yet
  applied (tracked in `supabase_migrations.schema_migrations`) and runs `seed.sql`.
- **Studio SQL editor:** paste each migration in number order, then `seed.sql`. Nothing tracks
  which ones ran, so keep a note, and keep applying later migrations by hand.

## Admin panel (`/admin`)

- **Who is an admin:** an Auth user with `app_metadata.role = 'admin'` **whose session passed
  the authenticator-app check** (`aal2`). `public.is_admin()` requires both, so every RLS
  policy (tables, Storage, Realtime) enforces 2FA; a stolen password alone sees nothing.
- **Accounts** (sign-ups are off): admins invite colleagues in the panel (Felhasználók). The
  new admin gets an email with a temporary password (`app_metadata.must_change_password`);
  on first sign-in they must enter it again and choose their own password (twice), then set up the authenticator app.
  `is_admin()` is false while the flag is set, even with 2FA, so the emailed password alone
  never reaches data. "Visszaállítás" (lost phone or password) sends a new temporary password
  and removes their 2FA. If the email cannot be sent, the panel shows the temporary password
  once so it can be handed over in person. Bootstrap the first admin, or fix things, from the
  CLI (needs the instance's URL + service key in `.env`):

  ```sh
  bun run admin create anna@bajorburger.hu   # prints a generated password
  bun run admin promote anna@bajorburger.hu  # make an existing user an admin
  bun run admin reset-2fa anna@bajorburger.hu   # remove their authenticator
  bun run admin list
  ```

- **Self-hosted Auth settings** (Coolify → Supabase service → environment), then restart Auth:
  `GOTRUE_DISABLE_SIGNUP=true`, `GOTRUE_MFA_TOTP_ENROLL_ENABLED=true`,
  `GOTRUE_MFA_TOTP_VERIFY_ENABLED=true`, `GOTRUE_PASSWORD_MIN_LENGTH=10`. Keep email+password sign-in enabled
  (`GOTRUE_EXTERNAL_EMAIL_ENABLED=true`). The Realtime and Storage services must be running
  (they are part of the standard self-hosted stack).
- **Live reservations:** `reservations` and `notification_log` are in the `supabase_realtime`
  publication; Realtime applies RLS, so only 2FA admins receive rows.
- **Storage:** public buckets `menu` (PDF, ≤ 15 MB) and `media` (images, ≤ 5 MB); anyone can
  download by URL, only admins can write. The site serves the current menu at `/etlap.pdf`
  (path in `site_settings.menu_pdf_path`); replacing it deletes the old file.
- **Notification log:** the app server writes one `notification_log` row per email (sent /
  failed / skipped) with the service role key; admins read it. Rows go with their reservation
  (GDPR retention).

## Rules worth knowing

- **Roles.** Visitors use the anon key, through the app's server only. They can read active
  content and settings, can `INSERT` reservations (only the guest columns), and can never read
  reservations. Admins are Auth users with `app_metadata.role = 'admin'` signed in with their
  second factor (see "Admin panel" above) and can do everything. Admins, the service role and
  direct database sessions skip the booking rules (phone bookings).
- **Booking rules** live in `site_settings` (`booking_*` columns: slot length, dining duration,
  capacity, max party size, days ahead, minimum notice, hold time). The trigger
  `private.check_reservation()` enforces them on every public insert and raises a stable code
  (`slot_full`, `invalid_slot`, `too_late`, `date_out_of_range`, `party_too_large`,
  `consent_required`); the app maps the codes to Hungarian messages.
- **Statuses:** `pending` → `confirmed` (accepted) or `rejected` (declined); `confirmed` →
  `cancelled`. A mistaken rejection or cancellation can be confirmed again ("Mégis elfogadom"); the panel
  warns, via `capacity_overflow()`, if the seats have been taken since. Every decision
  emails the guest, optionally with the staff's message (`decision_note`).
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
