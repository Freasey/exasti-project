"use client";

import Link from "next/link";
import { Bell, Settings } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/ui/Avatar";

export function Topbar({
  name,
  avatarUrl,
  hasNotification = true,
}: {
  name: string;
  avatarUrl: string | null;
  hasNotification?: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-ink-700 bg-ink-900/85 px-4 py-3 backdrop-blur lg:justify-end lg:border-none lg:bg-transparent lg:px-8 lg:py-5">
      <div className="lg:hidden">
        <Logo href="/dashboard" compact />
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Notifikasi"
          className="relative rounded-xl p-2.5 text-mist-300 transition-colors hover:bg-ink-800 hover:text-mist-100"
        >
          <Bell className="h-5 w-5" strokeWidth={1.9} />
          {hasNotification && (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-flame-500 ring-2 ring-ink-900" />
          )}
        </button>
        <Link
          href="/settings"
          aria-label="Pengaturan"
          className="rounded-xl p-2.5 text-mist-300 transition-colors hover:bg-ink-800 hover:text-mist-100"
        >
          <Settings className="h-5 w-5" strokeWidth={1.9} />
        </Link>
        <Link href="/settings" className="ml-1 lg:hidden">
          <Avatar name={name} src={avatarUrl} size={34} />
        </Link>
      </div>
    </header>
  );
}
