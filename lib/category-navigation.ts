type CatRef = { id: string; parentCategoryId: string | null };

/** Path from root to `categoryId`: [root, child, grandchild, ...] */
export function resolveCategoryPath(categories: CatRef[], categoryId: string): string[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const path: string[] = [];
  let cur: string | undefined = categoryId;
  while (cur) {
    path.unshift(cur);
    const parentId: string | null | undefined = byId.get(cur)?.parentCategoryId;
    cur = parentId ?? undefined;
  }
  return path;
}

export function getChildrenOf<T extends CatRef>(categories: T[], parentId: string): T[] {
  return categories.filter((c) => c.parentCategoryId === parentId);
}

export function getCategoryName(
  c: { nameBg: string; nameEn: string; nameRo: string },
  locale: string
): string {
  if (locale === 'en') return c.nameEn;
  if (locale === 'ro') return c.nameRo;
  return c.nameBg;
}
