<script lang="ts">
	import { Spring } from 'svelte/motion';
	import type { BoxState } from '#lib/calendar.js';
	import type { Lot } from '#lib/types.js';
	import Bow from '../decor/Bow.svelte';
	import { giftColor, prefersReducedMotion } from './gift.js';

	let {
		lot,
		box,
		today,
		unlocksAt,
		unlocksShort,
		onselect
	}: { lot: Lot; box: BoxState; today: boolean; unlocksAt: string; unlocksShort: string; onselect: () => void } =
		$props();

	const open = $derived(box.kind !== 'locked');
	const label = $derived(
		open
			? `Jour ${lot.day} : ${lot.title}${box.kind === 'revealed' ? ', gagnants connus' : ''}`
			: `Jour ${lot.day}, cadeau dévoilé ${unlocksAt}`
	);

	// Springs keep the motion interruptible: a new pointer position just retargets them.
	const tilt = new Spring({ x: 0, y: 0 }, { stiffness: 0.12, damping: 0.55 });
	const wiggle = new Spring(0, { stiffness: 0.2, damping: 0.18 });
	let pressed = $state(false);
	let hint = $state(false);
	let hintTimer: ReturnType<typeof setTimeout>;

	function track(event: PointerEvent) {
		if (event.pointerType !== 'mouse' || prefersReducedMotion()) return;
		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
		const px = (event.clientX - rect.left) / rect.width - 0.5;
		const py = (event.clientY - rect.top) / rect.height - 0.5;
		tilt.target = { x: -py * 16, y: px * 16 };
	}

	function release() {
		pressed = false;
		tilt.target = { x: 0, y: 0 };
	}

	function activate() {
		if (open) return onselect();
		// A wrapped gift refuses to open: a short shake, like a locked door.
		if (!prefersReducedMotion()) wiggle.set(12, { instant: true }).then(() => (wiggle.target = 0));
		hint = true;
		clearTimeout(hintTimer);
		hintTimer = setTimeout(() => (hint = false), 1800);
	}
</script>

<div class="relative" style:--gift={giftColor(lot.day)}>
	<button
		type="button"
		aria-label={label}
		onclick={activate}
		onpointerdown={() => (pressed = true)}
		onpointerup={() => (pressed = false)}
		onpointermove={track}
		onpointerleave={release}
		style:transform={`perspective(600px) rotateX(${tilt.current.x}deg) rotateY(${tilt.current.y}deg) rotate(${wiggle.current}deg) scale(${pressed ? 0.92 : 1})`}
		class={[
			'relative flex size-(--s) flex-col items-start overflow-hidden rounded-[calc(var(--s)*0.22)] p-[calc(var(--s)*0.1)] text-left shadow-lg will-change-transform',
			'focus-visible:outline-2 focus-visible:outline-offset-2',
			open ? 'gift-open glass' : 'gift-paper text-white',
			today && 'glow-ring bob overflow-visible'
		]}
	>
		{#if open}
			<span class="text-[calc(var(--s)*0.4)] leading-none font-bold tracking-tight text-(--gift) tabular-nums">
				{lot.day}
			</span>
			{#if box.kind === 'revealed'}
				<span
					class="absolute right-[8%] bottom-[8%] grid size-[calc(var(--s)*0.26)] place-items-center rounded-full bg-(--gift) text-[calc(var(--s)*0.15)] text-white"
					aria-hidden="true">✓</span
				>
			{:else}
				<span
					class="twinkle absolute right-[12%] bottom-[12%] size-[calc(var(--s)*0.12)] rounded-full bg-gold text-gold"
					aria-hidden="true"
				></span>
			{/if}
		{:else}
			<!-- Ribbon cross and bow -->
			<span class="absolute inset-y-0 left-1/2 w-[14%] -translate-x-1/2 bg-(--ribbon)/90" aria-hidden="true"></span>
			<span class="absolute inset-x-0 top-1/2 h-[14%] -translate-y-1/2 bg-(--ribbon)/90" aria-hidden="true"></span>
			<Bow class="absolute top-1/2 left-1/2 w-[64%] -translate-x-1/2 -translate-y-[78%] drop-shadow-sm" />
			<span
				class="relative rounded-full bg-white/90 px-[0.35em] text-[calc(var(--s)*0.22)] font-bold text-(--gift) tabular-nums shadow-sm"
			>
				{lot.day}
			</span>
		{/if}
	</button>
	{#if hint}
		<span
			role="status"
			class="absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 rounded-full bg-foreground px-3 py-1 text-xs font-semibold whitespace-nowrap text-background shadow-lg"
		>
			🔒 {unlocksShort}
		</span>
	{/if}
</div>
