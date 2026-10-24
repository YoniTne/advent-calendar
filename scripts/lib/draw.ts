// Draw engine, implementing docs/DRAW.md §4–§8. Pure functions: randomness and clock come from the caller.
import { createHash } from 'node:crypto';
import { lotForDay, DAY_COUNT } from '../../src/lib/lots';
import { parseDate } from '../../src/lib/paris';
import type { Commitment, DayResult, Lot, Results } from '../../src/lib/types';
import { DRAW_TIME, QUICKNET, roundForDate, type Beacon } from './drand';

export const EDITION = 'advent-insset-2026';

const sha256 = (...parts: (Uint8Array | string)[]) => {
	const hash = createHash('sha256');
	for (const part of parts) hash.update(part);
	return hash.digest();
};

/** Rejects a commitment that does not describe this edition's draw parameters. */
export function checkCommitment(commitment: Commitment): void {
	const problems = [
		commitment.edition !== EDITION && `edition must be ${EDITION}`,
		!/^[0-9a-f]{64}$/.test(commitment.listSha256) && 'listSha256 must be 64 lowercase hex characters',
		!(Number.isInteger(commitment.participantCount) && commitment.participantCount > 0) &&
			'participantCount must be a positive integer',
		commitment.drand?.chainHash !== QUICKNET.hash && 'drand.chainHash must be the quicknet chain hash',
		commitment.drawTime !== DRAW_TIME && `drawTime must be ${DRAW_TIME}`,
		commitment.timezone !== 'Europe/Paris' && 'timezone must be Europe/Paris'
	].filter(Boolean);
	if (problems.length > 0) throw new Error(`invalid commitment: ${problems.join('; ')}`);
}

/** Calendar day (1–24) of a December date, or null outside the calendar. */
export function calendarDay(date: string): number | null {
	const [, month, day] = parseDate(date);
	return month === 12 && day <= DAY_COUNT ? day : null;
}

/** `YYYY-12-DD` for each calendar day from the 1st up to `date`'s day, in order. */
export function calendarDatesUpTo(date: string): string[] {
	const [year] = parseDate(date);
	const last = calendarDay(date);
	if (last === null) throw new Error(`${date} is not a calendar day`);
	return Array.from({ length: last }, (_, i) => `${year}-12-${String(i + 1).padStart(2, '0')}`);
}

/** §4: seed = SHA-256(UTF-8("advent-insset-2026|" + D + "|" + randomness)). */
export function computeSeed(date: string, randomness: string): Buffer {
	return sha256(`${EDITION}|${date}|${randomness}`);
}

/** §5: ids 1..N minus the winners of days strictly before `date`, ascending. */
export function candidatesFor(participantCount: number, results: Results, date: string): number[] {
	const excluded = new Set(
		Object.entries(results)
			.filter(([day]) => day < date)
			.flatMap(([, result]) => result.winners.map((w) => w.id))
	);
	return Array.from({ length: participantCount }, (_, i) => i + 1).filter((id) => !excluded.has(id));
}

/** §6: draws up to `count` winners; everyone left wins if there are fewer candidates. */
export function pickWinners(seed: Uint8Array, candidates: number[], count: number): number[] {
	const remaining = [...candidates];
	const winners: number[] = [];
	for (let k = 1; k <= count && remaining.length > 0; k++) {
		const h = BigInt('0x' + sha256(seed, `:${k}`).toString('hex'));
		const i = Number(h % BigInt(remaining.length));
		winners.push(remaining.splice(i, 1)[0]);
	}
	return winners;
}

export interface DrawInput {
	date: string;
	beacon: Beacon;
	lots: Lot[];
	results: Results;
	participantCount: number;
	names: Map<number, string>;
	drawnAt: string;
}

