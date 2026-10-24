// Google Form export → normalized participants.csv (docs/SPEC.md §5).
import { parseCsv, toCsv } from './csv';
import { PARTICIPANTS_HEADER } from './participants';

/** Header of the Google Sheet CSV export. */
export const FORM_HEADER = ['Horodateur', 'Prénom', 'Nom', 'E-mail'];

const clean = (value: string) => value.normalize('NFC').trim().replace(/\s+/g, ' ');

/** Google's French timestamp `DD/MM/YYYY HH:MM:SS` as a sortable number. */
function timestamp(value: string, line: number): number {
	const match = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{1,2}):(\d{2}):(\d{2})$/.exec(value);
	if (!match) throw new Error(`line ${line}: unreadable timestamp`);
	const [day, month, year, hour, minute, second] = match.slice(1).map(Number);
	return Date.UTC(year, month - 1, day, hour, minute, second);
}

/**
 * Builds participants.csv: ids 1..N in registration order, cleaned fields, UTF-8 text with LF endings.
 * Fails on empty fields or duplicate e-mails (to be fixed by hand in the Sheet), reporting line numbers only.
 */
export function prepareParticipants(exportText: string): string {
	const [header, ...rows] = parseCsv(exportText.replace(/^﻿/, ''));
	if (header?.map(clean).join(',') !== FORM_HEADER.join(','))
		throw new Error(`export header must be exactly ${FORM_HEADER.join(',')}`);

	const entries = rows
		.map((row, index) => ({ row: row.map(clean), line: index + 2 }))
		.filter(({ row }) => row.some((field) => field !== ''))
		.map(({ row, line }) => {
			if (row.length !== FORM_HEADER.length) throw new Error(`line ${line}: expected ${FORM_HEADER.length} fields`);
			if (row.some((field) => field === '')) throw new Error(`line ${line}: empty field`);
			const [time, prenom, nom, email] = row;
			return { line, time: timestamp(time, line), prenom, nom, email };
		});

	const byEmail = new Map<string, number[]>();
	for (const { email, line } of entries) byEmail.set(email.toLowerCase(), [...(byEmail.get(email.toLowerCase()) ?? []), line]);
	const duplicates = [...byEmail.values()].filter((lines) => lines.length > 1);
	if (duplicates.length > 0)
		throw new Error(`duplicate e-mails on lines: ${duplicates.map((lines) => lines.join(' & ')).join(', ')}`);

	// Array.prototype.sort is stable: same-second registrations keep the export order.
	entries.sort((a, b) => a.time - b.time);
	return toCsv([PARTICIPANTS_HEADER, ...entries.map((e, i) => [String(i + 1), e.prenom, e.nom, e.email])]);
}
