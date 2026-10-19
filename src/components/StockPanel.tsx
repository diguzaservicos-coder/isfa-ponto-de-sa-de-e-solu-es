import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Minus, Plus, Upload } from "lucide-react";
import { availability, LOW_STOCK, Product } from "../lib/products";
import { adjustStock, importStock, loadRecentMovements, StockKind, StockMovement } from "../lib/store";

const input =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-isfa-blue focus:outline-none focus:ring-2 focus:ring-isfa-blue/20";

type Msg = { kind: "ok" | "error"; text: string } | null;
type Filter = "todos" | "sem_stock" | "limitado" | "sem_quantidade";

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const KIND_LABEL: Record<string, string> = { entrada: "Entrada", saida: "Saída", ajuste: "Definido", importacao: "Importação" };

export type ImportRow = { product: Product; qty: number };
export type ImportResult = { rows: ImportRow[]; unmatched: string[]; invalid: string[]; duplicates: string[] };

/** Lê linhas "nome;quantidade", "código;nome;quantidade" (separadas por ; , tab ou vírgula). Aceita também o ficheiro descarregado. */
export function parseImport(text: string, products: Product[]): ImportResult {
  const byId = new Map(products.map((p) => [norm(p.id), p]));
  const byName = new Map(products.map((p) => [norm(p.name), p]));
  const chosen = new Map<string, ImportRow>();
  const unmatched: string[] = [];
  const invalid: string[] = [];
  const duplicates: string[] = [];

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    let parts = line.split(/[;\t]/).map((s) => s.trim().replace(/^"|"$/g, ""));
    if (parts.length === 1) {
      const m = line.match(/^(.*),\s*([^,]*)$/);
      if (m) parts = [m[1].trim().replace(/^"|"$/g, ""), m[2].trim()];
    }
    if (parts.length < 2) {
      unmatched.push(line);
      continue;
    }
    const qtyText = parts[parts.length - 1];
    const keys = parts.slice(0, -1);
    const product = keys.map((k) => byId.get(norm(k)) ?? byName.get(norm(k))).find(Boolean);
    if (!product) {
      // Cabeçalho (ex.: "nome;quantidade") ou produto desconhecido
      if (!/^\d+$/.test(qtyText) && /nome|codigo|c.digo|produto|quantidade/i.test(line)) continue;
      unmatched.push(keys.join(" / "));
      continue;
    }
    if (qtyText === "") continue; // quantidade em branco: mantém o que está
    if (!/^\d+$/.test(qtyText)) {
      invalid.push(`${product.name}: "${qtyText}"`);
      continue;
    }
    if (chosen.has(product.id)) duplicates.push(product.name);
    chosen.set(product.id, { product, qty: Number(qtyText) });
  }
  return { rows: [...chosen.values()], unmatched, invalid, duplicates };
}

