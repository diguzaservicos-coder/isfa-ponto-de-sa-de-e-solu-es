import { supabase, VIDEO_BUCKET } from "./supabaseClient";
import type { FeaturedVideo } from "./backends/types";

export type Playable =
  | { kind: "embed"; src: string; provider: "youtube" | "vimeo"; thumb?: string }
  | { kind: "file"; src: string };

/** Interpreta o endereço escrito pela equipa. Só aceita https e fontes conhecidas; devolve null se não for válido. */
export function parseVideoUrl(raw: string): Playable | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  const host = u.hostname.replace(/^www\.|^m\./, "");
  let id = "";
  if (host === "youtu.be") id = u.pathname.slice(1).split("/")[0];
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (u.pathname === "/watch") id = u.searchParams.get("v") ?? "";
    else {
      const m = u.pathname.match(/^\/(embed|shorts|live|v)\/([\w-]{11})/);
      if (m) id = m[2];
    }
  }
  if (id) {
    if (!/^[\w-]{11}$/.test(id)) return null;
    return {
      kind: "embed",
      provider: "youtube",
      src: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`,
      thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    };
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const m = u.pathname.match(/(?:video\/)?(\d{6,12})(?:\/([0-9a-f]{8,}))?/);
    if (m) {
      const h = m[2] ? `?h=${m[2]}` : "";
      return { kind: "embed", provider: "vimeo", src: `https://player.vimeo.com/video/${m[1]}${h}` };
    }
    return null;
  }
  return null;
}

export function videoFileUrl(path: string): string {
  if (!supabase) return "";
  return supabase.storage.from(VIDEO_BUCKET).getPublicUrl(path).data.publicUrl;
}

export function toPlayable(v: FeaturedVideo | null): Playable | null {
  if (!v || !v.enabled) return null;
  if (v.source === "upload") {
    const src = v.path ? videoFileUrl(v.path) : v.url;
    return src ? { kind: "file", src } : null;
  }
  return parseVideoUrl(v.url);
}

/** Vídeo que acompanha o site (public/videos). Usado enquanto a gestão não definir outro. */
export const DEFAULT_VIDEO: FeaturedVideo = {
  enabled: true,
  source: "upload",
  url: "/videos/destaque.mp4",
  path: "",
  title: "Conheça a ISFA",
  description: "",
};
export const DEFAULT_POSTER = "/videos/destaque.jpg";
