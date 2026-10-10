"use client";

import { useMemo, useState } from "react";

type ScanOrder = { id: string; trackingCode: string; orderId: string | null; recipientName: string; destinationCity: string; deliveryAddress: string; pieces: number; codAmount: number | null };

export function ScanSheet({ orders, riders }: { orders: ScanOrder[]; riders: { id: string; email: string }[] }) {
  const [input, setInput] = useState("");
  const [rider, setRider] = useState("");
  const requested = useMemo(() => new Set(input.split(/[\s,\n]+/).map((value) => value.trim().toUpperCase()).filter(Boolean)), [input]);
  const selected = useMemo(() => orders.filter((order) => requested.has(order.trackingCode.toUpperCase()) || (order.orderId && requested.has(order.orderId.toUpperCase()))), [orders, requested]);
  const print = () => {
    if (!selected.length) return;
    const riderName = riders.find((item) => item.id === rider)?.email ?? "Unassigned";
    const escape = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" } as Record<string, string>)[char] ?? char);
    const windowRef = window.open("", "_blank", "width=900,height=700");
    if (!windowRef) return;
    windowRef.document.write(`<html><head><title>Scan sheet</title><style>body{font:14px Arial;padding:24px}h1{margin:0 0 8px}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #bbb;padding:8px;text-align:left}th{background:#f1f1f1}@media print{button{display:none}}</style></head><body><h1>Go Delivery Express — Scan Sheet</h1><p>Rider: ${escape(riderName)} · Orders: ${selected.length}</p><table><thead><tr><th>Tracking No</th><th>Order ID</th><th>Customer</th><th>Destination</th><th>Address</th><th>Pieces</th><th>COD</th></tr></thead><tbody>${selected.map((order) => `<tr><td>${escape(order.trackingCode)}</td><td>${escape(order.orderId ?? "—")}</td><td>${escape(order.recipientName)}</td><td>${escape(order.destinationCity)}</td><td>${escape(order.deliveryAddress)}</td><td>${order.pieces}</td><td>${order.codAmount == null ? "—" : `PKR ${order.codAmount.toFixed(2)}`}</td></tr>`).join("")}</tbody></table><script>window.onload=()=>window.print()</script></body></html>`);
    windowRef.document.close();
  };
  return <section className="grid min-h-[570px] grid-cols-2 gap-6 rounded-2xl border border-[#e5e6e9] bg-white p-6 shadow-[0_8px_24px_rgba(24,25,30,0.04)] max-[850px]:grid-cols-1"><div><textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder="Please enter order IDs" className="min-h-70 w-full resize-y rounded-xl border border-[#dedfe2] p-5 text-[18px] text-[#34353a] outline-none transition focus:border-[#163e6a] focus:ring-3 focus:ring-[#163e6a]/10" aria-label="Order IDs" /><p className="m-0 text-right text-[13px] text-[#85868c]">Orders count: {selected.length}</p><div className="mt-4 flex items-end gap-2"><label className="grid flex-1 gap-1 text-[12px] font-semibold text-[#686970]">Rider vendor<select value={rider} onChange={(event) => setRider(event.target.value)} className="h-11 rounded-lg border border-[#dedfe2] bg-white px-3 text-[14px] text-[#34353a]"><option value="">Select rider</option>{riders.map((item) => <option key={item.id} value={item.id}>{item.email}</option>)}</select></label><button type="button" onClick={print} disabled={!selected.length} className="h-11 rounded-lg bg-[#163e6a] px-6 text-[14px] font-semibold text-white transition hover:bg-[#ec8123] disabled:cursor-not-allowed disabled:opacity-50">Print</button></div><p className="mt-3 text-[12px] text-[#85868c]">Enter tracking numbers or order IDs separated by commas, spaces, or new lines.</p></div><div className="min-h-140 rounded-xl border border-[#e5e6e9] bg-[#f8fafc] p-5"><p className="m-0 text-[11px] font-bold uppercase tracking-[0.12em] text-[#163e6a]">Preview</p>{selected.length ? <div className="mt-5 space-y-3">{selected.map((order) => <div key={order.id} className="rounded-xl border border-[#e1e5ea] bg-white p-3 text-[13px] shadow-sm"><strong className="font-mono text-[#163e6a]">{order.trackingCode}</strong> · {order.recipientName}<p className="m-0 mt-1 text-[#686970]">{order.destinationCity} · {order.deliveryAddress}</p></div>)}</div> : <p className="mt-5 text-[13px] text-[#85868c]">Matching orders will appear here.</p>}</div></section>;
}
