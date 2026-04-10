/** Strips a leading emoji run from titles (legacy values stored with 🍽️ prefix). */
export function stripLeadingEmoji(title: string): string {
  const t = title.trim();
  const cleaned = t.replace(/^(?:\p{Extended_Pictographic}\uFE0F?\s*)+/u, '').trim();
  return cleaned || t;
}
