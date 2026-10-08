"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Plus, UserX, UserCheck, ShieldCheck } from "lucide-react";

type StaffUser = {
  id: string;
  email: string;
  role: string;
  status: string;
  mfaEnabledAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
};

const inputClass =
  "mt-1.5 h-10 w-full rounded-lg border border-[#dedfe2] bg-white px-3 text-[13px] text-[#25262a] outline-none focus:border-[#163e6a]";

export function AdminStaffManager() {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("OPERATIONS");
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let ignore = false;
    fetch("/api/admin/staff", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json() as { staff?: StaffUser[]; message?: string };
        if (!res.ok) throw new Error(data.message ?? "Could not load staff.");
        if (!ignore) setStaff(data.staff ?? []);
      })
      .catch((err) => {
        if (!ignore) setError(err instanceof Error ? err.message : "Failed to load staff.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          role: newRole,
        }),
      });

      const data = await res.json() as { message?: string };
      if (!res.ok) throw new Error(data.message ?? "Failed to create staff account.");

      setMessage(data.message ?? "Staff account created.");
      setNewEmail("");
      setNewPassword("");
      setShowAddForm(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Creation failed.");
    } finally {
      setCreating(false);
    }
  };

  const toggleStatus = async (user: StaffUser) => {
    const nextStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    if (
      !confirm(
        `Are you sure you want to ${nextStatus.toLowerCase()} ${user.email}? This will revoke their active login sessions immediately.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/staff/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json() as { message?: string };
      if (!res.ok) throw new Error(data.message ?? "Status update failed.");

      setMessage(data.message ?? "Status updated.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed.");
    }
  };

  const changeRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/staff/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json() as { message?: string };
      if (!res.ok) throw new Error(data.message ?? "Role update failed.");

      setMessage(data.message ?? "Role updated.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Role update failed.");
    }
  };

  if (loading) return <p className="mt-8 text-[14px] text-[#686970]">Loading staff list…</p>;

  return (
    <div className="mt-8 grid gap-6">
      <div className="flex items-center justify-between">
        <p className="m-0 text-[13px] text-[#77787e]">
          Manage internal staff accounts with role-based access for Operations, Support, Finance, and Administrators.
        </p>
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#163e6a] px-4 text-[12px] font-semibold text-white hover:bg-[#ec8123]"
        >
          <Plus className="size-4" /> Add Staff Member
        </button>
      </div>

      {message && <div className="rounded-xl bg-emerald-50 p-4 text-[13px] text-emerald-800">{message}</div>}
      {error && <div className="rounded-xl bg-red-50 p-4 text-[13px] text-red-700">{error}</div>}

      {showAddForm && (
        <form onSubmit={handleCreate} className="rounded-2xl border border-[#e5e6e9] bg-[#f8fafc] p-6 shadow-xs">
          <h3 className="m-0 text-[16px] font-semibold text-[#163e6a]">Create New Staff Account</h3>
          <p className="mb-4 mt-1 text-[13px] text-[#64748b]">
            Assign specific department roles. Passwords must be at least 8 characters with letters and numbers.
          </p>

          <div className="grid grid-cols-3 gap-4 max-[650px]:grid-cols-1">
            <label className="text-[12px] font-medium text-[#45464b]">
              Email Address
              <input
                type="email"
                required
                className={inputClass}
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="staff@xpsworldwideexpress.com"
              />
            </label>

            <label className="text-[12px] font-medium text-[#45464b]">
              Initial Password
              <input
                type="password"
                required
                className={inputClass}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Strong initial password"
              />
            </label>

            <label className="text-[12px] font-medium text-[#45464b]">
              Assigned Role
              <select
                className={inputClass}
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              >
                <option value="OPERATIONS">OPERATIONS (Dispatch, Shipments, Hubs)</option>
                <option value="SUPPORT">SUPPORT (Tickets, Inquiries)</option>
                <option value="FINANCE">FINANCE (COD, Bank, Remittances)</option>
                <option value="ADMIN">ADMIN (Full System Privileges)</option>
              </select>
            </label>
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-lg border border-[#dedfe2] px-4 py-2 text-[12px] font-semibold text-[#45464b] hover:bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-[#163e6a] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#ec8123] disabled:opacity-50"
            >
              {creating ? "Creating…" : "Save Staff Member"}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-2xl border border-[#e5e6e9] bg-white shadow-xs">
        <table className="w-full border-collapse text-left text-[13px]">
          <thead className="bg-[#f8f8f9] text-[11px] uppercase tracking-wide text-[#77787e]">
            <tr>
              <th className="px-5 py-4 font-semibold">User Email</th>
              <th className="px-5 py-4 font-semibold">Department Role</th>
              <th className="px-5 py-4 font-semibold">Status</th>
              <th className="px-5 py-4 font-semibold">MFA</th>
              <th className="px-5 py-4 font-semibold">Last Login</th>
              <th className="px-5 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eeeeef]">
            {staff.map((u) => {
              const isSuspended = u.status === "SUSPENDED";
              return (
                <tr key={u.id} className="text-[#45464b] hover:bg-[#fafbfc]">
                  <td className="px-5 py-3.5 font-medium text-[#202126]">{u.email}</td>
                  <td className="px-5 py-3.5">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                      className="rounded border border-[#dedfe2] bg-white px-2 py-1 text-[12px] font-semibold text-[#163e6a]"
                    >
                      <option value="OPERATIONS">OPERATIONS</option>
                      <option value="SUPPORT">SUPPORT</option>
                      <option value="FINANCE">FINANCE</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        isSuspended ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {u.mfaEnabledAt ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                        <ShieldCheck className="size-3.5" /> Enforced
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-400">Optional</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-[12px] text-[#77787e]">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "Never"}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => toggleStatus(u)}
                      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold ${
                        isSuspended
                          ? "border border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50"
                          : "border border-red-200 bg-white text-red-600 hover:bg-red-50"
                      }`}
                    >
                      {isSuspended ? (
                        <>
                          <UserCheck className="size-3" /> Reactivate
                        </>
                      ) : (
                        <>
                          <UserX className="size-3" /> Suspend
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
