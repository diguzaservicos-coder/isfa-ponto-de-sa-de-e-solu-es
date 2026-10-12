import { useState } from "react";
import { Menu, X, MessageCircle, LogIn } from "lucide-react";
import logo from "../assets/logo-isfa.webp";
import { generalLink, whatsappLink } from "../lib/whatsapp";

const links = [
  { href: "#inicio", label: "Início" },
  { href: "#produtos", label: "Produtos" },
  { href: "#areas", label: "Áreas de atuação" },
  { href: "#cotacao", label: "Como pedir cotação" },
  { href: "#contactos", label: "Contactos" },
];

const quoteHref = whatsappLink(
  "Olá, ISFA Equipamentos Hospitalares. Gostaria de solicitar uma cotação.",
);

export default function Nav({
  isAdmin = false,
  onAdmin,
  canLogin = false,
}: {
  isAdmin?: boolean;
  onAdmin?: () => void;
  canLogin?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header style={{ top: "env(safe-area-inset-top, 0px)" }}
    className="sticky z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6"
        aria-label="Navegação principal"
      >
        <a href="#inicio" className="flex items-center gap-2" aria-label="ISFA — página inicial">
          <img
            src={logo}
            alt="Logótipo ISFA — Ponto de Saúde e Soluções"
            width={48}
            height={48}
            className="h-11 w-11 object-contain"
          />
          <span className="hidden text-sm font-bold leading-tight text-isfa-blue-dark sm:block">
            ISFA
            <span className="block text-xs font-medium text-slate-500">Equipamentos Hospitalares</span>
          </span>
        </a>

        <ul className="hidden items-center gap-6 lg:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="text-sm font-medium text-slate-600 transition hover:text-isfa-blue"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          {(isAdmin || canLogin) && (
            <button
              type="button"
              onClick={onAdmin}
              className="hidden items-center gap-1.5 rounded-full border border-isfa-green px-4 py-2 text-sm font-semibold text-isfa-green-dark hover:bg-isfa-green-soft sm:inline-flex"
            >
              {!isAdmin && <LogIn size={15} aria-hidden="true" />}
              {isAdmin ? "Gestão" : "Entrar"}
            </button>
          )}
          <a
            href={quoteHref}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-full bg-isfa-blue px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-isfa-blue-dark sm:inline-block"
          >
            Solicitar cotação
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-md p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {open && (
        <div id="menu-mobile" className="border-t border-slate-200 bg-white lg:hidden">
          <ul className="mx-auto flex max-w-6xl flex-col px-4 py-3 sm:px-6">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-2 py-3 text-base font-medium text-slate-700 hover:bg-isfa-blue-soft"
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li className="mt-2 grid gap-2">
              {(isAdmin || canLogin) && (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onAdmin?.();
                  }}
                  className="rounded-full border border-isfa-green px-4 py-3 text-center text-sm font-semibold text-isfa-green-dark"
                >
                  {isAdmin ? "Gestão de produtos" : "Entrar (equipa)"}
                </button>
              )}
              <a
                href={quoteHref}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-isfa-blue px-4 py-3 text-center text-sm font-semibold text-white"
              >
                Solicitar cotação
              </a>
              <a
                href={generalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-full border border-isfa-green px-4 py-3 text-sm font-semibold text-isfa-green-dark"
              >
                <MessageCircle size={16} /> Falar pelo WhatsApp
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
