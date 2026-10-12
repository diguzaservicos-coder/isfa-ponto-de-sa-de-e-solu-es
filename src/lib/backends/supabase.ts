import { PHOTO_BUCKET, supabase } from "../supabaseClient";
import { byOrder, Product, slugify } from "../products";
import { AuthState, Backend, newProductId, prepareImage, StockMovement } from "./types";

// Destino de produção: Supabase (Postgres + Auth + Storage). A segurança está nas políticas RLS de supabase/schema.sql.

const db = () => {
  if (!supabase) throw new Error("O Supabase não está configurado.");
  return supabase;
};

const str = (v: unknown) => (typeof v === "string" ? v : "");

function rowToProduct(r: any): Product {
  return {
    id: r.id,
    name: str(r.name),
    reference: str(r.reference),
    category: str(r.category),
    brand: str(r.brand),
    model: str(r.model),
    shortDescription: str(r.short_description),
    description: str(r.description),
    specs: Array.isArray(r.specs)
      ? r.specs.map((s: any) => ({ label: str(s?.label), value: str(s?.value) })).filter((s: any) => s.label || s.value)
      : [],
    price: r.price === null || r.price === undefined ? null : Number(r.price),
    showPrice: r.show_price === true,
    stock: r.stock === null || r.stock === undefined ? null : Number(r.stock),
    showStock: r.show_stock === true,
    mainImage: str(r.main_image) || (Array.isArray(r.images) ? r.images[0] ?? "" : ""),
    images: Array.isArray(r.images) ? r.images : [],
    featured: r.featured === true,
    order: typeof r.sort_order === "number" ? r.sort_order : 999,
    updatedAt: str(r.updated_at),
    published: r.published === true,
  };
}

function productToRow(p: Product) {
  return {
    id: p.id,
    name: p.name,
    reference: p.reference,
    category: p.category,
    brand: p.brand,
    model: p.model,
    short_description: p.shortDescription,
    description: p.description,
    specs: p.specs,
    price: p.price,
    show_price: p.showPrice,
    stock: p.stock,
    show_stock: p.showStock,
    main_image: p.mainImage,
    images: p.images,
    featured: p.featured,
    published: p.published,
    sort_order: p.order,
    updated_at: p.updatedAt,
  };
}

const notify = () => window.dispatchEvent(new Event("isfa:catalog"));

const isRemote = (ref: string) => ref && !ref.startsWith("builtin:");

function friendly(error: { message?: string; code?: string } | null, fallback: string): Error {
  if (!error) return new Error(fallback);
  if (error.code === "42501" || /row-level security|permission/i.test(error.message ?? ""))
    return new Error("Sem permissão. Inicie sessão com uma conta de administrador.");
  if (error.code === "23514") return new Error("Valor inválido: preço e stock não podem ser negativos.");
  return new Error(fallback);
}

