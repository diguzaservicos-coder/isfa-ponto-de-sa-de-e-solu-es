import imgKit from "../assets/kit-primeiros-socorros.webp";
import imgCadeira from "../assets/cadeira-de-rodas.webp";
import imgCirurgico from "../assets/kit-instrumentos-cirurgicos.webp";
import imgMicroscopio from "../assets/microscopio-optico.webp";
import imgBanho from "../assets/banho-maria.webp";
import imgCadeiraEletrica from "../assets/cadeira-eletrica.webp";
import imgMuletas from "../assets/muletas.webp";
import imgBalanca from "../assets/balanca.webp";
import imgMaleta from "../assets/maleta-medica.webp";
import imgAspirador from "../assets/aspirador-secrecoes.webp";
import imgBombaSeringa from "../assets/bomba-seringa.webp";
import imgCadeira2 from "../assets/cadeira-rodas-2.webp";
import imgMonitor from "../assets/monitor.webp";
import imgMuletasAxila from "../assets/muletas-axila.webp";
import imgBombaInfusao from "../assets/bomba-infusao.webp";
import imgLencoisAzuis from "../assets/lencois-azuis.webp";
import seed from "../data/seed.json";
import { photoUrl } from "./supabaseClient";
import { hasPlatform } from "./claude";

export type Spec = { label: string; value: string };

export type Product = {
  id: string;
  name: string;
  reference: string;
  category: string;
  brand: string;
  model: string;
  shortDescription: string;
  description: string;
  specs: Spec[];
  price: number | null;
  showPrice: boolean;
  stock: number | null;
  showStock: boolean;
  mainImage: string;
  images: string[];
  featured: boolean;
  order: number;
  updatedAt: string;
  published: boolean;
};

/** Stock igual ou abaixo deste valor aparece como "Stock limitado". */
export const LOW_STOCK = 5;

const builtin: Record<string, string> = {
  "kit-primeiros-socorros": imgKit,
  "cadeira-de-rodas": imgCadeira,
  "kit-instrumentos-cirurgicos": imgCirurgico,
  "microscopio-optico": imgMicroscopio,
  "banho-maria": imgBanho,
  "cadeira-eletrica": imgCadeiraEletrica,
  "muletas": imgMuletas,
  "balanca": imgBalanca,
  "maleta-medica": imgMaleta,
  "aspirador-secrecoes": imgAspirador,
  "bomba-seringa": imgBombaSeringa,
  "cadeira-rodas-2": imgCadeira2,
  "monitor": imgMonitor,
  "muletas-axila": imgMuletasAxila,
  "bomba-infusao": imgBombaInfusao,
  "lencois-azuis": imgLencoisAzuis,
};

/** Converte a referência guardada (fotografia incluída na página ou id de ficheiro carregado) num endereço. */
export function imageUrl(ref: string | undefined | null): string {
  if (!ref) return "";
  if (ref.startsWith("builtin:")) return builtin[ref.slice(8)] ?? "";
  return hasPlatform() ? "/_blob/" + ref : photoUrl(ref);
}

export type Availability = { key: "disponivel" | "limitado" | "sem_stock" | "confirmar"; label: string; classes: string };

export function availability(p: Pick<Product, "stock">): Availability {
  if (p.stock === null || p.stock === undefined)
    return { key: "confirmar", label: "Disponibilidade por confirmar", classes: "bg-slate-100 text-slate-600" };
  if (p.stock <= 0) return { key: "sem_stock", label: "Sem stock", classes: "bg-red-50 text-red-700" };
  if (p.stock <= LOW_STOCK) return { key: "limitado", label: "Stock limitado", classes: "bg-amber-50 text-amber-800" };
  return { key: "disponivel", label: "Disponível", classes: "bg-isfa-green-soft text-isfa-green-dark" };
}

export function formatPrice(p: Pick<Product, "price" | "showPrice">): string {
  if (p.showPrice && p.price !== null && p.price !== undefined) {
    return new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 2 }).format(p.price) + " Kz";
  }
  return "Sem preço";
}

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const numOrNull = (v: unknown): number | null => (typeof v === "number" && isFinite(v) ? v : null);

export function fromDoc(id: string, d: Record<string, unknown>, published: boolean): Product {
  const images = Array.isArray(d.images) ? (d.images as unknown[]).filter((x): x is string => typeof x === "string") : [];
  const specs = Array.isArray(d.specs)
    ? (d.specs as any[]).map((s) => ({ label: str(s?.label), value: str(s?.value) })).filter((s) => s.label || s.value)
    : [];
  const main = str(d.mainImage);
  return {
    id,
    name: str(d.name),
    reference: str(d.reference),
    category: str(d.category),
    brand: str(d.brand),
    model: str(d.model),
    shortDescription: str(d.shortDescription),
    description: str(d.description),
    specs,
    price: numOrNull(d.price),
    showPrice: d.showPrice === true,
    stock: numOrNull(d.stock),
    showStock: d.showStock === true,
    mainImage: main || images[0] || "",
    images,
    featured: d.featured === true,
    order: numOrNull(d.order) ?? 999,
    updatedAt: str(d.updatedAt),
    published,
  };
}

export function toDoc(p: Product): Record<string, unknown> {
  const { id: _id, published: _published, ...rest } = p;
  return rest;
}

/** Categorias da lista oficial de materiais da ISFA, pela ordem de apresentação. */
export const CATEGORIES = [
  "Equipamentos médicos e hospitalares",
  "Equipamentos laboratoriais",
  "Mobilidade e reabilitação",
  "Acessórios e materiais de apoio clínico",
];
export const categoryRank = (c: string) => {
  const i = CATEGORIES.indexOf(c);
  return i === -1 ? CATEGORIES.length : i;
};

/** Agrupa por categoria, pela ordem oficial; categorias novas vêm a seguir; produtos sem categoria ficam em "Outros". */
export function groupByCategory(list: Product[]): Array<[string, Product[]]> {
  const m = new Map<string, Product[]>();
  for (const p of list) {
    const k = p.category || "Outros";
    m.set(k, [...(m.get(k) ?? []), p]);
  }
  return Array.from(m.entries()).sort(
    (a, b) => categoryRank(a[0]) - categoryRank(b[0]) || a[0].localeCompare(b[0], "pt"),
  );
}

export const byOrder = (a: Product, b: Product) => a.order - b.order || a.name.localeCompare(b.name, "pt");

export function slugify(s: string): string {
  return (
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "produto"
  );
}

export function blankProduct(order: number): Product {
  return {
    id: "",
    name: "",
    reference: "",
    category: "",
    brand: "",
    model: "",
    shortDescription: "",
    description: "",
    specs: [],
    price: null,
    showPrice: false,
    stock: null,
    showStock: false,
    mainImage: "",
    images: [],
    featured: false,
    order,
    updatedAt: "",
    published: false,
  };
}

/** Dados de exemplo usados só em desenvolvimento local (fora da plataforma). */
export const seedProducts: Product[] = Object.entries(seed as Record<string, Record<string, unknown>>)
  .map(([id, d]) => fromDoc(id, d, true))
  .sort(byOrder);
