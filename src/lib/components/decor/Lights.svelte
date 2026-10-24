<script lang="ts">
	// A string of fairy lights hanging under the header.
	const colors = ['var(--gift-1)', 'var(--gold)', 'var(--gift-2)', 'var(--gift-5)', 'var(--gift-4)'];
	const bulbs = Array.from({ length: 18 }, (_, i) => ({
		x: 2.5 + i * 5.6,
		y: 6 + Math.sin((i / 17) * Math.PI * 3) * 3,
		color: colors[i % colors.length],
		delay: (i * 0.37) % 2.4
	}));
</script>

<svg viewBox="0 0 100 14" preserveAspectRatio="none" aria-hidden="true" class="pointer-events-none h-5 w-full">
	<path
		d={`M0 4 ${bulbs.map((b) => `L${b.x} ${b.y - 2.2}`).join(' ')} L100 4`}
		fill="none"
		stroke="currentColor"
		stroke-width="0.25"
		class="text-foreground/30"
		vector-effect="non-scaling-stroke"
	/>
	{#each bulbs as bulb, i (i)}
		<ellipse
			cx={bulb.x}
			cy={bulb.y}
			rx="0.9"
			ry="2"
			fill={bulb.color}
			style:color={bulb.color}
			style:animation-delay={`${bulb.delay}s`}
			class="twinkle"
		/>
	{/each}
</svg>
