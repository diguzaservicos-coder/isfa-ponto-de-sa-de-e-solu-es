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
import imgCentrifuga from "../assets/centrifuga-800d.webp";
import imgEcg from "../assets/ecg.webp";
import imgLencoisAzuis from "../assets/lencois-azuis.webp";
import img_cadeira_cromada from "../assets/cadeira-cromada.webp";
import img_nebulizador_compressor from "../assets/nebulizador-compressor.webp";
import img_fluxometro_oxigenio from "../assets/fluxometro-oxigenio.webp";
import img_tensiometro_digital from "../assets/tensiometro-digital.webp";
import img_esfigmo_manual from "../assets/esfigmo-manual.webp";
import img_nebulizador_portatil from "../assets/nebulizador-portatil.webp";
import img_termometro_infravermelho from "../assets/termometro-infravermelho.webp";
import img_balanca_pediatrica from "../assets/balanca-pediatrica.webp";
import img_teste_gravidez from "../assets/teste-gravidez.webp";
import img_bomba_upalm from "../assets/bomba-upalm.webp";
import img_teste_hiv from "../assets/teste-hiv.webp";
import img_kit_100 from "../assets/kit-100.webp";
import img_kit_bolsa from "../assets/kit-bolsa.webp";
import img_kit_25 from "../assets/kit-25.webp";
import img_banho_maria_2 from "../assets/banho-maria-2.webp";
import img_banho_maria_3 from "../assets/banho-maria-3.webp";
import seed from "../data/seed.json";
import { photoUrl } from "./supabaseClient";
import { hasPlatform } from "./claude";
import img_cama_normal from "../assets/cama-normal.webp";
import img_autoclave_35 from "../assets/autoclave-35.webp";
import img_cama_tripartida from "../assets/cama-tripartida.webp";
import img_bengalas from "../assets/bengalas.webp";
import img_estufa_50 from "../assets/estufa-50.webp";
import img_estufa_30 from "../assets/estufa-30.webp";
import img_estufa_136 from "../assets/estufa-136.webp";
import img_camara_inalacao from "../assets/camara-inalacao.webp";
import img_cadeira_colheita from "../assets/cadeira-colheita.webp";
import img_cadeira_rodas_isfa from "../assets/cadeira-rodas-isfa.webp";
import img_cama_eletrica from "../assets/cama-eletrica.webp";
import img_cadeira_infantil_eletrica from "../assets/cadeira-infantil-eletrica.webp";
import img_autoclave_50 from "../assets/autoclave-50.webp";
import img_cadeira_multifuncional from "../assets/cadeira-multifuncional.webp";
import img_higienizacao_sem_rodas from "../assets/higienizacao-sem-rodas.webp";
import img_higienizacao_rodas from "../assets/higienizacao-rodas.webp";
import img_cadeira_higienizacao_4_rodas from "../assets/cadeira-higienizacao-4-rodas.webp";
import img_carrinho_inox from "../assets/carrinho-inox.webp";
import img_higienizacao_rodas_2 from "../assets/higienizacao-rodas-2.webp";
import img_cadeira_higienizacao_banho from "../assets/cadeira-higienizacao-banho.webp";
import img_centrifuga_micro_hematocrito from "../assets/centrifuga-micro-hematocrito.webp";
import img_olympus_cx23 from "../assets/olympus-cx23.webp";
import img_bengala_dobravel from "../assets/bengala-dobravel.webp";
import img_estufa_136_2 from "../assets/estufa-136-2.webp";
import img_cadeira_odontologica from "../assets/cadeira-odontologica.webp";
import img_monitor_2 from "../assets/monitor-2.webp";
import img_centrifuga_24 from "../assets/centrifuga-24.webp";
import img_oximetro_upalm from "../assets/oximetro-upalm.webp";
import img_aspirador_manual from "../assets/aspirador-manual.webp";
import img_avental_cirurgico from "../assets/avental-cirurgico.webp";
import img_banco_laboratorio from "../assets/banco-laboratorio.webp";
import img_bata_clinica from "../assets/bata-clinica.webp";
import img_bengala_quatro_apoios from "../assets/bengala-quatro-apoios.webp";
import img_biombo_4_telas from "../assets/biombo-4-telas.webp";
import img_bisturi_eletrico from "../assets/bisturi-eletrico.webp";
import img_bomba_injecao from "../assets/bomba-injecao.webp";
import img_carrinho_medicacao from "../assets/carrinho-medicacao.webp";
import img_concentrador_10l from "../assets/concentrador-10l.webp";
import img_concentrador_390 from "../assets/concentrador-390.webp";
import img_concentrador_5l from "../assets/concentrador-5l.webp";
import img_ecg_12_canais from "../assets/ecg-12-canais.webp";
import img_ecg_3_canais from "../assets/ecg-3-canais.webp";
import img_ecg_6_canais from "../assets/ecg-6-canais.webp";
import img_ecografo_doppler from "../assets/ecografo-doppler.webp";
import img_ecografo_pb from "../assets/ecografo-pb.webp";
import img_estetoscopio from "../assets/estetoscopio.webp";
import img_maca_aco from "../assets/maca-aco.webp";
import img_maca_aco_2 from "../assets/maca-aco-2.webp";
import img_maca_laranja from "../assets/maca-laranja.webp";
import img_maca_laranja_2 from "../assets/maca-laranja-2.webp";
import img_mascara_n95 from "../assets/mascara-n95.webp";
import img_monitor_fetal from "../assets/monitor-fetal.webp";
import img_monitor_pa_bp05 from "../assets/monitor-pa-bp05.webp";
import img_oximetro_lk89 from "../assets/oximetro-lk89.webp";
import img_papel_marquesa from "../assets/papel-marquesa.webp";
import img_suporte_soro from "../assets/suporte-soro.webp";
import img_termometro_digital from "../assets/termometro-digital.webp";

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
  /** Catálogo da ISFA indica "Em stock" sem quantidade exata. */
  inStock: boolean;
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
  "cadeira-higienizacao-4-rodas": img_cadeira_higienizacao_4_rodas,
  "carrinho-inox": img_carrinho_inox,
  "higienizacao-rodas-2": img_higienizacao_rodas_2,
  "cadeira-higienizacao-banho": img_cadeira_higienizacao_banho,
  "centrifuga-micro-hematocrito": img_centrifuga_micro_hematocrito,
  "olympus-cx23": img_olympus_cx23,
  "bengala-dobravel": img_bengala_dobravel,
  "estufa-136-2": img_estufa_136_2,
  "aspirador-manual": img_aspirador_manual,
  "avental-cirurgico": img_avental_cirurgico,
  "banco-laboratorio": img_banco_laboratorio,
  "bata-clinica": img_bata_clinica,
  "bengala-quatro-apoios": img_bengala_quatro_apoios,
  "biombo-4-telas": img_biombo_4_telas,
  "bisturi-eletrico": img_bisturi_eletrico,
  "bomba-injecao": img_bomba_injecao,
  "carrinho-medicacao": img_carrinho_medicacao,
  "concentrador-10l": img_concentrador_10l,
  "concentrador-390": img_concentrador_390,
  "concentrador-5l": img_concentrador_5l,
  "ecg-12-canais": img_ecg_12_canais,
  "ecg-3-canais": img_ecg_3_canais,
  "ecg-6-canais": img_ecg_6_canais,
  "ecografo-doppler": img_ecografo_doppler,
  "ecografo-pb": img_ecografo_pb,
  "estetoscopio": img_estetoscopio,
  "maca-aco": img_maca_aco,
  "maca-aco-2": img_maca_aco_2,
  "maca-laranja": img_maca_laranja,
  "maca-laranja-2": img_maca_laranja_2,
  "mascara-n95": img_mascara_n95,
  "monitor-fetal": img_monitor_fetal,
  "monitor-pa-bp05": img_monitor_pa_bp05,
  "oximetro-lk89": img_oximetro_lk89,
  "papel-marquesa": img_papel_marquesa,
  "suporte-soro": img_suporte_soro,
  "termometro-digital": img_termometro_digital,
  "cadeira-odontologica": img_cadeira_odontologica,
  "monitor-2": img_monitor_2,
  "centrifuga-24": img_centrifuga_24,
  "oximetro-upalm": img_oximetro_upalm,
  "cama-normal": img_cama_normal,
  "autoclave-35": img_autoclave_35,
  "cama-tripartida": img_cama_tripartida,
  "bengalas": img_bengalas,
  "estufa-50": img_estufa_50,
  "estufa-30": img_estufa_30,
  "estufa-136": img_estufa_136,
  "camara-inalacao": img_camara_inalacao,
  "cadeira-colheita": img_cadeira_colheita,
  "cadeira-rodas-isfa": img_cadeira_rodas_isfa,
  "cama-eletrica": img_cama_eletrica,
  "cadeira-infantil-eletrica": img_cadeira_infantil_eletrica,
  "autoclave-50": img_autoclave_50,
  "cadeira-multifuncional": img_cadeira_multifuncional,
  "higienizacao-sem-rodas": img_higienizacao_sem_rodas,
  "higienizacao-rodas": img_higienizacao_rodas,
  "monitor": imgMonitor,
  "muletas-axila": imgMuletasAxila,
  "bomba-infusao": imgBombaInfusao,
  "lencois-azuis": imgLencoisAzuis,
  "ecg": imgEcg,
  "centrifuga-800d": imgCentrifuga,
  "cadeira-cromada": img_cadeira_cromada,
  "nebulizador-compressor": img_nebulizador_compressor,
  "fluxometro-oxigenio": img_fluxometro_oxigenio,
  "tensiometro-digital": img_tensiometro_digital,
  "esfigmo-manual": img_esfigmo_manual,
  "nebulizador-portatil": img_nebulizador_portatil,
  "termometro-infravermelho": img_termometro_infravermelho,
  "balanca-pediatrica": img_balanca_pediatrica,
  "teste-gravidez": img_teste_gravidez,
  "bomba-upalm": img_bomba_upalm,
  "teste-hiv": img_teste_hiv,
  "kit-100": img_kit_100,
  "kit-bolsa": img_kit_bolsa,
  "kit-25": img_kit_25,
  "banho-maria-2": img_banho_maria_2,
  "banho-maria-3": img_banho_maria_3,
};

