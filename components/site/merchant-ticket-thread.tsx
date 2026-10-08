"use client";

import { useState, type FormEvent } from "react";
import { Send, User, Headphones } from "lucide-react";

type Message = {
  id: string;
  authorId: string | null;
  body: string;
  createdAt: string;
};

type Ticket = {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  linkedShipmentCode: string | null;
  messages: Message[];
};

export function MerchantTicketThread({
  initialTicket,
  currentUserId,
}: {
  initialTicket: Ticket;
  currentUserId: string;
}) {
  const [ticket, setTicket] = useState<Ticket>(initialTicket);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSending(true);
    setError("");

    try {
      const res = await fetch(`/api/account/tickets/${ticket.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyText.trim() }),
      });

      const data = await res.json() as { message?: string };
      if (!res.ok) throw new Error(data.message ?? "Could not send reply.");

      // Refresh ticket messages
      const getRes = await fetch(`/api/account/tickets/${ticket.id}`, { cache: "no-store" });
      const getData = await getRes.json() as { ticket?: Ticket };
      if (getData.ticket) setTicket(getData.ticket);

      setReplyText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reply.");
    } finally {
      setSending(false);
    }
  };

  const isClosed = ticket.status === "CLOSED";

  return (
    <div className="mt-7 grid gap-6">
      {/* Thread Messages List */}
      <div className="grid gap-4">
        {ticket.messages.map((m) => {
          const isMe = m.authorId === currentUserId;
          return (
            <div
              key={m.id}
              className={`flex gap-3 ${isMe ? "justify-end" : "justify-start"}`}
            >
              {!isMe && (
                <div className="grid size-8 shrink-0 place-items-center rounded-full bg-[#163e6a] text-white">
                  <Headphones className="size-4" />
                </div>
              )}
              <div
                className={`max-w-160 rounded-2xl p-4.5 text-[13px] shadow-xs ${
                  isMe
                    ? "bg-[#163e6a] text-white"
                    : "border border-[#e5e6e9] bg-white text-[#202126]"
                }`}
              >
                <div
                  className={`mb-1 flex items-center justify-between gap-4 text-[11px] ${
                    isMe ? "text-white/70" : "text-[#77787e]"
                  }`}
                >
                  <span className="font-semibold">
                    {isMe ? "You (Merchant)" : "Go Delivery Support Agent"}
                  </span>
                  <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <p className="m-0 whitespace-pre-wrap leading-relaxed">{m.body}</p>
              </div>
              {isMe && (
                <div className="grid size-8 shrink-0 place-items-center rounded-full bg-[#ec8123] text-white">
                  <User className="size-4" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Reply Composer */}
      {isClosed ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center text-[13px] text-gray-600">
          This ticket is closed and no longer accepting replies.
        </div>
      ) : (
        <form
          onSubmit={handleReply}
          className="rounded-2xl border border-[#e5e6e9] bg-white p-5 shadow-xs"
        >
          {error && <p className="mb-3 text-[12px] text-red-600">{error}</p>}
          <label className="mb-2 block text-[13px] font-semibold text-[#202126]">
            Add a reply
          </label>
          <textarea
            rows={3}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type your message here…"
            className="w-full resize-y rounded-xl border border-[#dedfe2] p-3 text-[13px] text-[#25262a] outline-none focus:border-[#163e6a]"
            required
          />
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={sending || !replyText.trim()}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#163e6a] px-5 text-[12px] font-semibold text-white hover:bg-[#ec8123] disabled:opacity-50"
            >
              <Send className="size-3.5" /> {sending ? "Sending…" : "Send reply"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
