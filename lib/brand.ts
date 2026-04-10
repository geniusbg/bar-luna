import { prisma } from './prisma';

/** Default tenant for single-brand Malts deployment; override via env for multi-brand later. */
export const DEFAULT_BRAND_SLUG = 'malts';

export async function getDefaultBrandId(): Promise<string> {
  const slug = process.env.DEFAULT_BRAND_SLUG || DEFAULT_BRAND_SLUG;
  const brand = await prisma.brand.findUnique({ where: { slug } });
  if (!brand) {
    throw new Error(
      `Brand "${slug}" not found. Run: npx prisma db seed (after setting ADMIN_EMAIL / ADMIN_PASSWORD).`
    );
  }
  return brand.id;
}
