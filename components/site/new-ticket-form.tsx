"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";

const inputClass =
  "mt-1.5 h-11 w-full rounded-lg border border-[#dedfe2] bg-white px-3.5 text-[13px] text-[#25262a] outline-none transition focus:border-[#163e6a] focus:ring-3 focus:ring-[#163e6a]/10";
const labelClass = "block text-[13px] font-medium text-[#45464b]";

export function NewTicketForm() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/account/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          trackingCode: trackingCode || undefined,
          priority,
          message,
        }),
      });

      const data = await res.json() as { ticket?: { id: string }; message?: string };
      if (!res.ok) throw new Error(data.message ?? "Could not create ticket.");

      router.push(`/account/tickets/${data.ticket!.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 grid gap-6">
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-[13px] text-red-700" role="alert">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-[#e5e6e9] bg-white p-6 md:p-8 shadow-[0_4px_16px_rgba(24,25,30,0.02)]">
        <div className="grid gap-4.5">
          <label className={labelClass}>
            Subject
            <input
              required
              className={inputClass}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Delivery status inquiry for Lahore shipment"
              maxLength={150}
            />
          </label>

          <div className="grid grid-cols-2 gap-4 max-[600px]:grid-cols-1">
            <label className={labelClass}>
              Related Tracking Code (optional)
              <input
                className={inputClass}
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                placeholder="e.g. XPS-A1B2C3D4E5F6"
                maxLength={40}
              />
            </label>

            <label className={labelClass}>
              Priority
              <select
                className={inputClass}
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </label>
          </div>

          <label className={labelClass}>
            Describe your issue or request
            <textarea
              required
              rows={5}
              className={`${inputClass} min-h-32 resize-y py-3`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Provide as much detail as possible so our support team can resolve your query promptly…"
            />
          </label>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Link
          href="/account/tickets"
          className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#686970] hover:text-[#202126]"
        >
          <ArrowLeft className="size-4" /> Cancel
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#163e6a] px-6 text-[13px] font-semibold text-white shadow-xs hover:bg-[#ec8123] disabled:opacity-50"
        >
          {submitting ? "Opening ticket…" : "Submit ticket"} <ArrowRight className="size-4" />
        </button>
      </div>
    </form>
  );
}
