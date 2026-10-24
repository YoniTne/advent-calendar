import { describe, expect, it } from 'vitest';
import type { Commitment } from '../../src/lib/types';
import { toCsv } from './csv';
import { displayNames, PARTICIPANTS_HEADER, readParticipants, sha256Hex, type Participant } from './participants';

const person = (id: number, prenom: string, nom: string): Participant => ({
	id,
	prenom,
	nom,
	email: `user${id}@example.test`
});

const encode = (rows: string[][]) => new TextEncoder().encode(toCsv(rows));
const rowsOf = (people: Participant[]) => [
	PARTICIPANTS_HEADER,
	...people.map((p) => [String(p.id), p.prenom, p.nom, p.email])
];
const commitmentFor = (bytes: Uint8Array, participantCount: number) =>
	({ listSha256: sha256Hex(bytes), participantCount }) as Commitment;

describe('readParticipants', () => {
	const people = [person(1, 'Ada', 'Lovelace'), person(2, 'Alan', 'Turing')];

	it('reads a list matching the commitment', () => {
		const bytes = encode(rowsOf(people));
		expect(readParticipants(bytes, commitmentFor(bytes, 2))).toEqual(people);
	});

	it('fails when the hash does not match', () => {
		const bytes = encode(rowsOf(people));
		const commitment = commitmentFor(bytes, 2);
		bytes[bytes.length - 2] ^= 1;
		expect(() => readParticipants(bytes, commitment)).toThrow(/hash/);
	});

	it('fails when the count does not match', () => {
		const bytes = encode(rowsOf(people));
		expect(() => readParticipants(bytes, commitmentFor(bytes, 3))).toThrow(/2 entries/);
	});

	it('fails on a gap in ids', () => {
		const bytes = encode(rowsOf([people[0], { ...people[1], id: 3 }]));
		expect(() => readParticipants(bytes, commitmentFor(bytes, 2))).toThrow(/1 to 2/);
	});

	it('fails on a duplicate id', () => {
		const bytes = encode(rowsOf([people[0], { ...people[1], id: 1 }]));
		expect(() => readParticipants(bytes, commitmentFor(bytes, 2))).toThrow(/duplicate id/);
	});

	it('fails on a wrong header', () => {
		const bytes = encode([['id', 'first', 'last', 'email'], ['1', 'Ada', 'Lovelace', 'a@example.test']]);
		expect(() => readParticipants(bytes, commitmentFor(bytes, 1))).toThrow(/header/);
	});
});

describe('displayNames', () => {
	it('uses first name and initial', () => {
		expect(displayNames([person(1, 'Ada', 'Lovelace')]).get(1)).toBe('Ada L.');
	});

	it('lengthens the initial for homonyms only', () => {
		const names = displayNames([
			person(1, 'Léa', 'Dupont'),
			person(2, 'Léa', 'Dardenne'),
			person(3, 'Hugo', 'Durand'),
			person(4, 'léa', 'Martin')
		]);
		expect([...names.values()]).toEqual(['Léa Du.', 'Léa Da.', 'Hugo D.', 'léa M.']);
	});

	it('uses accented initials as one character', () => {
		const names = displayNames([person(1, 'Zoé', 'Élise'), person(2, 'Zoé', 'Émile')]);
		expect([...names.values()]).toEqual(['Zoé Él.', 'Zoé Ém.']);
	});

	it('falls back to full name and id for identical names', () => {
		const names = displayNames([person(1, 'Léa', 'Dupont'), person(2, 'Léa', 'Dupont')]);
		expect([...names.values()]).toEqual(['Léa Dupont #1', 'Léa Dupont #2']);
	});
});
