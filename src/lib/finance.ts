import type { Order } from "./backends/types";

export type Period = "hoje" | "semana" | "mes" | "tudo";

export const kz = (n: number) => `${Math.round(n).toLocaleString("pt-PT").replace(/ /g, " ")} Kz`;

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
/** Semana de segunda a domingo. */
const startOfWeek = (d: Date) => addDays(startOfDay(d), -((d.getDay() + 6) % 7));

export function periodRange(p: Period, day?: string): [Date, Date] | null {
  if (day) {
    const [y, m, d] = day.split("-").map(Number);
    const s = new Date(y, m - 1, d);
    return [s, addDays(s, 1)];
  }
  const now = new Date();
  if (p === "hoje") return [startOfDay(now), addDays(startOfDay(now), 1)];
  if (p === "semana") return [startOfWeek(now), addDays(startOfWeek(now), 7)];
  if (p === "mes") return [new Date(now.getFullYear(), now.getMonth(), 1), new Date(now.getFullYear(), now.getMonth() + 1, 1)];
  return null;
}

const inRange = (iso: string | null, r: [Date, Date] | null) => {
  if (!iso) return false;
  if (!r) return true;
  const t = new Date(iso).getTime();
  return t >= r[0].getTime() && t < r[1].getTime();
};

const subtotal = (o: Order) => o.items.reduce((t, i) => t + i.qty * i.unitPrice, 0);

export type Summary = {
  delivered: Order[];
  gross: number;
  discounts: number;
  net: number;
  avgTicket: number;
  deliveryFees: number;
  cancelledValue: number;
  cancelledCount: number;
  pending: number;
};

/** Receita conta só encomendas entregues, na data de entrega. Cancelados e pendentes na data de criação. */
export function summarize(orders: Order[], r: [Date, Date] | null): Summary {
  const delivered = orders.filter((o) => o.status === "entregue" && inRange(o.deliveredAt ?? o.createdAt, r));
  const cancelled = orders.filter((o) => o.status === "cancelado" && inRange(o.createdAt, r));
  const gross = delivered.reduce((t, o) => t + subtotal(o), 0);
  const discounts = delivered.reduce((t, o) => t + o.discount, 0);
  const net = gross - discounts;
  return {
    delivered,
    gross,
    discounts,
    net,
    avgTicket: delivered.length ? net / delivered.length : 0,
    deliveryFees: delivered.reduce((t, o) => t + o.deliveryFee, 0),
    cancelledValue: cancelled.reduce((t, o) => t + o.total, 0),
    cancelledCount: cancelled.length,
    pending: orders.filter((o) => o.status === "pendente").length,
  };
}

export const netOf = (o: Order) => subtotal(o) - o.discount;

const DAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
export const dayLabel = (d: Date) => `${DAYS[d.getDay()]}, ${d.getDate()}`;

export function lastDays(orders: Order[], n: number, from: Date = new Date()) {
  const out: { label: string; date: Date; revenue: number; orders: number; delivered: number }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = addDays(startOfDay(from), -i);
    const r: [Date, Date] = [d, addDays(d, 1)];
    out.push({
      label: dayLabel(d),
      date: d,
      revenue: summarize(orders, r).net,
      orders: orders.filter((o) => inRange(o.createdAt, r)).length,
      delivered: orders.filter((o) => o.status === "entregue" && inRange(o.deliveredAt ?? o.createdAt, r)).length,
    });
  }
  return out;
}

const MONTHS = ["jan.", "fev.", "mar.", "abr.", "mai.", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];
export function lastMonths(orders: Order[], n: number) {
  const now = new Date();
  const out: { label: string; revenue: number }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const s = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const e = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    out.push({ label: MONTHS[s.getMonth()], revenue: summarize(orders, [s, e]).net });
  }
  return out;
}

/** Descarrega um CSV (abre no Excel, com ponto e vírgula e BOM para acentos). */
export function downloadCsv(name: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    let t = String(v);
    if (/^[=+\-@]/.test(t)) t = "'" + t; // evita fórmulas injetadas
    return /[;"\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const blob = new Blob(["﻿" + rows.map((r) => r.map(esc).join(";")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
