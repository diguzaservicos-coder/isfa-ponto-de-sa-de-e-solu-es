import { useState } from "react";
import { Download, Printer, RotateCcw } from "lucide-react";
import { LineChart } from "./charts";
import { downloadCsv, kz, lastMonths, Period, periodRange, summarize } from "../lib/finance";
import { Order } from "../lib/backends/types";
import { resetOrders } from "../lib/store";
import { fmtDate } from "./DashboardPanel";

function Kpi({ label, value, sub, tone = "" }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-extrabold ${tone || "text-slate-900"}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export default function FinancePanel({ orders, loaded, error }: { orders: Order[]; loaded: boolean; error: string }) {
  const [period, setPeriod] = useState<Period>("mes");
  const [day, setDay] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  if (!loaded) return <p className="text-sm text-slate-500">A carregar…</p>;

  const range = periodRange(period, day);
  const s = summarize(orders, range);
  const label = day ? day.split("-").reverse().join("/") : { hoje: "hoje", semana: "esta semana", mes: "este mês", tudo: "total" }[period];

  const exportCsv = () =>
    downloadCsv(`financeiro-isfa-${day || period}.csv`, [
      ["N.º", "Entrega", "Cliente", "Telefone", "Artigos", "Subtotal (Kz)", "Desconto (Kz)", "Taxa de entrega (Kz)", "Total (Kz)"],
      ...s.delivered.map((o) => [
        o.number,
        fmtDate(o.deliveredAt ?? o.createdAt),
        o.customerName,
        o.customerPhone,
        o.items.map((i) => `${i.qty}x ${i.name}`).join(" | "),
        o.items.reduce((t, i) => t + i.qty * i.unitPrice, 0),
        o.discount,
        o.deliveryFee,
        o.total,
      ]),
      [],
      ["", "", "", "", "Receita bruta", s.gross, "", "", ""],
      ["", "", "", "", "Descontos", s.discounts, "", "", ""],
      ["", "", "", "", "Receita líquida", s.net, "", "", ""],
    ]);

  const reset = async () => {
    const t = prompt(`Isto apaga TODAS as ${orders.length} encomendas e o histórico financeiro. Produtos, categorias e stock não são afetados.\n\nEscreva ZERAR para confirmar:`);
    if (t?.trim().toUpperCase() !== "ZERAR") return;
    setBusy(true);
    try {
      const n = await resetOrders();
      setMsg(`${n} encomendas apagadas.`);
    } catch (e: any) {
      setMsg(e?.message ?? "Não foi possível zerar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-extrabold text-slate-900">Financeiro</h2>
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ["hoje", "Hoje"],
              ["semana", "Semana"],
              ["mes", "Mês"],
              ["tudo", "Tudo"],
            ] as const
          ).map(([k, t]) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setPeriod(k);
                setDay("");
              }}
              aria-pressed={!day && period === k}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${!day && period === k ? "bg-isfa-blue text-white" : "bg-slate-100 text-slate-600 hover:bg-isfa-blue-soft"}`}
            >
              {t}
            </button>
          ))}
          <input type="date" aria-label="Escolher um dia" value={day} onChange={(e) => setDay(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">
            <Printer size={15} /> PDF
          </button>
          <button type="button" onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">
            <Download size={15} /> Excel
          </button>
        </div>
      </div>
      <p className="hidden text-sm text-slate-600 print:block">ISFA — Relatório financeiro ({label}) · gerado a {new Date().toLocaleString("pt-PT")}</p>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Receita bruta" value={kz(s.gross)} sub={`${s.delivered.length} encomendas entregues (${label})`} />
        <Kpi label="Descontos" value={kz(s.discounts)} tone="text-red-600" />
        <Kpi label="Receita líquida" value={kz(s.net)} tone="text-isfa-green-dark" />
        <Kpi label="Ticket médio" value={kz(s.avgTicket)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Taxas de entrega" value={kz(s.deliveryFees)} />
        <Kpi label="Valor cancelado" value={kz(s.cancelledValue)} tone="text-red-600" sub={`${s.cancelledCount} ${s.cancelledCount === 1 ? "cancelamento" : "cancelamentos"}`} />
        <Kpi label="Encomendas pendentes" value={String(s.pending)} tone="text-amber-600" />
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h3 className="mb-3 font-bold text-slate-900">Evolução mensal (últimos 6 meses)</h3>
        <LineChart data={lastMonths(orders, 6).map((m) => ({ label: m.label, value: m.revenue }))} />
      </section>

      <section className="no-print rounded-2xl border border-red-200 bg-red-50 p-5">
        <h3 className="flex items-center gap-2 font-bold text-red-700">
          <RotateCcw size={16} /> Zerar operações
        </h3>
        <p className="mt-1 text-sm text-slate-600">Apaga todas as encomendas e movimentações financeiras. Produtos, categorias, stock e configurações não são afetados.</p>
        <button type="button" disabled={busy} onClick={() => void reset()} className="mt-3 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
          Zerar todas as operações
        </button>
        {msg && <p className="mt-2 text-sm text-slate-700">{msg}</p>}
      </section>
    </div>
  );
}
