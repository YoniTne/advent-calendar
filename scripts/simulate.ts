// Fake edition for development and the dress rehearsal: fictional participants, a commitment
// and the 24 draws of December 2025 computed with real drand rounds.
// Usage: npm run simulate [-- <participant count>]   (default 120)
// Writes private/simulation/{export,participants}.csv (ignored), data/commitment.json and data/results.json.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { validateLots } from '../src/lib/lots';
import type { Commitment } from '../src/lib/types';
import { DRAW_TIME, getBeacon, QUICKNET } from './lib/drand';
import { EDITION, runDraws } from './lib/draw';
import { displayNames, readParticipants, sha256Hex } from './lib/participants';
import { FORM_HEADER, prepareParticipants } from './lib/prepare';
import { toCsv } from './lib/csv';

const YEAR = 2025;
const DIR = 'private/simulation';

const FIRST = ['Léa', 'Hugo', 'Emma', 'Lucas', 'Chloé', 'Nathan', 'Inès', 'Tom', 'Manon', 'Théo', 'Camille', 'Noah', 'Zoé', 'Louis', 'Jade', 'Enzo', 'Sarah', 'Maël', 'Lina', 'Arthur'];
const LAST = ['Martin', 'Bernard', 'Dubois', 'Durand', 'Dupont', 'Dardenne', 'Lefèvre', 'Moreau', 'Laurent', 'Simon', 'Michel', 'Garcia', 'Roux', 'Fournier', 'Morel', 'Girard', 'André', 'Mercier'];

/** Deterministic fictional registrations; index steps are coprime with the list sizes so names mix, with some homonyms. */
function fakeExport(count: number): string {
	const rows = Array.from({ length: count }, (_, i) => {
		const minutes = i * 97;
		const day = String(1 + Math.floor(minutes / 1440) % 29).padStart(2, '0');
		const time = `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}:00`;
		return [`${day}/11/${YEAR} ${time}`, FIRST[(i * 7) % FIRST.length], LAST[(i * 5) % LAST.length], `fake${i + 1}@example.test`];
	});
	return toCsv([FORM_HEADER, ...rows]);
}

async function main() {
	const count = Number(process.argv[2] ?? 120);
	if (!Number.isInteger(count) || count < 1) throw new Error('participant count must be a positive integer');

	// Never overwrite a real commitment.
	if (existsSync('data/commitment.json')) {
		const current: Commitment = JSON.parse(readFileSync('data/commitment.json', 'utf8'));
		if (!current.publishedAt.startsWith(`${YEAR}-`)) throw new Error('data/commitment.json is not a simulation, refusing to overwrite');
	}

	mkdirSync(DIR, { recursive: true });
	const exportText = fakeExport(count);
	writeFileSync(`${DIR}/export.csv`, exportText);
	const bytes = Buffer.from(prepareParticipants(exportText), 'utf8');
	writeFileSync(`${DIR}/participants.csv`, bytes);

	const commitment: Commitment = {
		edition: EDITION,
		participantCount: count,
		listSha256: sha256Hex(bytes),
		drand: { network: 'quicknet', chainHash: QUICKNET.hash },
		drawTime: DRAW_TIME,
		timezone: 'Europe/Paris',
		publishedAt: `${YEAR}-12-01`
	};
	writeFileSync('data/commitment.json', JSON.stringify(commitment, null, '\t') + '\n');

	const participants = readParticipants(bytes, commitment);
	const results = await runDraws(`${YEAR}-12-24`, {}, {
		lots: validateLots(JSON.parse(readFileSync('data/lots.json', 'utf8'))),
		participantCount: participants.length,
		names: displayNames(participants),
		getBeacon,
		now: () => new Date().toISOString(),
		log: console.log
	});
	writeFileSync('data/results.json', JSON.stringify(results, null, '\t') + '\n');
	console.log(`simulation ready: ${count} fake participants, 24 days drawn`);
	console.log(`to rerun draw/verify: PARTICIPANTS_CSV_B64=$(base64 -w0 ${DIR}/participants.csv) npm run draw:verify`);
}

main().catch((error: Error) => {
	console.error(`error: ${error.message}`);
	process.exit(1);
});
