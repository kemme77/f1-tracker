import { SITE_LOCALE, SITE_TIME_ZONE } from "@/lib/siteConfig";

export function formatDate(
  iso: string,
  options?: Intl.DateTimeFormatOptions,
  locale = SITE_LOCALE,
  timeZone = SITE_TIME_ZONE,
): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, { timeZone, ...options }).format(d);
}

export function formatShortDate(iso: string) {
  return formatDate(iso, { day: "2-digit", month: "short" });
}

export function formatTime(iso: string) {
  return formatDate(iso, { hour: "2-digit", minute: "2-digit", hour12: false });
}
