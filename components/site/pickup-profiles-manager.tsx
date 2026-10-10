"use client";

import { useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { PAKISTAN_CITIES } from "@/lib/pakistan-cities";

type PickupProfile = { id: string; shipperName: string; shipperPhone: string; shipperEmail: string; origin: string; shipperAddress: string };
const inputClass = "mt-2 h-11 w-full rounded-lg border border-[#e1e2e5] bg-white px-3 text-[14px] text-[#25262a] outline-none transition focus:border-[#163e6a] focus:ring-3 focus:ring-[#163e6a]/10";

export function PickupProfilesManager({ initialProfiles }: { initialProfiles: PickupProfile[] }) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [message, setMessage] = useState("");

  const addProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    setSaving(true);
    setMessage("");
    const form = new FormData(formElement);
    try {
      const response = await fetch("/api/account/pickup-profiles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(form.entries())) });
      const result = await response.json() as { profile?: PickupProfile; message?: string };
      if (!response.ok || !result.profile) throw new Error(result.message ?? "Could not add pickup profile.");
      setProfiles((current) => [result.profile!, ...current]);
      setAdding(false);
      formElement.reset();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Could not add pickup profile.");
    } finally {
      setSaving(false);
    }
  };

  const deleteProfile = async (id: string) => {
    setDeletingId(id);
    setMessage("");
    try {
      const response = await fetch(`/api/account/pickup-profiles/${id}`, { method: "DELETE" });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message ?? "Could not delete pickup profile.");
      setProfiles((current) => current.filter((profile) => profile.id !== id));
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Could not delete pickup profile.");
    } finally {
      setDeletingId("");
    }
  };

  return <div className="grid gap-6">
    <div className="flex justify-end"><button className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#163e6a] px-4 text-[13px] font-semibold text-white hover:bg-[#ec8123]" type="button" onClick={() => { setAdding((current) => !current); setMessage(""); }}><Plus className="size-4" /> {adding ? "Cancel" : "Add profile"}</button></div>
    {adding && <form className="grid gap-5 rounded-2xl border border-[#e5e6e9] bg-white p-6 shadow-[0_8px_24px_rgba(24,25,30,0.04)]" onSubmit={addProfile}>
      <h2 className="m-0 text-[18px] font-semibold text-[#25262a]">New pickup profile</h2>
      <div className="grid grid-cols-2 gap-5 max-[700px]:grid-cols-1">
        <label className="text-[13px] font-medium text-[#45464b]">Shipper name<input className={inputClass} name="shipperName" required /></label>
        <label className="text-[13px] font-medium text-[#45464b]">Shipper phone<input className={inputClass} name="shipperPhone" type="tel" required /></label>
        <label className="text-[13px] font-medium text-[#45464b]">Shipper email<input className={inputClass} name="shipperEmail" type="email" required /></label>
        <label className="text-[13px] font-medium text-[#45464b]">Origin<select className={inputClass} name="origin" defaultValue="" required><option value="" disabled>Select city</option>{PAKISTAN_CITIES.map((city) => <option key={city} value={city}>{city}</option>)}</select></label>
        <label className="col-span-2 text-[13px] font-medium text-[#45464b] max-[700px]:col-span-1">Shipper address<textarea className={`${inputClass} h-auto min-h-24 resize-y py-3`} name="shipperAddress" required /></label>
      </div>
      <div><button className="min-h-11 rounded-lg bg-[#163e6a] px-5 text-[13px] font-semibold text-white hover:bg-[#ec8123] disabled:opacity-65" type="submit" disabled={saving}>{saving ? "Adding…" : "Add profile"}</button></div>
    </form>}
    <div className="overflow-x-auto rounded-2xl border border-[#e5e6e9] bg-white shadow-[0_8px_24px_rgba(24,25,30,0.04)]"><table className="w-full min-w-250 text-left text-[13px]"><thead className="bg-[#f8f8f9] text-[11px] font-semibold uppercase tracking-wide text-[#77787e]"><tr><th className="px-4 py-3">Profile ID</th><th className="px-4 py-3">Shipper Name</th><th className="px-4 py-3">Shipper Phone</th><th className="px-4 py-3">Shipper Email</th><th className="px-4 py-3">Origin</th><th className="px-4 py-3">Shipper Address</th><th className="px-4 py-3">Action</th></tr></thead><tbody className="divide-y divide-[#eeeeef]">{profiles.length ? profiles.map((profile) => <tr key={profile.id}><td className="px-4 py-4 font-mono text-[11px] text-[#5e6068]">{profile.id}</td><td className="px-4 py-4 font-medium text-[#25262a]">{profile.shipperName}</td><td className="px-4 py-4">{profile.shipperPhone}</td><td className="px-4 py-4">{profile.shipperEmail}</td><td className="px-4 py-4">{profile.origin}</td><td className="max-w-80 px-4 py-4">{profile.shipperAddress}</td><td className="px-4 py-4"><button className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50" type="button" onClick={() => deleteProfile(profile.id)} disabled={deletingId === profile.id}><Trash2 className="size-3.5" /> {deletingId === profile.id ? "Deleting…" : "Delete"}</button></td></tr>) : <tr><td className="px-4 py-10 text-center text-[#686970]" colSpan={7}>No alternate pickup profiles yet.</td></tr>}</tbody></table></div>
    {message && <p className="mb-0 rounded-lg bg-red-50 px-4 py-3 text-[13px] text-red-700" role="alert">{message}</p>}
  </div>;
}
