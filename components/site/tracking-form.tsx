"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, PackageSearch } from "lucide-react";

export function TrackingForm() {
  const [trackingNumbers, setTrackingNumbers] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const numbers = trackingNumbers.split(",").map((number) => number.trim()).filter(Boolean);

    if (numbers.length === 0) {
      setIsError(true);
      setMessage("Enter at least one tracking number.");
      return;
    }

    if (numbers.length > 10) {
      setIsError(true);
      setMessage("You can track up to 10 numbers at a time.");
      return;
    }

    setIsError(false);
    setMessage("Tracking lookup is not connected to a live shipment service yet.");
  };

  return (
    <section className="bg-[#f6f6f7] px-5 py-18 max-[760px]:py-12">
      <div className="mx-auto max-w-175 rounded-2xl border border-[#e8e8eb] bg-white p-[clamp(24px,5vw,52px)] shadow-[0_16px_48px_rgba(23,24,30,0.08)]">
        <div className="mb-7 flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#fff0f1] text-[#ed171d]">
            <PackageSearch className="size-6" aria-hidden="true" />
          </span>
          <div>
            <h2 className="m-0 text-[25px] font-semibold text-[#202126]">Track Your Page</h2>
            <p className="mb-0 mt-2 text-[14px] leading-6 text-[#6d6e74]">
              Track up to 10 numbers at a time. Separate by a comma (,)
            </p>
          </div>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="tracking-numbers">Enter your Tracking Code</label>
          <textarea
            className="min-h-28 w-full resize-y rounded-xl border border-[#dedfe2] bg-white px-4 py-3.5 text-[15px] text-[#25262a] outline-none transition placeholder:text-[#999aa0] focus:border-[#ed171d] focus:ring-3 focus:ring-[#ed171d]/10"
            id="tracking-numbers"
            name="trackingNumbers"
            value={trackingNumbers}
            onChange={(event) => { setTrackingNumbers(event.target.value); setMessage(""); }}
            placeholder="Enter your Tracking Code"
            aria-describedby={message ? "tracking-message" : undefined}
            aria-invalid={isError}
            required
          />
          <button className="inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-lg bg-[#ed171d] px-5 text-[14px] font-bold tracking-[0.04em] text-white transition hover:bg-[#c90d13] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#ed171d]" type="submit">
            TRACK YOUR PACKAGE <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </form>
        {message && <p id="tracking-message" className={`mb-0 mt-4 rounded-lg px-4 py-3 text-[13px] leading-5 ${isError ? "bg-red-50 text-red-700" : "bg-[#fff4e5] text-[#835813]"}`} role="status">{message}</p>}
      </div>
    </section>
  );
}
