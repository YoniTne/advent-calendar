import { describe, expect, it } from 'vitest';
import lotsJson from '../../data/lots.json';
import { validateLots } from './lots';

const valid = () => structuredClone(lotsJson) as Record<string, unknown>[];

describe('data/lots.json', () => {
	it('is valid', () => {
		expect(validateLots(lotsJson)).toHaveLength(24);
	});
});

describe('validateLots', () => {
	it('rejects a wrong number of entries', () => {
		expect(() => validateLots(valid().slice(1))).toThrow(/24 entries/);
	});

	it('rejects a duplicate day', () => {
		const lots = valid();
		lots[1].day = 1;
		expect(() => validateLots(lots)).toThrow(/duplicate day/);
	});

	it('rejects a day out of range', () => {
		const lots = valid();
		lots[0].day = 25;
		expect(() => validateLots(lots)).toThrow(/day must be/);
	});

	it('rejects zero winners', () => {
		const lots = valid();
		lots[0].winners = 0;
		expect(() => validateLots(lots)).toThrow(/winners/);
	});

	it('rejects an empty title', () => {
		const lots = valid();
		lots[0].title = ' ';
		expect(() => validateLots(lots)).toThrow(/title/);
	});
});
