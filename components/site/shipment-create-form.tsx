"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const fieldClass = "mt-2 h-12.5 w-full rounded-lg border border-[#e1e2e5] bg-white px-4 text-[14px] text-[#25262a] outline-none transition placeholder:text-[#9a9ba0] focus:border-[#163e6a] focus:ring-3 focus:ring-[#163e6a]/10";
const labelClass = "block text-[13px] font-medium text-[#45464b]";

export function ShipmentCreateForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await response.json() as { message?: string; shipment?: { trackingCode: string } };
      if (!response.ok || !result.shipment) throw new Error(result.message ?? "Could not create shipment.");
      router.push(`/account/shipments/${result.shipment.trackingCode}`);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create shipment.");
      setSubmitting(false);
    }
  };

  return (
    <form className="rounded-2xl border border-[#e5e6e9] bg-white p-6 shadow-[0_8px_24px_rgba(24,25,30,0.04)]" onSubmit={submit}>
      <div className="grid grid-cols-2 gap-x-5 gap-y-5 max-[600px]:grid-cols-1">
        <label className={labelClass} htmlFor="recipientName">Recipient name
          <input className={fieldClass} id="recipientName" name="recipientName" autoComplete="name" required />
        </label>
        <label className={labelClass} htmlFor="recipientPhone">Recipient phone
          <input className={fieldClass} id="recipientPhone" name="recipientPhone" type="tel" autoComplete="tel" required />
        </label>
        <label className={labelClass} htmlFor="destinationCity">Destination city
          <input className={fieldClass} id="destinationCity" name="destinationCity" required />
        </label>
        <label className={labelClass} htmlFor="pieces">Number of parcels
          <input className={fieldClass} id="pieces" name="pieces" type="number" min="1" max="100" defaultValue="1" required />
        </label>
        <label className={`${labelClass} col-span-2 max-[600px]:col-span-1`} htmlFor="deliveryAddress">Delivery address
          <textarea className={`${fieldClass} min-h-25 resize-y py-3`} id="deliveryAddress" name="deliveryAddress" required />
        </label>
        <label className={labelClass} htmlFor="itemDescription">Item description <span className="font-normal text-[#898a90]">(optional)</span>
          <input className={fieldClass} id="itemDescription" name="itemDescription" />
        </label>
        <label className={labelClass} htmlFor="codAmount">Cash on delivery (PKR) <span className="font-normal text-[#898a90]">(optional)</span>
          <input className={fieldClass} id="codAmount" name="codAmount" type="number" min="0" step="0.01" />
        </label>
      </div>
      {error && <p className="mb-0 mt-5 rounded-lg bg-red-50 px-4 py-3 text-[13px] text-red-700" role="alert">{error}</p>}
      <button className="mt-6 inline-flex min-h-12 items-center justify-center rounded-lg bg-[#163e6a] px-5 text-[14px] font-semibold text-white transition hover:bg-[#ec8123] disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={submitting}>
        {submitting ? "Creating shipment…" : "Create shipment"}
      </button>
    </form>
  );
}
