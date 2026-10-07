import Image from "next/image";

export function Brand({ priority = false }: { priority?: boolean }) {
  return (
    <a
      className="inline-flex w-33 shrink-0 max-[900px]:w-26.25"
      href="/"
      aria-label="XPS Worldwide Express home"
    >
      <Image
        src="https://xpsworldwideexpress.pk/img/logo.png"
        alt="XPS Worldwide Express"
        width={350}
        height={218}
        priority={priority}
        sizes="(max-width: 900px) 105px, 132px"
        className="h-auto w-full object-contain"
      />
    </a>
  );
}
