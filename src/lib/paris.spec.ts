import { describe, expect, it } from 'vitest';
import { parisDate, parisToUnix, parseDate } from './paris';

const utc = (iso: string) => Date.parse(iso) / 1000;

describe('parisToUnix', () => {
	it('uses UTC+1 in winter', () => {
		expect(parisToUnix('2026-12-01', '07:45:00')).toBe(utc('2026-12-01T06:45:00Z'));
	});

	it('handles the switch to summer time (2026-03-29)', () => {
		expect(parisToUnix('2026-03-28', '07:45:00')).toBe(utc('2026-03-28T06:45:00Z'));
		expect(parisToUnix('2026-03-29', '07:45:00')).toBe(utc('2026-03-29T05:45:00Z'));
	});

	it('handles the switch to winter time (2026-10-25)', () => {
		expect(parisToUnix('2026-10-24', '07:45:00')).toBe(utc('2026-10-24T05:45:00Z'));
		expect(parisToUnix('2026-10-25', '07:45:00')).toBe(utc('2026-10-25T06:45:00Z'));
	});
});

describe('parisDate', () => {
	it('returns the Paris date, not the UTC one', () => {
		expect(parisDate(Date.parse('2026-12-01T23:30:00Z'))).toBe('2026-12-02');
		expect(parisDate(Date.parse('2026-12-01T22:59:59Z'))).toBe('2026-12-01');
	});
});

describe('parseDate', () => {
	it('rejects malformed or impossible dates', () => {
		expect(() => parseDate('2026-12-1')).toThrow();
		expect(() => parseDate('2026-02-30')).toThrow();
	});
});
