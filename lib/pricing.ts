import type { Product, ProductPromotion } from '@prisma/client';

export type ProductWithPromotionFields = Product & {
  priceBgn: number;
  priceEur: number;
  basePriceBgn?: number;
  basePriceEur?: number;
  isPromoted: boolean;
  promotionLabel?: string | null;
  promotionEndsAt?: string | null;
  promotionId?: string | null;
};

/** Pick one active promo per product when several overlap (newest start wins). */
export function indexActivePromotionsByProductId(
  promotions: ProductPromotion[],
  at: Date = new Date()
): Map<string, ProductPromotion> {
  const map = new Map<string, ProductPromotion>();
  const active = promotions.filter((p) => p.startsAt <= at && p.endsAt >= at);
  active.sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime());
  for (const p of active) {
    if (!map.has(p.productId)) map.set(p.productId, p);
  }
  return map;
}

export function applyPromotionsToProductRow(
  product: Product,
  promo: ProductPromotion | undefined
): ProductWithPromotionFields {
  const baseBgn = Number(product.priceBgn);
  const baseEur = Number(product.priceEur);
  const { priceBgn: _bgn, priceEur: _eur, ...rest } = product;
  if (!promo) {
    return {
      ...rest,
      priceBgn: baseBgn,
      priceEur: baseEur,
      isPromoted: false,
      promotionLabel: null,
      promotionEndsAt: null,
      promotionId: null,
    } as ProductWithPromotionFields;
  }
  return {
    ...rest,
    priceBgn: Number(promo.priceBgn),
    priceEur: Number(promo.priceEur),
    basePriceBgn: baseBgn,
    basePriceEur: baseEur,
    isPromoted: true,
    promotionLabel: promo.label,
    promotionEndsAt: promo.endsAt.toISOString(),
    promotionId: promo.id,
  } as ProductWithPromotionFields;
}

export function expectedUnitPriceBgn(
  product: Pick<Product, 'priceBgn'>,
  promo: ProductPromotion | undefined
): number {
  if (promo && promo.startsAt <= new Date() && promo.endsAt >= new Date()) {
    return Number(promo.priceBgn);
  }
  return Number(product.priceBgn);
}
