export function parseNetAmount(value: unknown): number {
    if (value === null || value === undefined || value === '') return 0;

    const asString = String(value)
        .replace(/\s+/g, '')
        .replace(/[^\d,.-]/g, '');

    if (!asString) return 0;

    let normalized = asString;
    if (normalized.includes(',') && !normalized.includes('.')) {
        normalized = normalized.replace(',', '.');
    } else {
        normalized = normalized.replace(/,/g, '');
    }

    const parsed = Number.parseFloat(normalized);
    return Number.isNaN(parsed) ? 0 : parsed;
}
