"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Play } from "lucide-react";
import { NAV_ITEMS } from "./nav-items";
import { NavIcon } from "./NavIcon";

const LEFT = NAV_ITEMS.slice(0, 2);
const RIGHT = NAV_ITEMS.slice(3, 5);

export function MobileNav() {
  const pathname = usePathname();

  const item = (href: string, label: string, icon: (typeof NAV_ITEMS)[number]["icon"]) => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return (
      <Link
        key={href}
        href={href as never}
        className={`flex flex-1 flex-col items-center gap-1 py-2 text-[10px] transition-colors ${
          active ? "text-lime-400" : "text-mist-500"
        }`}
      >
        <NavIcon name={icon} className="h-5 w-5" />
        {label}
      </Link>
    );
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-end border-t border-ink-700 bg-ink-880/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      {LEFT.map((i) => item(i.href, i.label, i.icon))}

      <div className="relative flex w-20 justify-center">
        <Link
          href="/ride"
          aria-label="Mulai gowes"
          className="-mt-6 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-flame-400 to-flame-600 text-white shadow-lg shadow-flame-600/30 ring-4 ring-ink-880"
        >
          <Play className="h-6 w-6 fill-current" />
        </Link>
      </div>

      {RIGHT.map((i) => item(i.href, i.label, i.icon))}
    </nav>
  );
}
