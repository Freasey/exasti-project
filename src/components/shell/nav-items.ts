import type { Route } from "next";

export type NavItem = {
  href: Route;
  label: string;
  /** Label pendek untuk bottom nav mobile yang ruangnya sempit. */
  short?: string;
  icon: "home" | "map" | "route" | "gift" | "trophy" | "radio";
  /**
   * Tampil di bottom nav mobile. Slotnya hanya 4 (2 kiri + 2 kanan tombol
   * gowes), jadi item lain diakses lewat pintasan di Topbar.
   */
  mobile?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", short: "Home", icon: "home", mobile: true },
  { href: "/activities", label: "Aktivitas", icon: "route", mobile: true },
  { href: "/live", label: "Live Riders", short: "Live", icon: "radio" },
  { href: "/analytics", label: "Analytics & Maps", short: "Analytics", icon: "map", mobile: true },
  { href: "/rewards", label: "Rewards", icon: "gift", mobile: true },
  { href: "/leaderboard", label: "Leaderboard", short: "Peringkat", icon: "trophy" },
];

/** Item bottom nav mobile - dipilih lewat flag, bukan potongan indeks. */
export const MOBILE_NAV_ITEMS = NAV_ITEMS.filter((item) => item.mobile);

/** Sisanya tidak muat di bottom nav, jadi disediakan sebagai ikon di Topbar. */
export const MOBILE_TOPBAR_ITEMS = NAV_ITEMS.filter((item) => !item.mobile);
