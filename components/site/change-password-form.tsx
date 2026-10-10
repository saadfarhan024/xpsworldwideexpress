"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole } from "lucide-react";

const inputClass = "mt-2 h-12.5 w-full rounded-lg border border-[#e1e2e5] bg-white px-4 text-[14px] text-[#25262a] outline-none transition placeholder:text-[#9a9ba0] focus:border-[#163e6a] focus:ring-3 focus:ring-[#163e6a]/10";

export function ChangePasswordForm() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    if (newPassword !== confirmPassword) {
      setMessage("The new passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message ?? "Could not change your password.");
      router.replace("/login?passwordChanged=1");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Could not change your password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="max-w-150 rounded-2xl border border-[#e5e6e9] bg-white p-[clamp(22px,4vw,36px)] shadow-[0_8px_24px_rgba(24,25,30,0.04)]" onSubmit={submit}>
      <div className="mb-6 flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#fff3e8] text-[#163e6a]"><LockKeyhole className="size-6" aria-hidden="true" /></span>
        <p className="mb-0 mt-1 text-[13px] leading-6 text-[#686970]">Use at least 8 characters, including a letter and a number.</p>
      </div>
      <div className="grid gap-5">
        <label className="text-[13px] font-medium text-[#45464b]" htmlFor="current-password">Current password
          <input className={inputClass} id="current-password" type="password" autoComplete="current-password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
        </label>
        <label className="text-[13px] font-medium text-[#45464b]" htmlFor="new-password">New password
          <input className={inputClass} id="new-password" type="password" minLength={8} autoComplete="new-password" required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
        </label>
        <label className="text-[13px] font-medium text-[#45464b]" htmlFor="confirm-new-password">Confirm new password
          <input className={inputClass} id="confirm-new-password" type="password" minLength={8} autoComplete="new-password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
        </label>
      </div>
      <button className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#163e6a] px-5 text-[13px] font-semibold text-white transition hover:bg-[#ec8123] disabled:opacity-65" type="submit" disabled={submitting}>
        {submitting ? "Changing password…" : "Change password"} <ArrowRight className="size-4" aria-hidden="true" />
      </button>
      {message && <p className="mb-0 mt-4 rounded-lg bg-red-50 px-4 py-3 text-[13px] text-red-700" role="alert">{message}</p>}
    </form>
  );
}
