"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import { ArrowRight, Trash2, Upload } from "lucide-react";

type Profile = {
  email: string;
  companyName: string;
  contactName: string;
  phone: string;
  pickupAddress: string;
  city: string;
  website: string | null;
  accountNature: string;
  productType: string;
  monthlyShipmentVolume: string;
  hasLogo: boolean;
};

const inputClass =
  "mt-2 h-12.5 w-full rounded-lg border border-[#e1e2e5] bg-white px-4 text-[14px] text-[#25262a] outline-none transition placeholder:text-[#9a9ba0] focus:border-[#163e6a] focus:ring-3 focus:ring-[#163e6a]/10";
const labelClass = "block text-[13px] font-medium text-[#45464b]";

const cities = ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta", "Hyderabad", "Sialkot", "Gujranwala", "Other"];
const accountNatures = ["Individual", "Sole proprietorship", "Partnership", "Private limited company", "Other"];
const productTypes = ["Documents", "Clothing and fashion", "Electronics", "Health and beauty", "Food and grocery", "Home and lifestyle", "General merchandise", "Other"];
const volumes = ["1–50", "51–100", "101–250", "251–500", "501–1,000", "More than 1,000"];

export function MerchantProfileForm() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoVersion, setLogoVersion] = useState(0);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/account/profile", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json() as { profile?: Profile; message?: string };
        if (!response.ok) throw new Error(data.message ?? "Could not load profile.");
        setProfile(data.profile ?? null);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load profile."))
      .finally(() => setLoading(false));
  }, []);

  const updateField = <K extends keyof Profile>(key: K, value: Profile[K]) => {
    setProfile((current) => current ? { ...current, [key]: value } : current);
    setNotice("");
    setError("");
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile) return;
    setSaving(true);
    setNotice("");
    setError("");
    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const result = await response.json() as { profile?: Profile; message?: string };
      if (!response.ok) throw new Error(result.message ?? "Could not save profile.");
      if (result.profile) setProfile(result.profile);
      setNotice(result.message ?? "Profile updated.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async () => {
    if (!logoFile) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const body = new FormData();
      body.append("logo", logoFile);
      const response = await fetch("/api/account/logo", { method: "POST", body });
      const result = await response.json() as { message?: string; hasLogo?: boolean };
      if (!response.ok) throw new Error(result.message ?? "Could not upload logo.");
      setProfile((current) => current ? { ...current, hasLogo: true } : current);
      setLogoFile(null);
      setLogoVersion((value) => value + 1);
      setNotice(result.message ?? "Logo uploaded.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not upload logo.");
    } finally {
      setSaving(false);
    }
  };

  const removeLogo = async () => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/account/logo", { method: "DELETE" });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message ?? "Could not remove logo.");
      setProfile((current) => current ? { ...current, hasLogo: false } : current);
      setLogoVersion((value) => value + 1);
      setNotice(result.message ?? "Logo removed.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not remove logo.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-[14px] text-[#686970]">Loading profile…</p>;
  if (!profile) return <p className="rounded-lg bg-red-50 px-4 py-3 text-[13px] text-red-700" role="alert">{error || "Profile unavailable."}</p>;

  return (
    <div className="grid gap-6">
      <form className="rounded-2xl border border-[#e5e6e9] bg-white p-[clamp(22px,4vw,36px)] shadow-[0_8px_24px_rgba(24,25,30,0.04)]" onSubmit={saveProfile}>
        <h2 className="m-0 text-[20px] font-semibold text-[#25262a]">Business details</h2>
        <p className="mb-6 mt-1 text-[13px] text-[#77787e]">Signed in as {profile.email}</p>
        <div className="grid grid-cols-2 gap-x-5 gap-y-5 max-[650px]:grid-cols-1">
          <label className={labelClass}>Company / brand name
            <input className={inputClass} required value={profile.companyName} onChange={(event) => updateField("companyName", event.target.value)} />
          </label>
          <label className={labelClass}>Person of contact
            <input className={inputClass} required value={profile.contactName} onChange={(event) => updateField("contactName", event.target.value)} />
          </label>
          <label className={labelClass}>Phone
            <input className={inputClass} required value={profile.phone} onChange={(event) => updateField("phone", event.target.value)} />
          </label>
          <label className={labelClass}>City
            <select className={inputClass} required value={profile.city} onChange={(event) => updateField("city", event.target.value)}>
              {cities.map((city) => <option key={city} value={city}>{city}</option>)}
            </select>
          </label>
          <label className={`${labelClass} col-span-2 max-[650px]:col-span-1`}>Pickup address
            <textarea className={`${inputClass} min-h-24 resize-y py-3`} required value={profile.pickupAddress} onChange={(event) => updateField("pickupAddress", event.target.value)} />
          </label>
          <label className={labelClass}>Website
            <input className={inputClass} value={profile.website ?? ""} onChange={(event) => updateField("website", event.target.value || null)} placeholder="https://yourstore.com" />
          </label>
          <label className={labelClass}>Nature of account
            <select className={inputClass} required value={profile.accountNature} onChange={(event) => updateField("accountNature", event.target.value)}>
              {accountNatures.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className={labelClass}>Product type
            <select className={inputClass} required value={profile.productType} onChange={(event) => updateField("productType", event.target.value)}>
              {productTypes.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className={labelClass}>Expected monthly volume
            <select className={inputClass} required value={profile.monthlyShipmentVolume} onChange={(event) => updateField("monthlyShipmentVolume", event.target.value)}>
              {volumes.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        </div>
        <button className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#163e6a] px-5 text-[13px] font-semibold text-white transition hover:bg-[#ec8123] disabled:opacity-65" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save profile"} <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </form>

      <section className="rounded-2xl border border-[#e5e6e9] bg-white p-[clamp(22px,4vw,36px)] shadow-[0_8px_24px_rgba(24,25,30,0.04)]">
        <h2 className="m-0 text-[20px] font-semibold text-[#25262a]">Company logo</h2>
        <p className="mb-5 mt-1 text-[13px] text-[#77787e]">PNG, JPG, or WebP up to 2 MB. Logos are private to your account.</p>
        <div className="flex flex-wrap items-center gap-5">
          {profile.hasLogo ? (
            <Image
              width={80}
              height={80}
              unoptimized
              className="size-20 rounded-xl border border-[#e5e6e9] object-contain bg-[#fafafa]"
              src={`/api/account/logo?v=${logoVersion}`}
              alt="Company logo"
            />
          ) : (
            <div className="grid size-20 place-items-center rounded-xl border border-dashed border-[#d7d8dc] bg-[#fbfbfc] text-[11px] text-[#898a90]">No logo</div>
          )}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#d8d9dd] bg-white px-4 py-2.5 text-[13px] font-medium text-[#45464b] hover:bg-[#f7f7f8]">
            <Upload className="size-4 text-[#163e6a]" aria-hidden="true" />
            <span>{logoFile?.name || "Choose image"}</span>
            <input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)} />
          </label>
          <button className="rounded-lg bg-[#163e6a] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#ec8123] disabled:opacity-65" type="button" disabled={!logoFile || saving} onClick={uploadLogo}>Upload</button>
          {profile.hasLogo && (
            <button className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-[13px] font-semibold text-red-700 hover:bg-red-50 disabled:opacity-65" type="button" disabled={saving} onClick={removeLogo}>
              <Trash2 className="size-4" aria-hidden="true" /> Remove
            </button>
          )}
        </div>
      </section>

      {notice && <p className="mb-0 rounded-lg bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800" role="status">{notice}</p>}
      {error && <p className="mb-0 rounded-lg bg-red-50 px-4 py-3 text-[13px] text-red-700" role="alert">{error}</p>}
    </div>
  );
}
