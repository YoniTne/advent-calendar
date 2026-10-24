import { describe, expect, it } from 'vitest';
import { boxState, countdown, prizeShownAt, revealAt, todayOf } from './calendar';
import type { DayResult, Results } from './types';

const at = (iso: string) => Date.parse(iso);
const result = { day: 5, winners: [{ id: 1, display: 'Ada L.' }] } as DayResult;
const results: Results = { '2026-12-05': result };

describe('reveal times (Paris = UTC+1 in winter)', () => {
	it('shows the prize the day before at 18:00, day 1 on November 30', () => {
		expect(prizeShownAt(2026, 1)).toBe(at('2026-11-30T17:00:00Z'));
		expect(prizeShownAt(2026, 5)).toBe(at('2026-12-04T17:00:00Z'));
	});

	it('shows winners at 08:00', () => {
		expect(revealAt(2026, 5)).toBe(at('2026-12-05T07:00:00Z'));
	});
});

describe('boxState', () => {
	it('is locked before 18:00 the day before', () => {
		expect(boxState(2026, 5, results, at('2026-12-04T16:59:59Z')).kind).toBe('locked');
	});

	it('is announced from 18:00 the day before until 08:00, even if the result is already deployed', () => {
		expect(boxState(2026, 5, results, at('2026-12-04T17:00:00Z')).kind).toBe('announced');
		expect(boxState(2026, 5, results, at('2026-12-05T06:59:59Z'))).toEqual({
			kind: 'announced',
			revealAt: at('2026-12-05T07:00:00Z')
		});
	});

	it('is revealed from 08:00 when the result is there', () => {
		expect(boxState(2026, 5, results, at('2026-12-05T07:00:00Z'))).toEqual({ kind: 'revealed', result });
	});

	it('is drawing after 08:00 while the result is not deployed yet', () => {
		expect(boxState(2026, 6, results, at('2026-12-06T07:05:00Z')).kind).toBe('drawing');
	});
});

describe('todayOf', () => {
	it('uses the Paris date', () => {
		expect(todayOf(2026, at('2026-11-30T23:30:00Z'))).toBe(1);
		expect(todayOf(2026, at('2026-11-30T22:59:59Z'))).toBeNull();
	});

	it('is null after the 24th and in another year', () => {
		expect(todayOf(2026, at('2026-12-25T10:00:00Z'))).toBeNull();
		expect(todayOf(2025, at('2026-12-05T10:00:00Z'))).toBeNull();
	});
});

describe('countdown', () => {
	it('formats hours, minutes, seconds and days', () => {
		expect(countdown(at('2026-12-05T07:00:00Z'), at('2026-12-05T05:58:57Z'))).toBe('01:01:03');
		expect(countdown(at('2026-12-05T07:00:00Z'), at('2026-12-03T07:00:00Z'))).toBe('2 j 00:00:00');
	});

	it('never goes negative', () => {
		expect(countdown(0, 1000)).toBe('00:00:00');
	});
});
