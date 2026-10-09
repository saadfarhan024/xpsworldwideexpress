// Portfolio/demo rate card. Replace these constants with the courier's configured
// rate table when production pricing is available.
const SERVICE_BASE_RATES: Record<string, number> = {
  Overnight: 250,
  "Same Day": 400,
  Economy: 180,
  International: 1500,
  Shopify: 250,
};

const PRODUCT_MULTIPLIERS: Record<string, number> = {
  Parcel: 1,
  Document: 0.8,
  Fragile: 1.25,
  Electronics: 1.15,
};

const round = (value: number) => Math.round(value * 100) / 100;

export function calculateShipmentPricing(input: {
  serviceType: string;
  productType: string;
  pieces: number;
  weightKg: number;
  codAmount: number;
}) {
  const baseRate = SERVICE_BASE_RATES[input.serviceType] ?? SERVICE_BASE_RATES.Overnight;
  const productMultiplier = PRODUCT_MULTIPLIERS[input.productType] ?? 1;
  const weightCharge = Math.max(0, input.weightKg - 0.5) * 80;
  const extraPieceCharge = Math.max(0, input.pieces - 1) * 50;
  const codFee = input.codAmount > 0 ? Math.min(input.codAmount * 0.01, 500) : 0;
  const deliveryCharges = round((baseRate + weightCharge + extraPieceCharge + codFee) * productMultiplier);
  const fuelSurchargePercent = input.serviceType === "International" ? 12 : input.serviceType === "Same Day" ? 8 : 5;
  const fuelSurcharge = round((deliveryCharges * fuelSurchargePercent) / 100);
  const totalCharges = round(deliveryCharges + fuelSurcharge);
  const salesTax = round(totalCharges * 0.15);
  const netAmount = round(totalCharges + salesTax);

  return { deliveryCharges, fuelSurchargePercent, fuelSurcharge, totalCharges, salesTax, netAmount };
}
