"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Settings } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { Progress } from "@/components/ui/Progress";
import { NAV_ITEMS } from "./nav-items";
import { NavIcon } from "./NavIcon";
import { logoutAction } from "@/app/actions/auth";
import { formatNumber } from "@/lib/format";

export type ShellUser = {
  name: string;
  username: string;
  avatarUrl: string | null;
  level: number;
  title: string;
  xpIntoLevel: number;
  xpForNext: number;
  progress: number;
};

export function Sidebar({ user }: { user: ShellUser }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[264px] shrink-0 flex-col border-r border-ink-700 bg-ink-880 lg:flex">
      <div className="px-6 py-6">
        <Logo href="/dashboard" />
      </div>

      <nav className="flex flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] transition-colors ${
                active
                  ? "bg-lime-400/10 font-medium text-lime-300"
                  : "text-mist-300 hover:bg-ink-800 hover:text-mist-100"
              }`}
            >
              {active && (
                <span className="absolute -left-3 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-lime-400" />
              )}
              <NavIcon name={item.icon} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* siluet kota — dekorasi latar sidebar */}
      <div className="pointer-events-none relative -mb-2 mt-auto h-40 opacity-70">
        <svg
          viewBox="0 0 264 160"
          className="absolute inset-x-0 bottom-0 h-full w-full text-lime-900"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M0 120h16V80h10v40h14V96h18v24h12V60h14v60h16V88h20v32h14V72h12v48h18V92h16v28h12V64h14v56h18V100h14v20h22v40H0z"
          />
          <circle cx="46" cy="66" r="16" fill="none" stroke="currentColor" strokeWidth="3" />
        </svg>
      </div>

      <div className="m-3 rounded-2xl border border-ink-700 bg-ink-850 p-4">
        <div className="flex items-center gap-3">
          <Avatar name={user.name} src={user.avatarUrl} size={48} ring />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="text-xs text-mist-500">
              Level {user.level} · {user.title}
            </p>
          </div>
          <Link
            href="/settings"
            aria-label="Pengaturan akun"
            className="rounded-lg p-1.5 text-mist-500 transition-colors hover:bg-ink-800 hover:text-mist-100"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-3">
          <Progress value={user.progress} />
          <p className="mt-1.5 text-[11px] text-mist-500">
            {formatNumber(user.xpIntoLevel)} / {formatNumber(user.xpForNext)} XP
          </p>
        </div>

        <form action={logoutAction} className="mt-3">
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-sm text-mist-500 transition-colors hover:text-flame-400"
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </button>
        </form>
      </div>
    </aside>
  );
}
