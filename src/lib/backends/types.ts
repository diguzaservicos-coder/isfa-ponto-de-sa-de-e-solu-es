import type { Product } from "../products";

export type StockMovement = {
  id: string;
  before: number | null;
  after: number | null;
  reason: string;
  by: string | null;
  at: string;
  kind?: string;
  delta?: number | null;
  productName?: string;
};

/** Vídeo em destaque da página principal. */
export type FeaturedVideo = {
  enabled: boolean;
  /** "link" = YouTube ou Vimeo; "upload" = ficheiro enviado para o Supabase. */
  source: "link" | "upload";
  url: string;
  /** Caminho do ficheiro enviado (só source = "upload"). */
  path: string;
  title: string;
  description: string;
};

export const blankVideo: FeaturedVideo = { enabled: false, source: "link", url: "", path: "", title: "", description: "" };

export type StockKind = "entrada" | "saida" | "ajuste";

export type AuthState = { loading: boolean; signedIn: boolean; isAdmin: boolean; email: string | null; error?: string };

/** Contrato comum aos dois destinos de dados: pré-visualização (plataforma) e produção (Supabase). */
export interface Backend {
  subscribeCatalog(emit: (products: Product[]) => void, fail: () => void): () => void;
  watchAuth(cb: (a: AuthState) => void): () => void;
  saveProduct(p: Product, prev: Product | null, existingIds: string[], reason: string): Promise<Product>;
  deleteProduct(p: Product): Promise<void>;
  uploadPhoto(file: File): Promise<string>;
  loadMovements(productId: string): Promise<StockMovement[]>;
  loadRecentMovements(limit: number): Promise<StockMovement[]>;
  /** Entrada soma, saída subtrai (nunca abaixo de zero) e ajuste define a quantidade. Devolve o novo stock. */
  adjustStock(p: Product, kind: StockKind, qty: number, reason: string): Promise<number>;
  /** Define várias quantidades de uma vez (tudo ou nada). Devolve quantos produtos foram atualizados. */
  importStock(rows: { product: Product; qty: number }[], reason: string): Promise<number>;
  loadVideo(): Promise<FeaturedVideo | null>;
  saveVideo(v: FeaturedVideo): Promise<FeaturedVideo>;
  /** Envia um ficheiro de vídeo (MP4/WebM, máx. 50 MB) e devolve o caminho guardado. */
  uploadVideo(file: File): Promise<string>;
  deleteVideoFile(path: string): Promise<void>;
  resolveNames(ids: string[]): Promise<Record<string, string>>;
  signIn?(email: string, password: string): Promise<void>;
  signOut?(): Promise<void>;
}

export const ACCEPTED_IMAGES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** Reduz a fotografia (máx. 1600 px) e converte para WebP, quando o navegador permite. */
export async function prepareImage(file: File): Promise<Blob> {
  if (!ACCEPTED_IMAGES.includes(file.type)) throw new Error(`"${file.name}": use JPG, PNG, WebP ou GIF.`);
  if (file.size > 20 * 1024 * 1024) throw new Error(`"${file.name}" tem mais de 20 MB.`);
  let blob: Blob = file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const out: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/webp", 0.85));
    if (out && out.size > 0) blob = out;
  } catch {
    /* mantém o ficheiro original */
  }
  return blob;
}

export function newProductId(base: string, existingIds: string[]): string {
  let id = base;
  let n = 2;
  while (existingIds.includes(id)) id = `${base}-${n++}`;
  return id;
}

export const VIDEO_MIME = ["video/mp4", "video/webm", "video/quicktime"];
export const VIDEO_MAX_BYTES = 50 * 1024 * 1024;

export function checkVideoFile(file: File) {
  if (!VIDEO_MIME.includes(file.type)) throw new Error(`"${file.name}": use um vídeo MP4 ou WebM.`);
  if (file.size > VIDEO_MAX_BYTES) throw new Error(`"${file.name}" tem mais de 50 MB. Reduza o vídeo ou use uma ligação do YouTube.`);
}
