export type CosmeticProductId = 'butler_cosmetics_studio_10' | 'butler_cosmetics_atelier_20' | 'butler_remote_connection';
export type CosmeticPurchaseState = 'unavailable' | 'ready-for-provider' | 'pending' | 'verified' | 'restored' | 'failed';

export const COSMETIC_PRODUCTS: readonly { id: CosmeticProductId; label: string; priceLabel: string; kind: 'cosmetic' | 'remote'; entitlement: 'studio10' | 'atelier20' | 'remoteConnection'; consumable: false }[] = [
  { id: 'butler_cosmetics_studio_10', label: 'BUTLER STUDIO', priceLabel: '$10', kind: 'cosmetic', entitlement: 'studio10', consumable: false },
  { id: 'butler_cosmetics_atelier_20', label: 'BUTLER ATELIER', priceLabel: '$20', kind: 'cosmetic', entitlement: 'atelier20', consumable: false },
  { id: 'butler_remote_connection', label: 'REMOTE CONNECTION', priceLabel: 'SEPARATE PRODUCT', kind: 'remote', entitlement: 'remoteConnection', consumable: false },
];

export function cosmeticProduct(id: CosmeticProductId) { return COSMETIC_PRODUCTS.find(product => product.id === id); }
export function isVerifiedCosmeticState(state: CosmeticPurchaseState): boolean { return state === 'verified' || state === 'restored'; }
