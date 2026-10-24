// Daily draw. Usage (docs/DRAW.md):
//   npx tsx scripts/draw.ts          draw every calendar day up to today (catch-up included)
//   npx tsx scripts/draw.ts verify   recompute every published day
// Env: PARTICIPANTS_CSV_B64 (private list, base64; optional for verify),
//      DRAW_DATE=YYYY-MM-DD (simulation only; on GitHub Actions, allowed only in the draw-rehearsal workflow).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { validateLots } from '../src/lib/lots';
import { parisDate } from '../src/lib/paris';
import type { Commitment, Results } from '../src/lib/types';
import { drawInstant, getBeacon } from './lib/drand';
import { calendarDay, checkCommitment, runDraws, verifyResults } from './lib/draw';
import { displayNames, readParticipants } from './lib/participants';

const RESULTS = 'data/results.json';
const readJson = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const log = (message: string) => console.log(message);

function loadList(commitment: Commitment) {
	const b64 = process.env.PARTICIPANTS_CSV_B64;
	if (!b64) return null;
	const participants = readParticipants(Buffer.from(b64, 'base64'), commitment);
	log(`participant list matches the commitment (${participants.length} participants)`);
	return { participantCount: participants.length, names: displayNames(participants) };
}

/** The date to draw up to, or null when there is nothing to do. */
function targetDate(): string | null {
	const now = Date.now();
	const simulated = process.env.DRAW_DATE;
	if (simulated) {
		if (process.env.GITHUB_ACTIONS === 'true' && process.env.GITHUB_WORKFLOW !== 'draw-rehearsal')
			throw new Error('DRAW_DATE is forbidden on GitHub Actions outside the draw-rehearsal workflow');
		if (drawInstant(simulated) * 1000 > now) throw new Error(`DRAW_DATE ${simulated}: its drand round does not exist yet`);
		log(`simulation: drawing up to ${simulated}`);
		return simulated;
	}
	const today = parisDate(now);
	if (calendarDay(today) === null) {
		log(`${today} is outside December 1–24, nothing to draw`);
		return null;
	}
	if (drawInstant(today) * 1000 > now) {
		const yesterday = parisDate(now - 86_400_000);
		log(`today's round is not out before 07:45 Paris time; catching up to ${yesterday} only`);
		return calendarDay(yesterday) === null ? null : yesterday;
	}
	return today;
}

async function main() {
	const commitment: Commitment = readJson('data/commitment.json');
	checkCommitment(commitment);
	const lots = validateLots(readJson('data/lots.json'));
	const published: Results = existsSync(RESULTS) ? readJson(RESULTS) : {};
	const list = loadList(commitment);

	if (process.argv[2] === 'verify') {
		if (!list) log('no participant list: checking rounds, randomness and seeds only');
		const problems = await verifyResults(published, { lots, list: list ?? undefined, getBeacon, log });
		if (problems.length > 0) throw new Error(`verification failed:\n${problems.join('\n')}`);
		log(`all ${Object.keys(published).length} published days verified`);
		return;
	}

	if (!list) throw new Error('PARTICIPANTS_CSV_B64 is required to draw');
	const target = targetDate();
	if (!target) return;
	const results = await runDraws(target, published, {
		lots,
		...list,
		getBeacon,
		now: () => new Date().toISOString(),
		log
	});
	const json = JSON.stringify(results, null, '\t') + '\n';
	if (!existsSync(RESULTS) || readFileSync(RESULTS, 'utf8') !== json) {
		writeFileSync(RESULTS, json);
		log(`${RESULTS} updated`);
	}
}

main().catch((error: Error) => {
	console.error(`error: ${error.message}`);
	process.exit(1);
});
