import { Gift, Home, Map, Radio, Route as RouteIcon, Trophy } from "lucide-react";
import type { NavItem } from "./nav-items";

const ICONS = {
  home: Home,
  map: Map,
  route: RouteIcon,
  gift: Gift,
  trophy: Trophy,
  radio: Radio,
} as const;

export function NavIcon({
  name,
  className = "h-5 w-5",
}: {
  name: NavItem["icon"];
  className?: string;
}) {
  const Icon = ICONS[name];
  return <Icon className={className} strokeWidth={1.9} />;
}