function downloadCsv(products: Product[]) {
  const q = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const lines = ["codigo;nome;quantidade"];
  for (const p of products) lines.push(`${p.id};${q(p.name)};${p.stock ?? ""}`);
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "stock-isfa.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function StockPanel({ products }: { products: Product[] }) {
  const [filter, setFilter] = useState<Filter>("todos");
  const [query, setQuery] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<Msg>(null);
  const [moves, setMoves] = useState<StockMovement[]>([]);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);

  const reloadMoves = useCallback(() => {
    void loadRecentMovements(15).then(setMoves);
  }, []);
  useEffect(reloadMoves, [reloadMoves]);

  const counts = useMemo(
    () => ({
      sem_stock: products.filter((p) => p.stock === 0).length,
      limitado: products.filter((p) => p.stock !== null && p.stock > 0 && p.stock <= LOW_STOCK).length,
      sem_quantidade: products.filter((p) => p.stock === null).length,
    }),
    [products],
  );

  const list = useMemo(() => {
    const q = norm(query);
    return products.filter((p) => {
      if (q && !norm(p.name).includes(q)) return false;
      if (filter === "sem_stock") return p.stock === 0;
      if (filter === "limitado") return p.stock !== null && p.stock > 0 && p.stock <= LOW_STOCK;
      if (filter === "sem_quantidade") return p.stock === null;
      return true;
    });
  }, [products, filter, query]);

  const preview = useMemo(() => (importText.trim() ? parseImport(importText, products) : null), [importText, products]);

  const move = async (p: Product, kind: StockKind, qty: number) => {
    setMsg(null);
    try {
      const after = await adjustStock(p, kind, qty, note.trim());
      setMsg({
        kind: "ok",
        text: `${p.name}: ${KIND_LABEL[kind === "ajuste" ? "ajuste" : kind]} de ${qty} → stock ${after}.`,
      });
      setNote("");
      reloadMoves();
    } catch (e: any) {
      setMsg({ kind: "error", text: e?.message || "Não foi possível registar o movimento." });
    }
  };

  const applyImport = async () => {
    if (!preview || preview.rows.length === 0) return;
    setImporting(true);
    setMsg(null);
    try {
      const n = await importStock(preview.rows, note.trim() || "Importação de quantidades");
      setMsg({ kind: "ok", text: `${n} quantidades atualizadas.` });
      setImportText("");
      setNote("");
      reloadMoves();
    } catch (e: any) {
      setMsg({ kind: "error", text: e?.message || "Não foi possível importar. Nada foi alterado." });
    } finally {
      setImporting(false);
    }
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 1024 * 1024) return setMsg({ kind: "error", text: "O ficheiro é demasiado grande." });
    setImportText(await file.text());
  };

  const chip = (key: Filter, text: string, n?: number) => (
    <button
      key={key}
      type="button"
      onClick={() => setFilter(key)}
      aria-pressed={filter === key}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${
        filter === key ? "bg-isfa-blue text-white ring-isfa-blue" : "bg-white text-slate-600 ring-slate-200 hover:ring-isfa-blue"
      }`}
    >
      {text}
      {n !== undefined && <span className="ml-1.5 opacity-80">{n}</span>}
    </button>
  );

  return (
    <div className="space-y-6">
      {msg && (
        <p
          role={msg.kind === "error" ? "alert" : "status"}
          className={`rounded-lg px-4 py-3 text-sm ${msg.kind === "ok" ? "bg-isfa-green-soft text-isfa-green-dark" : "bg-red-50 text-red-700"}`}
        >
          {msg.text}
        </p>
      )}

      <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 sm:p-6" aria-label="Movimentos de stock">
        <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_1fr]">
          <div>
            <label htmlFor="s-pesquisa" className="mb-1 block text-xs font-semibold text-slate-600">
              Procurar produto
            </label>
            <input id="s-pesquisa" className={`${input} w-full`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nome do produto" />
          </div>
          <div>
            <label htmlFor="s-nota" className="mb-1 block text-xs font-semibold text-slate-600">
              Nota para o próximo movimento (opcional)
            </label>
            <input
              id="s-nota"
              className={`${input} w-full`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex.: fatura 123, venda a cliente, contagem de inventário"
            />
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {chip("todos", "Todos", products.length)}
          {chip("sem_stock", "Sem stock", counts.sem_stock)}
          {chip("limitado", `Stock limitado (≤ ${LOW_STOCK})`, counts.limitado)}
          {chip("sem_quantidade", "Sem quantidade registada", counts.sem_quantidade)}
        </div>

        {list.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">Nenhum produto nesta seleção.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {list.map((p) => (
              <StockRow key={p.id} p={p} onMove={move} />
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 sm:p-6" aria-label="Importar quantidades">
        <h2 className="text-base font-bold text-isfa-blue-dark">Importar quantidades</h2>
        <p className="mt-1 text-sm text-slate-600">
          Cole uma linha por produto, no formato <code className="rounded bg-slate-100 px-1">nome;quantidade</code>, ou descarregue a lista, preencha a coluna
          “quantidade” e cole-a aqui. Linhas sem quantidade são ignoradas. As quantidades passam a ser as indicadas e ficam no histórico.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => downloadCsv(products)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            <Download size={16} /> Descarregar lista (CSV)
          </button>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
            <Upload size={16} /> Abrir ficheiro CSV
            <input type="file" accept=".csv,.txt,text/csv,text/plain" className="sr-only" onChange={(e) => void onFile(e.target.files?.[0])} />
          </label>
        </div>
        <label htmlFor="s-import" className="sr-only">
          Quantidades a importar
        </label>
        <textarea
          id="s-import"
          rows={6}
          className={`${input} mt-3 w-full font-mono`}
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder={"Cama hospitalar;12\nEstetoscópio;40\nTermómetro digital;0"}
        />
        {preview && (
          <div className="mt-3 space-y-2 text-sm">
            <p className="font-semibold text-slate-700">
              {preview.rows.length} {preview.rows.length === 1 ? "produto será atualizado" : "produtos serão atualizados"}
            </p>
            {preview.rows.length > 0 && (
              <ul className="max-h-56 divide-y divide-slate-100 overflow-y-auto rounded-lg ring-1 ring-slate-200">
                {preview.rows.map((r) => (
                  <li key={r.product.id} className="flex justify-between gap-3 px-3 py-1.5 text-xs text-slate-600">
                    <span className="min-w-0 truncate">{r.product.name}</span>
                    <span className="shrink-0">
                      {r.product.stock ?? "—"} → <strong>{r.qty}</strong>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {preview.invalid.length > 0 && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                Quantidade inválida (use números inteiros, 0 ou mais): {preview.invalid.join("; ")}
              </p>
            )}
            {preview.unmatched.length > 0 && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Não encontrados (confirme o nome): {preview.unmatched.slice(0, 20).join("; ")}
                {preview.unmatched.length > 20 ? "…" : ""}
              </p>
            )}
            {preview.duplicates.length > 0 && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Repetidos (vale a última linha): {preview.duplicates.join("; ")}
              </p>
            )}
            <button
              type="button"
              disabled={importing || preview.rows.length === 0}
              onClick={() => void applyImport()}
              className="rounded-full bg-isfa-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-isfa-blue-dark disabled:opacity-50"
            >
              {importing ? "A aplicar…" : `Aplicar ${preview.rows.length} quantidades`}
            </button>
          </div>
        )}
      </section>

      {moves.length > 0 && (
        <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 sm:p-6" aria-label="Últimos movimentos">
          <h2 className="mb-2 text-base font-bold text-isfa-blue-dark">Últimos movimentos</h2>
          <ul className="divide-y divide-slate-100 text-xs text-slate-600">
            {moves.map((m) => (
              <li key={m.id} className="flex flex-wrap justify-between gap-x-4 gap-y-0.5 py-2">
                <span className="min-w-0">
                  <strong className="text-slate-800">{m.productName}</strong> · {KIND_LABEL[m.kind ?? "ajuste"] ?? "Alteração"}{" "}
                  {m.before === null ? "—" : m.before} → <strong>{m.after === null ? "por confirmar" : m.after}</strong>
                  {m.reason ? ` · ${m.reason}` : ""}
                </span>
                <span className="text-slate-400">
                  {m.by ?? ""} · {new Date(m.at).toLocaleString("pt-PT")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function StockRow({ p, onMove }: { p: Product; onMove: (p: Product, kind: StockKind, qty: number) => Promise<void> }) {
  const [qty, setQty] = useState("1");
  const [busy, setBusy] = useState(false);
  const n = /^\d+$/.test(qty.trim()) ? Number(qty.trim()) : null;
  const a = availability(p);
  const run = async (kind: StockKind) => {
    if (n === null) return;
    setBusy(true);
    try {
      await onMove(p, kind, n);
    } finally {
      setBusy(false);
    }
  };
  const btn = "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-40";
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="min-w-0 flex-1 basis-56">
        <p className="truncate text-sm font-semibold text-slate-800">{p.name}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="text-base font-extrabold text-isfa-blue-dark tabular-nums">{p.stock === null ? "—" : p.stock}</span>
          <span className={`rounded-full px-2 py-0.5 font-medium ${a.classes}`}>{a.label}</span>
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor={`q-${p.id}`}>
          Quantidade para {p.name}
        </label>
        <input
          id={`q-${p.id}`}
          inputMode="numeric"
          className={`${input} w-20 text-center tabular-nums`}
          value={qty}
          onChange={(e) => setQty(e.target.value)}
        />
        <button type="button" disabled={busy || n === null} onClick={() => void run("entrada")} className={`${btn} bg-isfa-green-soft text-isfa-green-dark`}>
          <Plus size={14} /> Entrada
        </button>
        <button type="button" disabled={busy || n === null} onClick={() => void run("saida")} className={`${btn} bg-amber-50 text-amber-800`}>
          <Minus size={14} /> Saída
        </button>
        <button type="button" disabled={busy || n === null} onClick={() => void run("ajuste")} className={`${btn} bg-slate-100 text-slate-700`}>
          Definir
        </button>
      </div>
    </li>
  );
}
