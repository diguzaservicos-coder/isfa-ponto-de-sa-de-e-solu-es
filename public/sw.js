/* Service worker da ISFA. Objetivo: abrir depressa, funcionar como app e mostrar algo útil sem rede.
   Nunca guarda dados privados: pedidos à gestão, encomendas e tudo o que não seja GET ficam sempre na rede. */
const VERSION = "isfa-v1";
const STATIC = `${VERSION}-static`;
const PAGES = `${VERSION}-pages`;
const DATA = `${VERSION}-catalog`;
const SHELL = ["/offline.html", "/icons/icon-192.png", "/icons/icon-512.png", "/images/logo-isfa.webp"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(STATIC).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Catálogo público (produtos publicados e definições do site): só quando o pedido é anónimo, nunca o de um utilizador autenticado.
const isPublicCatalog = (req, url) => {
  if (!/\.supabase\.co$/.test(url.hostname) || !/^\/rest\/v1\/(products|site_settings)/.test(url.pathname)) return false;
  const key = req.headers.get("apikey");
  const auth = req.headers.get("authorization");
  return !!key && (!auth || auth === `Bearer ${key}`);
};

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || req.headers.has("range")) return;
  const url = new URL(req.url);

  if (url.origin !== self.location.origin) {
    if (isPublicCatalog(req, url)) {
      e.respondWith(
        fetch(req)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(DATA).then((c) => c.put(req.url, copy));
            }
            return res;
          })
          .catch(() => caches.open(DATA).then((c) => c.match(req.url)).then((hit) => hit || Response.error())),
      );
    }
    return;
  }

  if (url.pathname === "/sw.js" || url.pathname.startsWith("/videos/")) return;

  // Páginas: rede primeiro (o site atualiza logo), cópia guardada ou página offline se falhar.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(PAGES).then((c) => c.put("/", copy));
          }
          return res;
        })
        .catch(() => caches.open(PAGES).then((c) => c.match("/")).then((hit) => hit || caches.match("/offline.html"))),
    );
    return;
  }

  // Ficheiros estáticos (nomes com hash em /assets, imagens, ícones): cache primeiro.
  if (/^\/(assets|images|icons)\//.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(STATIC).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
  }
});
