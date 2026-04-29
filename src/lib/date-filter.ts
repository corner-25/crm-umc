// ────────────────────────────────────────────────────────────────────────────
// Helper parse "YYYY-MM-DD" filter input từ user thành Date với timezone VN.
//
// Vấn đề: new Date("2024-01-01") parse thành 2024-01-01 00:00:00 UTC,
// trên server VN (UTC+7) tương đương 07:00 sáng ngày VN → mọi record có
// receivedDate < 07:00 VN ngày đó sẽ bị filter loại sai.
//
// Giải pháp: gắn explicit "+07:00" để mốc đúng nửa đêm VN.
// ────────────────────────────────────────────────────────────────────────────

const VN_OFFSET = "+07:00";

/**
 * Parse "YYYY-MM-DD" thành Date = 00:00:00 giờ Việt Nam (đầu ngày).
 * Trả về null nếu input rỗng / không hợp lệ.
 */
export function parseVnDateStart(input: string | null | undefined): Date | null {
  if (!input) return null;
  const d = new Date(`${input}T00:00:00${VN_OFFSET}`);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Parse "YYYY-MM-DD" thành Date = 23:59:59.999 giờ Việt Nam (cuối ngày).
 * Trả về null nếu input rỗng / không hợp lệ.
 */
export function parseVnDateEnd(input: string | null | undefined): Date | null {
  if (!input) return null;
  const d = new Date(`${input}T23:59:59.999${VN_OFFSET}`);
  return isNaN(d.getTime()) ? null : d;
}
