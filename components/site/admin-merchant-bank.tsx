"use client";

import { useCallback, useEffect, useState } from "react";

type MerchantSummary = {
  id: string;
  companyName: string;
  contactName: string;
  city: string;
  phone: string;
  email: string;
  status: string;
  hasBankDetail: boolean;
};

type BankDetail = {
  bankName: string | null;
  accountTitle: string | null;
  accountNumber: string | null;
  accountNumberMasked: string | null;
  branchName: string | null;
  branchCode: string | null;
  swiftCode: string | null;
  iban: string | null;
  ibanMasked: string | null;
};

const inputClass =
  "mt-1.5 h-11 w-full rounded-lg border border-[#e1e2e5] bg-white px-3 text-[13px] text-[#25262a] outline-none focus:border-[#163e6a] focus:ring-3 focus:ring-[#163e6a]/10";

export function AdminMerchantBank() {
  const [merchants, setMerchants] = useState<MerchantSummary[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [bank, setBank] = useState<BankDetail | null>(null);
  const [reveal, setReveal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const loadMerchants = useCallback(async () => {
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let ignore = false;
    fetch("/api/admin/merchants", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json() as { merchants?: MerchantSummary[]; message?: string };
        if (!response.ok) throw new Error(data.message ?? "Could not load merchants.");
        if (!ignore) setMerchants(data.merchants ?? []);
      })
      .catch((reason: unknown) => {
        if (!ignore) setError(reason instanceof Error ? reason.message : "Could not load merchants.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  const loadBank = async (merchantId: string) => {
    setSelectedId(merchantId);
    setBank(null);
    setReveal(false);
    setError("");
    setNotice("");
    if (!merchantId) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/merchants/${merchantId}/bank`, { cache: "no-store" });
      const data = await response.json() as { bank?: BankDetail; message?: string };
      if (!response.ok) throw new Error(data.message ?? "Could not load bank details.");
      setBank(data.bank ?? null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load bank details.");
    } finally {
      setBusy(false);
    }
  };

  const saveBank = async () => {
    if (!selectedId || !bank) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/admin/merchants/${selectedId}/bank`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName: bank.bankName,
          accountTitle: bank.accountTitle,
          accountNumber: bank.accountNumber,
          branchName: bank.branchName,
          branchCode: bank.branchCode,
          swiftCode: bank.swiftCode,
          iban: bank.iban,
        }),
      });
      const data = await response.json() as { message?: string; bank?: Partial<BankDetail> };
      if (!response.ok) throw new Error(data.message ?? "Could not save bank details.");
      setNotice(data.message ?? "Bank details updated.");
      setReveal(false);
      await loadMerchants();
      await loadBank(selectedId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save bank details.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="mt-8 text-[14px] text-[#686970]">Loading merchants…</p>;

  return (
    <div className="mt-9">
      <h2 className="m-0 text-[21px] font-semibold text-[#202126]">Merchant bank details</h2>
      <p className="mb-4 mt-1 text-[13px] text-[#686970]">Finance and admin only. Sensitive values are masked until revealed for editing.</p>
      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-[13px] text-red-700" role="alert">{error}</p>}
      {notice && <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800" role="status">{notice}</p>}

      <label className="block text-[13px] font-medium text-[#45464b]">
        Select merchant
        <select className={inputClass} value={selectedId} onChange={(event) => { void loadBank(event.target.value); }}>
          <option value="">Choose a merchant</option>
          {merchants.map((merchant) => (
            <option key={merchant.id} value={merchant.id}>
              {merchant.companyName} · {merchant.email} {merchant.hasBankDetail ? "" : "(no bank on file)"}
            </option>
          ))}
        </select>
      </label>

      {bank && (
        <div className="mt-5 grid gap-4 rounded-xl border border-[#e5e6e9] bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="m-0 text-[13px] text-[#686970]">Account number: <strong className="font-semibold text-[#25262a]">{reveal ? (bank.accountNumber || "—") : (bank.accountNumberMasked || "—")}</strong></p>
            <button className="rounded-md border border-[#d8d9dd] px-3 py-1.5 text-[12px] font-semibold text-[#45464b] hover:bg-[#f5f5f6]" type="button" onClick={() => setReveal((value) => !value)}>
              {reveal ? "Hide values" : "Reveal for edit"}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 max-[650px]:grid-cols-1">
            <label className="text-[12px] font-medium text-[#45464b]">Bank name
              <input className={inputClass} value={bank.bankName ?? ""} onChange={(event) => setBank({ ...bank, bankName: event.target.value })} disabled={!reveal} />
            </label>
            <label className="text-[12px] font-medium text-[#45464b]">Account title
              <input className={inputClass} value={bank.accountTitle ?? ""} onChange={(event) => setBank({ ...bank, accountTitle: event.target.value })} />
            </label>
            <label className="text-[12px] font-medium text-[#45464b]">Account number
              <input className={inputClass} value={reveal ? (bank.accountNumber ?? "") : (bank.accountNumberMasked ?? "")} onChange={(event) => setBank({ ...bank, accountNumber: event.target.value })} disabled={!reveal} />
            </label>
            <label className="text-[12px] font-medium text-[#45464b]">IBAN
              <input className={inputClass} value={reveal ? (bank.iban ?? "") : (bank.ibanMasked ?? "")} onChange={(event) => setBank({ ...bank, iban: event.target.value })} disabled={!reveal} />
            </label>
            <label className="text-[12px] font-medium text-[#45464b]">Branch name
              <input className={inputClass} value={bank.branchName ?? ""} onChange={(event) => setBank({ ...bank, branchName: event.target.value })} />
            </label>
            <label className="text-[12px] font-medium text-[#45464b]">Branch code
              <input className={inputClass} value={bank.branchCode ?? ""} onChange={(event) => setBank({ ...bank, branchCode: event.target.value })} />
            </label>
            <label className="text-[12px] font-medium text-[#45464b]">SWIFT code
              <input className={inputClass} value={bank.swiftCode ?? ""} onChange={(event) => setBank({ ...bank, swiftCode: event.target.value })} />
            </label>
          </div>
          <button className="inline-flex min-h-10 w-fit items-center rounded-lg bg-[#163e6a] px-4 text-[12px] font-semibold text-white hover:bg-[#102f52] disabled:opacity-60" type="button" disabled={busy || !reveal} onClick={saveBank}>
            {busy ? "Saving…" : "Save bank details"}
          </button>
        </div>
      )}
    </div>
  );
}
