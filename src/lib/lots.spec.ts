import { describe, expect, it } from 'vitest';
import lotsJson from '../../data/lots.json';
import prizesJson from '../../data/prizes.example.json';
import { validateLots, validatePrizes } from './lots';

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

});

describe('validatePrizes', () => {
	it('accepts the example prizes', () => {
		expect(validatePrizes(prizesJson)).toHaveLength(24);
	});

	it('rejects an empty title', () => {
		const prizes = structuredClone(prizesJson);
		prizes[0].title = ' ';
		expect(() => validatePrizes(prizes)).toThrow(/title/);
	});
});
