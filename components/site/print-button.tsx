"use client";

import { Printer } from "lucide-react";

interface PrintButtonProps {
  label?: string;
  className?: string;
  showIcon?: boolean;
}

export function PrintButton({
  label = "Print",
  className = "inline-flex items-center gap-2 rounded-lg bg-[#163e6a] px-4 py-2 text-[13px] font-semibold text-white shadow-xs hover:bg-[#ec8123] transition-colors cursor-pointer",
  showIcon = true,
}: PrintButtonProps) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={className}
      title={label}
    >
      {showIcon && <Printer className="size-3.5" />}
      <span>{label}</span>
    </button>
  );
}
