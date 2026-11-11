// Shared data types for the site and the draw scripts (formats in docs/SPEC.md §4).

/** One calendar box, from `data/lots.json`: only what the draw needs, public from the start. */
export interface Lot {
	day: number;
	winners: number;
}

/** What a box holds. Private (PRIZES_JSON_B64 secret) until the eve of its day (docs/SPEC.md §4). */
export interface Prize {
	day: number;
	title: string;
	description: string;
}

/** Published commitment, from `data/commitment.json`. */
export interface Commitment {
	edition: string;
	participantCount: number;
	listSha256: string;
	drand: {
		network: 'quicknet';
		chainHash: string;
	};
	drawTime: string;
	timezone: 'Europe/Paris';
	publishedAt: string;
}

/** A winner as published: numeric id and display name only. */
export interface Winner {
	id: number;
	display: string;
}

/** Result of one day's draw. */
export interface DayResult {
	day: number;
	drandRound: number;
	randomness: string;
	seed: string;
	candidateCount: number;
	winners: Winner[];
	drawnAt: string;
}

/** `data/results.json`, keyed by date `YYYY-MM-DD` (Europe/Paris). */
export type Results = Record<string, DayResult>;
