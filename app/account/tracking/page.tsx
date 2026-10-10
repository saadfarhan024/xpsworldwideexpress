import type { Metadata } from "next";
import { TrackingForm } from "@/components/site/tracking-form";

export const metadata: Metadata = {
  title: "Track Your Deliveries | Go Delivery Express",
  description: "Track your Go Delivery Express deliveries.",
};

export default async function AccountTrackingPage({ searchParams }: { searchParams: Promise<{ code?: string; trackingCode?: string }> }) {
  const query = await searchParams;
  return <TrackingForm initialTrackingCode={query.code ?? query.trackingCode ?? ""} />;
}
