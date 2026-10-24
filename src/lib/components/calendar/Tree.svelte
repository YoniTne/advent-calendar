<script lang="ts">
	import { backOut, cubicOut } from 'svelte/easing';
	import type { TransitionConfig } from 'svelte/transition';
	import type { BoxState } from '#lib/calendar.js';
	import type { Lot } from '#lib/types.js';
	import Logo from '../decor/Logo.svelte';
	import DayBox from './DayBox.svelte';
	import { prefersReducedMotion } from './gift.js';

	let {
		lots,
		boxes,
		today,
		unlocksAt,
		unlocksShort,
		onselect
	}: {
		lots: Lot[];
		boxes: BoxState[];
		today: number | null;
		unlocksAt: (day: number) => string;
		unlocksShort: (day: number) => string;
		onselect: (day: number) => void;
	} = $props();

	// Tiers from the top: 24 crowns the tree, 4–9 form the lowest branch, 1–3 are the gifts at its foot.
	const tiers = [[24], [22, 23], [19, 20, 21], [15, 16, 17, 18], [10, 11, 12, 13, 14], [4, 5, 6, 7, 8, 9]];
	const underTree = [1, 2, 3];

	const STEP = 70;
	// Let the splash window open most of the way before the tree starts growing.
	const START = 650;
	const reduced = prefersReducedMotion();

	/** Gifts rise into place from the bottom of the tree to the top, one day after another. */
	function rise(_node: Element, { day }: { day: number }): TransitionConfig {
		return {
			delay: reduced ? 0 : START + (day - 1) * STEP,
			duration: reduced ? 200 : 600,
			easing: backOut,
			css: (t, u) =>
				reduced ? `opacity: ${t}` : `opacity: ${Math.min(1, t * 2)}; transform: translateY(${u * 40}px) scale(${0.4 + 0.6 * t})`
		};
	}

	/** The tree grows upwards along with its gifts. */
	function grow(_node: Element): TransitionConfig {
		return {
			delay: reduced ? 0 : START - 50,
			duration: reduced ? 200 : 150 + 24 * STEP,
			easing: cubicOut,
			css: (t) => (reduced ? `opacity: ${t}` : `clip-path: inset(${(1 - t) * 100}% -10% 0 -10%)`)
		};
	}

	/** The club logo lands on top as the star, last. */
	function crown(_node: Element): TransitionConfig {
		return {
			delay: reduced ? 0 : START + 150 + 24 * STEP,
			duration: reduced ? 200 : 900,
			easing: backOut,
			css: (t, u) => (reduced ? `opacity: ${t}` : `opacity: ${t}; transform: rotate(${u * -180}deg) scale(${t})`)
		};
	}

	const lot = (day: number) => lots[day - 1];
</script>

{#snippet gift(day: number)}
	<div in:rise|global={{ day }}>
		<DayBox
			lot={lot(day)}
			box={boxes[day - 1]}
			today={day === today}
			unlocksAt={unlocksAt(day)}
			unlocksShort={unlocksShort(day)}
			onselect={() => onselect(day)}
		/>
	</div>
{/snippet}

<div class="relative mx-auto w-fit pt-[calc(var(--s)*1.5)] [--g:calc(var(--s)*0.16)] [--s:min(11.8vw,4.75rem)]">
	<!-- Tree silhouette behind the tiers -->
	<svg
		in:grow
		viewBox="0 0 100 100"
		preserveAspectRatio="none"
		aria-hidden="true"
		class="absolute top-[calc(var(--s)*0.9)] left-1/2 h-[calc((var(--s)+var(--g))*6+var(--s)*0.85)] w-[calc(var(--s)*8.6)] -translate-x-1/2 drop-shadow-[0_1.5rem_2.5rem_oklch(0.4_0.1_160/45%)]"
	>
		<defs>
			<linearGradient id="pine" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stop-color="oklch(0.55 0.13 158)" />
				<stop offset="1" stop-color="oklch(0.33 0.08 165)" />
			</linearGradient>
		</defs>
		<path
			d="M50 0 L63 17 L57 17 L72 35 L65 35 L81 55 L73 55 L90 76 L82 76 L100 100 L0 100 L18 76 L10 76 L27 55 L19 55 L35 35 L28 35 L43 17 L37 17 Z"
			fill="url(#pine)"
		/>
	</svg>

	<!-- The club logo as the star on top -->
	<div in:crown class="absolute top-0 left-1/2 -ml-[calc(var(--s)*0.8)] w-[calc(var(--s)*1.6)] text-gold">
		<Logo class="w-full drop-shadow-[0_0_1rem_var(--gold)]" strokeWidth={16} />
	</div>

	<div class="relative flex flex-col items-center gap-(--g)">
		{#each tiers as tier, i (i)}
			<div class="flex gap-(--g)">
				{#each tier as day (day)}
					{@render gift(day)}
				{/each}
			</div>
		{/each}
	</div>

	<!-- Trunk and the gifts at its foot -->
	<div in:grow class="mx-auto h-[calc(var(--s)*0.45)] w-[calc(var(--s)*0.7)] rounded-b-md bg-[oklch(0.42_0.07_50)]"></div>
	<div class="-mt-[calc(var(--s)*0.15)] flex justify-center gap-(--g)">
		{#each underTree as day (day)}
			{@render gift(day)}
		{/each}
	</div>
</div>
