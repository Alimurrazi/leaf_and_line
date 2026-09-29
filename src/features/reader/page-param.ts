export type PageParam = { page: number; canonical: boolean };

/** Pages are 1-based. `canonical: false` means the URL should be replaced with `?page=<page>`. */
export function parsePageParam(raw: string | null | undefined, pageCount: number): PageParam {
  if (raw == null || raw === "") return { page: 1, canonical: true };
  if (!/^\d+$/.test(raw)) return { page: 1, canonical: false };
  const page = Math.min(Math.max(Number(raw), 1), pageCount);
  return { page, canonical: String(page) === raw };
}
