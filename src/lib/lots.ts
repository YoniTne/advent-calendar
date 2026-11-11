import type { Lot, Prize } from './types.ts';

export const DAY_COUNT = 24;

/** Checks that `data` is 24 objects with unique days 1–24; throws on the first problem. */
function dayEntries(data: unknown, name: string): Record<string, unknown>[] {
	if (!Array.isArray(data)) throw new Error(`${name}: expected an array`);
	if (data.length !== DAY_COUNT) throw new Error(`${name}: expected ${DAY_COUNT} entries, got ${data.length}`);

	const seen = new Set<number>();
	for (const [index, entry] of data.entries()) {
		const where = `${name}[${index}]`;
		if (typeof entry !== 'object' || entry === null) throw new Error(`${where}: expected an object`);
		const { day } = entry as Record<string, unknown>;
		if (!Number.isInteger(day) || (day as number) < 1 || (day as number) > DAY_COUNT)
			throw new Error(`${where}: day must be an integer from 1 to ${DAY_COUNT}`);
		if (seen.has(day as number)) throw new Error(`${where}: duplicate day ${day}`);
		seen.add(day as number);
	}
	return data;
}

/** Checks the shape of `data/lots.json` (docs/SPEC.md §4) and returns it typed; throws on the first problem. */
export function validateLots(data: unknown): Lot[] {
	for (const [index, { winners }] of dayEntries(data, 'lots').entries())
		if (!Number.isInteger(winners) || (winners as number) < 1)
			throw new Error(`lots[${index}]: winners must be an integer ≥ 1`);
	return data as Lot[];
}

/** Checks the shape of the private prize list (docs/SPEC.md §4) and returns it typed; throws on the first problem. */
export function validatePrizes(data: unknown): Prize[] {
	for (const [index, { title, description }] of dayEntries(data, 'prizes').entries())
		for (const [key, value] of Object.entries({ title, description }))
			if (typeof value !== 'string' || value.trim() === '')
				throw new Error(`prizes[${index}]: ${key} must be a non-empty string`);
	return data as Prize[];
}

/** The lot of a given day; throws if missing. */
export function lotForDay(lots: Lot[], day: number): Lot {
	const lot = lots.find((l) => l.day === day);
	if (!lot) throw new Error(`no lot for day ${day}`);
	return lot;
}
