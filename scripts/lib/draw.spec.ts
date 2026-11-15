// Mandatory tests from docs/DRAW.md §9 (hash mismatch: participants.spec.ts, DST rounds: drand.spec.ts).
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import lotsJson from '../../data/lots.json';
import type { Lot, Results } from '../../src/lib/types';
import beacon from '../../tests/fixtures/drand/quicknet-23922712.json';
import { roundForDate, type Beacon } from './drand';
import { candidatesFor, computeSeed, drawDay, pickWinners, runDraws, verifyResults, type RunContext } from './draw';

const lots = lotsJson as Lot[];

/** Generated fake participants: display names are just unique labels. */
const fakeNames = (count: number) => new Map(Array.from({ length: count }, (_, i) => [i + 1, `P${i + 1} F.`]));

/** Deterministic fake beacons, valid for the draw logic (signatures are checked in drand.spec.ts). */
const fakeBeacon = async (round: number): Promise<Beacon> => ({
	round,
	randomness: createHash('sha256').update(`fake-${round}`).digest('hex'),
	signature: ''
});

const context = (participantCount: number, overrides: Partial<RunContext> = {}): RunContext => ({
	lots,
	participantCount,
	names: fakeNames(participantCount),
	getBeacon: fakeBeacon,
	now: () => '2025-12-24T06:46:00.000Z',
	log: () => {},
	...overrides
});

describe('frozen test vector (real drand round, expected values computed independently)', () => {
	it('computes the seed of 2025-12-01', () => {
		expect(computeSeed('2025-12-01', beacon.randomness).toString('hex')).toBe(
			'2f9cbc63c3d7ed99c612390126f986e56545af5801487ea8f8738f06286300ff'
		);
	});

	it('draws the expected winners', () => {
		const lots3 = lots.map((lot) => (lot.day === 1 ? { ...lot, winners: 3 } : lot));
		const result = drawDay({
			date: '2025-12-01',
			beacon,
			lots: lots3,
			results: {},
			participantCount: 50,
			names: fakeNames(50),
			drawnAt: 'x'
		});
		expect(result).toEqual({
			day: 1,
			drandRound: 23922712,
			randomness: beacon.randomness,
			seed: '2f9cbc63c3d7ed99c612390126f986e56545af5801487ea8f8738f06286300ff',
			candidateCount: 50,
			winners: [
				{ id: 26, display: 'P26 F.' },
				{ id: 4, display: 'P4 F.' },
				{ id: 8, display: 'P8 F.' }
			],
			drawnAt: 'x'
		});
	});

	it('rejects a beacon from another round', () => {
		const args = { lots, results: {}, participantCount: 50, names: fakeNames(50), drawnAt: 'x' };
		expect(() => drawDay({ date: '2025-12-02', beacon, ...args })).toThrow(/round/);
	});
});

describe('determinism', () => {
	it('gives the same results twice', async () => {
		const first = await runDraws('2025-12-24', {}, context(100));
		const second = await runDraws('2025-12-24', {}, context(100));
		expect(second).toEqual(first);
	});
});

describe('24 days', () => {
	it('never lets anyone win twice', async () => {
		const results = await runDraws('2025-12-24', {}, context(100));
		const ids = Object.values(results).flatMap((r) => r.winners.map((w) => w.id));
		expect(Object.keys(results)).toHaveLength(24);
		expect(ids).toHaveLength(lots.reduce((sum, lot) => sum + lot.winners, 0));
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('gives everything left when candidates run out', async () => {
		const results = await runDraws('2025-12-24', {}, context(10));
		const ids = Object.values(results).flatMap((r) => r.winners.map((w) => w.id));
		expect(new Set(ids).size).toBe(10);
		expect(results['2025-12-24'].winners).toEqual([]);
	});
});

describe('published results', () => {
	it('are recomputed, kept as is, and missing days are caught up', async () => {
		const partial = await runDraws('2025-12-02', {}, context(50, { now: () => 'first run' }));
		const full = await runDraws('2025-12-05', partial, context(50, { now: () => 'second run' }));
		expect(full['2025-12-01']).toEqual(partial['2025-12-01']);
		expect(full['2025-12-05'].drawnAt).toBe('second run');
		expect(Object.keys(full)).toHaveLength(5);
	});

	it('cause a failure when a winner was modified', async () => {
		const results = await runDraws('2025-12-03', {}, context(50));
		const tampered: Results = structuredClone(results);
		tampered['2025-12-02'].winners[0].id = tampered['2025-12-02'].winners[0].id === 1 ? 2 : 1;
		await expect(runDraws('2025-12-03', tampered, context(50))).rejects.toThrow(/2025-12-02.*differs/);
	});

	it('cause a failure when the randomness was modified', async () => {
		const results = await runDraws('2025-12-01', {}, context(50));
		results['2025-12-01'].randomness = '00'.repeat(32);
		await expect(runDraws('2025-12-01', results, context(50))).rejects.toThrow(/differs/);
	});
});

describe('verify mode', () => {
	it('passes on untouched results, with or without the list', async () => {
		const results = await runDraws('2025-12-10', {}, context(50));
		const base = { lots, getBeacon: fakeBeacon, log: () => {} };
		expect(await verifyResults(results, base)).toEqual([]);
		expect(await verifyResults(results, { ...base, list: { participantCount: 50, names: fakeNames(50) } })).toEqual([]);
	});

	it('reports a wrong seed without the list, and wrong winners with it', async () => {
		const results = await runDraws('2025-12-03', {}, context(50));
		const base = { lots, getBeacon: fakeBeacon, log: () => {} };
		const badSeed = structuredClone(results);
		badSeed['2025-12-02'].seed = '00'.repeat(32);
		expect(await verifyResults(badSeed, base)).toEqual(['2025-12-02: seed mismatch']);

		const badWinner = structuredClone(results);
		badWinner['2025-12-03'].candidateCount += 1;
		expect(await verifyResults(badWinner, base)).toEqual([]);
		const list = { participantCount: 50, names: fakeNames(50) };
		expect(await verifyResults(badWinner, { ...base, list })).toEqual([
			'2025-12-03: winners or candidate count mismatch'
		]);
	});
});

describe('building blocks', () => {
	it('excludes only winners of strictly earlier days', () => {
		const results = {
			'2025-12-01': { winners: [{ id: 2 }] },
			'2025-12-02': { winners: [{ id: 4 }] }
		} as unknown as Results;
		expect(candidatesFor(5, results, '2025-12-02')).toEqual([1, 3, 4, 5]);
	});

	it('draws each candidate once when prizes equal candidates', () => {
		const seed = computeSeed('2025-12-01', beacon.randomness);
		expect(pickWinners(seed, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 10).sort((a, b) => a - b)).toEqual([
			1, 2, 3, 4, 5, 6, 7, 8, 9, 10
		]);
	});

	it('maps calendar days to the right rounds', () => {
		expect(roundForDate('2025-12-01')).toBe(beacon.round);
	});
});
