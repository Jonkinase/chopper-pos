/**
 * Pricing Helper
 */

/**
 * Calcula el precio unitario y subtotal basado en la cantidad vs cantidad mínima para mayoreo.
 * @param {Object} product - Fila de la tabla inventory con los campos necesarios.
 * @param {number} quantity - Cantidad a comprar.
 * @returns {Object} { unit_price_applied, price_type, subtotal }
 */
const calculatePrice = (product, quantity) => {
  const { retail_price, wholesale_price, wholesale_min_qty } = product;

  let unitPrice = Number(retail_price);
  let priceType = 'menudeo';

  if (wholesale_price && wholesale_min_qty && quantity >= Number(wholesale_min_qty)) {
    unitPrice = Number(wholesale_price);
    priceType = 'mayoreo';
  }

  const subtotal = Number((unitPrice * quantity).toFixed(2));

  return {
    unit_price_applied: unitPrice,
    price_type: priceType,
    subtotal
  };
};

/**
 * Calcula la cantidad de producto que se puede comprar con un monto determinado en pesos.
 * Especialmente para productos líquidos o alimentos.
 * @param {Object} product - Fila de la tabla inventory.
 * @param {number} amount - Monto en pesos.
 * @returns {number} quantity - Cantidad calculada.
 */
const calculateQuantity = (product, amount) => {
  const { retail_price, wholesale_price, wholesale_min_qty } = product;

  // Primero intentamos con el precio de menudeo
  let quantity = amount / Number(retail_price);

  // Si con esa cantidad alcanzamos el precio de mayoreo, recalculamos usando ese precio
  if (wholesale_price && wholesale_min_qty && quantity >= Number(wholesale_min_qty)) {
    quantity = amount / Number(wholesale_price);
  }

  return Number(quantity.toFixed(3)); // Retornar con 3 decimales para litros/kg
};

module.exports = {
  calculatePrice,
  calculateQuantity
};
