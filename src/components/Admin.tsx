import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ImagePlus, Plus, Star, Trash2 } from "lucide-react";
import {
  availability,
  blankProduct,
  CATEGORIES,
  formatPrice,
  groupByCategory,
  imageUrl,
  Product,
  Spec,
} from "../lib/products";
import { deleteProduct, loadMovements, resolveNames, saveProduct, StockMovement, uploadPhoto } from "../lib/store";

const input =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-isfa-blue focus:outline-none focus:ring-2 focus:ring-isfa-blue/20";
const label = "mb-1 block text-xs font-semibold text-slate-600";

const specsToText = (s: Spec[]) => s.map((x) => `${x.label}: ${x.value}`).join("\n");
const textToSpecs = (t: string): Spec[] =>
  t
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const i = l.indexOf(":");
      return i === -1 ? { label: l, value: "" } : { label: l.slice(0, i).trim(), value: l.slice(i + 1).trim() };
    });

type Msg = { kind: "ok" | "error"; text: string } | null;

export default function Admin({
  products,
  onBack,
  onSignOut,
}: {
  products: Product[];
  onBack: () => void;
  onSignOut?: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<Product | null>(null);
  const [isNew, setIsNew] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);
  // Em ecrãs pequenos a lista fica por cima do formulário: ao escolher, desce até ele.
  const showForm = () => {
    if (window.innerWidth < 1024) setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };
  const select = (p: Product) => {
    setSelectedId(p.id);
    setIsNew(false);
    setForm(p);
    showForm();
  };
  const create = () => {
    setSelectedId(null);
    setIsNew(true);
    setForm(blankProduct(products.length + 1));
    showForm();
  };

  // Mantém o formulário em sincronia quando o produto é gravado (ex.: passa de rascunho a publicado)
  const afterSave = (saved: Product) => {
    setSelectedId(saved.id);
    setIsNew(false);
    setForm(saved);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div>
            <h1 className="text-lg font-extrabold text-isfa-blue-dark">Gestão de produtos</h1>
            <p className="text-xs text-slate-500">Fotografias, descrições, preços e stock</p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <ArrowLeft size={16} /> Voltar ao site
            </button>
            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="rounded-full px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
              >
                Terminar sessão
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[20rem_1fr]">
        <aside className="min-w-0 max-h-[55vh] overflow-y-auto pr-1 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)]">
          <button
            type="button"
            onClick={create}
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-full bg-isfa-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-isfa-blue-dark"
          >
            <Plus size={16} /> Novo produto
          </button>
          {products.length === 0 ? (
            <p className="rounded-xl bg-white p-4 text-sm text-slate-600 ring-1 ring-slate-200">
              Ainda não há produtos. Use “Novo produto” para adicionar o primeiro, com fotografia e descrição.
            </p>
          ) : (
            <div className="space-y-5">
              {groupByCategory(products).map(([cat, items]) => (
                <section key={cat} aria-label={cat}>
                  <h2 className="mb-2 flex items-baseline justify-between gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                    <span className="min-w-0">{cat}</span>
                    <span className="font-medium text-slate-400">{items.length}</span>
                  </h2>
                  <ul className="space-y-2">
                    {items.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => select(p)}
                        className={`flex w-full items-center gap-3 rounded-xl bg-white p-2.5 text-left ring-1 transition hover:ring-isfa-blue ${
                          selectedId === p.id ? "ring-2 ring-isfa-blue" : "ring-slate-200"
                        }`}
                      >
                        <span className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                          {p.mainImage && <img src={imageUrl(p.mainImage)} alt="" className="h-full w-full object-cover" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-slate-800">{p.name || "Sem nome"}</span>
                          <span className="mt-0.5 flex flex-wrap gap-1.5 text-[11px]">
                            <span
                              className={`rounded-full px-2 py-0.5 font-medium ${
                                p.published ? "bg-isfa-green-soft text-isfa-green-dark" : "bg-amber-50 text-amber-800"
                              }`}
                            >
                              {p.published ? "Publicado" : "Rascunho"}
                            </span>
                            {p.featured && <span className="rounded-full bg-isfa-blue-soft px-2 py-0.5 text-isfa-blue">Destaque</span>}
                        {!p.mainImage && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-500">Sem foto</span>}
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                            {availability(p).label} · {formatPrice(p)}
                          </span>
                        </span>
                      </button>
                    </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </aside>

        <main ref={formRef} className="min-w-0 scroll-mt-4">
          {form ? (
            <ProductForm
              key={isNew ? "novo" : selectedId ?? "x"}
              initial={form}
              isNew={isNew}
              existingIds={products.map((p) => p.id)}
              onSaved={afterSave}
              onDeleted={() => {
                setForm(null);
                setSelectedId(null);
              }}
            />
          ) : (
            <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 ring-1 ring-slate-200">
              Escolha um produto na lista para o editar, ou crie um novo.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function ProductForm({
  initial,
  isNew,
  existingIds,
  onSaved,
  onDeleted,
}: {
  initial: Product;
  isNew: boolean;
  existingIds: string[];
  onSaved: (p: Product) => void;
  onDeleted: () => void;
}) {
  const [p, setP] = useState<Product>(initial);
  const [saved, setSaved] = useState<Product | null>(isNew ? null : initial);
  const [specsText, setSpecsText] = useState(specsToText(initial.specs));
  const [priceText, setPriceText] = useState(initial.price === null ? "" : String(initial.price));
  const [stockText, setStockText] = useState(initial.stock === null ? "" : String(initial.stock));
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [moves, setMoves] = useState<StockMovement[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof Product>(k: K, v: Product[K]) => setP((x) => ({ ...x, [k]: v }));

  const refreshMoves = async (id: string) => {
    if (!id) return;
    const m = await loadMovements(id);
    setMoves(m);
    const ids = Array.from(new Set(m.map((x) => x.by).filter((x): x is string => !!x)));
    setNames(await resolveNames(ids));
  };
  useEffect(() => {
    if (!isNew) void refreshMoves(initial.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const parsedPrice = useMemo(() => {
    const t = priceText.trim().replace(/\s/g, "").replace(",", ".");
    if (t === "") return { value: null as number | null, ok: true };
    const n = Number(t);
    return { value: n, ok: isFinite(n) && n >= 0 };
  }, [priceText]);
  const parsedStock = useMemo(() => {
    const t = stockText.trim();
    if (t === "") return { value: null as number | null, ok: true };
    const n = Number(t);
    return { value: n, ok: Number.isInteger(n) && n >= 0 };
  }, [stockText]);

  const stockChanged = !isNew && saved !== null && (saved.stock ?? null) !== parsedStock.value && saved.stock !== null;

  const onFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setUploading(true);
    setMsg(null);
    const ids: string[] = [];
    try {
      for (const f of Array.from(files)) ids.push(await uploadPhoto(f));
    } catch (e: any) {
      setMsg({ kind: "error", text: e.message || "Não foi possível carregar a fotografia." });
    }
    if (ids.length) {
      setP((x) => ({ ...x, images: [...x.images, ...ids], mainImage: x.mainImage || ids[0] }));
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeImage = (id: string) =>
    setP((x) => {
      const images = x.images.filter((i) => i !== id);
      return { ...x, images, mainImage: x.mainImage === id ? images[0] || "" : x.mainImage };
    });

  const validate = (publish: boolean): string | null => {
    if (!p.name.trim()) return "Indique o nome do produto.";
    if (!parsedPrice.ok) return "O preço tem de ser um número igual ou superior a zero.";
    if (!parsedStock.ok) return "O stock tem de ser um número inteiro igual ou superior a zero.";
    if (stockChanged && !reason.trim()) return "Indique o motivo da alteração de stock.";
    if (publish) {
      if (!p.category.trim()) return "Para publicar, indique a categoria.";
    }
    return null;
  };

  const save = async (publish: boolean) => {
    const err = validate(publish);
    if (err) {
      setMsg({ kind: "error", text: err });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const toSave: Product = {
        ...p,
        name: p.name.trim(),
        specs: textToSpecs(specsText),
        price: parsedPrice.value,
        stock: parsedStock.value,
        published: publish,
      };
      const result = await saveProduct(toSave, saved, existingIds, reason.trim());
      setSaved(result);
      setP(result);
      setReason("");
      setMsg({ kind: "ok", text: publish ? "Guardado e publicado no site." : "Guardado como rascunho (não aparece no site)." });
      onSaved(result);
      void refreshMoves(result.id);
    } catch (e: any) {
      setMsg({
        kind: "error",
        text:
          e?.code === "invalid_argument"
            ? "Sem permissão para guardar. Só a equipa de gestão pode alterar produtos."
            : e?.message || "Não foi possível guardar. Tente novamente.",
      });
    }
    setBusy(false);
  };

  const remove = async () => {
    if (!saved) return;
    setBusy(true);
    try {
      await deleteProduct(saved);
      onDeleted();
    } catch (e: any) {
      setMsg({ kind: "error", text: e?.message || "Não foi possível eliminar." });
      setBusy(false);
    }
  };

  return (
    <form
      className="space-y-6 rounded-2xl bg-white p-5 ring-1 ring-slate-200 sm:p-6"
      onSubmit={(e) => e.preventDefault()}
    >
      <h2 className="text-lg font-bold text-isfa-blue-dark">{isNew ? "Novo produto" : p.name || "Editar produto"}</h2>

      {/* FOTOGRAFIAS */}
      <section aria-labelledby="fotos">
        <h3 id="fotos" className="mb-2 text-sm font-bold text-slate-800">
          Fotografias
        </h3>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {p.images.map((img) => (
            <li key={img} className="min-w-0">
              <div
                className={`overflow-hidden rounded-xl bg-slate-100 ring-2 ${p.mainImage === img ? "ring-isfa-green" : "ring-transparent"}`}
              >
                <img src={imageUrl(img)} alt="" className="aspect-square w-full object-cover" />
              </div>
              <div className="mt-1.5 flex flex-col gap-1">
                {p.mainImage === img ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-isfa-green-dark">
                    <Star size={12} /> Foto de perfil
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => set("mainImage", img)}
                    className="text-left text-xs font-medium text-isfa-blue hover:underline"
                  >
                    Definir como foto de perfil
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(img)}
                  className="text-left text-xs font-medium text-red-600 hover:underline"
                >
                  Remover
                </button>
              </div>
            </li>
          ))}
          <li>
            <label
              htmlFor="upload-fotos"
              className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 text-center text-xs font-medium text-slate-500 hover:border-isfa-blue hover:text-isfa-blue"
            >
              <ImagePlus size={22} />
              {uploading ? "A carregar…" : "Adicionar fotografias"}
            </label>
            <input
              id="upload-fotos"
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              disabled={uploading}
              className="sr-only"
              onChange={(e) => void onFiles(e.target.files)}
            />
          </li>
        </ul>
        <p className="mt-2 text-xs text-slate-500">
          A primeira fotografia adicionada fica como foto de perfil. As imagens são reduzidas automaticamente para carregarem depressa.
        </p>
      </section>

      {/* IDENTIFICAÇÃO */}
      <section className="grid gap-4 sm:grid-cols-2" aria-label="Identificação">
        <div className="sm:col-span-2">
          <label htmlFor="f-nome" className={label}>
            Nome do produto *
          </label>
          <input id="f-nome" className={input} value={p.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div>
          <label htmlFor="f-ref" className={label}>
            Referência / código
          </label>
          <input id="f-ref" className={input} value={p.reference} onChange={(e) => set("reference", e.target.value)} />
        </div>
        <div>
          <label htmlFor="f-cat" className={label}>
            Categoria
          </label>
          <input
            id="f-cat"
            list="categorias"
            className={input}
            value={p.category}
            onChange={(e) => set("category", e.target.value)}
          />
          <datalist id="categorias">
            {CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div>
          <label htmlFor="f-marca" className={label}>
            Marca
          </label>
          <input id="f-marca" className={input} value={p.brand} onChange={(e) => set("brand", e.target.value)} />
        </div>
        <div>
          <label htmlFor="f-modelo" className={label}>
            Modelo
          </label>
          <input id="f-modelo" className={input} value={p.model} onChange={(e) => set("model", e.target.value)} />
        </div>
      </section>

      {/* DESCRIÇÃO */}
      <section className="space-y-4" aria-label="Descrição">
        <div>
          <label htmlFor="f-curta" className={label}>
            Descrição curta (aparece no cartão do produto)
          </label>
          <textarea
            id="f-curta"
            rows={2}
            className={input}
            value={p.shortDescription}
            onChange={(e) => set("shortDescription", e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="f-desc" className={label}>
            Descrição completa (deixe uma linha em branco entre parágrafos)
          </label>
          <textarea
            id="f-desc"
            rows={7}
            className={input}
            value={p.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="f-specs" className={label}>
            Especificações (uma por linha, no formato “Nome: valor”)
          </label>
          <textarea
            id="f-specs"
            rows={4}
            className={`${input} font-mono`}
            placeholder={"Dimensões: 40 x 30 x 15 cm\nPeso: 2 kg"}
            value={specsText}
            onChange={(e) => setSpecsText(e.target.value)}
          />
          <p className="mt-1 text-xs text-slate-500">Escreva apenas o que está confirmado.</p>
        </div>
      </section>

      {/* PREÇO E STOCK */}
      <section className="grid gap-4 sm:grid-cols-2" aria-label="Preço e stock">
        <div>
          <label htmlFor="f-preco" className={label}>
            Preço (Kz)
          </label>
          <input
            id="f-preco"
            inputMode="decimal"
            className={input}
            value={priceText}
            onChange={(e) => setPriceText(e.target.value)}
            placeholder="Vazio = preço sob consulta"
          />
          <label className="mt-2 flex items-center gap-2 text-sm text-slate-700">
            <input
              id="f-mostrar-preco"
              type="checkbox"
              checked={p.showPrice}
              onChange={(e) => set("showPrice", e.target.checked)}
            />
            Mostrar o preço no site
          </label>
        </div>
        <div>
          <label htmlFor="f-stock" className={label}>
            Quantidade em stock
          </label>
          <input
            id="f-stock"
            inputMode="numeric"
            className={input}
            value={stockText}
            onChange={(e) => setStockText(e.target.value)}
            placeholder="Vazio = disponibilidade por confirmar"
          />
          <label className="mt-2 flex items-center gap-2 text-sm text-slate-700">
            <input
              id="f-mostrar-stock"
              type="checkbox"
              checked={p.showStock}
              onChange={(e) => set("showStock", e.target.checked)}
            />
            Mostrar a quantidade exata no site
          </label>
          <p className="mt-1 text-xs text-slate-500">
            No site aparece: {availability({ stock: parsedStock.ok ? parsedStock.value : null }).label}.
          </p>
        </div>
        {stockChanged && (
          <div className="sm:col-span-2">
            <label htmlFor="f-motivo" className={label}>
              Motivo da alteração de stock *
            </label>
            <input
              id="f-motivo"
              className={input}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex.: entrada de mercadoria, venda, correção de inventário"
            />
          </div>
        )}
        {moves.length > 0 && (
          <div className="sm:col-span-2">
            <h3 className="mb-1 text-xs font-semibold text-slate-600">Histórico de stock</h3>
            <ul className="divide-y divide-slate-100 rounded-lg ring-1 ring-slate-200">
              {moves.map((m) => (
                <li key={m.id} className="flex flex-wrap justify-between gap-x-4 px-3 py-2 text-xs text-slate-600">
                  <span>
                    {m.before === null ? "—" : m.before} → <strong>{m.after === null ? "por confirmar" : m.after}</strong> · {m.reason}
                  </span>
                  <span className="text-slate-400">
                    {m.by ? names[m.by] || "Utilizador" : ""} · {new Date(m.at).toLocaleString("pt-PT")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* APRESENTAÇÃO */}
      <section className="grid gap-4 sm:grid-cols-2" aria-label="Apresentação no site">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input id="f-destaque" type="checkbox" checked={p.featured} onChange={(e) => set("featured", e.target.checked)} />
          Produto em destaque (o primeiro destaque aparece no topo da página)
        </label>
        <div>
          <label htmlFor="f-ordem" className={label}>
            Ordem de apresentação (1 aparece primeiro)
          </label>
          <input
            id="f-ordem"
            type="number"
            min={1}
            className={input}
            value={p.order}
            onChange={(e) => set("order", Number(e.target.value) || 1)}
          />
        </div>
      </section>

      {msg && (
        <p
          role="status"
          className={`rounded-lg px-4 py-3 text-sm ${msg.kind === "ok" ? "bg-isfa-green-soft text-isfa-green-dark" : "bg-red-50 text-red-700"}`}
        >
          {msg.text}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
        <button
          type="button"
          disabled={busy || uploading}
          onClick={() => void save(true)}
          className="rounded-full bg-isfa-green px-6 py-2.5 text-sm font-semibold text-white hover:bg-isfa-green-dark disabled:opacity-50"
        >
          {busy ? "A guardar…" : p.published ? "Guardar alterações" : "Publicar no site"}
        </button>
        <button
          type="button"
          disabled={busy || uploading}
          onClick={() => void save(false)}
          className="rounded-full border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
        >
          {p.published ? "Ocultar do site (passar a rascunho)" : "Guardar como rascunho"}
        </button>

        {!isNew && saved && (
          <div className="ml-auto flex items-center gap-2">
            {confirmDelete ? (
              <>
                <span className="text-sm text-red-700">Eliminar definitivamente?</span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void remove()}
                  className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Sim, eliminar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 size={15} /> Eliminar
              </button>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
