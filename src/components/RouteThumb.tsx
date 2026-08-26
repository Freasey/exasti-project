/**
 * Pratinjau rute sebagai SVG murni — jauh lebih ringan daripada memuat
 * satu instance Leaflet per baris daftar aktivitas.
 */
export function RouteThumb({
  polyline,
  className = "",
}: {
  polyline: [number, number][];
  className?: string;
}) {
  if (!polyline || polyline.length < 2) {
    return (
      <div
        className={`grid place-items-center rounded-xl border border-ink-700 bg-ink-800 ${className}`}
      >
        <span className="text-[10px] text-mist-600">no GPS</span>
      </div>
    );
  }

  const lats = polyline.map((p) => p[0]);
  const lngs = polyline.map((p) => p[1]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  // Skala seragam agar bentuk rute tidak gepeng.
  const spanLat = Math.max(maxLat - minLat, 1e-5);
  const spanLng = Math.max(maxLng - minLng, 1e-5);
  const span = Math.max(spanLat, spanLng);
  const offsetX = (span - spanLng) / 2;
  const offsetY = (span - spanLat) / 2;

  const pad = 6;
  const size = 100 - pad * 2;
  const points = polyline
    .map(([lat, lng]) => {
      const x = pad + ((lng - minLng + offsetX) / span) * size;
      // lat naik ke atas, sumbu y SVG turun ke bawah
      const y = pad + ((maxLat - lat + offsetY) / span) * size;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const first = points.split(" ")[0].split(",");
  const last = points.split(" ").at(-1)!.split(",");

  return (
    <svg
      viewBox="0 0 100 100"
      className={`rounded-xl border border-ink-700 bg-ink-800 ${className}`}
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke="#1e261c"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points={points}
        fill="none"
        stroke="#8be04e"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={first[0]} cy={first[1]} r="4" fill="#8be04e" />
      <circle cx={last[0]} cy={last[1]} r="4" fill="#f4562a" />
    </svg>
  );
}
