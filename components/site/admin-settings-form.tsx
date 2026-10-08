"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";

const inputClass =
  "mt-1.5 h-11 w-full rounded-lg border border-[#dedfe2] bg-white px-3.5 text-[13px] text-[#25262a] outline-none transition focus:border-[#163e6a] focus:ring-3 focus:ring-[#163e6a]/10";
const labelClass = "block text-[13px] font-semibold text-[#45464b]";

export function AdminSettingsForm() {
  const [cities, setCities] = useState("");
  const [serviceTiers, setServiceTiers] = useState("");
  const [cutoffTime, setCutoffTime] = useState("17:00");
  const [supportPhone, setSupportPhone] = useState("+92 300 1234567");
  const [supportEmail, setSupportEmail] = useState("support@godeliveryexpress.com");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    fetch("/api/admin/settings", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json() as { settings?: Record<string, string>; message?: string };
        if (!res.ok) throw new Error(data.message ?? "Could not load settings.");

        if (!ignore) {
          const s = data.settings ?? {};
          if (s.service_cities) {
            try {
              const parsed = JSON.parse(s.service_cities);
              setCities(Array.isArray(parsed) ? parsed.join(", ") : s.service_cities);
            } catch {
              setCities(s.service_cities);
            }
          }
          if (s.service_tiers) {
            try {
              const parsed = JSON.parse(s.service_tiers);
              setServiceTiers(Array.isArray(parsed) ? parsed.join(", ") : s.service_tiers);
            } catch {
              setServiceTiers(s.service_tiers);
            }
          }
          if (s.daily_cutoff_time) setCutoffTime(s.daily_cutoff_time);
          if (s.support_phone) setSupportPhone(s.support_phone);
          if (s.support_email) setSupportEmail(s.support_email);
        }
      })
      .catch((err) => {
        if (!ignore) setError(err instanceof Error ? err.message : "Failed to load settings.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const cityList = cities
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      const tierList = serviceTiers
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_cities: JSON.stringify(cityList),
          service_tiers: JSON.stringify(tierList),
          daily_cutoff_time: cutoffTime,
          support_phone: supportPhone,
          support_email: supportEmail,
        }),
      });

      const data = await res.json() as { message?: string };
      if (!res.ok) throw new Error(data.message ?? "Could not save settings.");

      setMessage(data.message ?? "System settings saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="mt-8 text-[14px] text-[#686970]">Loading platform settings…</p>;

  return (
    <form onSubmit={handleSave} className="mt-8 grid max-w-220 gap-6">
      {message && <div className="rounded-xl bg-emerald-50 p-4 text-[13px] text-emerald-800">{message}</div>}
      {error && <div className="rounded-xl bg-red-50 p-4 text-[13px] text-red-700">{error}</div>}

      <div className="rounded-2xl border border-[#e5e6e9] bg-white p-6 shadow-xs">
        <h3 className="m-0 text-[16px] font-semibold text-[#163e6a]">Logistics Network & Routing</h3>
        <p className="mb-5 mt-1 text-[13px] text-[#686970]">
          Configure cities serviced by Go Delivery courier network and service speed tiers.
        </p>

        <div className="grid gap-4.5">
          <label className={labelClass}>
            Serviced Cities (comma-separated)
            <textarea
              rows={3}
              className={`${inputClass} min-h-20 resize-y py-2.5`}
              value={cities}
              onChange={(e) => setCities(e.target.value)}
              placeholder="Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad, Multan…"
            />
          </label>

          <label className={labelClass}>
            Domestic Service Tiers (comma-separated)
            <input
              className={inputClass}
              value={serviceTiers}
              onChange={(e) => setServiceTiers(e.target.value)}
              placeholder="Domestic Overnight, Same-Day Express, Economy Ground"
            />
          </label>

          <label className={labelClass}>
            Daily Dispatch Pickup Cutoff Time
            <input
              type="time"
              className={inputClass}
              value={cutoffTime}
              onChange={(e) => setCutoffTime(e.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-[#e5e6e9] bg-white p-6 shadow-xs">
        <h3 className="m-0 text-[16px] font-semibold text-[#163e6a]">Customer Support Contacts</h3>
        <p className="mb-5 mt-1 text-[13px] text-[#686970]">
          Contact endpoints published to merchant portals and automated status notifications.
        </p>

        <div className="grid grid-cols-2 gap-4 max-[600px]:grid-cols-1">
          <label className={labelClass}>
            Support Helpline Phone
            <input
              className={inputClass}
              value={supportPhone}
              onChange={(e) => setSupportPhone(e.target.value)}
            />
          </label>

          <label className={labelClass}>
            Support Email Address
            <input
              type="email"
              className={inputClass}
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#163e6a] px-6 text-[13px] font-semibold text-white shadow-xs hover:bg-[#ec8123] disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Configurations"} <ArrowRight className="size-4" />
        </button>
      </div>
    </form>
  );
}
