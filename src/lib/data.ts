// Public data files, bundled at build time.
import commitmentJson from '../../data/commitment.json';
import lotsJson from '../../data/lots.json';
import resultsJson from '../../data/results.json';
import { validateLots } from './lots';
import type { Commitment, Results } from './types';

export const lots = validateLots(lotsJson);
export const results = resultsJson as Results;
export const commitment = commitmentJson as Commitment;

/** Year of the edition shown (2025 while the simulation data is in place). */
export const editionYear = Number(commitment.publishedAt.slice(0, 4));

export const REPOSITORY_URL = 'https://github.com/YoniTne/advent-calendar';
