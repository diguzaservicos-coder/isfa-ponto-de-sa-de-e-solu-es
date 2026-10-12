// Número oficial da ISFA. Todos os botões de contacto e cotação usam apenas este número.
export const WHATSAPP_NUMBER = "244974805933";
export const WHATSAPP_DISPLAY = "+244 974 805 933";

export function whatsappLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function quoteLink(product: { name: string; reference?: string }): string {
  const lines = [
    "Olá, ISFA Equipamentos Hospitalares. Gostaria de solicitar uma cotação para o seguinte produto.",
    "",
    `Produto: ${product.name}`,
  ];
  if (product.reference) lines.push(`Referência: ${product.reference}`);
  lines.push(
    `Página: ${typeof window !== "undefined" ? window.location.href : ""}`,
    "",
    "Podem informar-me sobre o preço e a disponibilidade atual?",
    "",
    "Obrigado.",
  );
  return whatsappLink(lines.join("\n"));
}

export const generalLink = whatsappLink(
  "Olá, ISFA Equipamentos Hospitalares. Gostaria de obter informações sobre os vossos produtos.",
);
