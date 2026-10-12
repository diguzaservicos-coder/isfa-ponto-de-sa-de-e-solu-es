// Acesso às capacidades da plataforma onde a página está publicada (base de dados, fotos, utilizador).
// Fora da plataforma (npm run dev) window.claude não existe e a página usa os dados de exemplo.

declare global {
  interface Window {
    claude?: { use: (name: string) => Promise<any> };
  }
}

export const hasPlatform = (): boolean => typeof window !== "undefined" && !!window.claude;

export async function use<T = any>(name: string): Promise<T | null> {
  try {
    return ((await window.claude?.use(name)) as T) ?? null;
  } catch {
    return null;
  }
}
