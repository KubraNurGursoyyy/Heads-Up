export function normalizeInput(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function shouldRequestSuggestion(value: string): boolean {
  return normalizeInput(value).length >= 5;
}

export function shouldOfferCorrection(original: string, corrected: string): boolean {
  const a = normalizeInput(original);
  const b = normalizeInput(corrected);
  return Boolean(a && b && a !== b);
}

export function normalizeApiBaseUrl(value: string): string {
  const cleaned = value.trim().replace(/\/+$/, '');
  return cleaned.replace(/\/api$/i, '');
}
