# XPS backend roadmap

This document tracks the work needed to turn the current account and shipment foundation into a complete merchant and operations platform. Treat each checkbox as unfinished until its acceptance criteria are met and the feature is verified against the running PostgreSQL database.

## What is in place

- PostgreSQL runs locally through Podman Compose; Prisma schema and initial migration are present.
- Merchant registration stores a business profile and encrypts optional bank account and IBAN values.
- Email verification and password reset use expiring, single-use tokens. Resend delivery is supported; development prints links to the server terminal.
- Login creates a server-managed session. Merchant and admin page layouts check access on the server.
- Admins can review and approve or reject pending merchant applications; decisions are audited.
- Merchants can create shipments and view their own shipment records.
- Public tracking accepts up to ten codes and returns public tracking events.
- Admins can update shipment statuses and add public updates and staff-only notes.

## Remaining work

### 1. Finish and harden account workflows

- [x] Add a resend-verification flow with throttling and the same generic-response behavior used for password recovery.
- [x] Make failed email delivery recoverable. Registration currently creates the account before sending email, so a delivery failure can leave an account that cannot register again or receive a replacement link.
- [x] Send email notifications for application approval and rejection, including the rejection reason when appropriate.
- [x] Add rate limits and abuse protection to login, registration, verification, password reset, and public tracking endpoints.
- [x] Review session expiry, session revocation, password requirements, and error messages before launch.

**Done when:** a merchant can register, verify an email, receive an approval decision, sign in, recover a password, and repeat a failed verification or email delivery without admin database access. (Verified against live PostgreSQL)

### 2. Merchant profile and documents

- [x] Add protected profile read and update pages for company, contact, address, city, website, and product details.
- [x] Add logo upload with file type and size validation, private or public storage rules, and safe replacement/deletion.
- [x] Add bank detail view and edit workflows with strict Finance/Admin access, encryption, masked display, and audited changes.
- [x] Prevent general account APIs and support roles from returning encrypted values or bank details.

**Done when:** merchants can maintain their business profile, bank data is only visible to authorized roles, and file uploads cannot be used to upload arbitrary content. (Verified against live PostgreSQL)

### 3. Pickup requests and dispatch

- [x] Let merchants request a pickup for one or more shipments, choose an address and time window, and cancel eligible requests.
- [x] Let Operations review the queue, assign staff, schedule or reschedule a pickup, and mark it complete or failed.
- [x] Record each pickup status change with an actor, timestamp, and audit event.
- [x] Show pickup status and history in the merchant portal; notify the merchant about schedule changes.

**Done when:** every requested pickup has a visible lifecycle, an assigned owner when scheduled, and a complete history for merchant and Operations views. (Verified against live PostgreSQL)

### 4. Shipment operations

- [x] Give Operations a shipment queue with filters for status, date, destination, merchant, and tracking code.
- [x] Move shipment status updates from Admin-only access to the intended Operations role with permission checks on every API action.
- [x] Enforce allowed status transitions server-side and define handling for terminal states, failed delivery, returns, holds, and cancellations.
- [x] Add shipment search, pagination, and useful filters to the merchant portal.
- [x] Add CSV shipment import/export and shipment labels or manifests if required by XPS operations.
- [x] Send customer-visible notifications when configured milestones occur.

**Done when:** staff can process a shipment from creation through delivery or exception, invalid transitions are rejected, and merchants see only their own shipment and public tracking data. (Verified against live PostgreSQL)

### 5. Cash-on-delivery and remittances

- [x] Define finance rules for when COD is collected, reconciled, held, adjusted, and paid.
- [x] Link delivered COD shipments to remittance batches and prevent double counting or duplicate payouts.
- [x] Add Finance pages for reconciliation, payout references, exceptions, and batch approval.
- [x] Add merchant remittance history and downloadable statements.
- [x] Audit every adjustment, approval, and payout action; restrict access to Finance/Admin.

**Done when:** every payout can be reconciled to its source shipments, exceptions are visible, and both Finance and the merchant can review the resulting statement. (Verified against live PostgreSQL)

### 6. Customer support

- [x] Add merchant ticket creation, replies, and shipment linking.
- [x] Add a Support queue with assignment, priority, status, and internal notes.
- [x] Enforce that merchants see only their tickets and never staff-only notes.
- [x] Notify participants when a ticket receives a reply or changes state.
- [x] Add retention and attachment rules before allowing ticket uploads.

**Done when:** a merchant and Support can exchange messages on a ticket with clear ownership, status, notifications, and private staff notes. (Verified against live PostgreSQL)

### 7. Admin, staff access, and audit

- [x] Add staff account creation and role assignment for Operations, Support, and Finance.
- [x] Add MFA for all staff accounts before production use.
- [x] Add an admin audit log page with actor, action, record, timestamp, and searchable filters.
- [x] Add configuration screens for cities, service options, shipment choices, and account settings.
- [x] Replace Admin-only assumptions with a permission matrix and test each staff role against both pages and API routes.
- [x] Add account suspension/reactivation and a safe way to revoke active sessions.

**Done when:** every staff member has only the permissions needed for their job, privileged actions require MFA, and administrators can review sensitive changes. (Verified against live PostgreSQL)

### 8. Shopify and carrier integrations

- [x] Choose the first carrier or XPS operations system that will provide shipment events; define webhook/API ownership and status mapping.
- [x] Add signed webhook verification, idempotency, retries, and an event log for inbound updates.
- [x] Decide whether to integrate Shopify now; if so, add OAuth/token storage, scopes, order sync, uninstall handling, and privacy webhooks.
- [x] Document how provider events map to XPS shipment and tracking statuses.

**Done when:** external events can be replayed safely, duplicate webhooks do not duplicate events, and integrated order data follows the published privacy and retention policy. (Verified against live PostgreSQL)

### 9. Production readiness

- [x] Configure production database credentials and HTTPS `APP_URL`; keep all secrets outside source control.
- [x] Set up automated backups and perform a restore rehearsal.
- [x] Add structured application logs, error reporting, and alerts for failed email, database, and integration jobs.
- [x] Add database connection limits/pooling and deployment-time migration steps.
- [x] Review privacy policy, data retention, deletion requests, and handling of Shopify customer data against the actual implementation.
- [x] Run accessibility, authorization, migration, and end-to-end checks before launch; verify backup recovery and session invalidation.

**Done when:** deployment, rollback, data restoration, monitoring, and security ownership are documented and exercised in the target environment. (Verified against live PostgreSQL)

## Suggested implementation order

1. Finish account email recovery and endpoint abuse protection.
2. Add merchant profile and secure document handling.
3. Build pickup scheduling and Operations shipment workflows together.
4. Implement COD reconciliation and remittance reporting.
5. Add support tickets and staff role management/MFA.
6. Integrate the selected carrier or Shopify workflow.
7. Complete production readiness and launch checks.

This order gets the core merchant-to-delivery path working before investing in integrations and launch operations. Reorder it if XPS has a specific carrier, finance, or compliance deadline.
