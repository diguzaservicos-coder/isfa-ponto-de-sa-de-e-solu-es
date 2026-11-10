import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, MessageCircle, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { cart, useCart } from "../lib/cart";
import { availability, imageUrl, Product } from "../lib/products";
import { placeOrder } from "../lib/store";
import { whatsappLink } from "../lib/whatsapp";

const field = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-isfa-blue focus:outline-none focus:ring-2 focus:ring-isfa-blue/20";

export function AddToCart({ product, className = "" }: { product: Product; className?: string }) {
  const lines = useCart();
  const [done, setDone] = useState(false);
  const out = availability(product).key === "sem_stock";
  const inCart = lines.find((l) => l.id === product.id)?.qty ?? 0;
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 1600);
    return () => clearTimeout(t);
  }, [done]);
  return (
    <button
      type="button"
      disabled={out}
      onClick={() => {
        cart.add(product.id);
        setDone(true);
      }}
      className={`flex items-center justify-center gap-1.5 rounded-full bg-isfa-blue px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-isfa-blue-dark disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {done ? <Check size={15} /> : <ShoppingBag size={15} />}
      {out ? "Sem stock" : done ? "Adicionado" : inCart ? `Na encomenda (${inCart})` : "Encomendar"}
    </button>
  );
}

function summary(rows: { name: string; qty: number }[], c: { name: string; phone: string; address: string; notes: string }, number: number | null) {
  const out = [
    `Olá, ISFA Equipamentos Hospitalares. ${number ? `Fiz a encomenda n.º ${number} no site.` : "Gostaria de fazer uma encomenda."}`,
    "",
    ...rows.map((r) => `• ${r.qty} × ${r.name}`),
    "",
    `Nome: ${c.name}`,
    `Telefone: ${c.phone}`,
  ];
  if (c.address) out.push(`Entrega: ${c.address}`);
  if (c.notes) out.push(`Notas: ${c.notes}`);
  out.push("", "Podem confirmar o preço e a disponibilidade? Obrigado.");
  return out.join("\n");
}

export default function CartButton({ products }: { products: Product[] }) {
  const lines = useCart();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState<{ number: number | null; link: string } | null>(null);

  const rows = useMemo(
    () =>
      lines
        .map((l) => ({ line: l, p: products.find((p) => p.id === l.id && p.published) }))
        .filter((r): r is { line: typeof r.line; p: Product } => !!r.p),
    [lines, products],
  );
  const count = rows.reduce((t, r) => t + r.line.qty, 0);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const c = { name: form.name.trim(), phone: form.phone.trim(), address: form.address.trim(), notes: form.notes.trim() };
    if (c.name.length < 2) return setError("Indique o seu nome.");
    if (!/^[0-9+() -]{6,30}$/.test(c.phone)) return setError("Indique um número de telefone válido (só números).");
    setBusy(true);
    const items = rows.map((r) => ({ productId: r.p.id, qty: r.line.qty }));
    try {
      const number = await placeOrder({ ...c, items });
      const link = whatsappLink(summary(rows.map((r) => ({ name: r.p.name, qty: r.line.qty })), c, number));
      setSent({ number, link });
      cart.clear();
    } catch (err: any) {
      setError(err?.message ?? "Não foi possível enviar a encomenda.");
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    setOpen(false);
    if (sent) setSent(null);
  };

  if (!count && !open && !sent) return null;

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Abrir encomenda (${count} artigos)`}
          className="fixed bottom-5 left-4 z-40 flex items-center gap-2 rounded-full bg-isfa-blue px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-isfa-blue-dark"
        >
          <ShoppingBag size={18} /> Encomenda
          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-isfa-blue-dark">{count}</span>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60" onMouseDown={(e) => e.target === e.currentTarget && close()}>
          <div role="dialog" aria-modal="true" aria-label="A sua encomenda" className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-extrabold text-isfa-blue-dark">A sua encomenda</h2>
              <button type="button" onClick={close} aria-label="Fechar" className="rounded-full p-2 text-slate-600 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            {sent ? (
              <div className="flex-1 overflow-y-auto p-5">
                <div className="rounded-2xl bg-isfa-green-soft p-5 text-isfa-green-dark">
                  <p className="flex items-center gap-2 text-lg font-bold">
                    <Check size={20} /> {sent.number ? `Encomenda n.º ${sent.number} registada` : "Pedido pronto a enviar"}
                  </p>
                  <p className="mt-2 text-sm">
                    {sent.number
                      ? "A equipa da ISFA vai contactá-lo para confirmar preço, disponibilidade e entrega."
                      : "Envie o pedido pelo WhatsApp para a equipa da ISFA o confirmar."}
                  </p>
                </div>
                <a
                  href={sent.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 flex items-center justify-center gap-2 rounded-full bg-isfa-green px-6 py-3 text-sm font-semibold text-white hover:bg-isfa-green-dark"
                >
                  <MessageCircle size={18} /> {sent.number ? "Enviar também pelo WhatsApp" : "Enviar pelo WhatsApp"}
                </a>
                <button type="button" onClick={close} className="mt-3 w-full rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Continuar a ver produtos
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
                <div className="flex-1 space-y-5 overflow-y-auto p-5">
                  <ul className="divide-y divide-slate-100">
                    {rows.map(({ line, p }) => (
                      <li key={p.id} className="flex items-center gap-3 py-3">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                          {p.mainImage && <img src={imageUrl(p.mainImage)} alt="" className="h-full w-full object-cover" />}
                        </div>
                        <p className="min-w-0 flex-1 text-sm font-semibold text-slate-800">{p.name}</p>
                        <div className="flex items-center gap-1">
                          <button type="button" aria-label="Menos" onClick={() => cart.set(p.id, line.qty - 1)} className="rounded-full border border-slate-300 p-1.5 hover:bg-slate-50">
                            <Minus size={14} />
                          </button>
                          <input
                            aria-label={`Quantidade: ${p.name}`}
                            inputMode="numeric"
                            value={line.qty}
                            onChange={(e) => cart.set(p.id, parseInt(e.target.value.replace(/\D/g, ""), 10) || 1)}
                            className="w-12 rounded-lg border border-slate-300 py-1 text-center text-sm"
                          />
                          <button type="button" aria-label="Mais" onClick={() => cart.set(p.id, line.qty + 1)} className="rounded-full border border-slate-300 p-1.5 hover:bg-slate-50">
                            <Plus size={14} />
                          </button>
                        </div>
                        <button type="button" aria-label={`Remover ${p.name}`} onClick={() => cart.remove(p.id)} className="p-1.5 text-slate-400 hover:text-red-600">
                          <Trash2 size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                  {rows.length === 0 && <p className="text-sm text-slate-500">A encomenda está vazia.</p>}

                  <div className="space-y-3">
                    <div>
                      <label htmlFor="c-nome" className="mb-1 block text-sm font-medium text-slate-700">Nome</label>
                      <input id="c-nome" className={field} value={form.name} maxLength={80} autoComplete="name" onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                      <label htmlFor="c-tel" className="mb-1 block text-sm font-medium text-slate-700">Telefone / WhatsApp</label>
                      <input id="c-tel" className={field} value={form.phone} maxLength={30} inputMode="tel" autoComplete="tel" onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+244 …" />
                    </div>
                    <div>
                      <label htmlFor="c-end" className="mb-1 block text-sm font-medium text-slate-700">Local de entrega (opcional)</label>
                      <input id="c-end" className={field} value={form.address} maxLength={200} autoComplete="street-address" onChange={(e) => setForm({ ...form, address: e.target.value })} />
                    </div>
                    <div>
                      <label htmlFor="c-not" className="mb-1 block text-sm font-medium text-slate-700">Notas (opcional)</label>
                      <textarea id="c-not" rows={2} className={field} value={form.notes} maxLength={500} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">O preço e a disponibilidade são confirmados pela equipa da ISFA. Não há pagamento online.</p>
                  {error && (
                    <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                      {error}
                    </p>
                  )}
                </div>
                <div className="border-t border-slate-200 p-5">
                  <button
                    type="submit"
                    disabled={busy || rows.length === 0}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-isfa-blue px-6 py-3 text-sm font-semibold text-white hover:bg-isfa-blue-dark disabled:opacity-50"
                  >
                    {busy && <Loader2 size={16} className="animate-spin" />} Enviar encomenda
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
