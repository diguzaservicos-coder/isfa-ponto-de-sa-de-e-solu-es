import { FormEvent, useState } from "react";
import { signIn, signOut } from "../lib/store";

export default function AdminLogin({ onBack, notAdminEmail, unavailable }: { onBack: () => void; notAdminEmail?: string | null; unavailable?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (unavailable) {
      setError(unavailable);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || "Não foi possível iniciar sessão.");
    }
    setBusy(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <h1 className="text-xl font-extrabold text-isfa-blue-dark">Gestão de produtos</h1>
        <p className="text-sm text-slate-600">Entre com a conta da equipa da ISFA.</p>
        {notAdminEmail && (
          <p role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            A conta {notAdminEmail} não tem permissão de gestão.{" "}
            <button type="button" onClick={() => void signOut()} className="font-semibold underline">
              Terminar sessão
            </button>
          </p>
        )}
        <div>
          <label htmlFor="login-email" className="mb-1 block text-xs font-semibold text-slate-600">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-isfa-blue focus:outline-none focus:ring-2 focus:ring-isfa-blue/20"
          />
        </div>
        <div>
          <label htmlFor="login-pass" className="mb-1 block text-xs font-semibold text-slate-600">
            Palavra-passe
          </label>
          <input
            id="login-pass"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-isfa-blue focus:outline-none focus:ring-2 focus:ring-isfa-blue/20"
          />
        </div>
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-isfa-blue px-6 py-3 text-sm font-semibold text-white hover:bg-isfa-blue-dark disabled:opacity-50"
        >
          {busy ? "A entrar…" : "Entrar"}
        </button>
        <button type="button" onClick={onBack} className="w-full text-sm font-medium text-slate-500 hover:text-slate-800">
          Voltar ao site
        </button>
      </form>
    </div>
  );
}
