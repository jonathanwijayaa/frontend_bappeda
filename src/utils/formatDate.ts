/**
 * utils/formatDate.ts
 * Standarisasi format tanggal/waktu untuk locale id-ID.
 * Menggantikan puluhan baris inline `.toLocaleString("id-ID", ...)` di seluruh codebase.
 */

type DateStyle = "full" | "date-only" | "short" | "date-short";

/**
 * Format tanggal ke string locale Indonesia.
 *
 * @param date - Date object, ISO string, atau timestamp
 * @param style - Gaya format:
 *   - `"short"` (default): "17 Agt 2026, 14:30" (dateStyle:medium, timeStyle:short)
 *   - `"date-only"`: "17 Agustus 2026"
 *   - `"date-short"`: "17 Agt 2026"
 *   - `"full"`: "Senin, 17 Agustus 2026, 14:30 WIB"
 * @returns formatted string, atau "-" jika input invalid
 */
export const formatDateTime = (
  date: string | number | Date | null | undefined,
  style: DateStyle = "short",
): string => {
  if (!date) return "-";

  try {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return "-";

    switch (style) {
      case "full":
        return (
          d.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            weekday: "long",
            year: "numeric",
          }) +
          ", " +
          d.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }) +
          " WIB"
        );

      case "date-only":
        return d.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });

      case "date-short":
        return d.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });

      case "short":
      default:
        return d.toLocaleString("id-ID", {
          dateStyle: "medium",
          timeStyle: "short",
        });
    }
  } catch {
    return "-";
  }
};
