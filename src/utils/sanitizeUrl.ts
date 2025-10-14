// src/utils/sanitizeUrl.ts
export function sanitizeUrl(input: string): string {
  return (input || '')
    .trim()
    .replace(/[`'"]/g, '')
    .replace(/[\[\],]/g, '')
    .replace(/\s+/g, '');
}