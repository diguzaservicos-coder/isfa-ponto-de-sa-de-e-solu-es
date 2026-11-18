import { hasPlatform } from "./claude";
import { bannerFileUrl } from "./supabaseClient";
import type { Banner } from "./backends/types";
import banner1 from "../assets/banner-1.webp";
import banner2 from "../assets/banner-2.webp";

const builtin: Record<string, string> = { "banner-1": banner1, "banner-2": banner2 };

/** Banners incluídos no site (usados enquanto a base de dados não tiver banners próprios). */
export const defaultBanners: Banner[] = [
  { id: "default-1", image: "builtin:banner-1", title: "", link: "", enabled: true, position: 1 },
  { id: "default-2", image: "builtin:banner-2", title: "", link: "", enabled: true, position: 2 },
];

export function bannerUrl(ref: string): string {
  if (!ref) return "";
  if (ref.startsWith("builtin:")) return builtin[ref.slice(8)] ?? "";
  return hasPlatform() ? "/_blob/" + ref : bannerFileUrl(ref);
}
