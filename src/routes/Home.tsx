import { useEffect, useMemo, useState } from "react";
import { MessageCircle, ArrowRight, Search, Stethoscope, FlaskConical, Package, MapPin, Phone } from "lucide-react";
import Nav from "../components/Nav";
import Admin from "../components/Admin";
import AdminLogin from "../components/AdminLogin";
import ProductModal from "../components/ProductModal";
import logo from "../assets/logo-isfa.webp";
import { availability, formatPrice, groupByCategory, imageUrl, Product } from "../lib/products";
import { signOut, useAuth, useCatalog } from "../lib/store";
import { generalLink, quoteLink, whatsappLink, WHATSAPP_DISPLAY } from "../lib/whatsapp";

const areas = [
  { icon: Stethoscope, title: "Equipamentos hospitalares", text: "Comercialização e fornecimento para unidades de saúde." },
  { icon: FlaskConical, title: "Equipamentos laboratoriais", text: "Material e equipamento para laboratórios." },
  { icon: Package, title: "Consumíveis e materiais médicos", text: "Abastecimento de materiais de uso corrente." },
];

const steps = [
  { n: "1", title: "Escolha o produto", text: "Veja os detalhes e escolha o que procura." },
  { n: "2", title: "Clique em “Solicitar cotação”", text: "Abre o WhatsApp da ISFA com a mensagem já preenchida." },
  { n: "3", title: "Receba a resposta", text: "A equipa informa preço e disponibilidade atual." },
];

function Photo({ src, alt, className }: { src: string; alt: string; className: string }) {
  if (src) return <img src={src} alt={alt} loading="lazy" decoding="async" className={className} />;
  return (
    <div className={`${className.replace("aspect-[4/5]", "aspect-[4/3]")} flex flex-col items-center justify-center gap-2 bg-slate-50 text-xs font-medium text-slate-400`}>
      <img src={logo} alt="" className="h-20 w-20 object-contain opacity-40" />
      Fotografia em breve
    </div>
  );
}

function Chip({ p }: { p: Product }) {
  const av = availability(p);
  return <span className={`inline-block w-fit rounded-full px-3 py-1 text-xs font-medium ${av.classes}`}>{av.label}</span>;
}

