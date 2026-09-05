"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Play } from "lucide-react";
import { NAV_ITEMS, type NavItem } from "./nav-items";
import { NavIcon } from "./NavIcon";

// Tombol gowes duduk di tengah dock, jadi item lain dibagi rata kiri-kanan.
const HALF = Math.ceil(NAV_ITEMS.length / 2);
const LEFT = NAV_ITEMS.slice(0, HALF);
const RIGHT = NAV_ITEMS.slice(HALF);

export function Dock() {
  const pathname = usePathname();

  const item = (nav: NavItem) => {
    const active = pathname === nav.href || pathname.startsWith(`${nav.href}/`);
    return (
      <Link
        key={nav.href}
        href={nav.href}
        aria-label={nav.label}
        aria-current={active ? "page" : undefined}
        className={`group relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors sm:h-12 sm:w-12 ${
          active
            ? "bg-lime-400/15 text-lime-400"
            : "text-mist-500 hover:bg-ink-800 hover:text-mist-100"
        }`}
      >
        <NavIcon name={nav.icon} className="h-5 w-5" />
        {active && (
          <span className="absolute bottom-1 h-1 w-1 rounded-full bg-lime-400" />
        )}
        <span
          role="tooltip"
          className="pointer-events-none absolute -top-10 hidden whitespace-nowrap rounded-lg border border-ink-700 bg-ink-800 px-2.5 py-1 text-xs font-medium text-mist-100 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 lg:block"
        >
          {nav.label}
        </span>
      </Link>
    );
  };

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-3 pb-[env(safe-area-inset-bottom)] sm:bottom-5"
    >
      <div className="flex items-center gap-1 rounded-full border border-ink-700 bg-ink-850/90 p-1.5 shadow-xl shadow-black/40 backdrop-blur sm:gap-1.5 sm:p-2">
        {LEFT.map(item)}

        <Link
          href="/ride"
          aria-label="Mulai gowes"
          className="group relative mx-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-flame-400 to-flame-600 text-white shadow-lg shadow-flame-600/30 transition-transform hover:-translate-y-1 sm:h-14 sm:w-14"
        >
          <Play className="h-5 w-5 fill-current sm:h-6 sm:w-6" />
          <span
            role="tooltip"
            className="pointer-events-none absolute -top-10 hidden whitespace-nowrap rounded-lg border border-ink-700 bg-ink-800 px-2.5 py-1 text-xs font-medium text-mist-100 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 lg:block"
          >
            Mulai Gowes
          </span>
        </Link>

        {RIGHT.map(item)}
      </div>
    </nav>
  );
}
