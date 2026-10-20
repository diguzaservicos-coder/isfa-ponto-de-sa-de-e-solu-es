import { use } from "../claude";
import { byOrder, fromDoc, Product, slugify, toDoc } from "../products";
import { Backend, blankVideo, FeaturedVideo, newProductId, prepareImage, StockMovement } from "./types";

// Destino usado na pré-visualização publicada na plataforma Claude (base de dados + fotografias da página).
// Coleções: products (publicados), productDrafts (rascunhos, só a gestão lê), stockMovements (só a gestão).

async function userId(): Promise<string | null> {
  const user = await use<any>("user");
  return user ? await user.id() : null;
}

export const platform: Backend = {
  subscribeCatalog(emit, fail) {
    let cancelled = false;
    const unsubs: Array<() => void> = [];
    (async () => {
      const db = await use<any>("db");
      if (cancelled) return;
      if (!db) return fail();
      let pub: Product[] = [];
      let drafts: Product[] = [];
      const push = () => emit([...pub, ...drafts].sort(byOrder));
      unsubs.push(
        db.collection("products").onSnapshot((snap: any) => {
          pub = snap.docs.map((d: any) => fromDoc(d.id, d.data() ?? {}, true));
          push();
        }, fail),
      );
      unsubs.push(
        db.collection("productDrafts").onSnapshot((snap: any) => {
          drafts = snap.docs.map((d: any) => fromDoc(d.id, d.data() ?? {}, false));
          push();
        }, fail),
      );
    })();
    return () => {
      cancelled = true;
      unsubs.forEach((u) => u());
    };
  },

  watchAuth(cb) {
    let cancelled = false;
    (async () => {
      const user = await use<any>("user");
      const can = user ? await user.canEdit() : false;
      if (!cancelled) cb({ loading: false, signedIn: !!user, isAdmin: !!can, email: null });
    })();
    return () => {
      cancelled = true;
    };
  },

  async saveProduct(p, prev, existingIds, reason) {
    const db = await use<any>("db");
    if (!db) throw new Error("A base de dados não está disponível nesta visualização.");
    const id = p.id || newProductId(slugify(p.name), existingIds);
    const saved: Product = { ...p, id, updatedAt: new Date().toISOString() };
    const target = saved.published ? "products" : "productDrafts";
    const other = saved.published ? "productDrafts" : "products";

    await db.doc(`${target}/${id}`).set(toDoc(saved));
    if (prev && prev.published !== saved.published) await db.doc(`${other}/${id}`).delete();

    if ((prev?.stock ?? null) !== saved.stock) {
      await db.collection("stockMovements").add({
        productId: id,
        productName: saved.name,
        before: prev?.stock ?? null,
        after: saved.stock,
        reason: reason || (prev ? "Alteração de stock" : "Stock inicial"),
        by: await userId(),
        at: saved.updatedAt,
      });
    }
    if (prev) {
      const removed = prev.images.filter((i) => !i.startsWith("builtin:") && !saved.images.includes(i));
      const assets = await use<any>("assets");
      if (assets) for (const r of removed) await assets.delete(r).catch(() => undefined);
    }
    return saved;
  },

  async deleteProduct(p) {
    const db = await use<any>("db");
    if (!db) throw new Error("A base de dados não está disponível nesta visualização.");
    await db.doc(`${p.published ? "products" : "productDrafts"}/${p.id}`).delete();
    const assets = await use<any>("assets");
    if (assets) for (const i of p.images) if (!i.startsWith("builtin:")) await assets.delete(i).catch(() => undefined);
  },

  async uploadPhoto(file) {
    const blob = await prepareImage(file);
    const assets = await use<any>("assets");
    if (!assets) throw new Error("O carregamento de fotografias só está disponível para a equipa de gestão.");
    try {
      const res = await assets.upload(blob);
      return res.id as string;
    } catch (e: any) {
      const code = e?.code;
      if (code === "too_large") throw new Error("A fotografia é demasiado grande.");
      if (code === "quota_or_state") throw new Error("O espaço de armazenamento está cheio.");
      if (code === "rate_limited") throw new Error("Demasiados carregamentos seguidos. Aguarde um momento.");
      throw new Error("Não foi possível carregar a fotografia. Tente novamente.");
    }
  },

  async loadMovements(productId): Promise<StockMovement[]> {
    const db = await use<any>("db");
    if (!db) return [];
    try {
      const snap = await db.collection("stockMovements").where("productId", "==", productId).get();
      return snap.docs
        .map((d: any) => ({ id: d.id, ...(d.data() ?? {}) }) as StockMovement)
        .sort((a: StockMovement, b: StockMovement) => (a.at < b.at ? 1 : -1))
        .slice(0, 8);
    } catch {
      return [];
    }
  },

  async loadRecentMovements() {
    return [];
  },

  async adjustStock(prod, kind, qty, reason) {
    if (!Number.isInteger(qty) || qty < 0) throw new Error("Quantidade inválida.");
    const cur = prod.stock;
    let next: number;
    if (kind === "entrada") next = (cur ?? 0) + qty;
    else if (kind === "saida") {
      if (cur === null) throw new Error('Sem quantidade registada: use "Definir quantidade" primeiro');
      if (cur < qty) throw new Error(`Stock insuficiente: existem ${cur} unidades`);
      next = cur - qty;
    } else next = qty;
    await platform.saveProduct({ ...prod, stock: next }, prod, [], reason || "Movimento de stock");
    return next;
  },

  async importStock(rows, reason) {
    for (const r of rows) await platform.saveProduct({ ...r.product, stock: r.qty }, r.product, [], reason);
    return rows.length;
  },

  async loadVideo() {
    const db = await use<any>("db");
    if (!db) return null;
    const snap = await db.doc("settings/featuredVideo").get();
    const d = snap?.data?.();
    return d ? ({ ...blankVideo, ...d, source: "link" } as FeaturedVideo) : null;
  },

  async saveVideo(v) {
    const db = await use<any>("db");
    if (!db) throw new Error("A base de dados não está disponível nesta visualização.");
    await db.doc("settings/featuredVideo").set(v);
    window.dispatchEvent(new Event("isfa:video"));
    return v;
  },

  async uploadVideo() {
    throw new Error("O envio de vídeos só funciona no site publicado. Aqui use uma ligação do YouTube ou Vimeo.");
  },

  async deleteVideoFile() {
    /* nada a apagar nesta pré-visualização */
  },

  async resolveNames(ids) {
    const user = await use<any>("user");
    if (!user || !ids.length) return {};
    const profiles = await user.profiles(ids);
    const out: Record<string, string> = {};
    for (const id of ids) out[id] = profiles[id]?.name || "Utilizador";
    return out;
  },
};