export const supabaseBackend: Backend = {
  subscribeCatalog(emit, fail) {
    let active = true;
    const load = async () => {
      const { data, error } = await db().from("products").select("*").order("sort_order", { ascending: true });
      if (!active) return;
      if (error) return fail();
      emit((data ?? []).map(rowToProduct).sort(byOrder));
    };
    void load();
    const onChange = () => void load();
    window.addEventListener("isfa:catalog", onChange);
    // Ao entrar ou sair, volta a carregar (a gestão passa a ver também os rascunhos)
    const { data: sub } = db().auth.onAuthStateChange(() => {
      setTimeout(() => void load(), 0);
    });
    return () => {
      active = false;
      window.removeEventListener("isfa:catalog", onChange);
      sub.subscription.unsubscribe();
    };
  },

  watchAuth(cb) {
    let active = true;
    const out = (a: AuthState) => active && cb(a);
    const check = async (session: any) => {
      if (!session) return out({ loading: false, signedIn: false, isAdmin: false, email: null });
      const email = session.user?.email ?? null;
      const { data, error } = await db().rpc("is_admin");
      if (error) {
        // Falha ao verificar a permissão (rede, função em falta…): não dizer que a conta "não tem permissão".
        return out({
          loading: false,
          signedIn: true,
          isAdmin: false,
          email,
          error: "Não foi possível verificar a permissão de administrador. Confirme que o ficheiro schema.sql foi executado no Supabase.",
        });
      }
      out({ loading: false, signedIn: true, isAdmin: data === true, email });
    };
    db()
      .auth.getSession()
      .then(({ data }) => check(data.session))
      .catch(() => out({ loading: false, signedIn: false, isAdmin: false, email: null }));
    const { data: sub } = db().auth.onAuthStateChange((_event, session) => {
      setTimeout(() => void check(session).catch(() => undefined), 0);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  },

  async signIn(email, password) {
    let res;
    try {
      res = await db().auth.signInWithPassword({ email: email.trim(), password });
    } catch {
      throw new Error("Não foi possível ligar ao servidor. Verifique a ligação à internet e tente de novo.");
    }
    const { error } = res;
    if (!error) return;
    const code = (error as any).code as string | undefined;
    const status = (error as any).status as number | undefined;
    if (code === "email_not_confirmed") throw new Error("O email ainda não foi confirmado. No Supabase, confirme o utilizador (Auto Confirm User).");
    if (code === "invalid_credentials" || status === 400) throw new Error("Email ou palavra-passe incorretos.");
    if (status === 429 || code === "over_request_rate_limit") throw new Error("Demasiadas tentativas. Aguarde alguns minutos e tente de novo.");
    if (!status || /fetch|network/i.test(error.message)) throw new Error("Não foi possível ligar ao servidor. Verifique a ligação à internet e tente de novo.");
    if (code === "invalid_api_key" || status === 401) throw new Error("Chave do Supabase inválida. Confirme VITE_SUPABASE_ANON_KEY na Vercel e faça Redeploy.");
    throw new Error("Não foi possível iniciar sessão (" + (code || status) + ").");
  },

  async signOut() {
    await db().auth.signOut();
  },

  async saveProduct(p, prev, existingIds, reason) {
    const id = p.id || newProductId(slugify(p.name), existingIds);
    const saved: Product = { ...p, id, updatedAt: new Date().toISOString() };
    const { error } = await db().from("products").upsert(productToRow(saved), { onConflict: "id" });
    if (error) throw friendly(error, "Não foi possível guardar o produto. Tente novamente.");

    if ((prev?.stock ?? null) !== saved.stock) {
      const { data: sess } = await db().auth.getSession();
      const { error: mErr } = await db()
        .from("stock_movements")
        .insert({
          product_id: id,
          product_name: saved.name,
          before_qty: prev?.stock ?? null,
          after_qty: saved.stock,
          reason: reason || (prev ? "Alteração de stock" : "Stock inicial"),
          by_user: sess.session?.user?.email ?? null,
        });
      if (mErr) throw friendly(mErr, "Produto guardado, mas o histórico de stock não foi registado.");
    }

    if (prev) {
      const removed = prev.images.filter((i) => isRemote(i) && !saved.images.includes(i));
      if (removed.length) await db().storage.from(PHOTO_BUCKET).remove(removed);
    }
    notify();
    return saved;
  },

  async deleteProduct(p) {
    const { error } = await db().from("products").delete().eq("id", p.id);
    if (error) throw friendly(error, "Não foi possível eliminar o produto.");
    const files = p.images.filter(isRemote);
    if (files.length) await db().storage.from(PHOTO_BUCKET).remove(files);
    notify();
  },

  async uploadPhoto(file) {
    const blob = await prepareImage(file);
    if (blob.size > 5 * 1024 * 1024) throw new Error(`"${file.name}" é demasiado grande (máx. 5 MB).`);
    const ext = blob.type === "image/webp" ? "webp" : blob.type === "image/png" ? "png" : blob.type === "image/gif" ? "gif" : "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await db().storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: blob.type, upsert: false });
    if (error) throw friendly(error, "Não foi possível carregar a fotografia. Tente novamente.");
    return path;
  },

  async loadMovements(productId): Promise<StockMovement[]> {
    const { data, error } = await db()
      .from("stock_movements")
      .select("id, before_qty, after_qty, reason, by_user, created_at")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(8);
    if (error || !data) return [];
    return data.map((r: any) => ({
      id: r.id,
      before: r.before_qty,
      after: r.after_qty,
      reason: r.reason,
      by: r.by_user,
      at: r.created_at,
    }));
  },

  async resolveNames(ids) {
    return Object.fromEntries(ids.map((i) => [i, i]));
  },
};
