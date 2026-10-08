"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Calendar, MapPin, Package } from "lucide-react";
import Link from "next/link";

type ShipmentItem = {
  id: string;
  trackingCode: string;
  recipientName: string;
  destinationCity: string;
  pieces: number;
};

const inputClass =
  "mt-1.5 h-11 w-full rounded-lg border border-[#e1e2e5] bg-white px-3.5 text-[13px] text-[#25262a] outline-none transition focus:border-[#163e6a] focus:ring-3 focus:ring-[#163e6a]/10";
const labelClass = "block text-[13px] font-medium text-[#45464b]";

const timeWindows = [
  "Morning (09:00 - 13:00)",
  "Afternoon (13:00 - 17:00)",
  "Evening (17:00 - 20:00)",
  "Anytime (09:00 - 18:00)",
];

export function PickupRequestForm({
  defaultAddress,
  defaultContact,
  defaultPhone,
}: {
  defaultAddress: string;
  defaultContact: string;
  defaultPhone: string;
}) {
  const router = useRouter();
  const [pickupAddress, setPickupAddress] = useState(defaultAddress);
  const [contactPerson, setContactPerson] = useState(defaultContact);
  const [contactPhone, setContactPhone] = useState(defaultPhone);
  const [requestedFor, setRequestedFor] = useState("");
  const [timeWindow, setTimeWindow] = useState(timeWindows[0]);
  const [note, setNote] = useState("");
  const [availableShipments, setAvailableShipments] = useState<ShipmentItem[]>([]);
  const [selectedShipmentIds, setSelectedShipmentIds] = useState<string[]>([]);
  const [loadingShipments, setLoadingShipments] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Load merchant's shipments that are in CREATED status
    fetch("/api/account/shipments/available-pickups", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) return [];
        const data = await res.json() as { shipments?: ShipmentItem[] };
        return data.shipments ?? [];
      })
      .then((items) => {
        setAvailableShipments(items);
        // Default select all available shipments
        setSelectedShipmentIds(items.map((i) => i.id));
      })
      .catch(() => {})
      .finally(() => setLoadingShipments(false));
  }, []);

  const toggleShipment = (id: string) => {
    setSelectedShipmentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedShipmentIds(availableShipments.map((s) => s.id));
  };

  const deselectAll = () => {
    setSelectedShipmentIds([]);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/account/pickups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickupAddress,
          contactPerson,
          contactPhone,
          requestedFor: requestedFor || null,
          timeWindow,
          note: note || null,
          shipmentIds: selectedShipmentIds,
        }),
      });

      const data = await response.json() as { message?: string };
      if (!response.ok) {
        throw new Error(data.message ?? "Could not schedule pickup request.");
      }

      router.push("/account/pickups");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create pickup request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 grid gap-7">
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-[13px] text-red-700" role="alert">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-[#e5e6e9] bg-white p-6 md:p-8">
        <h2 className="m-0 flex items-center gap-2 text-[18px] font-semibold text-[#202126]">
          <MapPin className="size-5 text-[#163e6a]" /> Collection location & contact
        </h2>
        <p className="mb-6 mt-1 text-[13px] text-[#77787e]">
          Specify where our dispatch courier should pick up your parcel packages.
        </p>

        <div className="grid grid-cols-2 gap-4 max-[650px]:grid-cols-1">
          <label className={`${labelClass} col-span-2 max-[650px]:col-span-1`}>
            Pickup address
            <textarea
              className={`${inputClass} min-h-22 resize-y py-2.5`}
              required
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              placeholder="Warehouse address, street, floor, area"
            />
          </label>
          <label className={labelClass}>
            Contact person
            <input
              className={inputClass}
              required
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
            />
          </label>
          <label className={labelClass}>
            Contact phone
            <input
              className={inputClass}
              required
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-[#e5e6e9] bg-white p-6 md:p-8">
        <h2 className="m-0 flex items-center gap-2 text-[18px] font-semibold text-[#202126]">
          <Calendar className="size-5 text-[#163e6a]" /> Schedule & preferred timing
        </h2>
        <p className="mb-6 mt-1 text-[13px] text-[#77787e]">
          Choose the date and time window best suited for dispatch collection.
        </p>

        <div className="grid grid-cols-2 gap-4 max-[650px]:grid-cols-1">
          <label className={labelClass}>
            Preferred pickup date
            <input
              type="date"
              className={inputClass}
              value={requestedFor}
              onChange={(e) => setRequestedFor(e.target.value)}
            />
          </label>
          <label className={labelClass}>
            Preferred time window
            <select
              className={inputClass}
              value={timeWindow}
              onChange={(e) => setTimeWindow(e.target.value)}
            >
              {timeWindows.map((tw) => (
                <option key={tw} value={tw}>
                  {tw}
                </option>
              ))}
            </select>
          </label>
          <label className={`${labelClass} col-span-2 max-[650px]:col-span-1`}>
            Special instructions for courier (optional)
            <input
              className={inputClass}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Ring warehouse bell on gate 2, ask for John"
              maxLength={400}
            />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-[#e5e6e9] bg-white p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="m-0 flex items-center gap-2 text-[18px] font-semibold text-[#202126]">
              <Package className="size-5 text-[#163e6a]" /> Link shipments (optional)
            </h2>
            <p className="mb-0 mt-1 text-[13px] text-[#77787e]">
              Select which ready shipments are included in this pickup request.
            </p>
          </div>
          {availableShipments.length > 0 && (
            <div className="flex gap-2 text-[12px]">
              <button
                type="button"
                onClick={selectAll}
                className="font-medium text-[#163e6a] hover:underline"
              >
                Select all ({availableShipments.length})
              </button>
              <span className="text-[#c5c6cb]">·</span>
              <button
                type="button"
                onClick={deselectAll}
                className="font-medium text-[#77787e] hover:underline"
              >
                Deselect
              </button>
            </div>
          )}
        </div>

        <div className="mt-5">
          {loadingShipments ? (
            <p className="text-[13px] text-[#77787e]">Loading ready shipments…</p>
          ) : availableShipments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#e1e2e5] p-5 text-center">
              <p className="m-0 text-[13px] text-[#77787e]">
                No unscheduled shipments found. You can still schedule an open pickup request.
              </p>
            </div>
          ) : (
            <div className="max-h-70 divide-y divide-[#eeeeef] overflow-y-auto rounded-xl border border-[#e5e6e9]">
              {availableShipments.map((s) => {
                const isChecked = selectedShipmentIds.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className={`flex cursor-pointer items-center justify-between p-3.5 text-[13px] transition hover:bg-[#f9fafb] ${
                      isChecked ? "bg-[#f4f7fb]" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleShipment(s.id)}
                        className="size-4 rounded border-[#d1d5db] text-[#163e6a] focus:ring-[#163e6a]"
                      />
                      <div>
                        <span className="font-mono font-semibold text-[#163e6a]">
                          {s.trackingCode}
                        </span>
                        <span className="ml-3 text-[#45464b]">{s.recipientName}</span>
                      </div>
                    </div>
                    <div className="text-right text-[12px] text-[#77787e]">
                      <span>{s.destinationCity}</span> · <span>{s.pieces} parcel(s)</span>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Link
          href="/account/pickups"
          className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#686970] hover:text-[#202126]"
        >
          <ArrowLeft className="size-4" /> Cancel
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#163e6a] px-6 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#ec8123] disabled:opacity-60"
        >
          {submitting ? "Submitting request…" : "Request pickup"}{" "}
          <ArrowRight className="size-4" />
        </button>
      </div>
    </form>
  );
}