/** Full draw for one day (§4–§7). */
export function drawDay({ date, beacon, lots, results, participantCount, names, drawnAt }: DrawInput): DayResult {
	const day = calendarDay(date);
	if (day === null) throw new Error(`${date} is not a calendar day`);
	if (beacon.round !== roundForDate(date)) throw new Error(`${date}: beacon round ${beacon.round} is not the round of the day`);
	const seed = computeSeed(date, beacon.randomness);
	const candidates = candidatesFor(participantCount, results, date);
	const winners = pickWinners(seed, candidates, lotForDay(lots, day).winners);
	return {
		day,
		drandRound: beacon.round,
		randomness: beacon.randomness,
		seed: seed.toString('hex'),
		candidateCount: candidates.length,
		winners: winners.map((id) => {
			const display = names.get(id);
			if (!display) throw new Error(`no display name for id ${id}`);
			return { id, display };
		}),
		drawnAt
	};
}

/** Everything except `drawnAt`, which is when the run happened, not part of the draw. */
const drawFields = ({ drawnAt: _, ...rest }: DayResult) => JSON.stringify(rest);

export interface RunContext {
	lots: Lot[];
	participantCount: number;
	names: Map<number, string>;
	getBeacon: (round: number) => Promise<Beacon>;
	now: () => string;
	log: (message: string) => void;
}

const describe = (date: string, r: DayResult) =>
	`${date} (day ${r.day}): round ${r.drandRound}, ${r.candidateCount} candidates, winners: ${r.winners
		.map((w) => `#${w.id} ${w.display}`)
		.join(', ')}`;

/**
 * §8: walks every calendar day up to `target` in order. Missing days are drawn (catch-up);
 * published days are recomputed and must match exactly — they are never overwritten.
 * Returns a new results object.
 */
export async function runDraws(target: string, published: Results, ctx: RunContext): Promise<Results> {
	const results: Results = { ...published };
	for (const date of calendarDatesUpTo(target)) {
		const beacon = await ctx.getBeacon(roundForDate(date));
		const existing = results[date];
		const fresh = drawDay({ date, beacon, results, drawnAt: existing?.drawnAt ?? ctx.now(), ...ctx });
		if (existing) {
			if (drawFields(existing) !== drawFields(fresh))
				throw new Error(`${date}: published result differs from the recomputed draw — refusing to continue`);
			ctx.log(`${date}: already published, recomputed and identical`);
			continue;
		}
		const lot = lotForDay(ctx.lots, fresh.day);
		if (fresh.winners.length < lot.winners)
			ctx.log(`${date}: only ${fresh.winners.length} candidates left for ${lot.winners} prizes, all of them win`);
		results[date] = fresh;
		ctx.log(describe(date, fresh));
	}
	return results;
}

export interface VerifyContext extends Omit<RunContext, 'names' | 'participantCount' | 'now'> {
	/** Present only when the private list is available: winners are then checked too. */
	list?: { participantCount: number; names: Map<number, string> };
}

/** §8 verify mode: returns the list of problems found (empty when everything checks out). */
export async function verifyResults(published: Results, ctx: VerifyContext): Promise<string[]> {
	const problems: string[] = [];
	for (const date of Object.keys(published).sort()) {
		const result = published[date];
		try {
			if (calendarDay(date) !== result.day) throw new Error(`day ${result.day} does not match the date`);
			if (result.drandRound !== roundForDate(date))
				throw new Error(`round ${result.drandRound}, expected ${roundForDate(date)}`);
			const beacon = await ctx.getBeacon(result.drandRound);
			if (beacon.randomness !== result.randomness) throw new Error('randomness differs from drand');
			if (computeSeed(date, beacon.randomness).toString('hex') !== result.seed) throw new Error('seed mismatch');
			if (ctx.list) {
				const fresh = drawDay({ date, beacon, lots: ctx.lots, results: published, drawnAt: result.drawnAt, ...ctx.list });
				if (drawFields(fresh) !== drawFields(result)) throw new Error('winners or candidate count mismatch');
			}
			ctx.log(`${date}: OK`);
		} catch (error) {
			problems.push(`${date}: ${(error as Error).message}`);
		}
	}
	return problems;
}
