// Private participant list: verification against the commitment (docs/DRAW.md §2) and display names (docs/SPEC.md §6).
import { createHash } from 'node:crypto';
import type { Commitment } from '../../src/lib/types';
import { parseCsv } from './csv';

export interface Participant {
	id: number;
	prenom: string;
	nom: string;
	email: string;
}

export const PARTICIPANTS_HEADER = ['id', 'prenom', 'nom', 'email'];

export const sha256Hex = (data: Uint8Array | string) => createHash('sha256').update(data).digest('hex');

/** Checks the raw list bytes against the commitment, then parses them. Throws on any mismatch. */
export function readParticipants(bytes: Uint8Array, commitment: Commitment): Participant[] {
	const hash = sha256Hex(bytes);
	if (hash !== commitment.listSha256)
		throw new Error(`participant list hash ${hash} does not match the commitment ${commitment.listSha256}`);

	const [header, ...rows] = parseCsv(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
	if (header?.join(',') !== PARTICIPANTS_HEADER.join(','))
		throw new Error(`participant list: header must be exactly ${PARTICIPANTS_HEADER.join(',')}`);

	const seen = new Set<number>();
	const participants = rows.map((row, index) => {
		const line = index + 2;
		if (row.length !== PARTICIPANTS_HEADER.length) throw new Error(`participant list line ${line}: expected 4 fields`);
		const [id, prenom, nom, email] = row;
		if (!/^[1-9]\d*$/.test(id)) throw new Error(`participant list line ${line}: invalid id`);
		if (seen.has(Number(id))) throw new Error(`participant list line ${line}: duplicate id ${id}`);
		seen.add(Number(id));
		if (!prenom || !nom) throw new Error(`participant list line ${line}: empty name`);
		return { id: Number(id), prenom, nom, email };
	});

	const count = participants.length;
	if (count !== commitment.participantCount)
		throw new Error(`participant list has ${count} entries, commitment says ${commitment.participantCount}`);
	if (participants.some((p) => p.id > count)) throw new Error(`participant list: ids must be exactly 1 to ${count}`);
	return participants;
}

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
const prefix = (name: string, length: number) => Array.from(name).slice(0, length).join('');

/**
 * Display name for every participant, computed over the full list so it never changes during the month:
 * "Léa D.", lengthened ("Léa Du." / "Léa Da.") while another participant with the same first name shares the prefix,
 * and "Léa Dupont #42" when no prefix is unique.
 */
export function displayNames(participants: Participant[]): Map<number, string> {
	const names = new Map<number, string>();
	for (const p of participants) {
		const homonyms = participants.filter((o) => o.id !== p.id && same(o.prenom, p.prenom));
		const length = Array.from(p.nom).length;
		let display = `${p.prenom} ${p.nom} #${p.id}`;
		for (let k = 1; k <= length; k++) {
			const start = prefix(p.nom, k);
			if (!homonyms.some((o) => same(prefix(o.nom, k), start))) {
				display = `${p.prenom} ${start}${k < length ? '.' : ''}`;
				break;
			}
		}
		names.set(p.id, display);
	}
	return names;
}
