"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Settings } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { MOBILE_TOPBAR_ITEMS } from "./nav-items";
import { NavIcon } from "./NavIcon";

export function Topbar({
  name,
  avatarUrl,
  hasNotification = true,
}: {
  name: string;
  avatarUrl: string | null;
  hasNotification?: boolean;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-ink-700 bg-ink-900/85 px-3 py-3 backdrop-blur sm:gap-3 sm:px-4 lg:justify-end lg:border-none lg:bg-transparent lg:px-8 lg:py-5">
      <div className="lg:hidden">
        <Logo href="/dashboard" compact />
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* Halaman yang tidak kebagian slot di bottom nav mobile. */}
        {MOBILE_TOPBAR_ITEMS.map((nav) => {
          const active =
            pathname === nav.href || pathname.startsWith(`${nav.href}/`);
          return (
            <Link
              key={nav.href}
              href={nav.href}
              aria-label={nav.label}
              className={`rounded-xl p-2 transition-colors hover:bg-ink-800 hover:text-mist-100 sm:p-2.5 lg:hidden ${
                active ? "text-lime-400" : "text-mist-300"
              }`}
            >
              <NavIcon name={nav.icon} className="h-5 w-5" />
            </Link>
          );
        })}

        <button
          type="button"
          aria-label="Notifikasi"
          className="relative rounded-xl p-2 text-mist-300 transition-colors hover:bg-ink-800 hover:text-mist-100 sm:p-2.5"
        >
          <Bell className="h-5 w-5" strokeWidth={1.9} />
          {hasNotification && (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-flame-500 ring-2 ring-ink-900" />
          )}
        </button>

        {/* Di mobile avatar sudah menuju /settings, jadi ikon gir cukup untuk desktop. */}
        <Link
          href="/settings"
          aria-label="Pengaturan"
          className="hidden rounded-xl p-2.5 text-mist-300 transition-colors hover:bg-ink-800 hover:text-mist-100 lg:block"
        >
          <Settings className="h-5 w-5" strokeWidth={1.9} />
        </Link>
        <Link href="/settings" aria-label="Profil" className="ml-1 lg:hidden">
          <Avatar name={name} src={avatarUrl} size={34} />
        </Link>
      </div>
    </header>
  );
}
