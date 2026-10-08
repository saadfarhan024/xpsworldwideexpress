"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, LockKeyhole, MailCheck } from "lucide-react";

type AccountTokenFormProps = {
  mode: "verify-email" | "reset-password";
  token: string;
};

const inputClass = "mt-2 h-12.5 w-full rounded-lg border border-[#e1e2e5] bg-white px-4 text-[14px] text-[#25262a] outline-none transition placeholder:text-[#9a9ba0] focus:border-[#163e6a] focus:ring-3 focus:ring-[#163e6a]/10";

export function AccountTokenForm({ mode, token }: AccountTokenFormProps) {
  const isVerification = mode === "verify-email";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    if (!token) {
      setMessage("This link is missing its security token. Request a new link and try again.");
      return;
    }
    if (!isVerification && password !== confirmPassword) {
      setMessage("The passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(isVerification ? "/api/auth/verify-email" : "/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isVerification ? { token } : { token, password }),
      });
      const result = await response.json() as { message?: string };
      setMessage(result.message ?? "We could not complete this request.");
      setSuccess(response.ok);
    } catch {
      setMessage("We could not connect to the account service. Please try again.");
      setSuccess(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-[#f6f6f7] px-5 py-18 max-[760px]:py-11">
      <div className="mx-auto max-w-135 rounded-2xl border border-[#e8e8eb] bg-white p-[clamp(24px,5vw,44px)] shadow-[0_16px_48px_rgba(23,24,30,0.08)]">
        <span className="mb-5 grid size-12 place-items-center rounded-xl bg-[#fff3e8] text-[#163e6a]">
          {isVerification ? <MailCheck className="size-6" aria-hidden="true" /> : <LockKeyhole className="size-6" aria-hidden="true" />}
        </span>
        <h2 className="m-0 text-[25px] font-semibold text-[#202126]">{isVerification ? "Verify your email" : "Choose a new password"}</h2>
        <p className="mb-6 mt-2 text-[14px] leading-6 text-[#6d6e74]">
          {isVerification
            ? "Confirm your email address to send your business application for review."
            : "Choose a password with at least 8 characters, including a letter and a number. This reset link can only be used once."}
        </p>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          {!isVerification && (
            <>
              <label className="text-[13px] font-medium text-[#45464b]" htmlFor="new-password">New password
                <input className={inputClass} id="new-password" type="password" minLength={8} autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
              </label>
              <label className="text-[13px] font-medium text-[#45464b]" htmlFor="confirm-password">Confirm new password
                <input className={inputClass} id="confirm-password" type="password" minLength={8} autoComplete="new-password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
              </label>
            </>
          )}
          <button className="mt-1 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#163e6a] px-5 text-[14px] font-semibold text-white transition hover:bg-[#ec8123] disabled:cursor-not-allowed disabled:opacity-65" type="submit" disabled={submitting || success}>
            {submitting ? "Please wait…" : success ? "Completed" : isVerification ? "Verify email" : "Update password"}
            {success ? <CheckCircle2 className="size-4" aria-hidden="true" /> : <ArrowRight className="size-4" aria-hidden="true" />}
          </button>
        </form>

        {message && <p className={`mb-0 mt-4 rounded-lg px-4 py-3 text-[13px] leading-5 ${success ? "bg-emerald-50 text-emerald-800" : "bg-[#fff4e5] text-[#835813]"}`} role="status">{message}</p>}
        {success && <p className="mb-0 mt-4 text-[13px] text-[#686970]">{isVerification ? "Your application is now awaiting review." : "Your password has been changed."} <Link className="font-semibold text-[#163e6a] hover:underline" href="/login">Continue to login</Link></p>}
        {!success && isVerification && (
          <p className="mb-0 mt-4 text-[13px] text-[#686970]">
            Need a new link? <Link className="font-semibold text-[#163e6a] hover:underline" href="/resend-verification">Resend verification email</Link>
          </p>
        )}
        {!token && (
          <p className="mb-0 mt-4 text-[13px] text-[#686970]">
            Go back to{" "}
            <Link className="font-semibold text-[#163e6a] hover:underline" href={isVerification ? "/resend-verification" : "/forgot-password"}>
              {isVerification ? "request a new verification link" : "request a new reset link"}
            </Link>
            .
          </p>
        )}
      </div>
    </section>
  );
}
