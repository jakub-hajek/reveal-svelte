const DAY_MS = 86_400_000;
const MAX_LABELED_TICKS = 14;
export function toUTCms(value) {
    const ms = value instanceof Date ? value.getTime() : Date.parse(value);
    if (Number.isNaN(ms)) {
        throw new Error(`GanttChart: invalid date "${String(value)}"`);
    }
    return ms;
}
export function formatGanttDate(ms, locale) {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(ms);
}
function startOfDay(ms) {
    const d = new Date(ms);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}
function startOfWeek(ms) {
    const day = startOfDay(ms);
    const weekday = (new Date(day).getUTCDay() + 6) % 7;
    return day - weekday * DAY_MS;
}
function snapToUnit(ms, unit) {
    const d = new Date(ms);
    switch (unit) {
        case 'day':
            return startOfDay(ms);
        case 'week':
            return startOfWeek(ms);
        case 'month':
            return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
        case 'quarter':
            return Date.UTC(d.getUTCFullYear(), Math.floor(d.getUTCMonth() / 3) * 3, 1);
        case 'year':
            return Date.UTC(d.getUTCFullYear(), 0, 1);
    }
}
function addUnit(base, unit, count) {
    if (unit === 'day')
        return base + count * DAY_MS;
    if (unit === 'week')
        return base + count * 7 * DAY_MS;
    const monthsPer = unit === 'month' ? 1 : unit === 'quarter' ? 3 : 12;
    const d = new Date(base);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + count * monthsPer, 1);
}
function pickUnit(spanDays) {
    if (spanDays <= 31)
        return 'day';
    if (spanDays <= 180)
        return 'week';
    if (spanDays <= 750)
        return 'month';
    if (spanDays <= 1900)
        return 'quarter';
    return 'year';
}
function makeLabeler(unit, locale) {
    const dayFormat = new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC'
    });
    const monthFormat = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' });
    return (ms, index) => {
        const d = new Date(ms);
        switch (unit) {
            case 'day':
            case 'week':
                return dayFormat.format(ms);
            case 'month':
                // composed instead of a month+year Intl format: some locales (e.g. cs)
                // expand the short month to its full name when a year is present
                return d.getUTCMonth() === 0 || index === 0
                    ? `${monthFormat.format(ms)} ${d.getUTCFullYear()}`
                    : monthFormat.format(ms);
            case 'quarter':
                return `Q${Math.floor(d.getUTCMonth() / 3) + 1} ${d.getUTCFullYear()}`;
            case 'year':
                return String(d.getUTCFullYear());
        }
    };
}
export function computeGanttScale(startMs, endMs, locale) {
    const end = endMs > startMs ? endMs : startMs + DAY_MS;
    const unit = pickUnit((end - startMs) / DAY_MS);
    const boundaries = [];
    const min = snapToUnit(startMs, unit);
    for (let i = 0, t = min;; i += 1, t = addUnit(min, unit, i)) {
        boundaries.push(t);
        if (t >= end)
            break;
    }
    const max = boundaries[boundaries.length - 1];
    const step = Math.max(1, Math.ceil(boundaries.length / MAX_LABELED_TICKS));
    const label = makeLabeler(unit, locale);
    const ticks = boundaries
        .filter((_, i) => i % step === 0)
        .map((ms, i) => ({ ms, label: label(ms, i) }));
    return { min, max, unit, ticks };
}
