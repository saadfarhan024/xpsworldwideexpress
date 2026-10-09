"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { PAKISTAN_CITIES } from "@/lib/pakistan-cities";
import { calculateShipmentPricing } from "@/lib/shipment-pricing";

const fieldClass = "mt-2 h-12.5 w-full rounded-lg border border-[#d7d8da] bg-white px-4 text-[14px] text-[#25262a] outline-none transition placeholder:text-[#a7a8ac] focus:border-[#163e6a] focus:ring-3 focus:ring-[#163e6a]/10";
const readonlyClass = "bg-[#f0f0ef] text-[#75767a]";
const labelClass = "block text-[13px] font-semibold text-[#74757b]";
const requiredMark = <span className="text-[#ed171d]">*</span>;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="overflow-hidden rounded-lg border border-[#dedfe2]"><h2 className="m-0 bg-[#202426] px-5 py-3 text-[17px] font-medium text-white">{title}</h2><div className="grid gap-5 p-5">{children}</div></section>;
}

function Field({ label, name, required, children, className = "" }: { label: string; name: string; required?: boolean; children: ReactNode; className?: string }) {
  return <label className={`${labelClass} ${className}`} htmlFor={name}>{required && requiredMark}{label}{children}</label>;
}

type PickupDefaults = { city: string; name: string; phone: string; email: string; address: string };

