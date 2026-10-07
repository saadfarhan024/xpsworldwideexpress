"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type NavigationLink = {
  label: string;
  href: string;
};

export function MobileNavigation({
  links,
  isScrolled,
}: {
  links: NavigationLink[];
  isScrolled: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className={`hidden size-11 max-[900px]:inline-flex ${isScrolled ? "text-neutral-900 hover:bg-neutral-900/5 hover:text-neutral-900" : "text-white hover:bg-white/10 hover:text-white"}`}
            aria-label="Open navigation"
          />
        }
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[min(24rem,85vw)] border-l border-neutral-200 bg-white p-0 text-neutral-900"
      >
        <SheetHeader className="border-b border-neutral-200 px-6 py-5">
          <SheetTitle className="text-left text-lg font-bold tracking-[.14em] text-neutral-500">
            Menu
          </SheetTitle>
        </SheetHeader>
        <nav className="grid px-6 py-4" aria-label="Mobile navigation">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="border-b border-neutral-200 py-4 text-lg font-semibold text-neutral-800 transition-colors hover:text-[#ed171d]"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
