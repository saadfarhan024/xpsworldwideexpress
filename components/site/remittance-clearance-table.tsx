"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

type RemittanceRow = {
  reference: string;
  payoutReference: string | null;
  invoiceDate: string;
  shipmentCount: number;
  deliveryCount: number;
  codAmount: number;
  deliveryCharges: number;
  salesTax: number;
  payable: number;
  payment: number;
  balance: number;
};

const money = (value: number) => `Rs. ${value.toLocaleString("en-PK", { minimumFractionDigits: 2 })}`;

export function RemittanceClearanceTable({ rows }: { rows: RemittanceRow[] }) {
  const [query, setQuery] = useState("");

  const filteredRows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) =>
      [row.reference, row.payoutReference ?? "", row.invoiceDate].some((value) =>
        value.toLowerCase().includes(needle),
      ),
    );
  }, [query, rows]);

  const exportCsv = () => {
    const header = ["Payment ID", "Transaction ID", "Invoice Date", "Total Shipments", "Total Deliveries", "Total COD Amount", "Delivery Charges", "GST", "Total Payable", "Payment", "Balance"];
    const body = filteredRows.map((row) => [row.reference, row.payoutReference ?? `SI-${row.reference}`, row.invoiceDate, row.shipmentCount, row.deliveryCount, row.codAmount, row.deliveryCharges, row.salesTax, row.payable, row.payment, row.balance]);
    const csv = [header, ...body].map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "cod-payment-clearance.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-12">
      <ClearanceSection title="Payment Clearance (COD Account)">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <button type="button" onClick={() => window.print()} className="rounded-lg bg-[#163e6a] px-5 py-2.5 text-[15px] font-semibold text-white transition hover:bg-[#ec8123]">Print</button>
          <div className="flex flex-wrap items-center gap-2 text-[14px] text-[#666]">
            <label htmlFor="remittance-search">Search:</label>
            <input id="remittance-search" value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 w-60 rounded border border-[#cfcfcf] px-3 outline-none focus:border-[#1595b5]" />
            <button type="button" onClick={() => navigator.clipboard?.writeText(filteredRows.map((row) => `${row.reference}\t${money(row.payable)}`).join("\n"))} className="rounded-lg bg-[#163e6a] px-4 py-2 text-white transition hover:bg-[#ec8123]">Copy</button>
            <button type="button" onClick={exportCsv} className="rounded-lg bg-[#163e6a] px-4 py-2 text-white transition hover:bg-[#ec8123]">CSV</button>
            <button type="button" onClick={exportCsv} className="rounded-lg bg-[#163e6a] px-4 py-2 text-white transition hover:bg-[#ec8123]">Excel</button>
            <button type="button" onClick={() => window.print()} className="rounded-lg bg-[#163e6a] px-4 py-2 text-white transition hover:bg-[#ec8123]">Print</button>
          </div>
        </div>
        <div className="overflow-x-auto border border-[#d9d9d9]">
          <table className="w-full min-w-275 border-collapse text-left text-[13px]">
            <thead className="bg-[#f5f5f5] text-[#575757]"><tr>{["Sr.No..", "Payment ID", "Cheque No./Transaction ID", "Invoice Date", "Total Shipments", "Total Deliveries", "Total COD Amount", "Delivery Charges", "GST", "Flyers", "Total Payable", "Payment", "Balance", "Action"].map((heading) => <th key={heading} className="border border-[#d9d9d9] px-2.5 py-3 font-bold">{heading}</th>)}</tr></thead>
            <tbody>
              {filteredRows.map((row, index) => <tr key={row.reference} className="font-semibold text-[#222] odd:bg-white even:bg-[#fafafa]">
                <td className="border border-[#d9d9d9] px-2.5 py-3">{index + 1}</td><td className="border border-[#d9d9d9] px-2.5 py-3">{row.reference}</td><td className="border border-[#d9d9d9] px-2.5 py-3">{row.payoutReference ?? `SI-${row.reference}`}</td><td className="border border-[#d9d9d9] px-2.5 py-3">{row.invoiceDate}</td><td className="border border-[#d9d9d9] px-2.5 py-3">{row.shipmentCount}</td><td className="border border-[#d9d9d9] px-2.5 py-3">{row.deliveryCount}</td><td className="border border-[#d9d9d9] px-2.5 py-3">{money(row.codAmount)}</td><td className="border border-[#d9d9d9] px-2.5 py-3">{money(row.deliveryCharges)}</td><td className="border border-[#d9d9d9] px-2.5 py-3">{money(row.salesTax)}</td><td className="border border-[#d9d9d9] px-2.5 py-3">Rs. 0.00 (0)</td><td className="border border-[#d9d9d9] px-2.5 py-3">{money(row.payable)}</td><td className="border border-[#d9d9d9] px-2.5 py-3">{money(row.payment)}</td><td className="border border-[#d9d9d9] px-2.5 py-3">{money(row.balance)}</td><td className="border border-[#d9d9d9] px-2.5 py-3"><Link href={`/account/remittances/${row.reference}`} className="rounded bg-[#55b332] px-3 py-1.5 text-white hover:bg-[#449823]">View</Link></td>
              </tr>)}
              {filteredRows.length === 0 && <tr><td colSpan={14} className="border border-[#d9d9d9] px-4 py-6 text-center font-semibold">No data available in table</td></tr>}
            </tbody>
          </table>
        </div>
      </ClearanceSection>
      <ClearanceSection title="Invoices (Non COD Account)">
        <div className="border border-[#d9d9d9] px-4 py-8 text-center font-semibold text-[#222]">No data available in table</div>
      </ClearanceSection>
    </div>
  );
}

function ClearanceSection({ title, children }: { title: string; children: ReactNode }) {
  return <section><h1 className="mb-5 text-[27px] font-bold tracking-tight text-[#111]">{title}</h1>{children}</section>;
}
