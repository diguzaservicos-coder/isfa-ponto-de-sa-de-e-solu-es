import type { Playable } from "../lib/video";

/** Vídeo apresentado na página principal. Só carrega o que a gestão configurou e que passou na validação. */
export function VideoPlayer({ media, title }: { media: Playable; title: string }) {
  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-lg ring-1 ring-slate-200">
      {media.kind === "embed" ? (
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
      ) : (
        <video src={media.src} controls playsInline preload="metadata" className="h-full w-full" aria-label={title}>
          O seu navegador não suporta a reprodução de vídeo.
        </video>
      )}
    </div>
  );
}

export default function FeaturedVideoSection({ media, title, description }: { media: Playable; title: string; description: string }) {
  return (
    <section id="video" className="bg-white">
      <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-isfa-green-dark">Em destaque</p>
        <h2 className="mt-1 text-2xl font-extrabold text-isfa-blue-dark sm:text-3xl">{title || "Conheça a ISFA"}</h2>
        {description && <p className="mt-2 max-w-2xl text-slate-600">{description}</p>}
        <div className="mt-6">
          <VideoPlayer media={media} title={title || "Vídeo da ISFA"} />
        </div>
      </div>
    </section>
  );
}
