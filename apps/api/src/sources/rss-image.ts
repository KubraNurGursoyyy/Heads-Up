type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' ? (value as UnknownRecord) : null;
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function urlFromMediaValue(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const url = urlFromMediaValue(item);
      if (url) return url;
    }
    return undefined;
  }

  if (typeof value === 'string') {
    return value.startsWith('http') ? decodeHtml(value) : undefined;
  }

  const record = asRecord(value);
  if (!record) return undefined;

  for (const key of ['url', 'href']) {
    const direct = record[key];
    if (typeof direct === 'string' && direct.startsWith('http')) {
      return decodeHtml(direct);
    }
  }

  const attrs = asRecord(record.$);
  if (attrs) {
    for (const key of ['url', 'href']) {
      const attr = attrs[key];
      if (typeof attr === 'string' && attr.startsWith('http')) {
        return decodeHtml(attr);
      }
    }
  }

  return undefined;
}

function imageFromHtml(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.includes('<')) return undefined;

  const match = value.match(/<img\b[^>]*?(?:src|data-src)=["']([^"']+)["'][^>]*>/i);

  if (!match?.[1]) return undefined;
  const url = decodeHtml(match[1]);
  return /^https?:\/\//i.test(url) ? url : undefined;
}

export function extractRssImage(item: unknown): string | undefined {
  const record = asRecord(item);
  if (!record) return undefined;

  const enclosure = urlFromMediaValue(record.enclosure);
  if (enclosure) return enclosure;

  for (const key of [
    'media:content',
    'media:thumbnail',
    'mediaContent',
    'mediaThumbnail',
    'image',
  ]) {
    const mediaUrl = urlFromMediaValue(record[key]);
    if (mediaUrl) return mediaUrl;
  }

  return (
    imageFromHtml(record.content) ??
    imageFromHtml(record['content:encoded']) ??
    imageFromHtml(record.description)
  );
}

export function openLibraryCoverUrl(coverId?: number) {
  if (!Number.isInteger(coverId) || Number(coverId) <= 0) return undefined;
  return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
}
