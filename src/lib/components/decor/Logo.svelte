<script lang="ts">
	// Club logo: an open diamond with three bars, redrawn from the club's artwork.
	let { class: className = '', strokeWidth = 9 }: { class?: string; strokeWidth?: number } = $props();
</script>

<svg viewBox="0 0 200 200" class={className} role="img" aria-label="Logo du club électronique">
	<g fill="none" stroke="currentColor" stroke-width={strokeWidth} stroke-linecap="round" stroke-linejoin="round">
		<path data-part="frame" pathLength="1" d="M130 58 L100 30 L28 100 L100 170 L128 142" />
		<path data-part="bar" pathLength="1" d="M112 103 L143 72" />
		<path data-part="bar" pathLength="1" d="M126 116 L157 85" />
		<path data-part="bar" pathLength="1" d="M141 129 L172 98" />
	</g>
</svg>
