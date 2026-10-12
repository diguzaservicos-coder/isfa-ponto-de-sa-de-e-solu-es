import { useEffect, useRef, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { availability, formatPrice, imageUrl, Product } from "../lib/products";
import { quoteLink } from "../lib/whatsapp";

export default function ProductModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const [current, setCurrent] = useState(product.mainImage);
  const closeRef = useRef<HTMLButtonElement>(null);
  const av = availability(product);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const gallery = product.images.length ? product.images : product.mainImage ? [product.mainImage] : [];
  const details: Array<[string, string]> = [
    ["Referência", product.reference],
    ["Categoria", product.category],
    ["Marca", product.brand],
    ["Modelo", product.model],
    ...product.specs.map((s): [string, string] => [s.label, s.value]),
  ];
  const rows = details.filter(([, v]) => v);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 sm:items-center sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        className="relative max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 text-slate-700 shadow hover:bg-slate-100"
        >
          <X size={20} />
        </button>

        <div className="grid gap-6 p-5 sm:p-8 md:grid-cols-2">
          <div className="min-w-0">
            <div className="overflow-hidden rounded-2xl bg-slate-100">
              {current ? (
                <img src={imageUrl(current)} alt={product.name} className="aspect-[4/5] w-full object-cover" />
              ) : (
                <div className="flex aspect-[4/5] w-full items-center justify-center text-sm font-medium text-slate-400">
                  Fotografia em breve
                </div>
              )}
            </div>
            {gallery.length > 1 && (
              <ul className="mt-3 flex gap-2 overflow-x-auto">
                {gallery.map((g) => (
                  <li key={g}>
                    <button
                      type="button"
                      onClick={() => setCurrent(g)}
                      aria-label="Ver fotografia"
                      className={`h-16 w-16 overflow-hidden rounded-lg ring-2 ${current === g ? "ring-isfa-blue" : "ring-transparent"}`}
                    >
                      <img src={imageUrl(g)} alt="" className="h-full w-full object-cover" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="min-w-0">
            {product.category && (
              <p className="text-xs font-semibold uppercase tracking-wide text-isfa-green-dark">{product.category}</p>
            )}
            <h2 className="mt-1 text-2xl font-extrabold text-isfa-blue-dark">{product.name}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${av.classes}`}>{av.label}</span>
              {product.showStock && product.stock !== null && product.stock > 0 && (
                <span className="text-xs text-slate-500">{product.stock} unidades</span>
              )}
            </div>
            <p className="mt-4 text-xl font-bold text-slate-800">{formatPrice(product)}</p>

            {product.description && (
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600">
                {product.description.split(/\n{2,}/).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            )}

            {rows.length > 0 && (
              <dl className="mt-5 divide-y divide-slate-100 rounded-xl ring-1 ring-slate-200">
                {rows.map(([k, v]) => (
                  <div key={k + v} className="grid grid-cols-[9rem_1fr] gap-3 px-4 py-2.5 text-sm">
                    <dt className="font-medium text-slate-500">{k}</dt>
                    <dd className="min-w-0 break-words text-slate-800">{v}</dd>
                  </div>
                ))}
              </dl>
            )}

            <a
              href={quoteLink(product)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex items-center justify-center gap-2 rounded-full bg-isfa-green px-6 py-3 text-sm font-semibold text-white transition hover:bg-isfa-green-dark"
            >
              <MessageCircle size={18} /> Solicitar cotação pelo WhatsApp
            </a>
            <p className="mt-2 text-xs text-slate-500">
              Um pedido de cotação não representa compra nem reserva do produto.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
