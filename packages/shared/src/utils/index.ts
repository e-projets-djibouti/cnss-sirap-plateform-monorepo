/**
 * Formate un montant en francs djiboutiens
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-DJ', {
    style: 'currency',
    currency: 'DJF',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Convertit un nombre en lettres (français)
 * Ex: 1500 → "mille cinq cents"
 */
export function numberToFrenchWords(n: number): string {
  if (n === 0) return 'zéro';
  // Implémentation à compléter selon les besoins métier
  return n.toString();
}
