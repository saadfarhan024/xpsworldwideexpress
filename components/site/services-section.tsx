import { CircleDollarSign, DoorOpen, Mail, PackageCheck, Truck, Warehouse } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { pageWrap, orangeEyebrow } from "@/components/site/styles";

const services = [
  {
    title: "Cash On Delivery",
    description: "Secure collection, clear settlement.",
    details: "Collect payment at delivery with reliable cash reconciliation.",
    icon: CircleDollarSign,
  },
  {
    title: "Courier",
    description: "Fast, dependable parcel delivery.",
    details: "Schedule pickups, deliver to the doorstep, and track each parcel.",
    icon: Mail,
  },
  {
    title: "Cargo",
    description: "Flexible capacity for every shipment.",
    details: "Move heavier domestic and international loads by road, air, or sea.",
    icon: Truck,
  },
  {
    title: "Door To Door",
    description: "Picked up and delivered with care.",
    details: "One coordinated service from collection through final delivery.",
    icon: DoorOpen,
  },
  {
    title: "Warehousing",
    description: "Space and support when you need it.",
    details: "Store inventory securely and keep shipments ready for dispatch.",
    icon: Warehouse,
  },
  {
    title: "Fulfillment",
    description: "From order received to ready to ship.",
    details: "Get orders packed, prepared, and moving with delivery support.",
    icon: PackageCheck,
  },
];

export function ServicesSection() {
  return (
    <section className={`${pageWrap} py-30 pb-33.75 max-[760px]:py-19.5`} id="services">
      <div className="mb-12 text-center max-[760px]:mb-8.5">
        <p className={`${orangeEyebrow} mb-3.25`}>One partner, every mile</p>
        <h2 className="m-0 text-[clamp(32px,4vw,48px)] font-normal leading-[1.12] text-[#111]">Services built around your business</h2>
      </div>
      <div className="grid grid-cols-3 gap-5 max-[760px]:grid-cols-2 max-[760px]:gap-3 max-[640px]:grid-cols-1">
        {services.map(({ title, description, details, icon: Icon }) => (
          <Card key={title} className="group/card gap-0 rounded-md border border-neutral-200 border-t-[3px] border-t-[#163e6a] bg-white p-0 text-neutral-900 shadow-[0_8px_22px_rgba(20,20,20,0.06)] ring-0 transition-[transform,box-shadow] duration-300 motion-safe:hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(22,62,106,0.14)]">
            <CardContent className="flex min-h-63 flex-col items-start p-6 text-left max-[760px]:min-h-56 max-[760px]:p-5 max-[640px]:min-h-0">
              <span className="mb-5 grid size-12 place-items-center rounded-full bg-orange-50 text-[#ec8123] transition-transform duration-300 motion-safe:group-hover/card:rotate-[-8deg] motion-safe:group-hover/card:scale-110">
                <Icon className="size-6 stroke-[1.7]" />
              </span>
              <CardTitle className="text-xl font-semibold leading-tight text-neutral-900 max-[760px]:text-lg">{title}</CardTitle>
              <span className="mt-2.5 text-sm font-medium text-neutral-700">{description}</span>
              <p className="mb-0 mt-3 text-sm leading-[1.6] text-neutral-500">{details}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
