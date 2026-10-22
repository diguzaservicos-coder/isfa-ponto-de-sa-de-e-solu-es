import { useEffect, useRef, useState } from "react";
import { Film, Loader2, Trash2, Upload } from "lucide-react";
import { VideoPlayer } from "./FeaturedVideo";
import { blankVideo, FeaturedVideo, VIDEO_MAX_BYTES } from "../lib/backends/types";
import { deleteVideoFile, saveVideo, uploadVideo, useFeaturedVideo } from "../lib/store";
import { DEFAULT_VIDEO, parseVideoUrl, toPlayable } from "../lib/video";

type Msg = { kind: "ok" | "error"; text: string } | null;
const field = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-isfa-blue focus:outline-none focus:ring-2 focus:ring-isfa-blue/20";

export default function VideoPanel() {
  const { video, loaded } = useFeaturedVideo();
  const [form, setForm] = useState<FeaturedVideo>(blankVideo);
  const [saved, setSaved] = useState<FeaturedVideo>(blankVideo);
  const [busy, setBusy] = useState<"" | "upload" | "save">("");
  const [msg, setMsg] = useState<Msg>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (loaded) {
      setForm(video ?? DEFAULT_VIDEO);
      setSaved(video ?? DEFAULT_VIDEO);
    }
  }, [loaded, video]);

  const set = (patch: Partial<FeaturedVideo>) => setForm((f) => ({ ...f, ...patch }));
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const linkOk = form.source === "link" ? !!parseVideoUrl(form.url) : true;
  const preview = toPlayable({ ...form, enabled: true });

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setMsg(null);
    setBusy("upload");
    try {
      const path = await uploadVideo(file);
      const old = form.source === "upload" ? form.path : "";
      set({ source: "upload", path, url: "" });
      if (old && old !== saved.path) void deleteVideoFile(old);
      setMsg({ kind: "ok", text: "Vídeo enviado. Clique em “Guardar” para o publicar." });
    } catch (e: any) {
      setMsg({ kind: "error", text: e?.message ?? "Não foi possível enviar o vídeo." });
    } finally {
      setBusy("");
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async (next: FeaturedVideo, okText: string) => {
    setMsg(null);
    if (next.enabled) {
      if (next.source === "link" && !parseVideoUrl(next.url)) {
        setMsg({ kind: "error", text: "Endereço não reconhecido. Use uma ligação do YouTube ou Vimeo, ou envie o ficheiro." });
        return;
      }
      if (next.source === "upload" && !next.path) {
        setMsg({ kind: "error", text: "Envie primeiro um ficheiro de vídeo." });
        return;
      }
    }
    setBusy("save");
    try {
      await saveVideo(next);
      // Apaga do armazenamento o ficheiro que deixou de ser usado
      if (saved.source === "upload" && saved.path && !(next.source === "upload" && next.path === saved.path)) void deleteVideoFile(saved.path);
      setSaved(next);
      setForm(next);
      setMsg({ kind: "ok", text: okText });
    } catch (e: any) {
      setMsg({ kind: "error", text: e?.message ?? "Não foi possível guardar." });
    } finally {
      setBusy("");
    }
  };

  if (!loaded) return <p className="text-sm text-slate-500">A carregar…</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
      <div className="space-y-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-isfa-blue-dark">
            <Film size={18} /> Vídeo em destaque
          </h2>
          <p className="mt-1 text-sm text-slate-500">Aparece na página principal, logo abaixo da apresentação.</p>
        </div>

        <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={form.enabled} onChange={(e) => set({ enabled: e.target.checked })} className="h-4 w-4 rounded border-slate-300" />
          Mostrar o vídeo na página principal
        </label>

        <div role="radiogroup" aria-label="Origem do vídeo" className="flex gap-2">
          {(
            [
              ["link", "Ligação (YouTube / Vimeo)"],
              ["upload", "Enviar ficheiro"],
            ] as const
          ).map(([k, t]) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={form.source === k}
              onClick={() => set({ source: k })}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${form.source === k ? "bg-isfa-blue text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-100"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {form.source === "link" ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="vurl">
              Endereço do vídeo
            </label>
            <input id="vurl" className={field} value={form.url} onChange={(e) => set({ url: e.target.value })} placeholder="https://www.youtube.com/watch?v=…" inputMode="url" autoComplete="off" />
            {form.url && !linkOk && <p className="mt-1 text-xs text-red-600">Endereço não reconhecido. Aceita ligações do YouTube e do Vimeo.</p>}
            <p className="mt-1 text-xs text-slate-500">Cole a ligação do vídeo. Para vídeos grandes, o YouTube é a melhor opção.</p>
          </div>
        ) : (
          <div>
            <input ref={fileRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
            <button
              type="button"
              disabled={busy !== ""}
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-full border border-isfa-blue px-4 py-2 text-sm font-semibold text-isfa-blue hover:bg-isfa-blue-soft disabled:opacity-50"
            >
              {busy === "upload" ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {busy === "upload" ? "A enviar…" : form.path ? "Substituir vídeo" : "Escolher vídeo"}
            </button>
            <p className="mt-1 text-xs text-slate-500">MP4 ou WebM, até {VIDEO_MAX_BYTES / 1024 / 1024} MB. {form.path && "Há um vídeo enviado."}</p>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="vtitle">
            Título
          </label>
          <input id="vtitle" className={field} maxLength={90} value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="Conheça a ISFA" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="vdesc">
            Descrição (opcional)
          </label>
          <textarea id="vdesc" className={field} rows={3} maxLength={300} value={form.description} onChange={(e) => set({ description: e.target.value })} />
        </div>

        {msg && (
          <p role="status" className={`rounded-lg px-3 py-2 text-sm ${msg.kind === "ok" ? "bg-isfa-green-soft text-isfa-green-dark" : "bg-red-50 text-red-700"}`}>
            {msg.text}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy !== "" || !dirty}
            onClick={() => void save(form, form.enabled ? "Guardado. O vídeo já aparece na página principal." : "Guardado. O vídeo está oculto na página principal.")}
            className="inline-flex items-center gap-2 rounded-full bg-isfa-blue px-6 py-2.5 text-sm font-semibold text-white hover:bg-isfa-blue-dark disabled:opacity-50"
          >
            {busy === "save" && <Loader2 size={16} className="animate-spin" />} Guardar
          </button>
          {(saved.url || saved.path) && (
            <button
              type="button"
              disabled={busy !== ""}
              onClick={() => {
                if (confirm("Remover o vídeo em destaque?")) void save(blankVideo, "Vídeo removido da página principal.");
              }}
              className="inline-flex items-center gap-2 rounded-full border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 size={16} /> Remover vídeo
            </button>
          )}
        </div>
      </div>

      <aside className="space-y-2">
        <p className="text-sm font-semibold text-slate-700">Pré-visualização</p>
        {preview ? <VideoPlayer media={preview} title={form.title || "Vídeo da ISFA"} /> : <div className="flex aspect-video items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-400">Sem vídeo</div>}
      </aside>
    </div>
  );
}
