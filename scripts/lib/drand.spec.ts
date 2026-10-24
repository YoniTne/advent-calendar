import { describe, expect, it } from 'vitest';
import beacon from '../../tests/fixtures/drand/quicknet-23922712.json';
import { getBeacon, roundForDate, verifyBeacon } from './drand';

// Real quicknet beacon for 2025-12-01 07:45 Paris, recorded from api.drand.sh.
const ROUND = 23922712;

const quiet = () => {};
const json = (status: number, body: unknown = {}) =>
	new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('roundForDate', () => {
	it('maps a date to the round of 07:45 Paris time', () => {
		expect(roundForDate('2025-12-01')).toBe(ROUND);
	});

	it('follows the DST switch', () => {
		// One day apart, but only 23 hours between 07:45 on 03-28 and 07:45 on 03-29.
		expect(roundForDate('2026-03-29') - roundForDate('2026-03-28')).toBe((23 * 3600) / 3);
		expect(roundForDate('2026-10-25') - roundForDate('2026-10-24')).toBe((25 * 3600) / 3);
	});
});

describe('verifyBeacon', () => {
	it('accepts a real beacon', async () => {
		await expect(verifyBeacon(beacon, ROUND)).resolves.toEqual(beacon);
	});

	it('rejects the wrong round', async () => {
		await expect(verifyBeacon(beacon, ROUND + 1)).rejects.toThrow();
	});

	it('rejects tampered randomness', async () => {
		await expect(verifyBeacon({ ...beacon, randomness: '00'.repeat(32) }, ROUND)).rejects.toThrow();
	});

	it('rejects a forged signature', async () => {
		const signature = beacon.signature.slice(0, -2) + (beacon.signature.endsWith('00') ? '01' : '00');
		await expect(verifyBeacon({ ...beacon, signature }, ROUND)).rejects.toThrow();
	});
});

describe('getBeacon', () => {
	it('falls back to the next relay', async () => {
		const urls: string[] = [];
		const fetch = async (url: string | URL | Request) => {
			urls.push(String(url));
			return urls.length === 1 ? json(500) : json(200, beacon);
		};
		await expect(getBeacon(ROUND, { fetch: fetch as typeof globalThis.fetch, log: quiet })).resolves.toEqual(beacon);
		expect(urls[1]).toMatch(/^https:\/\/api2\.drand\.sh\//);
	});

	it('retries while the round is not published, then gives up', async () => {
		let calls = 0;
		const fetch = async () => (calls++, json(425));
		await expect(
			getBeacon(ROUND, { fetch: fetch as typeof globalThis.fetch, attempts: 2, delayMs: 0, log: quiet })
		).rejects.toThrow(/unavailable/);
		expect(calls).toBe(8);
	});

	it('stops on an invalid beacon instead of trying another relay', async () => {
		const fetch = async () => json(200, { ...beacon, randomness: '00'.repeat(32) });
		await expect(getBeacon(ROUND, { fetch: fetch as typeof globalThis.fetch, log: quiet })).rejects.toThrow();
	});
});
