"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface BarcodeProps {
  value: string;
  format?: "CODE128" | "CODE39";
  width?: number;
  height?: number;
  displayValue?: boolean;
  className?: string;
}

/**
 * High-precision scannable 1D barcode generator (Code 128)
 * Compatible with standard warehouse laser scanners, CCD optics, and thermal printers.
 */
export function Barcode({
  value,
  format = "CODE128",
  width = 2,
  height = 58,
  displayValue = false,
  className = "mx-auto max-w-full",
}: BarcodeProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format,
          width,
          height,
          displayValue,
          margin: 2,
          background: "#ffffff",
          lineColor: "#000000",
        });
      } catch (err) {
        console.error("Could not render barcode:", err);
      }
    }
  }, [value, format, width, height, displayValue]);

  return <svg ref={svgRef} className={className} aria-label={`Barcode for ${value}`} />;
}
