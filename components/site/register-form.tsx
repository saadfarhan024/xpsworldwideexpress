"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Upload, Building2, UserRound, Truck, LockKeyhole } from "lucide-react";
import { pageWrap } from "@/components/site/styles";
import { PAKISTAN_CITIES } from "@/lib/pakistan-cities";

type RegistrationValues = {
  company: string;
  contact: string;
  phone: string;
  email: string;
  pickupAddress: string;
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  branchName: string;
  branchCode: string;
  swiftCode: string;
  iban: string;
  website: string;
  city: string;
  accountNature: string;
  productType: string;
  shipmentVolume: string;
  password: string;
  confirmPassword: string;
};

type ValueKey = keyof RegistrationValues;

const initialValues: RegistrationValues = {
  company: "",
  contact: "",
  phone: "",
  email: "",
  pickupAddress: "",
  bankName: "",
  accountTitle: "",
  accountNumber: "",
  branchName: "",
  branchCode: "",
  swiftCode: "",
  iban: "",
  website: "",
  city: "",
  accountNature: "",
  productType: "",
  shipmentVolume: "",
  password: "",
  confirmPassword: "",
};

const steps = [
  { title: "Personal info", detail: "Your business and contact details", icon: UserRound },
  { title: "Bank info", detail: "Optional payment details", icon: Building2 },
  { title: "Shipping info", detail: "Your delivery requirements", icon: Truck },
  { title: "Password", detail: "Secure your account", icon: LockKeyhole },
];

const inputClass =
  "mt-2 h-12.5 w-full rounded-lg border border-[#e1e2e5] bg-white px-4 text-[14px] text-[#25262a] outline-none transition placeholder:text-[#9a9ba0] focus:border-[#163e6a] focus:ring-3 focus:ring-[#163e6a]/10";
const labelClass = "block text-[13px] font-medium text-[#45464b]";

function TextField({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
  autoComplete,
  required = false,
}: {
  id: ValueKey;
  label: string;
  value: string;
  onChange: (id: ValueKey, value: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className={labelClass} htmlFor={id}>
      {label}{required && <span className="ml-1 text-[#163e6a]" aria-hidden="true">*</span>}
      <input
        className={`${inputClass} ${error ? "border-[#d7262e]" : ""}`}
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(event) => onChange(id, event.target.value)}
        placeholder={placeholder ?? label}
        autoComplete={autoComplete}
        required={required}
        aria-required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && <span id={`${id}-error`} className="mt-1 block text-xs text-[#c31d25]" role="alert">{error}</span>}
    </label>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  error,
  required = false,
}: {
  id: ValueKey;
  label: string;
  value: string;
  onChange: (id: ValueKey, value: string) => void;
  options: string[];
  error?: string;
  required?: boolean;
}) {
  return (
    <label className={labelClass} htmlFor={id}>
      {label}{required && <span className="ml-1 text-[#163e6a]" aria-hidden="true">*</span>}
      <select
        className={`${inputClass} appearance-none ${value ? "" : "text-[#9a9ba0]"} ${error ? "border-[#d7262e]" : ""}`}
        id={id}
        name={id}
        value={value}
        onChange={(event) => onChange(id, event.target.value)}
        required={required}
        aria-required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      >
        <option value="" disabled>Select {label.toLowerCase()}</option>
        {options.map((option) => <option value={option} key={option}>{option}</option>)}
      </select>
      {error && <span id={`${id}-error`} className="mt-1 block text-xs text-[#c31d25]" role="alert">{error}</span>}
    </label>
  );
}

