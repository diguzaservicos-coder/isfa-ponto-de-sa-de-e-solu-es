import { useEffect, useState } from "react";
import { hasPlatform } from "./claude";
import { supabase } from "./supabaseClient";
import { platform } from "./backends/platform";
import { supabaseBackend } from "./backends/supabase";
import type { AuthState, Backend, FeaturedVideo, StockKind, StockMovement } from "./backends/types";
import { Product, seedProducts } from "./products";

export type { StockKind, StockMovement };

/** platform = pré-visualização na plataforma Claude; supabase = produção (Vercel); dev = só leitura, dados de exemplo. */
export const mode: "platform" | "supabase" | "dev" = hasPlatform() ? "platform" : supabase ? "supabase" : "dev";

const backend: Backend | null = mode === "platform" ? platform : mode === "supabase" ? supabaseBackend : null;

export type Catalog = { products: Product[]; ready: boolean; available: boolean };

export function useCatalog(): Catalog {
  const [state, setState] = useState<Catalog>({ products: [], ready: false, available: true });
  useEffect(() => {
    if (!backend) {
      setState({ products: seedProducts, ready: true, available: true });
      return;
    }
    return backend.subscribeCatalog(
      (products) => setState({ products, ready: true, available: true }),
      () => setState((s) => ({ ...s, ready: true, available: false })),
    );
  }, []);
  return state;
}

export type Auth = AuthState & { mode: typeof mode };

/** Quem tem sessão e permissão de gestão. A proteção real está nas regras da base de dados, não neste botão. */
export function useAuth(): Auth {
  const [a, setA] = useState<AuthState>({ loading: !!backend, signedIn: false, isAdmin: false, email: null });
  useEffect(() => (backend ? backend.watchAuth(setA) : undefined), []);
  return { ...a, mode };
}

const need = (): Backend => {
  if (!backend) throw new Error("A gestão não está disponível nesta versão.");
  return backend;
};

export const signIn = (email: string, password: string) => need().signIn!(email, password);
export const signOut = () => need().signOut!();
export const loadMovements = (id: string) => (backend ? backend.loadMovements(id) : Promise.resolve([]));
export const resolveNames = (ids: string[]) => (backend && ids.length ? backend.resolveNames(ids) : Promise.resolve({}));
export const saveProduct = (p: Product, prev: Product | null, existingIds: string[], reason: string) =>
  need().saveProduct(p, prev, existingIds, reason);
export const deleteProduct = (p: Product) => need().deleteProduct(p);
export const uploadPhoto = (file: File) => need().uploadPhoto(file);
export const loadRecentMovements = (limit = 15) => (backend ? backend.loadRecentMovements(limit) : Promise.resolve([]));
export const adjustStock = (p: Product, kind: StockKind, qty: number, reason: string) => need().adjustStock(p, kind, qty, reason);
export const importStock = (rows: { product: Product; qty: number }[], reason: string) => need().importStock(rows, reason);

export const saveVideo = (v: FeaturedVideo) => need().saveVideo(v);
export const uploadVideo = (f: File) => need().uploadVideo(f);
export const deleteVideoFile = (path: string) => (backend ? backend.deleteVideoFile(path).catch(() => undefined) : Promise.resolve());

/** Vídeo em destaque (null = nenhum). Em modo de exemplo (dev) lê o ficheiro de exemplo, sem vídeo. */
export function useFeaturedVideo(): { video: FeaturedVideo | null; loaded: boolean; reload: () => void } {
  const [video, setVideo] = useState<FeaturedVideo | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    if (!backend) {
      setLoaded(true);
      return;
    }
    backend
      .loadVideo()
      .then((v) => alive && setVideo(v))
      .catch(() => undefined)
      .finally(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, [tick]);
  useEffect(() => {
    const on = () => setTick((n) => n + 1);
    window.addEventListener("isfa:video", on);
    return () => window.removeEventListener("isfa:video", on);
  }, []);
  return { video, loaded, reload: () => setTick((n) => n + 1) };
}
