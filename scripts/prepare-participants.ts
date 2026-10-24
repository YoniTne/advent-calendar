// Usage: npx tsx scripts/prepare-participants.ts <google-form-export.csv> [output, default private/participants.csv]
// Prints the hash and count for data/commitment.json. Run locally only: the files contain personal data.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { prepareParticipants } from './lib/prepare';
import { sha256Hex } from './lib/participants';

const [input, output = 'private/participants.csv'] = process.argv.slice(2);
if (!input) {
	console.error('usage: npx tsx scripts/prepare-participants.ts <export.csv> [output.csv]');
	process.exit(1);
}

try {
	const csv = prepareParticipants(readFileSync(input, 'utf8'));
	const bytes = Buffer.from(csv, 'utf8');
	mkdirSync(dirname(output), { recursive: true });
	writeFileSync(output, bytes);
	console.log(`written: ${output}`);
	console.log(`participantCount: ${csv.split('\n').length - 2}`);
	console.log(`listSha256: ${sha256Hex(bytes)}`);
	console.log(`secret value: base64 -w0 ${output}`);
} catch (error) {
	console.error(`error: ${(error as Error).message}`);
	process.exit(1);
}
