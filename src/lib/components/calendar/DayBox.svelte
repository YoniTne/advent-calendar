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
	}: { lot: Lot; box: BoxState; today: boolean; unlocksAt: string; unlocksShort: string; onselect: () => void } = $props();

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

	function track(event: PointerEvent) {
		if (event.pointerType !== 'mouse' || prefersReducedMotion()) return;
		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
		const px = (event.clientX - rect.left) / rect.width - 0.5;
		const py = (event.clientY - rect.top) / rect.height - 0.5;
		tilt.target = { x: -py * 14, y: px * 14 };
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

	let hint = $state(false);
	let hintTimer: ReturnType<typeof setTimeout>;
</script>

<button
	type="button"
	aria-label={label}
	onclick={activate}
	onpointerdown={() => (pressed = true)}
	onpointerup={() => (pressed = false)}
	onpointermove={track}
	onpointerleave={release}
	style:--gift={giftColor(lot.day)}
	style:transform={`perspective(700px) rotateX(${tilt.current.x}deg) rotateY(${tilt.current.y}deg) rotate(${wiggle.current}deg) scale(${pressed ? 0.94 : 1})`}
	class={[
		'group relative flex aspect-square w-full flex-col items-start overflow-hidden rounded-2xl p-2.5 text-left shadow-md transition-[scale,box-shadow] duration-100 will-change-transform sm:p-3',
		'focus-visible:outline-2 focus-visible:outline-offset-2',
		open ? 'gift-open glass' : 'gift-paper text-white',
		today && 'glow-ring bob overflow-visible'
	]}
>
	{#if open}
		<span class="text-2xl font-bold tracking-tight text-(--gift) tabular-nums sm:text-3xl">{lot.day}</span>
		<span class="mt-auto line-clamp-2 hidden text-xs leading-snug font-medium sm:block">{lot.title}</span>
		{#if box.kind === 'revealed'}
			<span
				class="absolute top-2 right-2 grid size-5 place-items-center rounded-full bg-(--gift) text-[0.65rem] text-white"
				aria-hidden="true">✓</span
			>
		{:else}
			<span
				class={['absolute top-2.5 right-2.5 size-2 rounded-full bg-gold', 'twinkle text-gold']}
				aria-hidden="true"
			></span>
		{/if}
	{:else}
		<!-- Ribbon cross and bow -->
		<span class="absolute inset-y-0 left-1/2 w-[14%] -translate-x-1/2 bg-(--ribbon)/90" aria-hidden="true"></span>
		<span class="absolute inset-x-0 top-1/2 h-[14%] -translate-y-1/2 bg-(--ribbon)/90" aria-hidden="true"></span>
		<Bow class="absolute top-1/2 left-1/2 w-[62%] -translate-x-1/2 -translate-y-[78%] drop-shadow-sm" />
		<span
			class="relative rounded-full bg-white/90 px-2 py-0.5 text-sm font-bold text-(--gift) tabular-nums shadow-sm sm:text-base"
		>
			{lot.day}
		</span>
		{#if hint}
			<span
				class="absolute inset-x-1 bottom-1.5 rounded-lg bg-black/55 px-1 py-0.5 text-center text-[0.6rem] leading-tight font-medium backdrop-blur-sm sm:text-xs"
				role="status"
			>
				🔒 {unlocksShort}
			</span>
		{/if}
	{/if}
</button>
