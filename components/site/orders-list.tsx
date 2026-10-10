"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Eye, MapPin, Search } from "lucide-react";

type Order = {
  id: string; trackingCode: string; status: string; orderDate: string; createdAt: string;
  recipientName: string; recipientPhone: string; recipientEmail: string | null; destinationCity: string;
  pickupCity: string | null; pickupName: string | null; pickupPhone: string | null; pickupAddress: string | null;
  itemDescription: string | null; specialInstruction: string | null; codAmount: number | null; weightKg: number | null;
  referenceNumber: string | null; orderId: string | null; pieces: number; serviceType: string;
};
type Tab = "OPEN" | "DELIVERED" | "RETURNED";
const readable = (value: string) => value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const openOrder = (status: string) => !["DELIVERED", "RETURNED", "CANCELLED"].includes(status);

export function OrdersList({ shipments }: { shipments: Order[] }) {
  const [tab, setTab] = useState<Tab>("OPEN");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [origin, setOrigin] = useState("ALL");
  const [destination, setDestination] = useState("ALL");
  const [dateType, setDateType] = useState("ORDER_DATE");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(shipments[0]?.id ?? null);
  const origins = useMemo(() => [...new Set(shipments.map((item) => item.pickupCity).filter(Boolean))] as string[], [shipments]);
  const destinations = useMemo(() => [...new Set(shipments.map((item) => item.destinationCity))], [shipments]);
  const counts = useMemo(() => ({ OPEN: shipments.filter((item) => openOrder(item.status)).length, DELIVERED: shipments.filter((item) => item.status === "DELIVERED").length, RETURNED: shipments.filter((item) => item.status === "RETURNED").length }), [shipments]);
  const filtered = useMemo(() => shipments.filter((item) => {
    if (!(tab === "OPEN" ? openOrder(item.status) : item.status === tab)) return false;
    if (status !== "ALL" && item.status !== status) return false;
    if (origin !== "ALL" && item.pickupCity !== origin) return false;
    if (destination !== "ALL" && item.destinationCity !== destination) return false;
    const text = `${item.trackingCode} ${item.recipientName} ${item.recipientPhone} ${item.referenceNumber ?? ""} ${item.orderId ?? ""}`.toLowerCase();
    if (query.trim() && !text.includes(query.trim().toLowerCase())) return false;
    const date = (dateType === "ORDER_DATE" ? item.orderDate : item.createdAt).slice(0, 10);
    return (!from || date >= from) && (!to || date <= to);
  }), [shipments, tab, status, origin, destination, query, dateType, from, to]);
  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0] ?? null;
  const tabs: Array<{ key: Tab; name: string; count: number }> = [{ key: "OPEN", name: "Open Orders", count: counts.OPEN }, { key: "DELIVERED", name: "Delivered", count: counts.DELIVERED }, { key: "RETURNED", name: "Returned", count: counts.RETURNED }];

  return <div className="grid gap-6">
    <div className="rounded-2xl border border-[#e5e6e9] bg-white p-5 shadow-[0_8px_24px_rgba(24,25,30,0.04)]">
      <div className="grid grid-cols-6 gap-4 max-[1100px]:grid-cols-3 max-[650px]:grid-cols-1">
        <Filter label="Tracking No"><input className={inputClass} placeholder="Tracking No" value={query} onChange={(event) => setQuery(event.target.value)} /></Filter>
        <Filter label="Date Type"><select className={inputClass} value={dateType} onChange={(event) => setDateType(event.target.value)}><option value="ORDER_DATE">Order Date</option><option value="CREATED_DATE">Created Date</option></select></Filter>
        <Filter label="From"><input className={inputClass} type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></Filter>
        <Filter label="To"><input className={inputClass} type="date" value={to} onChange={(event) => setTo(event.target.value)} /></Filter>
        <Filter label="Order Status"><select className={inputClass} value={status} onChange={(event) => setStatus(event.target.value)}><option value="ALL">Select Status</option>{[...new Set(shipments.map((item) => item.status))].map((value) => <option key={value} value={value}>{readable(value)}</option>)}</select></Filter>
        <Filter label="Origin"><select className={inputClass} value={origin} onChange={(event) => setOrigin(event.target.value)}><option value="ALL">All City</option>{origins.map((value) => <option key={value} value={value}>{value}</option>)}</select></Filter>
        <Filter label="Destination" className="col-start-6 max-[1100px]:col-start-auto"><select className={inputClass} value={destination} onChange={(event) => setDestination(event.target.value)}><option value="ALL">All City</option>{destinations.map((value) => <option key={value} value={value}>{value}</option>)}</select></Filter>
      </div>
      <button className="mt-5 inline-flex min-h-10 w-60 items-center justify-center gap-2 rounded-full bg-[#4e5bd5] px-5 text-[13px] font-semibold text-white hover:bg-[#163e6a]" type="button" onClick={() => setSelectedId(filtered[0]?.id ?? null)}><Search className="size-4" /> Search</button>
    </div>
    <div className="flex w-full max-w-140 overflow-hidden rounded-full border-2 border-dotted border-[#cfd1d4] bg-white">{tabs.map((item) => <button key={item.key} className={`flex-1 px-5 py-3 text-left text-[13px] font-semibold ${tab === item.key ? "bg-[#3568b5] text-white" : "text-[#686970] hover:bg-[#f5f7fa]"}`} type="button" onClick={() => { setTab(item.key); setSelectedId(null); }}><span className="block">{item.name}</span><span className={`mt-1 block text-[12px] ${tab === item.key ? "text-[#8bea00]" : "text-[#45464b]"}`}>{item.count} Total</span></button>)}</div>
    <div className="min-w-0 overflow-hidden rounded-2xl border border-[#e5e6e9] bg-white shadow-[0_8px_24px_rgba(24,25,30,0.04)]"><div className="flex items-center justify-between border-b border-[#eeeeef] px-5 py-3 text-[12px] text-[#77787e]"><span>Showing {filtered.length} order(s)</span><span>{query ? `Search: ${query}` : ""}</span></div><div className="divide-y divide-[#eeeeef]">{filtered.length ? filtered.map((order) => <article className={`cursor-pointer p-5 transition hover:bg-[#f8fbff] ${selected?.id === order.id ? "bg-[#f4f8ff]" : ""}`} key={order.id} onClick={() => setSelectedId(order.id)}><div className="grid grid-cols-[1.1fr_1fr_1fr_auto] items-center gap-5 max-[800px]:grid-cols-2 max-[520px]:grid-cols-1"><div><p className="m-0 text-[13px] font-bold text-[#25262a]">{order.recipientName}</p><p className="mb-0 mt-1 text-[12px] text-[#77787e]">{order.recipientPhone}</p><p className="mb-0 mt-2 text-[11px] font-semibold text-[#72bf19]">View More Details</p></div><div><p className="m-0 font-mono text-[12px] font-semibold text-[#34353a]">{order.trackingCode}</p><p className="mb-0 mt-1 text-[11px] text-[#686970]">{new Date(order.orderDate).toLocaleString()}</p><p className="mb-0 mt-2 text-[11px] font-semibold text-[#72bf19]">{order.serviceType} · {order.weightKg ?? "—"} kg</p></div><div><p className="m-0 text-[12px] font-semibold text-[#34353a]">{order.referenceNumber || order.orderId || "No reference"}</p><p className="mb-0 mt-1 text-[12px] text-[#686970]">{order.destinationCity}</p><p className="mb-0 mt-2 text-[11px] font-semibold text-[#72bf19]">COD Amount: {order.codAmount?.toFixed(2) ?? "0.00"}</p></div><div className="grid gap-2"><Link className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#3568b5] px-4 py-2 text-[11px] font-semibold text-white hover:bg-[#163e6a]" href={`/account/shipments/${order.trackingCode}`} onClick={(event) => event.stopPropagation()}><Eye className="size-3.5" /> View Details</Link><Link className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#7ac943] px-4 py-2 text-[11px] font-semibold text-white hover:bg-[#55a51b]" href={`/account/tracking?code=${encodeURIComponent(order.trackingCode)}`} onClick={(event) => event.stopPropagation()}><MapPin className="size-3.5" /> Live Tracking</Link><span className="text-center text-[11px] font-semibold text-[#72bf19]">✓ {readable(order.status)}</span></div></div></article>) : <div className="px-6 py-16 text-center text-[14px] text-[#686970]">No orders match these filters.</div>}</div></div>
  </div>;
}

const inputClass = "h-10 rounded-full border border-[#cfd1d4] bg-white px-4 text-[13px] font-normal outline-none focus:border-[#163e6a]";
function Filter({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) { return <label className={`grid gap-1 text-[12px] font-semibold text-[#686970] ${className}`}>{label}{children}</label>; }
