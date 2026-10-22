import type { Playable } from "../lib/video";

/** Vídeo apresentado na página principal. Só carrega o que a gestão configurou e que passou na validação. */
export function VideoPlayer({ media, title, poster }: { media: Playable; title: string; poster?: string }) {
  if (media.kind === "file") {
    // Ficheiros (muitas vezes gravados na vertical, no telemóvel) mantêm a proporção original, sem barras pretas.
    return (
      <div className="mx-auto w-fit max-w-full overflow-hidden rounded-2xl bg-black shadow-lg ring-1 ring-slate-200">
        <video src={media.src} poster={poster} controls playsInline preload="metadata" className="mx-auto block max-h-[75vh] max-w-full" aria-label={title}>
          O seu navegador não suporta a reprodução de vídeo.
        </video>
      </div>
    );
  }
  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-lg ring-1 ring-slate-200">
      <iframe
        src={media.src}
        title={title}
        loading="lazy"
        allow="encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
        className="h-full w-full border-0"
      />
    </div>
  );
}

export default function FeaturedVideoSection({ media, title, description, poster }: { media: Playable; title: string; description: string; poster?: string }) {
  return (
    <section id="video" className="bg-white">
      <div className={`mx-auto max-w-4xl px-4 py-14 sm:px-6 ${media.kind === "file" ? "text-center" : ""}`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-isfa-green-dark">Em destaque</p>
        <h2 className="mt-1 text-2xl font-extrabold text-isfa-blue-dark sm:text-3xl">{title || "Conheça a ISFA"}</h2>
        {description && <p className={`mt-2 max-w-2xl text-slate-600 ${media.kind === "file" ? "mx-auto" : ""}`}>{description}</p>}
        <div className="mt-6">
          <VideoPlayer media={media} title={title || "Vídeo da ISFA"} poster={poster} />
        </div>
      </div>
    </section>
  );
}
