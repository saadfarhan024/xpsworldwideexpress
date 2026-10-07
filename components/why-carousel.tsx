"use client";

import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const slides = [
  {
    image:
      "https://xpsworldwideexpress.pk/img/4049421-scaled.jpg",
    alt: "A delivery truck carrying cargo",
  },
  {
    image:
      "https://xpsworldwideexpress.pk/img/4049648-scaled.jpg",
    alt: "Packages organized inside a distribution warehouse",
  },
  {
    image:
      "https://xpsworldwideexpress.pk/img/4049410-scaled.jpg",
    alt: "A courier preparing a parcel for delivery",
  },
];

export default function WhyCarousel() {
  const [api, setApi] = useState<CarouselApi>();
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (!api) return;

    const updateActiveSlide = () => setActiveSlide(api.selectedScrollSnap());
    api.on("select", updateActiveSlide);

    return () => {
      api.off("select", updateActiveSlide);
    };
  }, [api]);

  return (
    <Carousel
      setApi={setApi}
      opts={{ loop: true }}
      className="relative min-h-100 bg-center max-[760px]:min-h-77.5"
      aria-label={slides[activeSlide].alt}
    >
      <CarouselContent className="ml-0">
        {slides.map((slide) => (
          <CarouselItem key={slide.image} className="h-100 pl-0 max-[760px]:h-77.5">
            <div
              className="h-full bg-cover bg-center"
              role="img"
              aria-label={slide.alt}
              style={{ backgroundImage: `url("${slide.image}")` }}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious
        variant="ghost"
        size="icon"
        className="left-4 top-1/2 bottom-auto my-0 size-10.5 -translate-y-1/2 rounded-none bg-black/55 text-white hover:bg-black/75 hover:text-white"
      />
      <CarouselNext
        variant="ghost"
        size="icon"
        className="right-4 top-1/2 bottom-auto my-0 size-10.5 -translate-y-1/2 rounded-none bg-black/55 text-white hover:bg-black/75 hover:text-white"
      />
      <div className="absolute bottom-4.5 left-1/2 flex -translate-x-1/2 gap-2" aria-label="Choose an image">
        {slides.map((slide, index) => (
          <button
            key={slide.image}
            className={`size-2 rounded-full ${index === activeSlide ? "bg-[#ed171d]" : "bg-white/60"}`}
            type="button"
            aria-label={`Show image ${index + 1}`}
            aria-current={index === activeSlide ? "true" : undefined}
            onClick={() => api?.scrollTo(index)}
          />
        ))}
      </div>
    </Carousel>
  );
}