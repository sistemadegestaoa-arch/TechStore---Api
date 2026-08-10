/**
 * Calcula a taxa de comissão da plataforma com base no preço unitário do produto.
 *
 * Tabela:
 *   10.000  –  40.000 kz  → 2%
 *   50.000  –  99.999 kz  → 3%
 *  100.000  – 499.999 kz  → 4%
 *  500.000+            kz  → 5%
 *
 * @param {number|string} productPrice - Preço unitário do produto em kz
 * @returns {number} Taxa de comissão em percentagem (ex: 2, 3, 4, 5)
 */
export const getCommissionRate = (productPrice) => {
  const price = Number(productPrice);

  if (price >= 500000) return 5;
  if (price >= 100000) return 4;
  if (price >= 50000)  return 3;
  if (price >= 10000)  return 2;

  // Produtos abaixo de 10.000 kz — taxa mínima de 2%
  return 2;
};

/**
 * Calcula o valor da comissão e os ganhos líquidos do vendedor.
 *
 * @param {number} subtotal     - Subtotal do item (preço × quantidade)
 * @param {number} productPrice - Preço unitário do produto (para determinar a taxa)
 * @returns {{ commissionRate: number, commission: number, vendorEarnings: number }}
 */
export const calculateCommission = (subtotal, productPrice) => {
  const commissionRate = getCommissionRate(productPrice);
  const commission     = subtotal * (commissionRate / 100);
  const vendorEarnings = subtotal - commission;

  return {
    commissionRate,
    commission,
    vendorEarnings
  };
};
