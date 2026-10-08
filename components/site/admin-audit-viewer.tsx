"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Filter, Search, ArrowLeft, ArrowRight } from "lucide-react";

type AuditEntry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  ipHash: string | null;
  createdAt: string;
  actor: { id: string; email: string; role: string } | null;
};

const inputClass =
  "h-9.5 rounded-lg border border-[#dedfe2] bg-white px-3 text-[12px] text-[#34353a] outline-none focus:border-[#163e6a]";

export function AdminAuditViewer() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [entities, setEntities] = useState<string[]>([]);
  const [actionFilter, setActionFilter] = useState("ALL");
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let ignore = false;
    const url = new URL("/api/admin/audit-logs", window.location.origin);
    if (actionFilter !== "ALL") url.searchParams.set("action", actionFilter);
    if (entityFilter !== "ALL") url.searchParams.set("entityType", entityFilter);
    if (searchQuery.trim()) url.searchParams.set("q", searchQuery.trim());
    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", "30");

    fetch(url.toString(), { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json() as {
          logs?: AuditEntry[];
          pagination?: { totalPages: number; totalCount: number };
          filterOptions?: { actions: string[]; entities: string[] };
          message?: string;
        };
        if (!res.ok) throw new Error(data.message ?? "Failed to load audit logs.");
        if (!ignore) {
          setLogs(data.logs ?? []);
          if (data.pagination) {
            setTotalPages(data.pagination.totalPages);
            setTotalCount(data.pagination.totalCount);
          }
          if (data.filterOptions) {
            setActions(data.filterOptions.actions ?? []);
            setEntities(data.filterOptions.entities ?? []);
          }
        }
      })
      .catch((err) => {
        if (!ignore) setError(err instanceof Error ? err.message : "Failed to load audit trail.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [actionFilter, entityFilter, searchQuery, page, reloadKey]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    refresh();
  };

  if (loading && logs.length === 0) return <p className="mt-8 text-[14px] text-[#686970]">Loading audit events…</p>;

  return (
    <div className="mt-8 grid gap-5">
      <div className="rounded-xl border border-[#e5e6e9] bg-white p-4 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="size-4 text-[#163e6a]" />
            <select
              className={inputClass}
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All Actions</option>
              {actions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>

            <select
              className={inputClass}
              value={entityFilter}
              onChange={(e) => {
                setEntityFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All Entity Types</option>
              {entities.map((ent) => (
                <option key={ent} value={ent}>
                  {ent}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-[#85868c]" />
              <input
                type="text"
                placeholder="Search audit summary…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9.5 w-60 rounded-lg border border-[#dedfe2] bg-white pl-8 pr-3 text-[12px] text-[#34353a] outline-none focus:border-[#163e6a]"
              />
            </div>
            <button
              type="submit"
              className="h-9.5 rounded-lg bg-[#163e6a] px-3.5 text-[12px] font-semibold text-white hover:bg-[#ec8123]"
            >
              Filter
            </button>
          </div>
        </form>

        <div className="mt-3 flex items-center justify-between border-t border-[#f0f0f2] pt-2 text-[12px] text-[#85868c]">
          <span>Logged {totalCount} compliance audit event(s)</span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded p-1 hover:bg-[#f5f5f7] disabled:opacity-30"
              >
                <ArrowLeft className="size-4" />
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded p-1 hover:bg-[#f5f5f7] disabled:opacity-30"
              >
                <ArrowRight className="size-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {error && <div className="rounded-xl bg-red-50 p-4 text-[13px] text-red-700">{error}</div>}

      <div className="overflow-hidden rounded-2xl border border-[#e5e6e9] bg-white shadow-xs">
        {logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-220 border-collapse text-left text-[12px]">
              <thead className="bg-[#f8f8f9] text-[11px] uppercase tracking-wide text-[#77787e]">
                <tr>
                  <th className="px-5 py-4 font-semibold">Timestamp</th>
                  <th className="px-5 py-4 font-semibold">Actor / User</th>
                  <th className="px-5 py-4 font-semibold">Action</th>
                  <th className="px-5 py-4 font-semibold">Target Entity</th>
                  <th className="px-5 py-4 font-semibold">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eeeeef]">
                {logs.map((log) => (
                  <tr key={log.id} className="text-[#45464b] hover:bg-[#fafbfc]">
                    <td className="px-5 py-3 text-[#77787e] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      {log.actor ? (
                        <>
                          <span className="font-semibold text-[#202126]">{log.actor.email}</span>
                          <span className="block text-[10px] text-[#85868c]">
                            {log.actor.role}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-400">System / Unauthenticated</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className="rounded-md bg-[#f0f4f8] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#163e6a]">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-[11px] text-[#77787e]">
                      {log.entityType} ({log.entityId.slice(-6)})
                    </td>
                    <td className="px-5 py-3 text-[#34353a]">{log.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center text-[#77787e]">No audit log events match criteria.</div>
        )}
      </div>
    </div>
  );
}