export default function Home() {
  const { products, ready, available } = useCatalog();
  const auth = useAuth();
  const isAdmin = auth.isAdmin;
  const [view, setView] = useState<"site" | "admin">("site");
  const [open, setOpen] = useState<Product | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    const sync = () => setView(location.hash === "#gestao" ? "admin" : "site");
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const goAdmin = () => {
    setView("admin");
    try {
      location.hash = "gestao";
    } catch {
      /* ignora */
    }
    window.scrollTo(0, 0);
  };
  const goSite = () => {
    setView("site");
    try {
      history.replaceState(null, "", location.pathname + location.search);
    } catch {
      /* ignora */
    }
    window.scrollTo(0, 0);
  };

  const visible = useMemo(() => products.filter((p) => p.published), [products]);
  const hero = visible.find((p) => p.featured && p.mainImage) ?? visible.find((p) => p.mainImage);
  const categories = useMemo(() => Array.from(new Set(visible.map((p) => p.category).filter(Boolean))), [visible]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visible.filter(
      (p) =>
        (!category || p.category === category) &&
        (!q || [p.name, p.reference, p.category, p.brand, p.model].some((v) => v.toLowerCase().includes(q))),
    );
  }, [visible, query, category]);

  const groups = useMemo(() => groupByCategory(filtered), [filtered]);

  if (view === "admin") {
    if (auth.loading) {
      return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">A carregar…</div>;
    }
    if (!isAdmin) {
      return (
        <AdminLogin
          onBack={goSite}
          notAdminEmail={auth.signedIn ? auth.email : null}
          authError={auth.error}
          unavailable={
            auth.mode === "supabase"
              ? undefined
              : import.meta.env.PROD && auth.mode === "dev"
                ? "Este site foi publicado sem as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY. Na Vercel, abra Settings > Environment Variables, adicione-as e faça Redeploy."
                : "O início de sessão fica ativo no site publicado, depois de ligar o Supabase (ver README). Nesta pré-visualização a gestão abre automaticamente para quem tem permissão de edição."
          }
        />
      );
    }
    return (
      <Admin
        products={products}
        onBack={goSite}
        onSignOut={auth.mode === "supabase" ? () => void signOut().then(goSite) : undefined}
      />
    );
  }

  return (
    <div className="min-h-screen">
      <Nav isAdmin={isAdmin} onAdmin={goAdmin} canLogin />

      {/* HERO */}
      <section id="inicio" className="relative overflow-hidden bg-gradient-to-br from-isfa-blue-soft via-white to-isfa-green-soft">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 md:py-20">
          <div className="fade-up">
            <p className="mb-3 inline-block rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-isfa-green-dark shadow-sm">
              Luanda, Angola
            </p>
            <h1 className="text-3xl font-extrabold leading-tight text-isfa-blue-dark sm:text-4xl lg:text-5xl">
              Equipamentos hospitalares e soluções para profissionais de saúde.
            </h1>
            <p className="mt-4 max-w-xl text-base text-slate-600 sm:text-lg">
              Explore os produtos da ISFA e solicite uma cotação diretamente à nossa equipa.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#produtos"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-isfa-blue px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-isfa-blue-dark"
              >
                Ver produtos <ArrowRight size={16} />
              </a>
              <a
                href={generalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-isfa-green px-6 py-3 text-sm font-semibold text-white transition hover:bg-isfa-green-dark"
              >
                <MessageCircle size={16} /> WhatsApp
              </a>
            </div>
          </div>

          <div className="fade-up relative mx-auto w-full max-w-sm md:max-w-md" style={{ animationDelay: "0.1s" }}>
            <div className="absolute -inset-3 -z-10 rounded-[2rem] bg-gradient-to-br from-isfa-blue/15 to-isfa-green/20 blur-xl" />
            {hero ? (
              <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200">
                <button type="button" onClick={() => setOpen(hero)} className="block w-full" aria-label={`Ver detalhes: ${hero.name}`}>
                  <img src={imageUrl(hero.mainImage)} alt={hero.name} className="aspect-[4/5] w-full object-cover" />
                </button>
                <div className="space-y-2 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-isfa-green-dark">Em destaque</p>
                  <p className="font-bold text-isfa-blue-dark">{hero.name}</p>
                  {hero.shortDescription && <p className="text-sm text-slate-600">{hero.shortDescription}</p>}
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <Chip p={hero} />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setOpen(hero)}
                        className="rounded-full border border-isfa-blue px-4 py-2 text-xs font-semibold text-isfa-blue hover:bg-isfa-blue-soft"
                      >
                        Detalhes
                      </button>
                      <a
                        href={quoteLink(hero)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-isfa-blue px-4 py-2 text-xs font-semibold text-white hover:bg-isfa-blue-dark"
                      >
                        Cotação
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
                <img src={logo} alt="ISFA — Ponto de Saúde e Soluções" className="mx-auto w-full max-w-xs object-contain" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* PRODUTOS */}
      <section id="produtos" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-extrabold text-isfa-blue-dark sm:text-3xl">Produtos</h2>
        <p className="mt-2 max-w-2xl text-slate-600">
          Preços e disponibilidade são confirmados pela equipa da ISFA no momento do pedido de cotação.
        </p>

        {visible.length > 0 && (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative sm:w-80">
              <label htmlFor="pesquisa" className="sr-only">
                Pesquisar produtos
              </label>
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="pesquisa"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Pesquisar por nome ou referência"
                className="w-full rounded-full border border-slate-300 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-isfa-blue focus:outline-none focus:ring-2 focus:ring-isfa-blue/20"
              />
            </div>
            {categories.length > 1 && (
              <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoria">
                {["", ...categories].map((c) => (
                  <button
                    key={c || "todas"}
                    type="button"
                    onClick={() => setCategory(c)}
                    aria-pressed={category === c}
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                      category === c ? "bg-isfa-blue text-white" : "bg-slate-100 text-slate-600 hover:bg-isfa-blue-soft"
                    }`}
                  >
                    {c || "Todos"}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!ready ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-96 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : !available ? (
          <p className="mt-8 rounded-2xl bg-slate-50 p-6 text-sm text-slate-600 ring-1 ring-slate-200">
            O catálogo não está disponível nesta visualização. Fale com a ISFA pelo WhatsApp para conhecer os produtos.
          </p>
        ) : visible.length === 0 ? (
          <p className="mt-8 rounded-2xl bg-slate-50 p-6 text-sm text-slate-600 ring-1 ring-slate-200">
            Os primeiros produtos serão publicados em breve. Entretanto, fale diretamente com a equipa da ISFA pelo WhatsApp.
          </p>
        ) : filtered.length === 0 ? (
          <p className="mt-8 rounded-2xl bg-slate-50 p-6 text-sm text-slate-600 ring-1 ring-slate-200">
            Nenhum produto encontrado.{" "}
            <a
              className="font-semibold text-isfa-blue underline"
              href={whatsappLink(`Olá, ISFA Equipamentos Hospitalares. Procuro: ${query || category}`)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Contacte a ISFA pelo WhatsApp
            </a>{" "}
            e diga-nos o que procura.
          </p>
        ) : (
          <div className="mt-8 space-y-12">
            {groups.map(([cat, items]) => (
              <div key={cat}>
                <h3 className="mb-4 flex items-baseline gap-2 border-b border-slate-200 pb-2 text-lg font-bold text-isfa-blue-dark">
                  {cat}
                  <span className="text-sm font-medium text-slate-400">{items.length}</span>
                </h3>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((p) => (
                    <article
                      key={p.id}
                      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:shadow-lg"
                    >
                      <button
                        type="button"
                        onClick={() => setOpen(p)}
                        className="block overflow-hidden bg-slate-100"
                        aria-label={`Ver detalhes: ${p.name}`}
                      >
                        <Photo
                          src={imageUrl(p.mainImage)}
                          alt={p.name}
                          className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      </button>
                      <div className="flex flex-1 flex-col gap-2 p-5">
                        <h4 className="text-lg font-bold text-isfa-blue-dark">{p.name}</h4>
                        {p.reference && <p className="text-sm text-slate-500">Ref.: {p.reference}</p>}
                        {p.shortDescription && <p className="text-sm text-slate-600">{p.shortDescription}</p>}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <Chip p={p} />
                          <span className="text-sm font-semibold text-slate-700">{formatPrice(p)}</span>
                        </div>
                        <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
                          <button
                            type="button"
                            onClick={() => setOpen(p)}
                            className="rounded-full border border-isfa-blue px-4 py-2.5 text-sm font-semibold text-isfa-blue transition hover:bg-isfa-blue-soft"
                          >
                            Ver detalhes
                          </button>
                          <a
                            href={quoteLink(p)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1.5 rounded-full bg-isfa-green px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-isfa-green-dark"
                          >
                            <MessageCircle size={15} /> Cotação
                          </a>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ÁREAS DE ATUAÇÃO */}
      <section id="areas" className="bg-isfa-blue-soft/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-extrabold text-isfa-blue-dark sm:text-3xl">O que a ISFA oferece</h2>
          <p className="mt-2 max-w-2xl text-slate-600">
            Comercialização, fornecimento e abastecimento para hospitais, clínicas, centros médicos, farmácias,
            laboratórios e profissionais de saúde.
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {areas.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-isfa-green-soft text-isfa-green-dark">
                  <Icon size={22} />
                </span>
                <h3 className="font-bold text-isfa-blue-dark">{title}</h3>
                <p className="mt-1 text-sm text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO PEDIR COTAÇÃO */}
      <section id="cotacao" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-extrabold text-isfa-blue-dark sm:text-3xl">Como solicitar uma cotação</h2>
        <ol className="mt-8 grid gap-5 md:grid-cols-3">
          {steps.map((s) => (
            <li key={s.n} className="rounded-2xl p-6 ring-1 ring-slate-200">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-isfa-blue text-sm font-bold text-white">
                {s.n}
              </span>
              <h3 className="mt-4 font-bold text-isfa-blue-dark">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{s.text}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs text-slate-500">Um pedido de cotação não representa compra nem reserva do produto.</p>
      </section>

      {/* CONTACTOS */}
      <section id="contactos" className="bg-isfa-blue-dark text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-2xl font-extrabold sm:text-3xl">Fale diretamente com a ISFA</h2>
            <p className="mt-2 text-blue-100">A forma mais rápida de obter preço e disponibilidade é pelo WhatsApp.</p>
            <ul className="mt-5 space-y-2 text-sm text-blue-100">
              <li className="flex items-center gap-2">
                <Phone size={16} /> WhatsApp: {WHATSAPP_DISPLAY}
              </li>
              <li className="flex items-center gap-2">
                <MapPin size={16} /> Luanda, Angola
              </li>
            </ul>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <a
              href={generalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-isfa-green px-8 py-3.5 text-sm font-semibold text-white shadow transition hover:bg-isfa-green-dark"
            >
              <MessageCircle size={18} /> Falar pelo WhatsApp
            </a>
            <p className="text-xs text-blue-200">Se o WhatsApp não abrir, ligue ou escreva para {WHATSAPP_DISPLAY}.</p>
          </div>
        </div>
      </section>

      {/* RODAPÉ */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-center sm:px-6 md:flex-row md:text-left">
          <div className="flex items-center gap-3">
            <img src={logo} alt="" width={48} height={48} className="h-12 w-12 object-contain" />
            <div>
              <p className="text-sm font-bold text-isfa-blue-dark">ISFA Equipamentos Hospitalares</p>
              <p className="text-xs text-slate-500">
                I.S.F.A — Ponto de Saúde e Soluções, Comércio &amp; Serviços (SU), LDA.
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} ISFA. Todos os direitos reservados.
            {" · "}
            <button type="button" onClick={goAdmin} className="underline hover:text-slate-700">
              Área da equipa
            </button>
          </p>
        </div>
      </footer>

      <a
        href={whatsappLink("Olá, ISFA Equipamentos Hospitalares. Gostaria de obter informações.")}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar com a ISFA pelo WhatsApp"
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-isfa-green text-white shadow-lg transition hover:scale-105 hover:bg-isfa-green-dark"
        style={{ bottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <MessageCircle size={26} />
      </a>

      {open && <ProductModal product={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
