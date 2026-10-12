import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    // INLINE_ASSETS=1 gera tudo embutido (pré-visualização num só ficheiro). Na Vercel as imagens ficam em ficheiros próprios.
    assetsInlineLimit: process.env.INLINE_ASSETS ? 10_000_000 : 4096,
    cssCodeSplit: false,
  },
});
