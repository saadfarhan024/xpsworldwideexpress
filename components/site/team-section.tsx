import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { pageWrap, orangeEyebrow } from "@/components/site/styles";

const team = [
  {
    name: "Timothy Powell",
    role: "Operations lead",
    image: "/Team-5.png",
  },
  {
    name: "Lisa R. Boone",
    role: "Customer experience",
    image: "/Team-8.png",
  },
];

export function TeamSection() {
  return (
    <section className={`${pageWrap} py-30 pb-37.5 max-[760px]:py-19.5`} id="team">
      <div className="mb-13.75 text-center">
        <p className={`${orangeEyebrow} mb-3.25`}>People who get it there</p>
        <h2 className="m-0 text-[clamp(32px,4vw,48px)] font-normal leading-[1.12] text-[#111]">Our Efficient Workers</h2>
      </div>
      <div className="grid grid-cols-[1fr_1fr_.9fr] items-center gap-5.5 max-[760px]:grid-cols-2 max-[760px]:gap-3.5 max-[420px]:grid-cols-1">
        {team.map((member) => (
          <Card key={member.name} className="group/card gap-0 overflow-hidden rounded-none bg-white py-0 shadow-[0_14px_45px_rgb(0_0_0/7%)] ring-0 transition-[transform,box-shadow] duration-300 motion-safe:hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(22,62,106,0.16)]">
            <div className="h-68.75 bg-cover bg-center transition-transform duration-500 motion-safe:group-hover/card:scale-105 max-[760px]:h-51.25 max-[420px]:h-62.5" role="img" aria-label={`${member.name}, GDE team member`} style={{ backgroundImage: `url(${member.image})` }} />
            <CardContent className="grid gap-1.5 px-5.5 pb-5.5 pt-4.75 text-center max-[760px]:px-2.5 max-[760px]:pb-4.25 max-[760px]:pt-3.5">
              <CardTitle className="text-[20px] font-normal text-[#163e6a] max-[760px]:text-[16px]">{member.name}</CardTitle>
              <span className="text-[12px] text-[#6c6d70]">{member.role}</span>
            </CardContent>
          </Card>
        ))}
        <div className="px-6 py-7 max-[760px]:col-span-full max-[760px]:px-0 max-[760px]:pt-6.75">
          <p className={orangeEyebrow}>Our work inspires smiles</p>
          <h3 className="m-0 text-[clamp(28px,3vw,40px)] font-normal leading-[1.2]">We Give Our Best To Provide Everything On Time</h3>
          <Button nativeButton={false} render={<a href="#contact" aria-label="Contact GDE" />} size="icon" className="mt-7 size-11.5 rounded-none bg-[#163e6a] text-white hover:bg-[#ec8123]">
            <ArrowUpRight />
          </Button>
        </div>
      </div>
    </section>
  );
}
