<script lang="ts">
	import { onMount } from 'svelte';
	import { editionYear } from '#lib/data.js';
	import Logo from './Logo.svelte';
	import { splash } from './splash.svelte.js';

	let root = $state<HTMLDivElement>()!;
	let mark = $state<HTMLDivElement>()!;
	let count = $state(0);
	let gone = $state(false);
	let opening = false;

	onMount(() => {
		// The inline script in app.html already hid us for repeat visits and reduced motion.
		if (document.documentElement.dataset.splash === 'off') {
			gone = true;
			splash.open = true;
			return;
		}
		try {
			sessionStorage.setItem('splash-seen', '1');
		} catch {
			// Storage unavailable: the splash simply shows again next time.
		}

		const ease = 'cubic-bezier(0.65, 0, 0.35, 1)';
		mark.querySelectorAll('path').forEach((path, i) =>
			path.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
				duration: i === 0 ? 900 : 360,
				delay: i === 0 ? 150 : 800 + i * 110,
				easing: ease,
				fill: 'both'
			})
		);

		const start = performance.now();
		let frame = requestAnimationFrame(function tick(time) {
			count = Math.min(24, Math.floor(((time - start) / 1500) * 24));
			if (count < 24) frame = requestAnimationFrame(tick);
		});
		const timer = setTimeout(open, 1900);
		addEventListener('pointerdown', open, { once: true });
		addEventListener('keydown', open, { once: true });
		return () => {
			cancelAnimationFrame(frame);
			clearTimeout(timer);
			removeEventListener('pointerdown', open);
			removeEventListener('keydown', open);
		};
	});

	/** A diamond window, the shape of the logo, opens from its centre onto the site. */
	function open() {
		if (opening || gone) return;
		opening = true;
		splash.open = true;
		const rect = mark.getBoundingClientRect();
		const cx = rect.left + rect.width / 2;
		const cy = rect.top + rect.height / 2;
		const reach = Math.max(cx, innerWidth - cx) + Math.max(cy, innerHeight - cy);
		const start = performance.now();
		requestAnimationFrame(function step(time) {
			const t = Math.min(1, (time - start) / 950);
			const e = t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
			const r = e * reach;
			root.style.clipPath = `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${cx}px ${cy - r}px, ${cx + r}px ${cy}px, ${cx}px ${cy + r}px, ${cx - r}px ${cy}px, ${cx}px ${cy - r}px)`;
			mark.style.transform = `scale(${1 + e * 5})`;
			mark.style.opacity = String(1 - e);
			if (t < 1) requestAnimationFrame(step);
			else gone = true;
		});
	}
</script>

{#if !gone}
	<div bind:this={root} class="splash fixed inset-0 z-[100] bg-[#161616] text-[#efefef] select-none" aria-hidden="true">
		<div class="absolute top-6 right-6 left-1/2 text-xs leading-relaxed font-medium sm:top-10 sm:text-sm">
			Club électronique<br />Avent {editionYear} — 1 → 24
		</div>

		<div
			bind:this={mark}
			class="absolute top-1/2 left-1/2 w-[clamp(7rem,30vw,11rem)] -translate-x-1/2 -translate-y-1/2 will-change-transform sm:left-[30%]"
		>
			<Logo class="splash-logo w-full" strokeWidth={8} />
		</div>

		<div class="absolute bottom-6 left-6 font-mono text-4xl font-light tracking-tight tabular-nums sm:bottom-10 sm:text-6xl">
			{String(count).padStart(2, '0')}<span class="text-[#efefef]/35">/24</span>
		</div>

		<div
			class="absolute right-6 bottom-6 border border-current px-1.5 py-1 text-[0.6rem] leading-[1.15] font-bold tracking-wider uppercase sm:right-10 sm:bottom-10 sm:text-xs"
		>
			Club<br />Électro<br />INSSET
		</div>
	</div>
{/if}
