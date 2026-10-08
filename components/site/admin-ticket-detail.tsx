"use client";

import { useState, type FormEvent } from "react";
import { Lock, Send, User, Headphones } from "lucide-react";

type Staff = {
  id: string;
  email: string;
  role: string;
};

type Message = {
  id: string;
  authorId: string | null;
  body: string;
  internal: boolean;
  createdAt: string;
};

type TicketDetail = {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  assignedToId: string | null;
  linkedShipmentCode: string | null;
  merchant: {
    id: string;
    companyName: string;
    contactName: string;
    phone: string;
    user: { email: string };
  };
  messages: Message[];
};

const inputClass =
  "h-9.5 rounded-lg border border-[#dedfe2] bg-white px-3 text-[12px] text-[#34353a] outline-none focus:border-[#163e6a]";

export function AdminTicketDetail({
  initialTicket,
  staffMembers,
  currentUserId,
}: {
  initialTicket: TicketDetail;
  staffMembers: Staff[];
  currentUserId: string;
}) {
  const [ticket, setTicket] = useState<TicketDetail>(initialTicket);
  const [status, setStatus] = useState(ticket.status);
  const [priority, setPriority] = useState(ticket.priority);
  const [assignedToId, setAssignedToId] = useState(ticket.assignedToId ?? "");
  const [replyText, setReplyText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageNotice, setMessageNotice] = useState("");
  const [error, setError] = useState("");

  const refreshTicket = async () => {
    try {
      const res = await fetch(`/api/admin/tickets/${ticket.id}`, { cache: "no-store" });
      const data = await res.json() as { ticket?: TicketDetail };
      if (data.ticket) setTicket(data.ticket);
    } catch {}
  };

  const updateTicketMeta = async () => {
    setSavingSettings(true);
    setMessageNotice("");
    setError("");

    try {
      const res = await fetch(`/api/admin/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          priority,
          assignedToId: assignedToId || null,
        }),
      });

      const data = await res.json() as { message?: string };
      if (!res.ok) throw new Error(data.message ?? "Could not update ticket.");

      setMessageNotice(data.message ?? "Ticket properties saved.");
      await refreshTicket();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handlePostMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSendingMessage(true);
    setMessageNotice("");
    setError("");

    try {
      const res = await fetch(`/api/admin/tickets/${ticket.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: replyText.trim(),
          internal: isInternal,
        }),
      });

      const data = await res.json() as { message?: string };
      if (!res.ok) throw new Error(data.message ?? "Failed to send message.");

      setReplyText("");
      setMessageNotice(data.message ?? "Message added.");
      await refreshTicket();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post message.");
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="mt-7 grid gap-6">
      {/* Management Toolbar */}
      <div className="rounded-2xl border border-[#e5e6e9] bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-[11px] font-semibold text-[#686970]">
              Status
              <select
                className={`${inputClass} ml-2`}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="WAITING_ON_CUSTOMER">Waiting on Customer</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </label>

            <label className="text-[11px] font-semibold text-[#686970]">
              Priority
              <select
                className={`${inputClass} ml-2`}
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </label>

            <label className="text-[11px] font-semibold text-[#686970]">
              Assignee
              <select
                className={`${inputClass} ml-2`}
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {staffMembers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.email} ({s.role.toLowerCase()})
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              disabled={savingSettings}
              onClick={updateTicketMeta}
              className="rounded-lg bg-[#163e6a] px-3.5 py-1.5 text-[12px] font-semibold text-white hover:bg-[#ec8123] disabled:opacity-50"
            >
              {savingSettings ? "Saving…" : "Update Ticket"}
            </button>
          </div>

          {messageNotice && <span className="text-[12px] text-emerald-700">{messageNotice}</span>}
          {error && <span className="text-[12px] text-red-600">{error}</span>}
        </div>
      </div>

      {/* Messages Thread */}
      <div className="grid gap-4">
        {ticket.messages.map((m) => {
          const isInternalNote = m.internal;
          const isMerchantAuthor = m.authorId !== currentUserId && !isInternalNote;

          return (
            <div
              key={m.id}
              className={`rounded-2xl p-4.5 text-[13px] shadow-xs ${
                isInternalNote
                  ? "border border-amber-300 bg-amber-50/70"
                  : isMerchantAuthor
                  ? "border border-[#e5e6e9] bg-white text-[#202126]"
                  : "border border-blue-200 bg-blue-50/40 text-[#202126]"
              }`}
            >
              <div className="mb-1 flex items-center justify-between text-[11px] text-[#77787e]">
                <div className="flex items-center gap-2">
                  {isInternalNote ? (
                    <span className="flex items-center gap-1 rounded-md bg-amber-200/80 px-2 py-0.5 font-bold uppercase text-amber-900">
                      <Lock className="size-3" /> Staff Private Note
                    </span>
                  ) : isMerchantAuthor ? (
                    <span className="flex items-center gap-1 font-semibold text-[#163e6a]">
                      <User className="size-3.5" /> {ticket.merchant.companyName} ({ticket.merchant.contactName})
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 font-semibold text-emerald-800">
                      <Headphones className="size-3.5" /> Go Delivery Support Staff Reply
                    </span>
                  )}
                </div>
                <span>{new Date(m.createdAt).toLocaleString()}</span>
              </div>
              <p className="m-0 whitespace-pre-wrap leading-relaxed">{m.body}</p>
            </div>
          );
        })}
      </div>

      {/* Response Composer with Internal Note Toggle */}
      <form onSubmit={handlePostMessage} className="rounded-2xl border border-[#e5e6e9] bg-white p-5 shadow-xs">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-4 text-[13px]">
            <label className="flex cursor-pointer items-center gap-1.5 font-semibold text-[#202126]">
              <input
                type="radio"
                name="msgType"
                checked={!isInternal}
                onChange={() => setIsInternal(false)}
                className="size-4"
              />
              <span>Public reply (email sent to merchant)</span>
            </label>
            <label className="flex cursor-pointer items-center gap-1.5 font-semibold text-amber-800">
              <input
                type="radio"
                name="msgType"
                checked={isInternal}
                onChange={() => setIsInternal(true)}
                className="size-4"
              />
              <span className="flex items-center gap-1">
                <Lock className="size-3.5" /> Staff-only internal note
              </span>
            </label>
          </div>
        </div>

        <textarea
          rows={4}
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder={
            isInternal
              ? "Write internal staff observation, escalation notes, or driver phone log (never shown to merchant)…"
              : "Type public reply to merchant customer…"
          }
          className={`w-full resize-y rounded-xl border p-3 text-[13px] outline-none ${
            isInternal
              ? "border-amber-300 bg-amber-50/30 focus:border-amber-500"
              : "border-[#dedfe2] focus:border-[#163e6a]"
          }`}
          required
        />

        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            disabled={sendingMessage || !replyText.trim()}
            className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-5 text-[12px] font-semibold text-white disabled:opacity-50 ${
              isInternal ? "bg-amber-800 hover:bg-amber-900" : "bg-[#163e6a] hover:bg-[#ec8123]"
            }`}
          >
            <Send className="size-3.5" />
            {sendingMessage ? "Posting…" : isInternal ? "Save Internal Note" : "Send Reply"}
          </button>
        </div>
      </form>
    </div>
  );
}
