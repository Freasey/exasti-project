import type { Route } from "next";

export type NavItem = {
  href: Route;
  label: string;
  icon: "home" | "map" | "route" | "gift" | "trophy" | "radio";
};

/** Ditampilkan di floating dock, dibagi rata kiri-kanan tombol gowes. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "home" },
  { href: "/activities", label: "Aktivitas", icon: "route" },
  { href: "/live", label: "Live Riders", icon: "radio" },
  { href: "/analytics", label: "Analytics & Maps", icon: "map" },
  { href: "/leaderboard", label: "Leaderboard", icon: "trophy" },
  { href: "/rewards", label: "Rewards", icon: "gift" },
];
