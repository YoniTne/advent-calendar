<script lang="ts">
	let { class: className = '' }: { class?: string } = $props();
</script>

<svg viewBox="0 0 40 24" aria-hidden="true" class={className}>
	<path d="M20 12C14 2 3 1 4 9c1 6 10 5 16 3z" fill="var(--ribbon)" stroke="oklch(0 0 0 / 22%)" stroke-width="0.8" />
	<path d="M20 12c6-10 17-11 16-3-1 6-10 5-16 3z" fill="var(--ribbon)" stroke="oklch(0 0 0 / 22%)" stroke-width="0.8" />
	<path d="M20 12 13 23M20 12l7 11" stroke="var(--ribbon)" stroke-width="3" stroke-linecap="round" />
	<circle cx="20" cy="12" r="3.2" fill="var(--ribbon)" stroke="oklch(0 0 0 / 22%)" stroke-width="0.8" />
	<path d="M20 12C15 5 8 4 8 9" fill="none" stroke="oklch(0 0 0 / 12%)" stroke-width="1" />
	<path d="M20 12c5-7 12-8 12-3" fill="none" stroke="oklch(0 0 0 / 12%)" stroke-width="1" />
</svg>
