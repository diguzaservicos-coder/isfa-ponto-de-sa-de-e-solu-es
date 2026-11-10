import { useMemo, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Order, OrderInput, OrderItem, OrderStatus } from "../lib/backends/types";
import { kz } from "../lib/finance";
import { Product } from "../lib/products";
import { deleteOrder, saveOrder } from "../lib/store";
import { fmtDate, STATUS_CLASS, STATUS_LABEL } from "./DashboardPanel";

const field = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-isfa-blue focus:outline-none focus:ring-2 focus:ring-isfa-blue/20";
const num = (v: string) => Math.max(0, parseFloat(v.replace(",", ".")) || 0);
const blank = (): OrderInput => ({ customerName: "", customerPhone: "", customerAddress: "", status: "pendente", items: [], discount: 0, deliveryFee: 0, notes: "" });

export default function OrdersPanel({ orders, products, loaded, error }: { orders: Order[]; products: Product[]; loaded: boolean; error: string }) {
  const [filter, setFilter] = useState<"" | OrderStatus>("");
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState<(OrderInput & { number?: number }) | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return orders.filter((o) => (!filter || o.status === filter) && (!t || `${o.number} ${o.customerName} ${o.customerPhone}`.toLowerCase().includes(t)));
  }, [orders, filter, q]);

  if (!loaded) return <p className="text-sm text-slate-500">A carregar…</p>;

  const sub = draft ? draft.items.reduce((t, i) => t + i.qty * i.unitPrice, 0) : 0;
  const total = draft ? Math.max(sub - draft.discount + draft.deliveryFee, 0) : 0;
  const setItem = (i: number, patch: Partial<OrderItem>) => setDraft((d) => d && { ...d, items: d.items.map((x, k) => (k === i ? { ...x, ...patch } : x)) });

  const save = async () => {
    if (!draft) return;
    if (draft.items.length === 0) return setMsg({ ok: false, text: "Adicione pelo menos um produto." });
    setBusy(true);
    setMsg(null);
    try {
      const { number: _n, ...input } = draft;
      await saveOrder(input);
      setDraft(null);
      setMsg({ ok: true, text: "Encomenda guardada." });
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message ?? "Não foi possível guardar." });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!draft?.id || !confirm("Eliminar esta encomenda? Se já foi entregue, o stock é reposto.")) return;
    setBusy(true);
    try {
      await deleteOrder(draft.id);
      setDraft(null);
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message ?? "Não foi possível eliminar." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
      <aside className="min-w-0 space-y-3">
        <button type="button" onClick={() => { setDraft(blank()); setMsg(null); }} className="flex w-full items-center justify-center gap-2 rounded-full bg-isfa-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-isfa-blue-dark">
          <Plus size={16} /> Nova encomenda
        </button>
        <input type="search" aria-label="Pesquisar encomendas" placeholder="Pesquisar por n.º, nome ou telefone" value={q} onChange={(e) => setQ(e.target.value)} className={field} />
        <div className="flex flex-wrap gap-1.5">
          {(["", "pendente", "entregue", "cancelado"] as const).map((s) => (
            <button key={s || "t"} type="button" aria-pressed={filter === s} onClick={() => setFilter(s)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${filter === s ? "bg-isfa-blue text-white" : "bg-slate-100 text-slate-600"}`}>
              {s ? STATUS_LABEL[s] : "Todas"}
            </button>
          ))}
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <ul className="max-h-[60vh] divide-y divide-slate-100 overflow-y-auto rounded-2xl bg-white ring-1 ring-slate-200">
          {list.length === 0 && <li className="p-4 text-sm text-slate-500">Sem encomendas.</li>}
          {list.map((o) => (
            <li key={o.id}>
              <button type="button" onClick={() => { setDraft({ ...o }); setMsg(null); }} className={`flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm hover:bg-slate-50 ${draft?.id === o.id ? "bg-isfa-blue-soft" : ""}`}>
                <span className="min-w-0">
                  <b className="block truncate">#{o.number} · {o.customerName || "Sem nome"}</b>
                  <span className="text-xs text-slate-500">{fmtDate(o.createdAt)} · {kz(o.total)}</span>
                </span>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLASS[o.status]}`}>{STATUS_LABEL[o.status]}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="min-w-0">
        {msg && <p role="status" className={`mb-3 rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-isfa-green-soft text-isfa-green-dark" : "bg-red-50 text-red-700"}`}>{msg.text}</p>}
        {!draft ? (
          <p className="rounded-2xl bg-white p-6 text-sm text-slate-500 ring-1 ring-slate-200">Escolha uma encomenda para ver ou editar, ou crie uma nova (por exemplo, um pedido recebido por telefone).</p>
        ) : (
          <div className="space-y-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-extrabold text-isfa-blue-dark">{draft.number ? `Encomenda #${draft.number}` : "Nova encomenda"}</h2>
              <select aria-label="Estado" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as OrderStatus })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold">
                {(["pendente", "entregue", "cancelado"] as const).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </div>
            {draft.status === "entregue" && <p className="rounded-lg bg-isfa-green-soft px-3 py-2 text-xs text-isfa-green-dark">Ao guardar como Entregue, a receita é contada e o stock dos produtos com quantidade registada é descontado.</p>}

            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="mb-1 block text-sm font-medium text-slate-700">Cliente</label><input className={field} value={draft.customerName} onChange={(e) => setDraft({ ...draft, customerName: e.target.value })} /></div>
              <div><label className="mb-1 block text-sm font-medium text-slate-700">Telefone</label><input className={field} value={draft.customerPhone} onChange={(e) => setDraft({ ...draft, customerPhone: e.target.value })} /></div>
              <div className="sm:col-span-2"><label className="mb-1 block text-sm font-medium text-slate-700">Local de entrega</label><input className={field} value={draft.customerAddress} onChange={(e) => setDraft({ ...draft, customerAddress: e.target.value })} /></div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">Produtos e preços (Kz)</p>
              {draft.items.some((i) => i.unitPrice === 0) && <p className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">Há linhas sem preço (os preços não aparecem no site). Preencha o preço unitário combinado com o cliente.</p>}
              <div className="space-y-2">
                {draft.items.map((it, i) => (
                  <div key={i} className="grid grid-cols-[1fr_4.5rem_7rem_2rem] items-center gap-2">
                    <span className="min-w-0 truncate text-sm">{it.name}</span>
                    <input aria-label="Quantidade" inputMode="numeric" className={field} value={it.qty} onChange={(e) => setItem(i, { qty: Math.max(1, Math.floor(num(e.target.value))) })} />
                    <input aria-label="Preço unitário" inputMode="decimal" className={field} value={it.unitPrice} onChange={(e) => setItem(i, { unitPrice: num(e.target.value) })} />
                    <button type="button" aria-label="Remover linha" onClick={() => setDraft({ ...draft, items: draft.items.filter((_, k) => k !== i) })} className="text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
              <select aria-label="Adicionar produto" value="" onChange={(e) => { const p = products.find((x) => x.id === e.target.value); if (p) setDraft({ ...draft, items: [...draft.items, { productId: p.id, name: p.name, qty: 1, unitPrice: p.price ?? 0 }] }); }} className={`${field} mt-3`}>
                <option value="">+ Adicionar produto…</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="mb-1 block text-sm font-medium text-slate-700">Desconto (Kz)</label><input inputMode="decimal" className={field} value={draft.discount} onChange={(e) => setDraft({ ...draft, discount: num(e.target.value) })} /></div>
              <div><label className="mb-1 block text-sm font-medium text-slate-700">Taxa de entrega (Kz)</label><input inputMode="decimal" className={field} value={draft.deliveryFee} onChange={(e) => setDraft({ ...draft, deliveryFee: num(e.target.value) })} /></div>
            </div>
            <div><label className="mb-1 block text-sm font-medium text-slate-700">Notas</label><textarea rows={2} className={field} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <p className="text-sm text-slate-600">Subtotal {kz(sub)} · <b className="text-base text-slate-900">Total {kz(total)}</b></p>
              <div className="flex gap-2">
                {draft.id && <button type="button" disabled={busy} onClick={() => void remove()} className="rounded-full border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">Eliminar</button>}
                <button type="button" onClick={() => setDraft(null)} className="rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Fechar</button>
                <button type="button" disabled={busy} onClick={() => void save()} className="inline-flex items-center gap-2 rounded-full bg-isfa-blue px-6 py-2.5 text-sm font-semibold text-white hover:bg-isfa-blue-dark disabled:opacity-50">{busy && <Loader2 size={16} className="animate-spin" />} Guardar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
