import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BANNER_SECONDS } from "../lib/backends/types";
import { bannerUrl } from "../lib/banners";
import { useBanners } from "../lib/store";

/** Faixa de banners no topo da página: uma imagem de cada vez, 10 segundos cada. */
export default function BannerStrip() {
  const { banners } = useBanners();
  const list = banners.filter((b) => b.enabled && bannerUrl(b.image));
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = list.length;
  const idx = n ? i % n : 0;
  const timer = useRef<number>();

  // Reinicia os 10 segundos sempre que a imagem muda (também ao usar as setas ou os pontos)
  useEffect(() => {
    window.clearTimeout(timer.current);
    if (n < 2 || paused) return;
    timer.current = window.setTimeout(() => setI((v) => (v + 1) % n), BANNER_SECONDS * 1000);
    return () => window.clearTimeout(timer.current);
  }, [idx, n, paused]);

  if (!n) return null;
  const go = (d: number) => setI((idx + d + n) % n);

  return (
    <section
      aria-roledescription="carrossel"
      aria-label="Destaques da ISFA"
      className="bg-gradient-to-r from-isfa-blue-dark via-isfa-blue to-isfa-blue-dark"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
        <div className="relative h-[min(82vw,22rem)] overflow-hidden rounded-2xl bg-isfa-blue-dark shadow-lg ring-1 ring-white/20 sm:h-[26rem]">
          {list.map((b, k) => {
            const src = bannerUrl(b.image);
            const active = k === idx;
            const pic = (
              <>
                {/* Fundo desfocado com a própria imagem: a imagem aparece inteira, sem cortes */}
                <img src={src} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl" />
                <img src={src} alt={b.title || `Banner ${k + 1}`} decoding="async" loading={k === 0 ? "eager" : "lazy"} className="relative z-10 mx-auto h-full w-auto max-w-full object-contain" />
              </>
            );
            const cls = `absolute inset-0 block transition-opacity duration-700 motion-reduce:transition-none ${active ? "opacity-100" : "pointer-events-none opacity-0"}`;
            return b.link ? (
              <a
                key={b.id}
                href={b.link}
                {...(b.link.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                tabIndex={active ? 0 : -1}
                aria-hidden={!active}
                className={cls}
              >
                {pic}
              </a>
            ) : (
              <div key={b.id} aria-hidden={!active} className={cls}>
                {pic}
              </div>
            );
          })}

          {list[idx].title && (
            <p className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-isfa-blue-dark/90 to-transparent px-5 pb-4 pt-10 text-sm font-bold text-white sm:text-base">
              {list[idx].title}
            </p>
          )}

          {n > 1 && (
            <>
              <button type="button" aria-label="Banner anterior" onClick={() => go(-1)} className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/85 p-2 text-isfa-blue-dark shadow hover:bg-white">
                <ChevronLeft size={20} />
              </button>
              <button type="button" aria-label="Banner seguinte" onClick={() => go(1)} className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/85 p-2 text-isfa-blue-dark shadow hover:bg-white">
                <ChevronRight size={20} />
              </button>
              <div className="absolute bottom-3 right-4 z-20 flex gap-2">
                {list.map((b, k) => (
                  <button
                    key={b.id}
                    type="button"
                    aria-label={`Ver banner ${k + 1}`}
                    aria-current={k === idx}
                    onClick={() => setI(k)}
                    className={`h-2.5 rounded-full transition-all ${k === idx ? "w-7 bg-isfa-green" : "w-2.5 bg-white/70 hover:bg-white"}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="h-1 bg-isfa-green" />
    </section>
  );
}
