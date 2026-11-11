// Public data files, bundled at build time.
import commitmentJson from '../../data/commitment.json';
import lotsJson from '../../data/lots.json';
import resultsJson from '../../data/results.json';
import { validateLots } from './lots';
import type { Commitment, Lot, Prize, Results } from './types';

/** Prize texts this build may show, injected by vite.config.ts: a deployed build never holds the hidden ones. */
declare const __PRIZES__: Prize[];

export const lots: (Lot & Partial<Prize>)[] = validateLots(lotsJson).map((lot) => ({
	...lot,
	...__PRIZES__.find((prize) => prize.day === lot.day)
}));
export const results = resultsJson as Results;
export const commitment = commitmentJson as Commitment;

/** Year of the edition shown. */
export const editionYear = Number(commitment.publishedAt.slice(0, 4));

export const REPOSITORY_URL = 'https://github.com/YoniTne/advent-calendar';
export const CONTACT_EMAIL = 'clubelec.insset@gmail.com';
