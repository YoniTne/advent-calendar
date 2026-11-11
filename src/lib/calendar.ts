// What the site shows for each box at a given instant (docs/SPEC.md §7), always in Paris time.
import { DAY_COUNT } from './lots.ts';
import { parisDate, parisToUnix } from './paris.ts';
import type { DayResult, Prize, Results } from './types.ts';

/** The prize of day D is shown on day D−1 at this time. */
export const PRIZE_TIME = '18:00:00';
/** Winners are shown at this time on day D. */
export const REVEAL_TIME = '08:00:00';

const pad = (n: number) => String(n).padStart(2, '0');

export const dateOfDay = (year: number, day: number) => `${year}-12-${pad(day)}`;

/** Instant (ms) the prize of `day` appears: the day before at 18:00 (November 30 for day 1). */
export function prizeShownAt(year: number, day: number): number {
	const eve = day === 1 ? `${year}-11-30` : dateOfDay(year, day - 1);
	return parisToUnix(eve, PRIZE_TIME) * 1000;
}

/** The prizes already shown at `now`: the only ones a deployed build may contain. */
export const prizesShownBy = (prizes: Prize[], year: number, now: number) =>
	prizes.filter((prize) => prizeShownAt(year, prize.day) <= now);

/** Instant (ms) the winners of `day` appear. */
export const revealAt = (year: number, day: number) => parisToUnix(dateOfDay(year, day), REVEAL_TIME) * 1000;

export type BoxState =
	| { kind: 'locked' }
	| { kind: 'announced'; revealAt: number }
	| { kind: 'drawing' }
	| { kind: 'revealed'; result: DayResult };

export function boxState(year: number, day: number, results: Results, now: number): BoxState {
	if (now < prizeShownAt(year, day)) return { kind: 'locked' };
	const reveal = revealAt(year, day);
	if (now < reveal) return { kind: 'announced', revealAt: reveal };
	const result = results[dateOfDay(year, day)];
	return result ? { kind: 'revealed', result } : { kind: 'drawing' };
}

/** Calendar day (1–24) of the edition at `now`, or null outside December 1–24 of `year`. */
export function todayOf(year: number, now: number): number | null {
	const [y, m, d] = parisDate(now).split('-').map(Number);
	return y === year && m === 12 && d <= DAY_COUNT ? d : null;
}

/** `HH:MM:SS` (or `J j HH:MM:SS` beyond a day) until `target`, never negative. */
export function countdown(target: number, now: number): string {
	const total = Math.max(0, Math.floor((target - now) / 1000));
	const days = Math.floor(total / 86_400);
	const clock = [Math.floor(total / 3600) % 24, Math.floor(total / 60) % 60, total % 60].map(pad).join(':');
	return days > 0 ? `${days} j ${clock}` : clock;
}
