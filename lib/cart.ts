// Panier partagé par la caisse staff et la commande client.
// Les prix affichés ici servent à l'aperçu : le total facturé est toujours recalculé
// par la base à partir de la table products.

export type CartLine = {
  key: string; // product_id, ou identifiant unique pour une ligne libre (caisse)
  productId: string | null;
  name: string;
  unitPrice: number;
  quantity: number;
};

export const MAX_QUANTITY = 99;

export function addToCart(cart: CartLine[], line: Omit<CartLine, "quantity">, quantity = 1): CartLine[] {
  const existing = cart.find((l) => l.key === line.key);
  if (existing) {
    return cart.map((l) => (l.key === line.key ? { ...l, quantity: Math.min(l.quantity + quantity, MAX_QUANTITY) } : l));
  }
  return [...cart, { ...line, quantity }];
}

export function setQuantity(cart: CartLine[], key: string, quantity: number): CartLine[] {
  if (quantity <= 0) return cart.filter((l) => l.key !== key);
  return cart.map((l) => (l.key === key ? { ...l, quantity: Math.min(quantity, MAX_QUANTITY) } : l));
}

export const cartTotal = (cart: CartLine[]) => Math.round(cart.reduce((s, l) => s + l.unitPrice * l.quantity, 0) * 100) / 100;

export const cartCount = (cart: CartLine[]) => cart.reduce((s, l) => s + l.quantity, 0);

/** Format attendu par les fonctions SQL pos_checkout / place_order. */
export function cartToItems(cart: CartLine[]) {
  return cart.map((l) =>
    l.productId
      ? { product_id: l.productId, quantity: l.quantity }
      : { name: l.name, price_chf: l.unitPrice, quantity: l.quantity },
  );
}
