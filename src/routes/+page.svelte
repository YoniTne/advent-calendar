<script lang="ts">
	import { onMount } from 'svelte';
	import confetti from 'canvas-confetti';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import Bow from '#lib/components/decor/Bow.svelte';
	import Countdown from '#lib/components/calendar/Countdown.svelte';
	import Tree from '#lib/components/calendar/Tree.svelte';
	import { splash } from '#lib/components/decor/splash.svelte.js';
	import DayDetail from '#lib/components/calendar/DayDetail.svelte';
	import { formatDay } from '#lib/components/calendar/format.js';
	import { giftColor } from '#lib/components/calendar/gift.js';
	import { boxState, prizeShownAt, revealAt, todayOf } from '#lib/calendar.js';
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

	const boxes = $derived(now === null ? null : lots.map((lot) => boxState(editionYear, lot.day, results, now!)));
	const today = $derived(now === null ? null : todayOf(editionYear, now));
	const next = $derived.by(() => {
		const day = (today ?? 0) + 1;
		return boxes && day <= DAY_COUNT && boxes[day - 1].kind === 'announced' ? day : null;
	});
	const opening = $derived(now !== null && now < prizeShownAt(editionYear, 1));
	const over = $derived(now !== null && !opening && today === null && next === null);
	const todayKind = $derived(boxes && today !== null ? boxes[today - 1].kind : null);

	// Confetti once per day: when the winners appear live, or on the first visit after 08:00.
	let previousKind: string | null = null;
	$effect(() => {
		const kind = splash.open ? todayKind : null;
		if (kind === 'revealed' && previousKind !== 'revealed' && today !== null) {
			const key = `confetti-${editionYear}-${today}`;
			let seen = false;
			try {
				seen = localStorage.getItem(key) === '1';
				localStorage.setItem(key, '1');
			} catch {
				// Storage unavailable: celebrate anyway.
			}
			// On arrival, wait for the splash window to open and the tree to grow first.
			if (previousKind !== null) celebrate();
			else if (!seen) setTimeout(celebrate, 2600);
		}
		previousKind = kind;
	});

	function celebrate() {
		const colors = ['#c8283f', '#e8c46a', '#2f7a5c', '#e04f86', '#3b55b5'];
		const burst = (x: number) =>
			confetti({ particleCount: 90, spread: 75, startVelocity: 45, origin: { x, y: 0.35 }, colors, disableForReducedMotion: true });
		burst(0.25);
		setTimeout(() => burst(0.75), 250);
	}

	const unlocksAt = (day: number) =>
		day === 1 ? 'le 30 novembre à 18h' : `le ${formatDay(prizeShownAt(editionYear, day)).replace(/^\S+ /, '')} à 18h`;

	const shortDay = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'Europe/Paris' });
	const unlocksShort = (day: number) => `${shortDay.format(prizeShownAt(editionYear, day))} · 18h`;

	let selected = $state<number | null>(null);
</script>

<svelte:head>
	<title>Calendrier de l'avent · Club électronique INSSET</title>
	<meta name="description" content="Un lot par jour du 1er au 24 décembre, tiré au sort chaque matin à 8h." />
</svelte:head>

<div class="text-center sm:text-left">
	<p class="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase">
		<span class="text-gold">✦</span> Club électronique · INSSET
	</p>
	<h1 class="mt-4 text-display">
		<span class="festive-text">Calendrier de l'avent</span>
		<span class="block text-foreground/90">{editionYear}</span>
	</h1>
	<p class="mt-3 text-lg text-muted-foreground">24 jours, 24 cadeaux, un tirage chaque matin à 8h.</p>
</div>

<section class="mt-6" aria-labelledby="grid-title">
	<h2 id="grid-title" class="sr-only">Les 24 cadeaux</h2>
	<div class="min-h-[calc(min(11.8vw,4.75rem)*11)]">
		{#if boxes && splash.open}
			<Tree {lots} {boxes} {today} {unlocksAt} {unlocksShort} onselect={(day) => (selected = day)} />
		{/if}
	</div>
</section>

<section class="mt-10" aria-label="Aujourd'hui">
	{#if now !== null && boxes}
		{#if opening}
			<div class="glass rounded-3xl p-6 shadow-xl">
				<p class="mb-3 font-medium text-muted-foreground">Premier cadeau dévoilé le 30 novembre à 18h</p>
				<Countdown target={prizeShownAt(editionYear, 1)} {now} />
			</div>
		{:else if over}
			<div class="glass rounded-3xl p-6 shadow-xl">
				<p class="text-2xl font-bold tracking-tight">🎄 Le calendrier est terminé.</p>
				<p class="mt-1 text-muted-foreground">Merci à toutes et à tous, et joyeuses fêtes !</p>
			</div>
		{/if}

		<div class="grid gap-4 sm:grid-cols-[3fr_2fr]">
			{#if today !== null}
				<article class="glass glow-ring rounded-3xl p-6 shadow-xl" style:--gift={giftColor(today)}>
					<p class="text-sm font-semibold text-(--gift) first-letter:uppercase">
						Aujourd'hui · {formatDay(revealAt(editionYear, today))}
					</p>
					<div class="mt-3">
						<DayDetail lot={lotForDay(lots, today)} box={boxes[today - 1]} {now} />
					</div>
				</article>
			{/if}
			{#if next !== null}
				<article
					class="gift-paper relative self-start overflow-hidden rounded-3xl p-6 text-white shadow-xl"
					style:--gift={giftColor(next)}
				>
					<Bow class="absolute -top-2 -right-3 w-24 rotate-12 opacity-90" />
					<p class="text-sm font-semibold opacity-85 first-letter:uppercase">
						Demain · {formatDay(revealAt(editionYear, next))}
					</p>
					<h3 class="mt-3 text-xl leading-tight font-bold tracking-tight">{lotForDay(lots, next).title}</h3>
					<p class="mt-1 text-sm opacity-85">{lotForDay(lots, next).description}</p>
				</article>
			{/if}
		</div>
	{/if}
</section>



<Dialog.Root bind:open={() => selected !== null, (open) => !open && (selected = null)}>
	{#if selected !== null && boxes && now !== null}
		<Dialog.Content class="overflow-hidden p-0" style={`--gift: ${giftColor(selected)}`}>
			<div class="gift-paper relative h-24">
				<Bow class="absolute bottom-0 left-1/2 w-28 -translate-x-1/2 translate-y-1/3" />
			</div>
			<div class="px-6 pb-6">
				<Dialog.Header>
					<Dialog.Title class="font-semibold text-(--gift) first-letter:uppercase">
						Jour {selected} · {formatDay(revealAt(editionYear, selected))}
					</Dialog.Title>
				</Dialog.Header>
				<div class="mt-3">
					<DayDetail lot={lotForDay(lots, selected)} box={boxes[selected - 1]} {now} />
				</div>
			</div>
		</Dialog.Content>
	{/if}
</Dialog.Root>
