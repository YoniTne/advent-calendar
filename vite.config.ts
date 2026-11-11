import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { existsSync, readFileSync } from 'node:fs';
import { prizesShownBy } from './src/lib/calendar.ts';
import { validatePrizes } from './src/lib/lots.ts';

// A build also holds the prizes shown within the next 2 hours, so that the scheduled 17:15 deployment
// already carries the 18:00 prize (the site itself hides it until 18:00) even when GitHub's cron runs late.
const PRIZE_LEAD_MS = 2 * 3_600_000;

/** Prize texts for this build: the PRIZES_JSON_B64 secret in CI, else private/prizes.json, else the fake ones. */
function loadPrizes(build: boolean) {
	const b64 = process.env.PRIZES_JSON_B64;
	const text = b64
		? Buffer.from(b64, 'base64').toString('utf8')
		: readFileSync(existsSync('private/prizes.json') ? 'private/prizes.json' : 'data/prizes.example.json', 'utf8');
	const prizes = validatePrizes(JSON.parse(text));
	// Dev server and tests get everything: the simulated clock needs it.
	if (!build) return prizes;
	const year = Number(JSON.parse(readFileSync('data/commitment.json', 'utf8')).publishedAt.slice(0, 4));
	return prizesShownBy(prizes, year, Date.now() + PRIZE_LEAD_MS);
}

export default defineConfig(({ command }) => ({
	define: { __PRIZES__: JSON.stringify(loadPrizes(command === 'build')) },
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter(),
			// GitHub Pages serves the site under /<repo>; set by CI, empty in dev
			paths: { base: (process.env.BASE_PATH ?? '') as '' | `/${string}` }
		})
	],
	test: {
		expect: { requireAssertions: true },
		passWithNoTests: true,
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}', 'scripts/**/*.{test,spec}.ts'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
}));
