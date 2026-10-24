<script lang="ts">
	import { fly } from 'svelte/transition';
	import { prefersReducedMotion } from './gift.js';

	let { target, now }: { target: number; now: number } = $props();

	const parts = $derived.by(() => {
		const total = Math.max(0, Math.floor((target - now) / 1000));
		const units = [
			{ label: 'h', value: Math.floor(total / 3600) },
			{ label: 'min', value: Math.floor(total / 60) % 60 },
			{ label: 's', value: total % 60 }
		];
		const days = Math.floor(total / 86_400);
		if (days > 0) units[0].value %= 24;
		return days > 0 ? [{ label: 'j', value: days }, ...units] : units;
	});
	const motion = prefersReducedMotion() ? 0 : 1;
</script>

<div class="flex gap-2" role="timer" aria-label={parts.map((p) => `${p.value} ${p.label}`).join(' ')}>
	{#each parts as part (part.label)}
		<div class="flex flex-col items-center">
			<span
				class="relative grid h-14 w-14 place-items-center overflow-hidden rounded-2xl bg-foreground text-2xl font-bold text-background tabular-nums shadow-lg sm:h-16 sm:w-16 sm:text-3xl"
			>
				{#key part.value}
					<span class="absolute" in:fly={{ y: -24 * motion, duration: 350 }} out:fly={{ y: 24 * motion, duration: 350 }}>
						{String(part.value).padStart(2, '0')}
					</span>
				{/key}
			</span>
			<span class="mt-1 text-xs text-muted-foreground">{part.label}</span>
		</div>
	{/each}
</div>
