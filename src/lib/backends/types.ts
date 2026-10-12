import type { Product } from "../products";

export type StockMovement = {
  id: string;
  before: number | null;
  after: number | null;
  reason: string;
  by: string | null;
  at: string;
};

export type AuthState = { loading: boolean; signedIn: boolean; isAdmin: boolean; email: string | null; error?: string };

/** Contrato comum aos dois destinos de dados: pré-visualização (plataforma) e produção (Supabase). */
export interface Backend {
  subscribeCatalog(emit: (products: Product[]) => void, fail: () => void): () => void;
  watchAuth(cb: (a: AuthState) => void): () => void;
  saveProduct(p: Product, prev: Product | null, existingIds: string[], reason: string): Promise<Product>;
  deleteProduct(p: Product): Promise<void>;
  uploadPhoto(file: File): Promise<string>;
  loadMovements(productId: string): Promise<StockMovement[]>;
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
