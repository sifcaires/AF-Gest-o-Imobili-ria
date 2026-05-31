/**
 * Safely parses any date representation (string or Date) into a local Date object,
 * preventing UTC timezone shifting (e.g., parsing "YYYY-MM-DD" as UTC and ending up 
 * one day behind in local time).
 */
export function parseLocalDate(dateStr: string | Date | undefined | null): Date {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  
  if (typeof dateStr === 'string') {
    const trimmed = dateStr.trim();
    
    // Match "YYYY-MM-DD"
    const matchIso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (matchIso) {
      const year = parseInt(matchIso[1], 10);
      const month = parseInt(matchIso[2], 10) - 1; // 0-indexed in JS
      const day = parseInt(matchIso[3], 10);
      return new Date(year, month, day);
    }
    
    // Match "YYYY-MM-DD with timestamp" like "2026-06-10T..." or "2026-06-10 ..."
    const matchPartialIso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[T\s]/);
    if (matchPartialIso) {
      const year = parseInt(matchPartialIso[1], 10);
      const month = parseInt(matchPartialIso[2], 10) - 1;
      const day = parseInt(matchPartialIso[3], 10);
      return new Date(year, month, day);
    }

    // Match "DD/MM/YYYY" or "D/M/YYYY" (Brazilian format)
    const matchBr = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (matchBr) {
      const day = parseInt(matchBr[1], 10);
      const month = parseInt(matchBr[2], 10) - 1;
      const year = parseInt(matchBr[3], 10);
      return new Date(year, month, day);
    }
  }
  
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) {
    return new Date();
  }
  return parsed;
}

/**
 * Format a parseLocalDate input safely using local timezone.
 */
export function formatLocalDateString(dateStr: string | Date | undefined | null): string {
  const d = parseLocalDate(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}
