"use client";

import { useCallback, useEffect, useState } from "react";

type Application = {
  id: string;
  email: string;
  status: string;
  emailVerifiedAt: string | null;
  createdAt: string;
  merchantProfile: {
    companyName: string;
    contactName: string;
    phone: string;
    pickupAddress: string;
    city: string;
    website: string | null;
    accountNature: string;
    productType: string;
    monthlyShipmentVolume: string;
  } | null;
};

export function AdminApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const refresh = useCallback(async () => {
    const response = await fetch("/api/admin/applications", { cache: "no-store" });
    const data = await response.json() as { applications?: Application[]; message?: string };
    if (!response.ok) throw new Error(data.message ?? "Could not load applications.");
    setApplications(data.applications ?? []);
  }, []);

  useEffect(() => {
    let ignore = false;
    fetch("/api/admin/applications", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json() as { applications?: Application[]; message?: string };
        if (!res.ok) throw new Error(data.message ?? "Could not load applications.");
        if (!ignore) setApplications(data.applications ?? []);
      })
      .catch((reason: unknown) => {
        if (!ignore) setError(reason instanceof Error ? reason.message : "Could not load applications.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const decide = async (application: Application, decision: "approve" | "reject" | "verify_and_approve") => {
    const reason = decision === "reject" ? window.prompt("Why is this application being rejected?")?.trim() ?? "" : "";
    if (decision === "reject" && !reason) return;

    setBusyId(application.id);
    setError("");
    try {
      const response = await fetch("/api/admin/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: application.id, decision, reason }),
      });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message ?? "Could not update this application.");
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update this application.");
    } finally {
      setBusyId("");
    }
  };

  if (loading) return <p className="mt-8 text-[14px] text-[#686970]">Loading applications…</p>;

  return (
    <div className="mt-9">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="m-0 text-[21px] font-semibold text-[#202126]">Pending applications</h2>
        <button className="rounded-md border border-[#d8d9dd] bg-white px-3.5 py-2 text-[12px] font-semibold text-[#45464b] hover:bg-[#f5f5f6]" type="button" onClick={() => { setLoading(true); refresh().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load applications.")).finally(() => setLoading(false)); }}>Refresh</button>
      </div>
      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-[13px] text-red-700" role="alert">{error}</p>}
      {applications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#d7d8dc] bg-white p-7 text-[14px] text-[#686970]">There are no applications awaiting review.</div>
      ) : (
        <div className="grid gap-4">
          {applications.map((application) => {
            const profile = application.merchantProfile;
            if (!profile) return null;
            const isUnverified = application.status === "PENDING_EMAIL_VERIFICATION";
            return (
              <article className="rounded-xl border border-[#e5e6e9] bg-white p-5 shadow-[0_6px_20px_rgba(24,25,30,0.035)]" key={application.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="m-0 text-[18px] font-semibold text-[#202126]">{profile.companyName}</h3>
                      {isUnverified ? (
                        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">Unverified Email</span>
                      ) : (
                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">Email Verified</span>
                      )}
                    </div>
                    <p className="mb-0 mt-1 text-[13px] text-[#686970]">Submitted {new Date(application.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    {isUnverified ? (
                      <button className="rounded-md bg-[#ec8123] px-3.5 py-2 text-[12px] font-semibold text-white hover:bg-[#d9731b] disabled:opacity-60" type="button" disabled={busyId === application.id} onClick={() => decide(application, "verify_and_approve")}>{busyId === application.id ? "Saving…" : "Verify & Approve"}</button>
                    ) : (
                      <button className="rounded-md bg-[#163e6a] px-3.5 py-2 text-[12px] font-semibold text-white hover:bg-[#102f52] disabled:opacity-60" type="button" disabled={busyId === application.id} onClick={() => decide(application, "approve")}>{busyId === application.id ? "Saving…" : "Approve"}</button>
                    )}
                    <button className="rounded-md border border-red-200 px-3.5 py-2 text-[12px] font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60" type="button" disabled={busyId === application.id} onClick={() => decide(application, "reject")}>Reject</button>
                  </div>
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-[13px] max-[600px]:grid-cols-1">
                  <div><dt className="text-[#898a90]">Contact</dt><dd className="m-0 text-[#34353a]">{profile.contactName}</dd></div>
                  <div><dt className="text-[#898a90]">Email / phone</dt><dd className="m-0 text-[#34353a]">{application.email} · {profile.phone}</dd></div>
                  <div><dt className="text-[#898a90]">City / business type</dt><dd className="m-0 text-[#34353a]">{profile.city} · {profile.accountNature}</dd></div>
                  <div><dt className="text-[#898a90]">Product / monthly volume</dt><dd className="m-0 text-[#34353a]">{profile.productType} · {profile.monthlyShipmentVolume}</dd></div>
                  <div className="col-span-2 max-[600px]:col-span-1"><dt className="text-[#898a90]">Pickup address</dt><dd className="m-0 text-[#34353a]">{profile.pickupAddress}</dd></div>
                  {profile.website && <div><dt className="text-[#898a90]">Website</dt><dd className="m-0 text-[#34353a]">{profile.website}</dd></div>}
                </dl>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
