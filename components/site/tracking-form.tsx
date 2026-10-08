"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Clock3, PackageSearch } from "lucide-react";

type TrackingEvent = {
  status: string;
  location: string | null;
  publicNote: string;
  occurredAt: string;
};

type TrackedShipment = {
  trackingCode: string;
  status: string;
  destinationCity: string;
  publicSummary: string | null;
  createdAt: string;
  updatedAt: string;
  events: TrackingEvent[];
};

type TrackingResult = { code: string; shipment: TrackedShipment | null };

const readableStatus = (status: string) => status.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export function TrackingForm() {
  const [trackingNumbers, setTrackingNumbers] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [results, setResults] = useState<TrackingResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const enteredNumbers = trackingNumbers.split(",").map((number) => number.trim()).filter(Boolean);
    const numbers = [...new Set(enteredNumbers)];
    setResults([]);

    if (numbers.length === 0) {
      setIsError(true);
      setMessage("Enter at least one tracking number.");
      return;
    }

    if (enteredNumbers.length > 10) {
      setIsError(true);
      setMessage("You can track up to 10 numbers at a time.");
      return;
    }

    setLoading(true);
    setIsError(false);
    setMessage("");
    try {
      const query = new URLSearchParams({ codes: numbers.join(",") });
      const response = await fetch(`/api/tracking?${query.toString()}`, { cache: "no-store" });
      const data = await response.json() as { message?: string; results?: TrackingResult[] };
      if (!response.ok) throw new Error(data.message ?? "Unable to look up these tracking codes.");
      const found = data.results ?? [];
      setResults(found);
      const foundCount = found.filter((result) => result.shipment).length;
      setMessage(foundCount === numbers.length ? `Found ${foundCount} shipment${foundCount === 1 ? "" : "s"}.` : `Found ${foundCount} of ${numbers.length} tracking codes.`);
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Unable to look up these tracking codes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-[#f6f6f7] px-5 py-18 max-[760px]:py-12">
      <div className="mx-auto max-w-175 rounded-2xl border border-[#e8e8eb] bg-white p-[clamp(24px,5vw,52px)] shadow-[0_16px_48px_rgba(23,24,30,0.08)]">
        <div className="mb-7 flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#fff3e8] text-[#163e6a]">
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
            className="min-h-28 w-full resize-y rounded-xl border border-[#dedfe2] bg-white px-4 py-3.5 text-[15px] text-[#25262a] outline-none transition placeholder:text-[#999aa0] focus:border-[#163e6a] focus:ring-3 focus:ring-[#163e6a]/10"
            id="tracking-numbers"
            name="trackingNumbers"
            value={trackingNumbers}
            onChange={(event) => { setTrackingNumbers(event.target.value); setMessage(""); }}
            placeholder="Enter your Tracking Code"
            aria-describedby={message ? "tracking-message" : undefined}
            aria-invalid={isError}
            required
          />
          <button className="inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-lg bg-[#163e6a] px-5 text-[14px] font-bold tracking-[0.04em] text-white transition hover:bg-[#ec8123] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#163e6a] disabled:cursor-wait disabled:opacity-65" type="submit" disabled={loading}>
            {loading ? "LOOKING UP SHIPMENTS…" : "TRACK YOUR PACKAGE"} <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </form>
        {message && <p id="tracking-message" className={`mb-0 mt-4 rounded-lg px-4 py-3 text-[13px] leading-5 ${isError ? "bg-red-50 text-red-700" : "bg-[#fff4e5] text-[#835813]"}`} role="status">{message}</p>}
        {results.length > 0 && (
          <div className="mt-6 grid gap-4" aria-live="polite">
            {results.map(({ code, shipment }) => (
              <article className="rounded-xl border border-[#e6e7ea] bg-[#fcfcfd] p-4.5" key={code}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#85868c]">Tracking code</p>
                    <h3 className="mb-0 mt-1 font-mono text-[15px] font-semibold text-[#25262a]">{code}</h3>
                  </div>
                  {shipment ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#edf6ef] px-3 py-1.5 text-[11px] font-semibold text-[#28623a]">
                      <CheckCircle2 className="size-3.5" aria-hidden="true" /> {readableStatus(shipment.status)}
                    </span>
                  ) : <span className="rounded-full bg-[#f0f0f2] px-3 py-1.5 text-[11px] font-semibold text-[#686970]">Not found</span>}
                </div>
                {shipment && (
                  <>
                    <p className="mb-0 mt-3 text-[13px] text-[#5d5e64]">Destination: <strong className="font-semibold text-[#34353a]">{shipment.destinationCity}</strong></p>
                    {shipment.publicSummary && <p className="mb-0 mt-1.5 text-[13px] text-[#5d5e64]">{shipment.publicSummary}</p>}
                    <ol className="mt-4 grid list-none gap-3 border-l border-[#dedfe2] pl-4">
                      {shipment.events.map((item, index) => (
                        <li className="relative" key={`${item.status}-${item.occurredAt}-${index}`}>
                          <span className="absolute -left-[21px] top-1 grid size-3 place-items-center rounded-full bg-white text-[#163e6a] ring-1 ring-[#cbd3dd]">
                            <Clock3 className="size-2" aria-hidden="true" />
                          </span>
                          <p className="m-0 text-[12px] font-semibold text-[#34353a]">{readableStatus(item.status)}{item.location ? ` · ${item.location}` : ""}</p>
                          <p className="mb-0 mt-0.5 text-[12px] leading-5 text-[#686970]">{item.publicNote}</p>
                          <time className="mt-0.5 block text-[11px] text-[#929399]" dateTime={item.occurredAt}>{new Date(item.occurredAt).toLocaleString()}</time>
                        </li>
                      ))}
                    </ol>
                  </>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
