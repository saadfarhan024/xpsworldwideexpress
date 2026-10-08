# XPS backend foundation

The application uses PostgreSQL and Prisma for persistent users, merchant accounts, shipments, tracking events, pickup requests, support tickets, remittances, and audit records.

## First-time setup

1. Install the project dependencies:

   ```bash
   corepack enable
   pnpm add @prisma/client@^7 @prisma/adapter-pg pg dotenv
   pnpm add -D @types/pg
   pnpm add -D prisma@^7
   ```

2. Copy `.env.example` to `.env` and replace the local PostgreSQL password in both places. Do not commit `.env`.

3. Start the local PostgreSQL container:

   ```bash
   podman-compose up -d postgres
   podman-compose ps
   ```

   The database is exposed only on `127.0.0.1:5432` and persists in the named `xps-postgres-data` volume. Its first startup creates PostgreSQL's `citext` extension.

4. Generate the client and create the first migration:

   ```bash
   pnpm prisma generate
   pnpm prisma migrate dev --name init
   ```

5. Add `ADMIN_EMAIL` and `ADMIN_PASSWORD` to `.env`, then create the first administrator:

   ```bash
   pnpm prisma db seed
   ```

   The seed may be rerun to refresh that administrator's password. It only promotes the email configured in `.env`.

6. Configure `APP_URL`, `EMAIL_FROM`, and `RESEND_API_KEY` to send verification and password reset email through Resend. In development without email credentials, the complete links are printed to the server terminal. Do not run production without a configured sender and API key.

7. Optional: set `UPLOAD_DIR` for private merchant logo storage (defaults to `./uploads`, which is gitignored).

## Security rules

- Store session, password-reset, and email-verification tokens only as hashes.
- Encrypt account numbers and IBANs before saving them to `MerchantBankDetail`.
- Keep public tracking responses to a shipment status, public timeline, and broad location. Never expose full addresses, phone numbers, bank records, or internal notes.
- Authorize every merchant query by `merchantId` and every staff action by its role. The route path alone is never authorization.
- Add an audit record for application decisions, bank changes, remittance actions, shipment overrides, and role changes.

## Initial roles

`MERCHANT` is used for customers. `OPERATIONS`, `SUPPORT`, `FINANCE`, and `ADMIN` are staff roles. Require MFA for every staff account before production use.
