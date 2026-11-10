import { AlertTriangle } from "lucide-react";
import { BarChart, LineChart, Pie } from "./charts";
import { kz, lastDays, periodRange, summarize } from "../lib/finance";
import { Order } from "../lib/backends/types";
import { Product } from "../lib/products";

export const STATUS_LABEL = { pendente: "Pendente", entregue: "Entregue", cancelado: "Cancelado" } as const;
export const STATUS_CLASS = {
  pendente: "bg-amber-50 text-amber-800",
  entregue: "bg-isfa-green-soft text-isfa-green-dark",
  cancelado: "bg-red-50 text-red-700",
} as const;

export const fmtDate = (iso: string) => new Date(iso).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" });

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-slate-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

const Card = ({ title, children, className = "" }: { title: React.ReactNode; children: React.ReactNode; className?: string }) => (
  <section className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 ${className}`}>
    <h3 className="mb-3 font-bold text-slate-900">{title}</h3>
    {children}
  </section>
);

export default function DashboardPanel({ orders, products, loaded, error }: { orders: Order[]; products: Product[]; loaded: boolean; error: string }) {
  if (!loaded) return <p className="text-sm text-slate-500">A carregar…</p>;
  const k = (p: "hoje" | "semana" | "mes" | "tudo") => summarize(orders, periodRange(p));
  const days = lastDays(orders, 7);
  const byStatus = (["entregue", "pendente", "cancelado"] as const).map((s) => ({ label: STATUS_LABEL[s], value: orders.filter((o) => o.status === s).length }));
  const cats = new Map<string, number>();
  products.filter((p) => p.published).forEach((p) => cats.set(p.category || "Sem categoria", (cats.get(p.category || "Sem categoria") ?? 0) + 1));
  const low = products.filter((p) => p.stock !== null && p.stock <= 10).sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-extrabold text-slate-900">Dashboard</h2>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <p className="flex items-center gap-2 text-sm text-slate-600">
        <AlertTriangle size={16} className="shrink-0 text-amber-500" />
        <span>
          Receitas calculadas apenas com encomendas <b>entregues</b>.
        </span>
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            ["Receita hoje", "hoje"],
            ["Receita semana", "semana"],
            ["Receita mês", "mes"],
            ["Receita total", "tudo"],
          ] as const
        ).map(([l, p]) => {
          const s = k(p);
          return <Kpi key={p} label={l} value={kz(s.net)} sub={`${s.delivered.length} entregues`} />;
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Receita — últimos 7 dias">
          <LineChart data={days.map((d) => ({ label: d.label, value: d.revenue }))} />
        </Card>
        <Card title="Encomendas — últimos 7 dias">
          <BarChart data={days.map((d) => ({ label: d.label, value: d.orders }))} />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Distribuição de estados">
          <Pie data={byStatus} />
        </Card>
        <Card title="Produtos por categoria">
          <Pie data={[...cats].map(([label, value]) => ({ label, value }))} />
        </Card>
        <Card
          title={
            <span className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-isfa-green-dark" /> Stock baixo
            </span>
          }
        >
          {low.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhum produto com stock baixo (≤ 10). Os produtos sem quantidade registada não entram.</p>
          ) : (
            <ul className="max-h-56 divide-y divide-slate-100 overflow-y-auto text-sm">
              {low.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0 truncate">{p.name}</span>
                  <b className={p.stock === 0 ? "text-red-600" : "text-amber-600"}>{p.stock} un.</b>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Encomendas recentes">
        {orders.length === 0 ? (
          <p className="text-sm text-slate-500">Ainda não há encomendas. Quando um cliente encomendar no site, aparece aqui.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {orders.slice(0, 6).map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-800">
                    #{o.number} · {o.customerName || "Sem nome"}
                  </p>
                  <p className="text-xs text-slate-500">{fmtDate(o.createdAt)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-semibold">{kz(o.total)}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLASS[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
