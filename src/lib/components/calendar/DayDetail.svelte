<script lang="ts">
	import type { BoxState } from '#lib/calendar.js';
	import { commitment } from '#lib/data.js';
	import type { Lot } from '#lib/types.js';
	import Countdown from './Countdown.svelte';
	import { reveal } from './reveal.js';

	let { lot, box, now }: { lot: Lot; box: BoxState; now: number } = $props();
</script>

{#if box.kind === 'locked'}
	<p class="text-muted-foreground">Ce cadeau sera dévoilé la veille à 18h. Patience !</p>
{:else}
	<div>
		<h3 class="text-2xl leading-tight font-bold tracking-tight sm:text-3xl">{lot.title}</h3>
		<p class="mt-1 text-muted-foreground">{lot.description}</p>
		<p class="mt-2 inline-flex rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
			🎁 {lot.winners} gagnant{lot.winners > 1 ? 's' : ''}
		</p>
	</div>

	<div class="mt-6" aria-live="polite">
		{#if box.kind === 'announced'}
			<p class="mb-2 text-sm font-medium text-muted-foreground">Tirage dans</p>
			<Countdown target={box.revealAt} {now} />
		{:else if box.kind === 'drawing'}
			<p class="flex items-center gap-2 text-lg font-semibold">
				<span class="twinkle size-2.5 rounded-full bg-gold text-gold" aria-hidden="true"></span>
				Tirage en cours…
			</p>
			<p class="mt-1 text-sm text-muted-foreground">Les gagnants arrivent dans quelques minutes.</p>
		{:else}
			{@const { result } = box}
			<p class="text-sm font-medium text-muted-foreground">
				{result.winners.length > 1 ? 'Les gagnants' : result.winners.length === 1 ? 'Le gagnant' : 'Aucun gagnant'}
			</p>
			{#if result.winners.length === 0}
				<p class="mt-1">Tous les participants ont déjà gagné un lot.</p>
			{:else}
				<ul class="mt-2 flex flex-wrap gap-2">
					{#each result.winners as winner, i (winner.id)}
						<li
							in:reveal={{ delay: 150 + i * 160 }}
							class="festive-chip rounded-full px-4 py-2 text-lg font-bold text-[oklch(0.25_0.05_60)] shadow-md"
						>
							🏆 {winner.display}
						</li>
					{/each}
				</ul>
			{/if}
			<p class="mt-4 text-xs text-muted-foreground">
				Hasard :
				<a
					class="underline underline-offset-2"
					href={`https://api.drand.sh/${commitment.drand.chainHash}/public/${result.drandRound}`}
				>
					round drand n° {result.drandRound}
				</a>
				· {result.candidateCount} participants en lice
			</p>
		{/if}
	</div>
{/if}
