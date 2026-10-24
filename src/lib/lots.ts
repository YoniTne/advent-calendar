import type { Lot } from './types';

export const DAY_COUNT = 24;

/** Checks the shape of `data/lots.json` (docs/SPEC.md §4) and returns it typed; throws on the first problem. */
export function validateLots(data: unknown): Lot[] {
	if (!Array.isArray(data)) throw new Error('lots: expected an array');
	if (data.length !== DAY_COUNT) throw new Error(`lots: expected ${DAY_COUNT} entries, got ${data.length}`);

	const seen = new Set<number>();
	for (const [index, lot] of data.entries()) {
		const where = `lots[${index}]`;
		if (typeof lot !== 'object' || lot === null) throw new Error(`${where}: expected an object`);
		const { day, title, description, image, winners } = lot as Record<string, unknown>;
		if (!Number.isInteger(day) || (day as number) < 1 || (day as number) > DAY_COUNT)
			throw new Error(`${where}: day must be an integer from 1 to ${DAY_COUNT}`);
		if (seen.has(day as number)) throw new Error(`${where}: duplicate day ${day}`);
		seen.add(day as number);
		for (const [key, value] of Object.entries({ title, description, image }))
			if (typeof value !== 'string' || value.trim() === '') throw new Error(`${where}: ${key} must be a non-empty string`);
		if (!Number.isInteger(winners) || (winners as number) < 1) throw new Error(`${where}: winners must be an integer ≥ 1`);
	}
	return data as Lot[];
}

/** The lot of a given day; throws if missing. */
export function lotForDay(lots: Lot[], day: number): Lot {
	const lot = lots.find((l) => l.day === day);
	if (!lot) throw new Error(`no lot for day ${day}`);
	return lot;
}
