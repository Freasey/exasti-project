import { Bell, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { logoutAction } from "@/app/actions/auth";

export function Topbar({
  name,
  avatarUrl,
  level,
  title,
  hasNotification = true,
}: {
  name: string;
  avatarUrl: string | null;
  level: number;
  title: string;
  hasNotification?: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-ink-700 bg-ink-900/85 px-3 py-3 backdrop-blur sm:gap-3 sm:px-6 lg:px-8 lg:py-4">
      <Logo href="/dashboard" compact />

      <div className="flex items-center gap-1 sm:gap-1.5">
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

        <Link
          href="/settings"
          aria-label="Pengaturan"
          className="hidden rounded-xl p-2.5 text-mist-300 transition-colors hover:bg-ink-800 hover:text-mist-100 sm:block"
        >
          <Settings className="h-5 w-5" strokeWidth={1.9} />
        </Link>

        <form action={logoutAction} className="hidden sm:block">
          <button
            type="submit"
            aria-label="Keluar"
            className="rounded-xl p-2.5 text-mist-300 transition-colors hover:bg-ink-800 hover:text-flame-400"
          >
            <LogOut className="h-5 w-5" strokeWidth={1.9} />
          </button>
        </form>

        <Link
          href="/settings"
          aria-label="Profil"
          className="ml-1 flex items-center gap-2.5 rounded-xl py-1 pl-1 pr-1 transition-colors hover:bg-ink-800 lg:pr-3"
        >
          <Avatar name={name} src={avatarUrl} size={34} />
          <span className="hidden text-left leading-tight lg:block">
            <span className="block text-xs font-medium text-mist-100">
              {name}
            </span>
            <span className="block text-[11px] text-mist-500">
              Level {level} &middot; {title}
            </span>
          </span>
        </Link>
      </div>
    </header>
  );
}
