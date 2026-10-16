import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import seed from "./src/data/seed.json";

const SITE_URL = (process.env.SITE_URL || "https://isfa-ponto-de-sa-de-e-solu-es.vercel.app").replace(/\/$/, "");
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

type Item = { name: string; category: string };

async function loadItems(env: Record<string, string>): Promise<Item[]> {
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY;
  if (url && key) {
    try {
      const r = await fetch(`${url}/rest/v1/products?published=eq.true&select=name,category&order=sort_order`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(6000),
      });
      if (r.ok) {
        const rows = (await r.json()) as Item[];
        if (rows.length) return rows;
      }
    } catch {
      /* usa o catálogo local */
    }
  }
  return Object.values(seed as Record<string, any>)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((p) => ({ name: p.name, category: p.category }));
}

// SEO: injeta no HTML (no momento da compilação) dados estruturados e uma lista de produtos legível sem JavaScript.
function seo(env: Record<string, string>): Plugin {
  return {
    name: "isfa-seo",
    async transformIndexHtml(html) {
      const items = await loadItems(env);
      const jsonld = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "@id": `${SITE_URL}/#organizacao`,
            name: "ISFA Equipamentos Hospitalares",
            legalName: "I.S.F.A — Ponto de Saúde e Soluções, Comércio & Serviços (SU), LDA.",
            url: `${SITE_URL}/`,
            logo: `${SITE_URL}/images/logo-isfa.jpg`,
            telephone: "+244974805933",
            address: { "@type": "PostalAddress", addressLocality: "Luanda", addressCountry: "AO" },
            areaServed: { "@type": "Country", name: "Angola" },
          },
          {
            "@type": "WebSite",
            "@id": `${SITE_URL}/#site`,
            url: `${SITE_URL}/`,
            name: "ISFA Equipamentos Hospitalares",
            inLanguage: "pt-AO",
            publisher: { "@id": `${SITE_URL}/#organizacao` },
          },
          {
            "@type": "ItemList",
            name: "Catálogo ISFA",
            numberOfItems: items.length,
            itemListElement: items.map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.name })),
          },
        ],
      };
      const byCat = new Map<string, string[]>();
      for (const p of items) byCat.set(p.category, [...(byCat.get(p.category) ?? []), p.name]);
      const noscript =
        `<h1>ISFA Equipamentos Hospitalares — Luanda, Angola</h1>` +
        `<p>Equipamentos hospitalares, laboratoriais e consumíveis clínicos. Peça cotação pelo WhatsApp: +244 974 805 933.</p>` +
        [...byCat].map(([c, l]) => `<h2>${esc(c)}</h2><ul>${l.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>`).join("");
      return html
        .replaceAll("__SITE_URL__", SITE_URL)
        .replace("__JSONLD__", JSON.stringify(jsonld).replace(/</g, "\\u003c"))
        .replace("__NOSCRIPT__", noscript);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), "VITE_"), ...Object.fromEntries(Object.entries(process.env).filter(([k]) => k.startsWith("VITE_")) as [string, string][]) };
  return {
    plugins: [react(), seo(env)],
    build: {
      // INLINE_ASSETS=1 gera tudo embutido (pré-visualização num só ficheiro). Na Vercel as imagens ficam em ficheiros próprios.
      assetsInlineLimit: process.env.INLINE_ASSETS ? 10_000_000 : 4096,
      cssCodeSplit: false,
    },
  };
});
