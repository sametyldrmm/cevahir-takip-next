export type FormatDateTimeOptions = {
  locale?: string;
  timeZone?: string;
  formatOptions?: Intl.DateTimeFormatOptions;
};

const pad2 = (value: number) => String(value).padStart(2, '0');

export const dateKeyLocal = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const normalizeIsoLike = (raw: string) => {
  let value = raw.trim();
  value = value.includes(' ') && !value.includes('T') ? value.replace(' ', 'T') : value;
  value = value.replace(/(\.\d{3})\d+/, '$1');
  value = value.replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
  return value;
};

export const parseApiDateTime = (raw: string): Date | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-').map((v) => Number.parseInt(v, 10));
    if (![y, m, d].every((n) => Number.isFinite(n))) return null;
    return new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0));
  }

  const date = new Date(normalizeIsoLike(trimmed));
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

export const formatDateTime = (
  value: string | null | undefined,
  options: FormatDateTimeOptions = {},
) => {
  if (!value || !value.trim()) return '-';
  const date = parseApiDateTime(value);
  if (!date) return value;

  const locale = options.locale ?? 'tr-TR';
  const timeZone = options.timeZone ?? 'Europe/Istanbul';
  return date.toLocaleString(locale, { timeZone, ...options.formatOptions });
};

export const formatDate = (
  value: string | null | undefined,
  options: FormatDateTimeOptions = {},
) => {
  if (!value || !value.trim()) return '-';
  const date = parseApiDateTime(value);
  if (!date) return value;

  const locale = options.locale ?? 'tr-TR';
  const timeZone = options.timeZone ?? 'Europe/Istanbul';
  return date.toLocaleDateString(locale, { timeZone, ...options.formatOptions });
};
