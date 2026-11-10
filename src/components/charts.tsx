import { kz } from "../lib/finance";

const ORANGE = "#2563a8";
export const PALETTE = ["#2563a8", "#1f9d6b", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#ef4444", "#64748b"];

const niceMax = (v: number) => {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
};

type Pt = { label: string; value: number };

function Frame({ data, money, children }: { data: Pt[]; money?: boolean; children: (x: (i: number) => number, y: (v: number) => number, max: number) => React.ReactNode }) {
  const W = 560, H = 240, L = money ? 62 : 36, R = 12, T = 12, B = 28;
  const max = niceMax(Math.max(...data.map((d) => d.value), 0));
  const P = 22; // margem interior para não cortar a última barra/etiqueta
  const x = (i: number) => L + P + (data.length === 1 ? (W - L - R - 2 * P) / 2 : (i * (W - L - R - 2 * P)) / (data.length - 1));
  const y = (v: number) => T + (H - T - B) * (1 - v / max);
  const fmt = (v: number) => (money ? (v >= 1000 ? `${v / 1000}k` : String(v)) : String(v));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img">
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={y(max * t)} y2={y(max * t)} stroke="#e2e8f0" strokeDasharray="3 3" />
          <text x={L - 6} y={y(max * t) + 4} textAnchor="end" fontSize="11" fill="#64748b">
            {fmt(Math.round(max * t * 100) / 100)}
          </text>
        </g>
      ))}
      {data.map((d, i) => (
        <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#64748b">
          {d.label}
        </text>
      ))}
      {children(x, y, max)}
    </svg>
  );
}

export function LineChart({ data, money = true }: { data: Pt[]; money?: boolean }) {
  return (
    <Frame data={data} money={money}>
      {(x, y) => {
        const pts = data.map((d, i) => `${x(i)},${y(d.value)}`);
        return (
          <>
            <polygon points={`${x(0)},${y(0)} ${pts.join(" ")} ${x(data.length - 1)},${y(0)}`} fill={ORANGE} opacity="0.1" />
            <polyline points={pts.join(" ")} fill="none" stroke={ORANGE} strokeWidth="2.5" strokeLinejoin="round" />
            {data.map((d, i) => (
              <circle key={i} cx={x(i)} cy={y(d.value)} r="3.5" fill={ORANGE}>
                <title>{`${d.label}: ${money ? kz(d.value) : d.value}`}</title>
              </circle>
            ))}
          </>
        );
      }}
    </Frame>
  );
}

export function BarChart({ data, color = "#1f9d6b" }: { data: Pt[]; color?: string }) {
  return (
    <Frame data={data}>
      {(x, y) =>
        data.map((d, i) => {
          const w = Math.min(36, 320 / data.length);
          return (
            <rect key={i} x={x(i) - w / 2} y={y(d.value)} width={w} height={Math.max(0, y(0) - y(d.value))} rx="3" fill={color}>
              <title>{`${d.label}: ${d.value}`}</title>
            </rect>
          );
        })
      }
    </Frame>
  );
}

export function Pie({ data }: { data: Pt[] }) {
  const items = data.filter((d) => d.value > 0);
  const total = items.reduce((t, d) => t + d.value, 0);
  if (!total) return <p className="py-10 text-center text-sm text-slate-400">Sem dados</p>;
  let a0 = -Math.PI / 2;
  const R = 70;
  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      <svg viewBox="-80 -80 160 160" className="h-40 w-40" role="img">
        {items.length === 1 ? (
          <circle r={R} fill={PALETTE[0]} />
        ) : (
          items.map((d, i) => {
            const a1 = a0 + (d.value / total) * Math.PI * 2;
            const large = a1 - a0 > Math.PI ? 1 : 0;
            const path = `M0 0 L${R * Math.cos(a0)} ${R * Math.sin(a0)} A${R} ${R} 0 ${large} 1 ${R * Math.cos(a1)} ${R * Math.sin(a1)}Z`;
            a0 = a1;
            return (
              <path key={d.label} d={path} fill={PALETTE[i % PALETTE.length]} stroke="#fff" strokeWidth="1">
                <title>{`${d.label}: ${d.value}`}</title>
              </path>
            );
          })
        )}
      </svg>
      <ul className="space-y-1 text-xs text-slate-600">
        {items.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: PALETTE[i % PALETTE.length] }} />
            {d.label}: <b>{d.value}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}
