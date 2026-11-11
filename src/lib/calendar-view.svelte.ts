// View model of the home page: one entry per day,
// already resolved to what may be shown at the current Paris time (docs/SPEC.md §7).
import { onMount } from 'svelte';
import { boxState, countdown, prizeShownAt, revealAt, todayOf, type BoxState } from './calendar';
import { formatDay } from './components/calendar/format';
import { commitment, editionYear, lots, results } from './data';
import { DAY_COUNT } from './lots';
import type { Lot, Prize, Winner } from './types';

export interface DayView {
	lot: Lot & Partial<Prize>;
	box: BoxState;
	/** False while the prize is still secret, or not in this build yet: there is no title to render. */
	open: boolean;
	isToday: boolean;
	/** "vendredi 5 décembre" */
	date: string;
	/** "5 déc." */
	shortDate: string;
	winners: Winner[];
	/** Shown instead of winners: unlock date, countdown, draw in progress. */
	status: string | null;
	proof: { href: string; round: number; candidates: number } | null;
}

const short = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'Europe/Paris' });

export const pad = (n: number) => String(n).padStart(2, '0');

/** Must be called during component initialisation. `days` is empty until the page runs in the browser. */
export function useCalendar() {
	// Unknown until mounted: the prerendered HTML must not freeze the build time.
	let now = $state<number | null>(null);

	onMount(() => {
		// Development only: ?now=2026-12-05T07:59:50+01:00 starts a simulated clock at that instant.
		const simulated = import.meta.env.DEV ? new URLSearchParams(location.search).get('now') : null;
		const offset = simulated && !Number.isNaN(Date.parse(simulated)) ? Date.parse(simulated) - Date.now() : 0;
		const tick = () => (now = Date.now() + offset);
		tick();
		const id = setInterval(tick, 1000);
		return () => clearInterval(id);
	});

	const today = $derived(now === null ? null : todayOf(editionYear, now));

	const days = $derived(
		now === null
			? []
			: lots.map((lot): DayView => {
					const box = boxState(editionYear, lot.day, results, now!);
					const winners = box.kind === 'revealed' ? box.result.winners : [];
					return {
						lot,
						box,
						open: box.kind !== 'locked' && lot.title !== undefined,
						isToday: lot.day === today,
						date: formatDay(revealAt(editionYear, lot.day)),
						shortDate: short.format(revealAt(editionYear, lot.day)),
						winners,
						status:
							box.kind === 'locked'
								? `Dévoilé le ${short.format(prizeShownAt(editionYear, lot.day))} à 18h`
								: box.kind === 'announced'
									? `Tirage dans ${countdown(box.revealAt, now!)}`
									: box.kind === 'drawing'
										? 'Tirage en cours…'
										: winners.length
											? null
											: 'Aucun gagnant : tout le monde a déjà gagné',
						proof:
							box.kind === 'revealed'
								? {
										href: `https://api.drand.sh/${commitment.drand.chainHash}/public/${box.result.drandRound}`,
										round: box.result.drandRound,
										candidates: box.result.candidateCount
									}
								: null
					};
				})
	);

	// The day to put forward: today, else the first box before the calendar starts and the last one after.
	const featured = $derived(
		days.length ? days[(today ?? (now! < revealAt(editionYear, 1) ? 1 : DAY_COUNT)) - 1] : null
	);

	return {
		get days() {
			return days;
		},
		get featured() {
			return featured;
		},
		/** Number of days whose winners are published. */
		get done() {
			return days.filter((d) => d.box.kind === 'revealed').length;
		}
	};
}
