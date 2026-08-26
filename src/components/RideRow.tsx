import Link from "next/link";
import { ChevronRight, Clock, Gauge, Leaf, Route } from "lucide-react";
import { RouteThumb } from "./RouteThumb";
import { formatDurationShort, formatKm, timeAgo } from "@/lib/format";
import type { Ride } from "@/lib/types";

export function RideRow({ ride }: { ride: Ride }) {
  return (
    <li>
      <Link
        href={`/activities/${ride.id}`}
        className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-ink-800"
      >
        <RouteThumb polyline={ride.polyline} className="h-16 w-16 shrink-0" />

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{ride.title}</p>
          <p className="mt-0.5 text-xs text-mist-500">
            {timeAgo(ride.started_at)}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-mist-300">
            <span className="flex items-center gap-1.5">
              <Route className="h-3.5 w-3.5 text-mist-500" />
              {formatKm(ride.distance_m)} km
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-mist-500" />
              {formatDurationShort(ride.moving_s)}
            </span>
            <span className="hidden items-center gap-1.5 sm:flex">
              <Gauge className="h-3.5 w-3.5 text-mist-500" />
              {Number(ride.avg_speed).toFixed(1)} km/j
            </span>
            <span className="flex items-center gap-1.5 text-lime-400">
              <Leaf className="h-3.5 w-3.5" />
              {Number(ride.co2_kg).toFixed(2)} kg CO₂
            </span>
          </div>
        </div>

        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-lime-400">
            +{ride.points}
            <span className="ml-1 text-[10px] font-normal text-mist-500">PTS</span>
          </p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-mist-600" />
      </Link>
    </li>
  );
}
