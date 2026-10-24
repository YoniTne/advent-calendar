// drand quicknet client (docs/DRAW.md §3).
import { fetchBeacon, type ChainClient, type ChainInfo } from 'drand-client';
import { parisToUnix } from '../../src/lib/paris';

/** Pinned network parameters: relays are never trusted for the chain info or public key. */
export const QUICKNET: ChainInfo = {
	public_key:
		'83cf0f2896adee7eb8b5f01fcad3912212c437e0073e911fb90022d3e760183c8c4b450b6a0a6c3ac6a5776a2d1064510d1fec758c921cc22b0e17e63aaf4bcb5ed66304de9cf809bd274ca73bab4af5a6e9c76a4bc09e76eae8991ef5ece45a',
	period: 3,
	genesis_time: 1692803367,
	hash: '52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971',
	groupHash: 'f477d5c89f21a17c863a7f937c6a6d15859414d2be09cd448d4279af331c5d3e',
	schemeID: 'bls-unchained-g1-rfc9380',
	metadata: { beaconID: 'quicknet' }
};

export const RELAYS = [
	'https://api.drand.sh',
	'https://api2.drand.sh',
	'https://api3.drand.sh',
	'https://drand.cloudflare.com'
];

export const DRAW_TIME = '07:45:00';

export interface Beacon {
	round: number;
	randomness: string;
	signature: string;
}

/** Unix time (seconds) of the draw for `date`: 07:45 Paris time. */
export function drawInstant(date: string): number {
	return parisToUnix(date, DRAW_TIME);
}

/** The quicknet round whose randomness is used for `date`. */
export function roundForDate(date: string): number {
	return Math.floor((drawInstant(date) - QUICKNET.genesis_time) / QUICKNET.period) + 1;
}

/**
 * Checks round, randomness = SHA-256(signature) and the BLS signature against the pinned key,
 * using the official drand-client verification. Throws if anything is wrong.
 */
export async function verifyBeacon(beacon: unknown, round: number): Promise<Beacon> {
	const chain = { baseUrl: '', info: async () => QUICKNET };
	const client: ChainClient = {
		options: { disableBeaconVerification: false, noCache: true },
		chain: () => chain,
		get: async () => beacon as Beacon,
		latest: async () => beacon as Beacon
	};
	const verified = await fetchBeacon(client, round);
	return { round: verified.round, randomness: verified.randomness, signature: verified.signature };
}

export interface FetchOptions {
	attempts?: number;
	delayMs?: number;
	fetch?: typeof fetch;
	log?: (message: string) => void;
}

/**
 * Fetches and verifies `round`, trying each relay in order and retrying while the round is not published yet.
 * A beacon that fails verification stops everything immediately.
 */
export async function getBeacon(round: number, options: FetchOptions = {}): Promise<Beacon> {
	const { attempts = 10, delayMs = 15_000, fetch: get = fetch, log = console.log } = options;
	for (let attempt = 1; attempt <= attempts; attempt++) {
		for (const relay of RELAYS) {
			let body: unknown;
			try {
				const response = await get(`${relay}/${QUICKNET.hash}/public/${round}`);
				if (!response.ok) {
					log(`drand: ${relay} answered ${response.status} for round ${round}`);
					continue;
				}
				body = await response.json();
			} catch (error) {
				log(`drand: ${relay} unreachable (${(error as Error).message})`);
				continue;
			}
			return verifyBeacon(body, round);
		}
		if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, delayMs));
	}
	throw new Error(`drand: round ${round} unavailable on every relay after ${attempts} attempts`);
}
