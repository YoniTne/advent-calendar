<script lang="ts">
	import type { BoxState } from '#lib/calendar.js';
	import type { Lot } from '#lib/types.js';

	let {
		lot,
		state,
		today,
		onselect
	}: { lot: Lot; state: BoxState | null; today: boolean; onselect: () => void } = $props();

	const open = $derived(state !== null && state.kind !== 'locked');
	const label = $derived(
		!open
			? `Jour ${lot.day}, pas encore dévoilé`
			: `Jour ${lot.day} : ${lot.title}${state?.kind === 'revealed' ? ', gagnants connus' : ''}`
	);
</script>

{#snippet face()}
	<span class="text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{lot.day}</span>
	{#if open}
		<span class="mt-auto line-clamp-2 hidden text-left text-xs leading-snug text-muted-foreground sm:block">
			{lot.title}
		</span>
		<span
			class={[
				'absolute top-2.5 right-2.5 size-2 rounded-full',
				state?.kind === 'revealed' ? 'bg-primary' : 'bg-gold',
				state?.kind === 'drawing' && 'motion-safe:animate-pulse'
			]}
			aria-hidden="true"
		></span>
	{/if}
{/snippet}

{#if open}
	<button
		type="button"
		aria-label={label}
		onclick={onselect}
		class={[
			'relative flex aspect-square flex-col items-start rounded-2xl border border-border bg-card p-3 shadow-sm',
			'transition-transform duration-100 ease-out active:scale-[0.96] motion-reduce:active:scale-100',
			'focus-visible:outline-2 focus-visible:outline-offset-2',
			today && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
		]}
	>
		{@render face()}
	</button>
{:else}
	<div
		role="img"
		aria-label={label}
		class="relative flex aspect-square flex-col items-start rounded-2xl bg-secondary p-3 text-muted-foreground/70"
	>
		{@render face()}
	</div>
{/if}