/** Converte a referência guardada (fotografia incluída na página ou id de ficheiro carregado) num endereço. */
export function imageUrl(ref: string | undefined | null): string {
  if (!ref) return "";
  if (ref.startsWith("builtin:")) return builtin[ref.slice(8)] ?? "";
  return hasPlatform() ? "/_blob/" + ref : photoUrl(ref);
}

export type Availability = { key: "disponivel" | "limitado" | "sem_stock" | "confirmar"; label: string; classes: string };

export function availability(p: Pick<Product, "stock"> & { inStock?: boolean }): Availability {
  if (p.stock === null || p.stock === undefined) {
    if (p.inStock) return { key: "disponivel", label: "Em stock", classes: "bg-isfa-green-soft text-isfa-green-dark" };
    return { key: "confirmar", label: "Disponibilidade por confirmar", classes: "bg-slate-100 text-slate-600" };
  }
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
    inStock: d.inStock === true,
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

/** Categorias do catálogo da ISFA, pela ordem de apresentação. */
export const CATEGORIES = [
  "Mobilidade, acessibilidade e reabilitação",
  "Camas, macas e mobiliário hospitalar",
  "Equipamentos de diagnóstico e monitorização",
  "Equipamentos respiratórios e oxigenoterapia",
  "Equipamentos laboratoriais",
  "Material de colheita, testes e consumíveis clínicos",
  "Material cirúrgico e esterilização",
  "Vestuário clínico e proteção individual",
  "Kits de primeiros socorros",
  "Outros equipamentos clínicos",
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
    inStock: false,
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
