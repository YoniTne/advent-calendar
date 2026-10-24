<script lang="ts">
	import { onMount } from 'svelte';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import DayBox from '#lib/components/calendar/DayBox.svelte';
	import DayDetail from '#lib/components/calendar/DayDetail.svelte';
	import { formatDay } from '#lib/components/calendar/format.js';
	import { boxState, countdown, prizeShownAt, revealAt, todayOf } from '#lib/calendar.js';
	import { DAY_COUNT, lotForDay } from '#lib/lots.js';
	import { editionYear, lots, results } from '#lib/data.js';

	// Unknown until the page runs in the browser: the prerendered HTML must not freeze the build time.
	let now = $state<number | null>(null);

	onMount(() => {
		// Development only: ?now=2025-12-05T07:59:50+01:00 starts a simulated clock at that instant.
		const simulated = import.meta.env.DEV ? new URLSearchParams(location.search).get('now') : null;
		const offset = simulated && !Number.isNaN(Date.parse(simulated)) ? Date.parse(simulated) - Date.now() : 0;
		const tick = () => (now = Date.now() + offset);
		tick();
		const id = setInterval(tick, 1000);
		return () => clearInterval(id);
	});

	const states = $derived(now === null ? null : lots.map((lot) => boxState(editionYear, lot.day, results, now!)));
	const today = $derived(now === null ? null : todayOf(editionYear, now));
	const next = $derived.by(() => {
		const day = (today ?? 0) + 1;
		return states && day <= DAY_COUNT && states[day - 1].kind === 'announced' ? day : null;
	});
	const opening = $derived(now !== null && now < prizeShownAt(editionYear, 1));
	const over = $derived(now !== null && !opening && today === null && next === null);

	let selected = $state<number | null>(null);
</script>

<svelte:head>
	<title>Calendrier de l'avent · Club électronique INSSET</title>
	<meta name="description" content="Un lot par jour du 1er au 24 décembre, tiré au sort chaque matin à 8h." />
</svelte:head>

<p class="text-sm font-medium text-primary">Club électronique · INSSET</p>
<h1 class="mt-1 text-display">Calendrier de l'avent {editionYear}</h1>

<section class={['mt-8', now === null && 'min-h-48']} aria-label="Aujourd'hui">
	{#if now !== null && states}
		{#if opening}
			<div class="rounded-3xl border border-border bg-card p-6 shadow-sm">
				<p class="text-muted-foreground">Premier lot dévoilé le 30 novembre à 18h</p>
				<p class="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
					{countdown(prizeShownAt(editionYear, 1), now)}
				</p>
			</div>
		{:else if over}
			<div class="rounded-3xl border border-border bg-card p-6 shadow-sm">
				<p class="text-xl font-semibold tracking-tight">Le calendrier est terminé.</p>
				<p class="mt-1 text-muted-foreground">Merci à toutes et à tous, et joyeuses fêtes !</p>
			</div>
		{/if}

		<div class="grid gap-3 sm:grid-cols-[3fr_2fr]">
			{#if today !== null}
				<article class="rounded-3xl border border-border bg-card p-6 shadow-sm">
					<p class="text-sm font-medium text-muted-foreground first-letter:uppercase">
						Aujourd'hui · {formatDay(revealAt(editionYear, today))}
					</p>
					<div class="mt-3">
						<DayDetail lot={lotForDay(lots, today)} state={states[today - 1]} {now} />
					</div>
				</article>
			{/if}
			{#if next !== null}
				<article class="self-start rounded-3xl bg-accent p-6 text-accent-foreground">
					<p class="text-sm font-medium opacity-80 first-letter:uppercase">
						Demain · {formatDay(revealAt(editionYear, next))}
					</p>
					<h3 class="mt-3 text-xl leading-tight font-semibold tracking-tight">{lotForDay(lots, next).title}</h3>
					<p class="mt-1 text-sm opacity-80">{lotForDay(lots, next).description}</p>
				</article>
			{/if}
		</div>
	{/if}
</section>

<section class="mt-10" aria-labelledby="grid-title">
	<h2 id="grid-title" class="text-xl font-semibold tracking-tight">Les 24 cases</h2>
	<div class="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6 sm:gap-3">
		{#each lots as lot (lot.day)}
			<DayBox
				{lot}
				state={states ? states[lot.day - 1] : null}
				today={lot.day === today}
				onselect={() => (selected = lot.day)}
			/>
		{/each}
	</div>
</section>

<Dialog.Root bind:open={() => selected !== null, (open) => !open && (selected = null)}>
	{#if selected !== null && states && now !== null}
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title class="first-letter:uppercase">
					Jour {selected} · {formatDay(revealAt(editionYear, selected))}
				</Dialog.Title>
			</Dialog.Header>
			<div>
				<DayDetail lot={lotForDay(lots, selected)} state={states[selected - 1]} {now} />
			</div>
		</Dialog.Content>
	{/if}
</Dialog.Root>
