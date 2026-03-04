import { describe, expect, it } from 'vitest';
import { parseNetAmount } from './upload.parsing';

describe('parseNetAmount', () => {
    it('returns 0 for nullish/empty values', () => {
        expect(parseNetAmount(null)).toBe(0);
        expect(parseNetAmount(undefined)).toBe(0);
        expect(parseNetAmount('')).toBe(0);
    });

    it('parses plain numbers', () => {
        expect(parseNetAmount('12345')).toBe(12345);
        expect(parseNetAmount(9876)).toBe(9876);
    });

    it('handles french thousands with spaces', () => {
        expect(parseNetAmount('12 345')).toBe(12345);
    });

    it('handles comma as decimal when no dot is present', () => {
        expect(parseNetAmount('123,45')).toBe(123.45);
    });

    it('handles comma as thousands separator when dot exists', () => {
        expect(parseNetAmount('1,234.56')).toBe(1234.56);
    });

    it('strips currency symbols and non numeric chars', () => {
        expect(parseNetAmount('DJF 45 000')).toBe(45000);
    });

    it('returns 0 on non parsable values', () => {
        expect(parseNetAmount('abc')).toBe(0);
    });
});
