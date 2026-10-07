import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { pageWrap, redEyebrow } from "@/components/site/styles";

const team = [
  {
    name: "Timothy Powell",
    role: "Operations lead",
    image: "https://xpsworldwideexpress.pk/img/Team-5.png",
  },
  {
    name: "Lisa R. Boone",
    role: "Customer experience",
    image: "https://xpsworldwideexpress.pk/img/Team-8.png",
  },
];

export function TeamSection() {
  return (
    <section className={`${pageWrap} py-30 pb-37.5 max-[760px]:py-19.5`} id="team">
      <div className="mb-13.75 text-center">
        <p className={`${redEyebrow} mb-3.25`}>People who get it there</p>
        <h2 className="m-0 text-[clamp(32px,4vw,48px)] font-normal leading-[1.12] text-[#111]">Our Efficient Workers</h2>
      </div>
      <div className="grid grid-cols-[1fr_1fr_.9fr] items-center gap-5.5 max-[760px]:grid-cols-2 max-[760px]:gap-3.5 max-[420px]:grid-cols-1">
        {team.map((member) => (
          <Card key={member.name} className="gap-0 overflow-hidden rounded-none bg-white py-0 shadow-[0_14px_45px_rgb(0_0_0/7%)] ring-0">
            <div className="h-68.75 bg-cover bg-center max-[760px]:h-51.25 max-[420px]:h-62.5" role="img" aria-label={`${member.name}, XPS team member`} style={{ backgroundImage: `url(${member.image})` }} />
            <CardContent className="grid gap-1.5 px-5.5 pb-5.5 pt-4.75 text-center max-[760px]:px-2.5 max-[760px]:pb-4.25 max-[760px]:pt-3.5">
              <CardTitle className="text-[20px] font-normal text-[#ed171d] max-[760px]:text-[16px]">{member.name}</CardTitle>
              <span className="text-[12px] text-[#6c6d70]">{member.role}</span>
            </CardContent>
          </Card>
        ))}
        <div className="px-6 py-7 max-[760px]:col-span-full max-[760px]:px-0 max-[760px]:pt-6.75">
          <p className={redEyebrow}>Our work inspires smiles</p>
          <h3 className="m-0 text-[clamp(28px,3vw,40px)] font-normal leading-[1.2]">We Give Our Best To Provide Everything On Time</h3>
          <Button nativeButton={false} render={<a href="#contact" aria-label="Contact XPS" />} size="icon" className="mt-7 size-11.5 rounded-none bg-[#ed171d] text-white hover:bg-[#c9080c]">
            <ArrowUpRight />
          </Button>
        </div>
      </div>
    </section>
  );
}
