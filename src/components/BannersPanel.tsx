import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Banner, BANNER_SECONDS, validBannerLink } from "../lib/backends/types";
import { bannerUrl } from "../lib/banners";
import { deleteBanner, saveBanner, uploadBanner, useBanners } from "../lib/store";

type Msg = { kind: "ok" | "error"; text: string } | null;
const field = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-isfa-blue focus:outline-none focus:ring-2 focus:ring-isfa-blue/20";

function Row({ b, first, last, busy, onSave, onMove, onDelete }: { b: Banner; first: boolean; last: boolean; busy: boolean; onSave: (b: Banner) => void; onMove: (d: number) => void; onDelete: () => void }) {
  const [f, setF] = useState(b);
  const dirty = f.title !== b.title || f.link !== b.link || f.enabled !== b.enabled;
  const linkOk = validBannerLink(f.link.trim());
  return (
    <li className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:flex-row">
      <img src={bannerUrl(b.image)} alt="" className="h-40 w-full rounded-xl bg-slate-100 object-contain sm:h-32 sm:w-40" />
      <div className="min-w-0 flex-1 space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Texto sobre a imagem (opcional)</label>
          <input className={field} maxLength={120} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Ligação ao clicar (opcional)</label>
          <input className={field} value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} placeholder="https://… ou #produtos" inputMode="url" autoComplete="off" />
          {!linkOk && <p className="mt-1 text-xs text-red-600">Use um endereço https:// ou uma secção como #produtos.</p>}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={f.enabled} onChange={(e) => setF({ ...f, enabled: e.target.checked })} className="h-4 w-4 rounded border-slate-300" />
            Visível no site
          </label>
          <div className="ml-auto flex items-center gap-1">
            <button type="button" aria-label="Subir" disabled={busy || first} onClick={() => onMove(-1)} className="rounded-full border border-slate-300 p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-30">
              <ArrowUp size={16} />
            </button>
            <button type="button" aria-label="Descer" disabled={busy || last} onClick={() => onMove(1)} className="rounded-full border border-slate-300 p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-30">
              <ArrowDown size={16} />
            </button>
            <button type="button" disabled={busy || !dirty || !linkOk} onClick={() => onSave({ ...f, link: f.link.trim(), title: f.title.trim() })} className="ml-2 rounded-full bg-isfa-blue px-4 py-2 text-sm font-semibold text-white hover:bg-isfa-blue-dark disabled:opacity-50">
              Guardar
            </button>
            <button type="button" aria-label="Apagar banner" disabled={busy} onClick={onDelete} className="rounded-full border border-red-300 p-2 text-red-600 hover:bg-red-50 disabled:opacity-50">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

export default function BannersPanel() {
  const { banners, loaded, fromDb } = useBanners();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const run = async (fn: () => Promise<void>, ok: string) => {
    setMsg(null);
    setBusy(true);
    try {
      await fn();
      setMsg({ kind: "ok", text: ok });
    } catch (e: any) {
      setMsg({ kind: "error", text: e?.message ?? "Não foi possível concluir." });
    } finally {
      setBusy(false);
    }
  };

  const add = (files: FileList | null) =>
    run(async () => {
      if (!files?.length) return;
      let pos = banners.reduce((m, b) => Math.max(m, b.position), 0);
      for (const file of Array.from(files)) {
        const image = await uploadBanner(file);
        await saveBanner({ id: "", image, title: "", link: "", enabled: true, position: ++pos });
      }
      if (fileRef.current) fileRef.current.value = "";
    }, "Banner adicionado. Já aparece no topo da página principal.");

  const move = (k: number, d: number) =>
    run(async () => {
      const a = banners[k];
      const c = banners[k + d];
      const pa = a.position, pc = c.position;
      // Se as posições forem iguais, usa a ordem da lista
      await saveBanner({ ...a, position: pc === pa ? pa + d : pc });
      await saveBanner({ ...c, position: pa });
    }, "Ordem atualizada.");

  if (!loaded) return <p className="text-sm text-slate-500">A carregar…</p>;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-extrabold text-isfa-blue-dark">Banners da página principal</h2>
        <p className="mt-1 text-sm text-slate-500">
          Aparecem numa faixa no topo do site, uma imagem de cada vez, {BANNER_SECONDS} segundos cada. Guarde aqui todas as imagens de campanhas e avisos.
          Use imagens JPG, PNG ou WebP (de preferência quadradas ou horizontais).
        </p>
        <input ref={fileRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => void add(e.target.files)} />
        <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} className="mt-4 inline-flex items-center gap-2 rounded-full bg-isfa-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-isfa-green-dark disabled:opacity-50">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />} Adicionar banners
        </button>
        {!fromDb && (
          <p role="status" className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Os banners ainda não estão ligados à base de dados. Para poder adicionar, alterar e apagar, execute o ficheiro supabase/banners.sql no SQL Editor do Supabase. Entretanto o site mostra os dois banners iniciais.
          </p>
        )}
        {msg && (
          <p role="status" className={`mt-4 rounded-lg px-3 py-2 text-sm ${msg.kind === "ok" ? "bg-isfa-green-soft text-isfa-green-dark" : "bg-red-50 text-red-700"}`}>
            {msg.text}
          </p>
        )}
      </div>

      {banners.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Ainda não há banners. Clique em “Adicionar banners” para começar.</p>
      ) : (
        <ul className="space-y-3">
          {banners.map((b, k) => (
            <Row
              key={b.id + b.title + b.link + b.enabled}
              b={b}
              first={k === 0}
              last={k === banners.length - 1}
              busy={busy}
              onSave={(nb) => void run(async () => void (await saveBanner(nb)), "Banner guardado.")}
              onMove={(d) => void move(k, d)}
              onDelete={() => confirm("Apagar este banner?") && void run(() => deleteBanner(b), "Banner apagado.")}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