export function ShipmentCreateForm({ pickupDefaults }: { pickupDefaults: PickupDefaults }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [inputs, setInputs] = useState({ productType: "Parcel", serviceType: "Overnight", pieces: "1", weightKg: "0.5", codAmount: "0" });
  const pricing = useMemo(() => calculateShipmentPricing({ productType: inputs.productType, serviceType: inputs.serviceType, pieces: Number(inputs.pieces) || 1, weightKg: Number(inputs.weightKg) || 0.5, codAmount: Number(inputs.codAmount) || 0 }), [inputs]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(formData.entries());
    values.deliveryCharges = pricing.deliveryCharges.toFixed(2);
    values.fuelSurchargePercent = pricing.fuelSurchargePercent.toFixed(2);
    values.totalCharges = pricing.totalCharges.toFixed(2);
    values.salesTax = pricing.salesTax.toFixed(2);
    values.netAmount = pricing.netAmount.toFixed(2);
    values.allowToOpen = formData.get("allowToOpen") === "on" ? "true" : "false";
    try {
      const response = await fetch("/api/shipments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const result = await response.json() as { message?: string; shipment?: { trackingCode: string } };
      if (!response.ok || !result.shipment) throw new Error(result.message ?? "Could not create shipment.");
      router.push(`/account/shipments/${result.shipment.trackingCode}`);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create shipment.");
      setSubmitting(false);
    }
  };

  return <form className="space-y-6" onSubmit={submit}>
    <div className="rounded-xl border border-[#e5e6e9] bg-white p-5 shadow-[0_8px_24px_rgba(24,25,30,0.04)] sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-4"><div><p className="m-0 text-[11px] font-bold uppercase tracking-[0.15em] text-[#ec8123]">Order setup</p><p className="mb-0 mt-1 text-[13px] text-[#85868c]">Choose the service and booking date.</p></div><span className="hidden rounded-full bg-[#f1f5fa] px-3 py-1 text-[11px] font-semibold text-[#163e6a] sm:inline-flex">Step 1 of 3</span></div>
      <div className="grid grid-cols-3 gap-5 max-[760px]:grid-cols-1">
      <Field label="Product Type" name="productType" required><select className={fieldClass} id="productType" name="productType" value={inputs.productType} onChange={(event) => setInputs({ ...inputs, productType: event.target.value })} required><option>Parcel</option><option>Document</option><option>Fragile</option><option>Electronics</option></select></Field>
      <Field label="Service Type" name="serviceType" required><select className={fieldClass} id="serviceType" name="serviceType" value={inputs.serviceType} onChange={(event) => setInputs({ ...inputs, serviceType: event.target.value })} required><option>Overnight</option><option>Same Day</option><option>Economy</option><option>International</option></select></Field>
      <Field label="Order Date" name="orderDate" required><input className={fieldClass} id="orderDate" name="orderDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></Field>
      </div>
    </div>

    <div className="grid grid-cols-2 items-start gap-6 max-[1100px]:grid-cols-1">
      <Section title="Pickup Details"><div className="grid grid-cols-2 gap-4 max-[600px]:grid-cols-1">
        <Field label="City/Area" name="pickupCity" required><input className={`${fieldClass} ${readonlyClass} cursor-not-allowed`} id="pickupCity" name="pickupCity" defaultValue={pickupDefaults.city} readOnly required /></Field>
        <Field label="Select Profile" name="pickupProfile"><select className={fieldClass} id="pickupProfile" name="pickupProfile" defaultValue="Primary pickup profile"><option>Primary pickup profile</option></select></Field>
        <Field label="Name" name="pickupName" required><input className={fieldClass} id="pickupName" name="pickupName" autoComplete="name" defaultValue={pickupDefaults.name} required /></Field>
        <Field label="Phone" name="pickupPhone" required><input className={fieldClass} id="pickupPhone" name="pickupPhone" type="tel" autoComplete="tel" defaultValue={pickupDefaults.phone} required /></Field>
        <Field label="Email" name="pickupEmail" required className="col-span-2 max-[600px]:col-span-1"><input className={fieldClass} id="pickupEmail" name="pickupEmail" type="email" autoComplete="email" defaultValue={pickupDefaults.email} required /></Field>
        <Field label="Address" name="pickupAddress" required className="col-span-2 max-[600px]:col-span-1"><textarea className={`${fieldClass} h-auto min-h-20 resize-y py-3`} id="pickupAddress" name="pickupAddress" defaultValue={pickupDefaults.address} required /></Field>
        <Field label="Pickup Address" name="pickupAddressLine2" className="col-span-2 max-[600px]:col-span-1"><textarea className={`${fieldClass} h-auto min-h-20 resize-y py-3`} id="pickupAddressLine2" name="pickupAddressLine2" /></Field>
      </div></Section>

      <Section title="Delivery Details"><div className="grid grid-cols-2 gap-4 max-[600px]:grid-cols-1">
        <Field label="City/Area" name="destinationCity" required><select className={fieldClass} id="destinationCity" name="destinationCity" defaultValue="" required><option value="" disabled>Select Destination</option>{Array.from(new Set(PAKISTAN_CITIES)).map((city) => <option key={city}>{city}</option>)}</select></Field>
        <Field label="Name" name="recipientName" required><input className={fieldClass} id="recipientName" name="recipientName" placeholder="Consignee Name" autoComplete="name" required /></Field>
        <Field label="Email" name="recipientEmail"><input className={fieldClass} id="recipientEmail" name="recipientEmail" type="email" placeholder="Consignee Email" autoComplete="email" /></Field>
        <Field label="Phone" name="recipientPhone" required><input className={fieldClass} id="recipientPhone" name="recipientPhone" type="tel" placeholder="Consignee Phone" autoComplete="tel" required /></Field>
        <Field label="Consignee Address" name="deliveryAddress" required className="col-span-2 max-[600px]:col-span-1"><textarea className={`${fieldClass} h-auto min-h-25 resize-y py-3`} id="deliveryAddress" name="deliveryAddress" placeholder="Consignee Address" required /></Field>
        <Field label="Google Address" name="googleAddress" className="col-span-2 max-[600px]:col-span-1"><input className={fieldClass} id="googleAddress" name="googleAddress" placeholder="Google Address" /></Field>
      </div></Section>
    </div>

    <div className="grid grid-cols-2 items-start gap-6 max-[1100px]:grid-cols-1">
      <Section title="Shipment Details"><div className="grid grid-cols-2 gap-4 max-[600px]:grid-cols-1">
        <Field label="Item Detail" name="itemDescription" required><textarea className={`${fieldClass} h-auto min-h-20 resize-y py-3`} id="itemDescription" name="itemDescription" required /></Field>
        <Field label="Special Instruction" name="specialInstruction"><textarea className={`${fieldClass} h-auto min-h-20 resize-y py-3`} id="specialInstruction" name="specialInstruction" /></Field>
        <Field label="Reference No." name="referenceNumber"><input className={fieldClass} id="referenceNumber" name="referenceNumber" /></Field>
        <Field label="Order ID" name="orderId"><input className={fieldClass} id="orderId" name="orderId" /></Field>
        <Field label="No. of Pieces" name="pieces" required><input className={fieldClass} id="pieces" name="pieces" type="number" min="1" max="100" value={inputs.pieces} onChange={(event) => setInputs({ ...inputs, pieces: event.target.value })} required /></Field>
        <Field label="Weight (Kg)" name="weightKg" required><input className={fieldClass} id="weightKg" name="weightKg" type="number" min="0.001" step="0.001" value={inputs.weightKg} onChange={(event) => setInputs({ ...inputs, weightKg: event.target.value })} required /></Field>
        <Field label="COD Amount" name="codAmount" required><input className={fieldClass} id="codAmount" name="codAmount" type="number" min="0" step="0.01" value={inputs.codAmount} onChange={(event) => setInputs({ ...inputs, codAmount: event.target.value })} required /></Field>
        <label className="flex items-center gap-3 self-end pb-3 text-[13px] font-semibold text-[#74757b]" htmlFor="allowToOpen"><input className="size-4 accent-[#163e6a]" id="allowToOpen" name="allowToOpen" type="checkbox" />Allow to Open</label>
      </div></Section>

      <Section title="Price Information"><p className="-mb-1 text-[12px] leading-5 text-[#85868c]">Calculated automatically from the service, product, weight, pieces, and COD amount.</p><div className="grid grid-cols-3 gap-4 max-[600px]:grid-cols-1">
        <Field label="Delivery Charges" name="deliveryCharges" required><input className={`${fieldClass} ${readonlyClass} cursor-not-allowed`} id="deliveryCharges" name="deliveryCharges" value={pricing.deliveryCharges.toFixed(2)} disabled aria-disabled="true" /></Field>
        <Field label="Total Charges" name="totalCharges"><input className={`${fieldClass} ${readonlyClass} cursor-not-allowed`} id="totalCharges" name="totalCharges" value={pricing.totalCharges.toFixed(2)} disabled aria-disabled="true" /></Field>
        <Field label="Fuel Surcharge (%)" name="fuelSurchargePercent"><input className={`${fieldClass} ${readonlyClass} cursor-not-allowed`} id="fuelSurchargePercent" name="fuelSurchargePercent" value={pricing.fuelSurchargePercent.toFixed(2)} disabled aria-disabled="true" /></Field>
        <Field label="Sales Tax" name="salesTax" required><input className={`${fieldClass} ${readonlyClass} cursor-not-allowed`} id="salesTax" name="salesTax" value={pricing.salesTax.toFixed(2)} disabled aria-disabled="true" /></Field>
        <Field label="Net Amount" name="netAmount"><input className={`${fieldClass} ${readonlyClass} cursor-not-allowed`} id="netAmount" name="netAmount" value={pricing.netAmount.toFixed(2)} disabled aria-disabled="true" /></Field>
      </div></Section>
    </div>

    {error && <p className="mb-0 rounded-lg bg-red-50 px-4 py-3 text-[13px] text-red-700" role="alert">{error}</p>}
    <div className="flex flex-wrap gap-4"><button className="min-h-12 rounded-lg bg-[#87d500] px-7 text-[14px] font-semibold text-[#142000] transition hover:bg-[#72b600] disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={submitting}>{submitting ? "Saving…" : "Save"}</button><button className="min-h-12 rounded-lg bg-[#b9b9bb] px-7 text-[14px] font-semibold text-[#202126] transition hover:bg-[#a7a7a9] disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={submitting}>Save &amp; Print</button></div>
  </form>;
}
