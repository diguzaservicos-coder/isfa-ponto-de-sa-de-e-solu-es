import { useEffect, useState } from "react";
import { Download } from "lucide-react";

type Prompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const standalone = () => window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);

/** Ligação discreta "Instalar aplicação" no rodapé. Só aparece quando o navegador permite instalar (ou, no iPhone, explica como). */
export default function InstallApp() {
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as Prompt);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || standalone()) return null;
  if (!prompt && !isIos()) return null;

  return (
    <>
      {" · "}
      <button
        type="button"
        onClick={async () => {
          if (prompt) {
            await prompt.prompt();
            await prompt.userChoice.catch(() => undefined);
            setPrompt(null);
          } else setHint((h) => !h);
        }}
        className="inline-flex items-center gap-1 underline hover:text-slate-700"
      >
        <Download size={12} /> Instalar aplicação
      </button>
      {hint && <span className="mt-1 block text-slate-500">No iPhone: toque em Partilhar e depois em “Adicionar ao ecrã principal”.</span>}
    </>
  );
}