export function RegisterForm() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(initialValues);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Partial<Record<ValueKey, string>>>({});
  const [notice, setNotice] = useState("");
  const [verificationUrl, setVerificationUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateValue = (id: ValueKey, value: string) => {
    setValues((current) => ({ ...current, [id]: value }));
    setErrors((current) => ({ ...current, [id]: undefined }));
    setNotice("");
    setVerificationUrl("");
  };

  const validateCurrentStep = () => {
    const nextErrors: Partial<Record<ValueKey, string>> = {};
    if (step === 0) {
      if (!values.company.trim()) nextErrors.company = "Enter your company or brand name.";
      if (!values.contact.trim()) nextErrors.contact = "Enter a contact person.";
      if (!values.phone.trim()) nextErrors.phone = "Enter a phone number.";
      if (!values.email.trim()) nextErrors.email = "Enter an email address.";
      else if (!/^\S+@\S+\.\S+$/.test(values.email)) nextErrors.email = "Enter a valid email address.";
      if (!values.pickupAddress.trim()) nextErrors.pickupAddress = "Enter your company or pickup address.";
    }
    if (step === 2) {
      if (!values.city) nextErrors.city = "Select a city.";
      if (!values.accountNature) nextErrors.accountNature = "Select an account type.";
      if (!values.productType) nextErrors.productType = "Select a product type.";
      if (!values.shipmentVolume) nextErrors.shipmentVolume = "Select an estimated monthly volume.";
      if (values.website && !/^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/.*)?$/i.test(values.website)) {
        nextErrors.website = "Enter a valid website address.";
      }
    }
    if (step === 3) {
      if (values.password.length < 8 || !/[A-Za-z]/.test(values.password) || !/\d/.test(values.password)) {
        nextErrors.password = "Use at least 8 characters with at least one letter and one number.";
      }
      if (!values.confirmPassword) nextErrors.confirmPassword = "Confirm your password.";
      else if (values.password !== values.confirmPassword) nextErrors.confirmPassword = "Passwords do not match.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const continueStep = () => {
    if (validateCurrentStep()) {
      setStep((current) => Math.min(current + 1, steps.length - 1));
      setNotice("");
      setVerificationUrl("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goBack = () => {
    setErrors({});
    setNotice("");
    setVerificationUrl("");
    setStep((current) => Math.max(current - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateCurrentStep()) return;
    setIsSubmitting(true);
    setNotice("");
    setVerificationUrl("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await response.json() as { message?: string; verificationUrl?: string };
      setNotice(result.message ?? "We could not submit your application. Please try again.");
      if (result.verificationUrl) {
        setVerificationUrl(result.verificationUrl);
      }
    } catch {
      setNotice("We could not connect to the registration service. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-[#f6f6f7] py-16 max-[760px]:py-10">
      <div className={`${pageWrap} max-w-230`}>
        <div className="mx-auto mb-8 max-w-170 text-center">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#163e6a]">Join our delivery network</p>
          <h2 className="m-0 text-[clamp(29px,3.5vw,42px)] font-medium leading-tight text-[#1c1d21]">Create your business account</h2>
          <p className="mb-0 mt-3 text-[14px] leading-6 text-[#6a6b71]">Complete a few details so we can tailor shipping services to your business.</p>
          <p className="mb-0 mt-2 text-[12px] text-[#77787e]">Fields marked <span className="font-semibold text-[#163e6a]">*</span> are required.</p>
        </div>

        <div className="mb-7 grid grid-cols-4 rounded-2xl border border-[#e9e9eb] bg-white p-2 shadow-[0_8px_28px_rgba(20,20,30,0.04)] max-[650px]:grid-cols-2 max-[650px]:gap-1.5">
          {steps.map(({ title, detail, icon: Icon }, index) => {
            const active = index === step;
            const complete = index < step;
            return (
              <div className={`flex min-h-21 items-center gap-3 rounded-xl px-3.5 py-3 transition ${active ? "bg-[#fff3e8]" : ""} max-[650px]:min-h-17`} aria-current={active ? "step" : undefined} key={title}>
                <span className={`grid size-10 shrink-0 place-items-center rounded-full ${complete ? "bg-[#163e6a] text-white" : active ? "bg-[#163e6a] text-white" : "bg-[#f0f0f2] text-[#77787e]"}`}>
                  {complete ? <Check className="size-4.5" aria-hidden="true" /> : <Icon className="size-4.5" aria-hidden="true" />}
                </span>
                <span className="min-w-0">
                  <span className={`block text-[13px] font-semibold ${active || complete ? "text-[#202126]" : "text-[#77787e]"}`}>{title}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-[#85868c] max-[420px]:hidden">{detail}</span>
                </span>
              </div>
            );
          })}
        </div>

        <form onSubmit={submitRegistration} noValidate className="rounded-2xl border border-[#e9e9eb] bg-white p-[clamp(22px,4vw,42px)] shadow-[0_14px_42px_rgba(20,20,30,0.06)]">
          <div className="mb-7 flex items-start justify-between gap-4 border-b border-[#eeeeef] pb-5">
            <div>
              <h3 className="m-0 text-[21px] font-semibold text-[#25262a]">{steps[step].title}</h3>
              <p className="mb-0 mt-1 text-[13px] text-[#77787e]">Step {step + 1} of {steps.length} <span className="px-1.5 text-[#c7c7cb]">·</span> {steps[step].detail}</p>
            </div>
            {step === 1 && <span className="rounded-full bg-[#f2f2f4] px-3 py-1.5 text-[11px] font-medium text-[#686970]">All fields optional</span>}
          </div>

          {step === 0 && (
            <div className="grid grid-cols-2 gap-x-5 gap-y-5 max-[600px]:grid-cols-1">
              <TextField id="company" label="Company / brand name" value={values.company} onChange={updateValue} error={errors.company} required />
              <TextField id="contact" label="Person of contact" value={values.contact} onChange={updateValue} error={errors.contact} required autoComplete="name" />
              <TextField id="phone" label="Phone" value={values.phone} onChange={updateValue} error={errors.phone} type="tel" required autoComplete="tel" />
              <TextField id="email" label="Email" value={values.email} onChange={updateValue} error={errors.email} type="email" required autoComplete="email" />
              <label className={`${labelClass} col-span-2 max-[600px]:col-span-1`} htmlFor="pickupAddress">
                Company / pickup address<span className="ml-1 text-[#163e6a]" aria-hidden="true">*</span>
                <textarea className={`${inputClass} min-h-25 resize-y py-3`} id="pickupAddress" name="pickupAddress" value={values.pickupAddress} onChange={(event) => updateValue("pickupAddress", event.target.value)} placeholder="Enter the address where shipments will be collected" required aria-required="true" aria-invalid={Boolean(errors.pickupAddress)} aria-describedby={errors.pickupAddress ? "pickupAddress-error" : undefined} />
                {errors.pickupAddress && <span id="pickupAddress-error" className="mt-1 block text-xs text-[#c31d25]" role="alert">{errors.pickupAddress}</span>}
              </label>
              <label className="col-span-2 block max-[600px]:col-span-1">
                <span className={labelClass}>Company logo <span className="font-normal text-[#898a90]">(optional)</span></span>
                <span className="mt-2 flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border border-dashed border-[#d7d8dc] bg-[#fbfbfc] px-4 text-[13px] text-[#686970] transition hover:border-[#163e6a]">
                  <Upload className="size-4.5 text-[#163e6a]" aria-hidden="true" />
                  <span>{logoFile?.name || "Choose a logo image (PNG, JPG, or SVG)"}</span>
                  <input className="sr-only" name="logo" type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)} />
                </span>
              </label>
            </div>
          )}

          {step === 1 && (
            <div className="grid grid-cols-2 gap-x-5 gap-y-5 max-[600px]:grid-cols-1">
              <SelectField id="bankName" label="Bank name" value={values.bankName} onChange={updateValue} options={["Allied Bank", "Askari Bank", "Bank Alfalah", "Bank Al Habib", "Bank of Punjab", "Faysal Bank", "Habib Bank Limited (HBL)", "JS Bank", "Meezan Bank", "MCB Bank", "National Bank of Pakistan", "Standard Chartered Pakistan", "United Bank Limited (UBL)", "Other"]} />
              <TextField id="accountTitle" label="Account title" value={values.accountTitle} onChange={updateValue} />
              <TextField id="accountNumber" label="Account number" value={values.accountNumber} onChange={updateValue} />
              <TextField id="branchName" label="Branch name" value={values.branchName} onChange={updateValue} />
              <TextField id="branchCode" label="Branch code" value={values.branchCode} onChange={updateValue} />
              <TextField id="swiftCode" label="SWIFT code" value={values.swiftCode} onChange={updateValue} />
              <TextField id="iban" label="IBAN" value={values.iban} onChange={updateValue} />
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-2 gap-x-5 gap-y-5 max-[600px]:grid-cols-1">
              <TextField id="website" label="Website URL (optional)" value={values.website} onChange={updateValue} error={errors.website} placeholder="https://yourstore.com" />
              <SelectField id="city" label="City" value={values.city} onChange={updateValue} options={Array.from(new Set([...PAKISTAN_CITIES, "Other"]))} error={errors.city} required />
              <SelectField id="accountNature" label="Nature of account" value={values.accountNature} onChange={updateValue} options={["Individual", "Sole proprietorship", "Partnership", "Private limited company", "Other"]} error={errors.accountNature} required />
              <SelectField id="productType" label="Product type" value={values.productType} onChange={updateValue} options={["Documents", "Clothing and fashion", "Electronics", "Health and beauty", "Food and grocery", "Home and lifestyle", "General merchandise", "Other"]} error={errors.productType} required />
              <SelectField id="shipmentVolume" label="Expected average shipments / month" value={values.shipmentVolume} onChange={updateValue} options={["1–50", "51–100", "101–250", "251–500", "501–1,000", "More than 1,000"]} error={errors.shipmentVolume} required />
            </div>
          )}

          {step === 3 && (
            <div className="mx-auto grid max-w-140 gap-5">
              <p className="-mt-1 mb-1 text-[13px] leading-6 text-[#6a6b71]">Use at least 8 characters with at least one letter and one number. Your password will help protect your business account.</p>
              <TextField id="password" label="Password" value={values.password} onChange={updateValue} error={errors.password} type="password" autoComplete="new-password" required />
              <TextField id="confirmPassword" label="Confirm password" value={values.confirmPassword} onChange={updateValue} error={errors.confirmPassword} type="password" autoComplete="new-password" required />
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[#eeeeef] pt-5">
            {step > 0 ? (
              <button className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#dedfe2] px-4 text-[13px] font-medium text-[#4d4e54] transition hover:bg-[#f7f7f8]" type="button" onClick={goBack}>
                <ArrowLeft className="size-4" aria-hidden="true" /> Back
              </button>
            ) : <span />}
            {step < steps.length - 1 ? (
              <button className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#163e6a] px-5 text-[13px] font-semibold text-white transition hover:bg-[#ec8123]" type="button" onClick={continueStep}>
                Continue <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            ) : (
              <button className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#163e6a] px-5 text-[13px] font-semibold text-white transition hover:bg-[#ec8123] disabled:cursor-not-allowed disabled:opacity-65" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting…" : "Create account"} <Check className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>
          {notice && (
            <div className="mb-0 mt-5 rounded-xl border border-[#ffe0b2] bg-[#fff8f0] p-4 text-[13px] leading-5 text-[#835813]" role="status">
              <p className="m-0 font-medium">{notice}</p>
              {verificationUrl && (
                <div className="mt-3.5">
                  <Link
                    href={verificationUrl}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#163e6a] px-4 py-2.5 text-[12px] font-semibold text-white shadow-xs transition hover:bg-[#ec8123]"
                  >
                    Verify Email Now <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
