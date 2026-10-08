import Link from "next/link";
import Image from "next/image";

export function Brand({ priority = false }: { priority?: boolean }) {
  return (
    <Link
      className="inline-flex w-33 shrink-0 rounded-lg bg-white p-2 max-[900px]:w-26.25 max-[900px]:p-1.5"
      href="/"
      aria-label="Go Delivery Express home"
    >
      <Image
        src="/logo.png"
        alt="Go Delivery Express"
        width={350}
        height={218}
        priority={priority}
        sizes="(max-width: 900px) 105px, 132px"
        className="h-auto w-full object-contain"
      />
    </Link>
  );
}
