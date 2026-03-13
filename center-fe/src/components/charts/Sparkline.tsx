"use client";

export function Sparkline({
  values,
  width = 240,
  height = 56,
}: {
  values: number[];
  width?: number;
  height?: number;
}) {
  const safe = values.map((v) => (Number.isFinite(v) ? v : 0));
  const max = Math.max(1, ...safe);
  const min = Math.min(...safe);
  const span = Math.max(1, max - min);

  const points = safe
    .map((v, i) => {
      const x = (i / Math.max(1, safe.length - 1)) * (width - 8) + 4;
      const y = height - 4 - ((v - min) / span) * (height - 8);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        points={points}
        className="text-blue-600"
      />
    </svg>
  );
}


