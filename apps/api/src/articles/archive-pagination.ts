export const LIVE_FEED_SIZE = 12;
export const ARCHIVE_PAGE_SIZE = 3;

export function normalizeArchivePage(value: number | string | undefined): number {
  const parsed = Number(value ?? 1);
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(1, Math.floor(parsed));
}

export function archiveSkip(page: number): number {
  return LIVE_FEED_SIZE + (normalizeArchivePage(page) - 1) * ARCHIVE_PAGE_SIZE;
}

export function archiveTotal(totalItems: number): number {
  return Math.max(0, totalItems - LIVE_FEED_SIZE);
}

export function archiveTotalPages(totalItems: number): number {
  const total = archiveTotal(totalItems);
  return total === 0 ? 1 : Math.ceil(total / ARCHIVE_PAGE_SIZE);
}
