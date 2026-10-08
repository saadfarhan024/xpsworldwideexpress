"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { pageWrap } from "@/components/site/styles";

type AccountAccessFormProps = {
  mode: "login" | "forgot-password" | "resend-verification";
};

const inputClass =
  "mt-2 h-13 w-full rounded-lg border border-[#e1e2e5] bg-white px-4 text-[14px] text-[#25262a] outline-none transition placeholder:text-[#9a9ba0] focus:border-[#163e6a] focus:ring-3 focus:ring-[#163e6a]/10";

const copy = {
  login: {
    panelTitle: "Welcome back to better delivery.",
    panelBody: "Sign in to manage your shipping account and keep your business moving.",
    eyebrow: "Account access",
    heading: "Log in",
    intro: "Enter your account details to continue.",
    submit: "Log in",
    endpoint: "/api/auth/login",
  },
  "forgot-password": {
    panelTitle: "Get back to business with XPS.",
    panelBody: "Enter the email address linked to your account and we’ll help you reset your password.",
    eyebrow: "Account recovery",
    heading: "Forgot password?",
    intro: "We’ll use your email to identify your account.",
    submit: "Send reset instructions",
    endpoint: "/api/auth/forgot-password",
  },
  "resend-verification": {
    panelTitle: "Finish verifying your email.",
    panelBody: "Enter the email you used to register and we’ll send a fresh verification link if needed.",
    eyebrow: "Email verification",
    heading: "Resend verification",
    intro: "We’ll send a new link if an unverified account matches this address.",
    submit: "Send verification link",
    endpoint: "/api/auth/resend-verification",
  },
} as const;

export function AccountAccessForm({ mode }: AccountAccessFormProps) {
  const isLogin = mode === "login";
  const content = copy[mode];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState("");
  const [showResendLink, setShowResendLink] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setNotice("");
    setShowResendLink(false);

    try {
      const response = await fetch(content.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isLogin ? { email, password } : { email }),
      });
      const result = await response.json() as { message?: string; destination?: string; resendVerification?: boolean };
      if (!response.ok) {
        setNotice(result.message ?? "We could not complete that request. Please try again.");
        setShowResendLink(Boolean(result.resendVerification));
        return;
      }
      if (result.destination) {
        window.location.assign(result.destination);
        return;
      }
      setNotice(result.message ?? "Request received.");
    } catch {
      setNotice("We could not connect to the account service. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-[#f6f6f7] py-18 max-[760px]:py-11">
      <div className={`${pageWrap} max-w-230`}>
        <div className="grid min-h-125 grid-cols-2 overflow-hidden rounded-2xl bg-white shadow-[0_18px_54px_rgba(23,24,30,0.1)] max-[760px]:grid-cols-1">
          <div
            className="relative isolate flex min-h-115 flex-col justify-between overflow-hidden bg-cover bg-center p-[clamp(28px,5vw,56px)] text-white max-[760px]:min-h-75"
            style={{
              backgroundImage:
                "linear-gradient(145deg,rgba(16,17,20,0.86),rgba(16,17,20,0.68)),url(https://xpsworldwideexpress.pk/img/img-cap6-300x300-1.jpg)",
            }}
          >
            <div className="pointer-events-none absolute -left-15 -top-20 -z-10 size-60 rounded-full border border-white/15 shadow-[0_0_0_35px_rgb(255_255_255/5%),0_0_0_70px_rgb(255_255_255/4%)]" />
            <div className="relative z-1">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white/65">XPS Worldwide Express</p>
              <h2 className="m-0 max-w-100 text-[clamp(29px,3.5vw,44px)] font-medium leading-[1.13]">{content.panelTitle}</h2>
            </div>
            <p className="relative z-1 mb-0 mt-8 max-w-100 text-[14px] leading-[1.8] text-white/80">{content.panelBody}</p>
          </div>

          <div className="flex items-center px-[clamp(26px,5vw,64px)] py-12 max-[760px]:py-9">
            <div className="w-full max-w-115">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#163e6a]">{content.eyebrow}</p>
              <h1 className="m-0 text-[clamp(29px,3vw,38px)] font-semibold leading-tight text-[#202126]">{content.heading}</h1>
              <p className="mb-7 mt-2 text-[14px] leading-6 text-[#77787e]">{content.intro}</p>

              <form className="grid gap-5" onSubmit={handleSubmit}>
                <label className="block text-[13px] font-medium text-[#45464b]" htmlFor="account-email">
                  Email address
                  <span className="relative mt-2 block">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#999aa0]" aria-hidden="true" />
                    <input
                      className={`${inputClass} pl-11`}
                      id="account-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(event) => { setEmail(event.target.value); setNotice(""); setShowResendLink(false); }}
                      required
                    />
                  </span>
                </label>

                {isLogin && (
                  <label className="block text-[13px] font-medium text-[#45464b]" htmlFor="account-password">
                    <span className="flex items-center justify-between gap-3">
                      <span>Password</span>
                      <Link className="text-[12px] font-medium text-[#ec8123] hover:underline" href="/forgot-password">Forgot password?</Link>
                    </span>
                    <span className="relative mt-2 block">
                      <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#999aa0]" aria-hidden="true" />
                      <input
                        className={`${inputClass} pr-12 pl-11`}
                        id="account-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(event) => { setPassword(event.target.value); setNotice(""); setShowResendLink(false); }}
                        required
                      />
                      <button
                        className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-[#77787e] hover:bg-[#f2f2f4]"
                        type="button"
                        onClick={() => setShowPassword((visible) => !visible)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                      </button>
                    </span>
                  </label>
                )}

                <button className="mt-1 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#163e6a] px-5 text-[14px] font-semibold text-white transition hover:bg-[#ec8123] disabled:cursor-not-allowed disabled:opacity-65" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Please wait…" : content.submit}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </button>
              </form>

              {notice && <p className="mb-0 mt-4 rounded-lg bg-[#fff4e5] px-4 py-3 text-[13px] leading-5 text-[#835813]" role="status">{notice}</p>}
              {showResendLink && (
                <p className="mb-0 mt-3 text-[13px] text-[#686970]">
                  Need a new link?{" "}
                  <Link className="font-semibold text-[#163e6a] hover:underline" href="/resend-verification">Resend verification email</Link>
                </p>
              )}

              <div className="mt-6 border-t border-[#eeeeef] pt-5 text-[13px] text-[#77787e]">
                {isLogin ? (
                  <p className="m-0">
                    New to XPS? <Link className="font-semibold text-[#ec8123] hover:underline" href="/register">Create a business account</Link>
                    <span className="mx-2 text-[#c7c7cb]">·</span>
                    <Link className="font-medium text-[#55565c] hover:text-[#ec8123]" href="/resend-verification">Resend verification</Link>
                  </p>
                ) : (
                  <Link className="inline-flex items-center gap-2 font-medium text-[#55565c] hover:text-[#ec8123]" href="/login"><ArrowLeft className="size-4" aria-hidden="true" /> Back to login</Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
