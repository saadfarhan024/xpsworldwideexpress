# XPS Carrier & Shopify Integration Specifications

This guide outlines the integration contracts for inbound carrier events and Shopify automated order syncing into the XPS logistics platform.

## 1. Inbound Carrier Webhooks

Endpoint: `POST /api/webhooks/carrier`

### Security & Signing
All carrier webhook requests must include an HMAC-SHA256 signature in the `x-carrier-signature` header computed across the raw JSON body using the shared secret (`CARRIER_WEBHOOK_SECRET`).

```text
x-carrier-signature: <hex-encoded-hmac-sha256>
Content-Type: application/json
```

### Inbound Payload Format
```json
{
  "eventId": "evt_98471203",
  "trackingCode": "XPS-A1B2C3D4E5F6",
  "status": "OUT_FOR_DELIVERY",
  "location": "Lahore Gulberg Sorting Hub",
  "notes": "With courier for final doorstep delivery",
  "occurredAt": "2026-10-08T09:30:00Z"
}
```

### Carrier Status Mapping to XPS Shipment Statuses

| Inbound Carrier Status | XPS Platform Status | Description |
| :--- | :--- | :--- |
| `MANIFEST_RECEIVED` | `CREATED` | Initial shipment details received |
| `PICKED_UP` | `PICKED_UP` | Collected from merchant origin |
| `IN_TRANSIT` | `IN_TRANSIT` | Moving between network transport legs |
| `ARRIVED_AT_SORT_FACILITY` | `AT_HUB` | Scanned into local distribution hub |
| `DEPARTED_FACILITY` | `IN_TRANSIT` | En route to destination city hub |
| `OUT_FOR_DELIVERY` | `OUT_FOR_DELIVERY` | Handed over to last-mile rider |
| `DELIVERED` | `DELIVERED` | Handed over to recipient (auto-collects COD) |
| `DELIVERY_ATTEMPT_FAILED` | `DELIVERY_ATTEMPTED` | Recipient unavailable or address closed |
| `DELIVERY_EXCEPTION` | `ON_HOLD` | Damaged packaging, disputed COD, or hold |
| `RETURN_TO_SENDER` | `RETURNED` | Returned back to merchant |
| `CANCELLED` | `CANCELLED` | Order voided |

### Idempotency & Replay Protection
- Events with identical `status` and `occurredAt` timestamp are ignored idempotently without duplicating public timeline events.
- Terminal statuses (`DELIVERED`, `RETURNED`, `CANCELLED`) reject invalid backward regressions.

---

## 2. Shopify Integration

Endpoint: `POST /api/webhooks/shopify`

### Supported Topics
1. `orders/create`:
   - Verifies `X-Shopify-Hmac-Sha256` signature using `SHOPIFY_API_SECRET`.
   - Extracts customer delivery address, items, and COD requirement (`financial_status: "pending"`).
   - Automatically registers an `XPS-...` tracking code and creates initial tracking event.
2. `app/uninstalled`:
   - Logs merchant shop deactivation in audit log.
3. GDPR Privacy Compliance:
   - `customers/data_request` (200 OK)
   - `customers/redact` (200 OK)
   - `shop/redact` (200 OK)
