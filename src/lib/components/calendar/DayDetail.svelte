<script lang="ts">
	import { countdown, type BoxState } from '#lib/calendar.js';
	import { commitment } from '#lib/data.js';
	import type { Lot } from '#lib/types.js';
	import { reveal } from './reveal.js';

	let { lot, state, now }: { lot: Lot; state: BoxState; now: number } = $props();
</script>

{#if state.kind === 'locked'}
	<p class="text-muted-foreground">Ce lot sera dévoilé la veille à 18h.</p>
{:else}
	<div>
		<h3 class="text-2xl leading-tight font-semibold tracking-tight">{lot.title}</h3>
		<p class="mt-1 text-muted-foreground">{lot.description}</p>
		<p class="mt-1 text-xs text-muted-foreground">
			{lot.winners} gagnant{lot.winners > 1 ? 's' : ''}
		</p>
	</div>

	<div class="mt-5" aria-live="polite">
		{#if state.kind === 'announced'}
			<p class="text-sm text-muted-foreground">Tirage dans</p>
			<p class="text-3xl font-semibold tracking-tight tabular-nums">{countdown(state.revealAt, now)}</p>
			<p class="mt-1 text-xs text-muted-foreground">Gagnants dévoilés à 8h</p>
		{:else if state.kind === 'drawing'}
			<p class="flex items-center gap-2 font-medium">
				<span class="size-2 rounded-full bg-gold motion-safe:animate-pulse" aria-hidden="true"></span>
				Tirage en cours…
			</p>
			<p class="mt-1 text-xs text-muted-foreground">Les gagnants arrivent dans quelques minutes.</p>
		{:else}
			{@const { result } = state}
			<p class="text-sm text-muted-foreground">
				{result.winners.length > 1 ? 'Les gagnants' : result.winners.length === 1 ? 'Le gagnant' : 'Aucun gagnant'}
			</p>
			{#if result.winners.length === 0}
				<p class="mt-1">Tous les participants ont déjà gagné un lot.</p>
			{:else}
				<ul class="mt-2 flex flex-wrap gap-2">
					{#each result.winners as winner, i (winner.id)}
						<li
							in:reveal={{ delay: i * 120 }}
							class="rounded-full bg-primary px-4 py-1.5 text-base font-semibold text-primary-foreground"
						>
							{winner.display}
						</li>
					{/each}
				</ul>
			{/if}
			<p class="mt-3 text-xs text-muted-foreground">
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
