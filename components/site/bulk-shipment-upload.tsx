"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Download, FileSpreadsheet, Upload } from "lucide-react";

export function BulkShipmentUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ message?: string; error?: string; errors?: string[] } | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) return;
    const formElement = event.currentTarget;
    setSubmitting(true);
    setResult(null);
    const body = new FormData();
    body.append("file", file);
    try {
      const response = await fetch("/api/account/shipments/import", { method: "POST", body });
      const data = await response.json() as { message?: string; importedCount?: number; errors?: string[] };
      if (!response.ok) throw new Error(data.message ?? "Bulk upload failed.");
      setResult({ message: `${data.message ?? `Imported ${data.importedCount ?? 0} shipment(s).`}${data.errors?.length ? ` ${data.errors.length} row(s) were skipped.` : ""}`, errors: data.errors });
      setFile(null);
      formElement.reset();
    } catch (reason) {
      setResult({ error: reason instanceof Error ? reason.message : "Bulk upload failed." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6">
      <div className="grid gap-5 rounded-2xl border border-[#e5e6e9] bg-white p-6 shadow-[0_8px_24px_rgba(24,25,30,0.04)]">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#fff3e8] text-[#163e6a]"><FileSpreadsheet className="size-6" aria-hidden="true" /></span>
          <div><h2 className="m-0 text-[20px] font-semibold text-[#25262a]">How to prepare your sheet</h2><p className="mb-0 mt-1 text-[13px] leading-6 text-[#686970]">Use one shipment per row and keep the first row as the column headers.</p></div>
        </div>
        <ol className="m-0 grid gap-3 pl-5 text-[13px] leading-6 text-[#45464b]">
          <li>Download the <strong>GDE bulk booking helper</strong> below. It was created from the existing <code className="rounded bg-[#f2f3f5] px-1">bulk_booking.xlsx</code> example in this project.</li>
          <li>Fill in the receiver name, receiver phone, receiver address, delivery city, pieces, COD amount, and product description.</li>
          <li>Keep city names and required values complete. Delete the sample row before uploading your real shipments.</li>
          <li>Save the workbook as <strong>CSV UTF-8</strong>, then upload the CSV here. The importer accepts the helper’s Receiver Name, Receiver Phone, Receiver Address, and Delivery City headers.</li>
        </ol>
        <div><a className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#d8d9dd] bg-white px-4 text-[13px] font-semibold text-[#163e6a] hover:bg-[#f7f7f8]" href="/templates/gde-bulk-booking-helper.xlsx" download><Download className="size-4" /> Download GDE bulk booking helper (.xlsx)</a></div>
      </div>

      <form className="grid gap-5 rounded-2xl border border-[#163e6a]/20 bg-[#f8fafc] p-6 shadow-xs" onSubmit={submit}>
        <div><h2 className="m-0 text-[18px] font-semibold text-[#163e6a]">Upload completed sheet</h2><p className="mb-0 mt-1 text-[13px] text-[#64748b]">Accepted format: CSV UTF-8. Each valid row creates a new shipment under your merchant account.</p></div>
        <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#b9c7d8] bg-white px-5 text-center text-[13px] text-[#64748b] hover:border-[#163e6a]">
          <Upload className="mb-2 size-5 text-[#163e6a]" aria-hidden="true" />
          <span className="font-semibold text-[#45464b]">{file?.name ?? "Choose your CSV file"}</span>
          <span className="mt-1 text-[12px]">Click to browse</span>
          <input className="sr-only" type="file" accept=".csv,text/csv" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        </label>
        <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#163e6a] px-5 text-[13px] font-semibold text-white hover:bg-[#ec8123] disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={!file || submitting}>{submitting ? "Uploading…" : "Upload and create shipments"}</button>
        {result?.message && <div className="rounded-lg bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800" role="status"><p className="m-0 flex items-center gap-2"><CheckCircle2 className="size-4" />{result.message}</p>{result.errors?.length ? <ul className="mb-0 mt-2 list-disc pl-5">{result.errors.map((error) => <li key={error}>{error}</li>)}</ul> : null}</div>}
        {result?.error && <p className="mb-0 rounded-lg bg-red-50 px-4 py-3 text-[13px] text-red-700" role="alert">{result.error}</p>}
      </form>
    </div>
  );
}
