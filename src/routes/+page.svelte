<script lang="ts">
	// A tree of 24 gifts, today's prize and tomorrow's teaser, drawn like a printed card:
	// flat inks on cream paper (palette and fonts in layout.css).
	import { useCalendar } from '#lib/calendar-view.svelte.js';
	import { reveal } from '#lib/components/calendar/reveal.js';
	import Bow from '#lib/components/decor/Bow.svelte';
	import Logo from '#lib/components/decor/Logo.svelte';
	import { editionYear } from '#lib/data.js';

	const cal = useCalendar();
	let selected = $state<number | null>(null);
	const shown = $derived(selected === null ? cal.featured : cal.days[selected - 1]);
	// Tomorrow's prize, once it is announced (the day before at 18:00).
	const next = $derived(cal.days.find((d) => d.box.kind === 'announced' && !d.isToday));

	// Same tree as the current site: 24 crowns it, 4–9 form the lowest branch, 1–3 are the gifts at its foot.
	const tiers = [[24], [22, 23], [19, 20, 21], [15, 16, 17, 18], [10, 11, 12, 13, 14], [4, 5, 6, 7, 8, 9]];
	const underTree = [1, 2, 3];
	const papers = ['#b8322a', '#25406e', '#e2a08a'];

	let panel = $state<HTMLElement>();
	function select(day: number) {
		selected = day;
		// On phones the detail sits below the tree.
		panel?.scrollIntoView({ block: 'nearest' });
	}
</script>

<svelte:head>
	<title>Calendrier de l'avent · Club électronique INSSET</title>
	<meta name="description" content="Un lot par jour du 1er au 24 décembre, tiré au sort chaque matin à 8h." />
</svelte:head>

{#snippet gift(day: number)}
	{@const d = cal.days[day - 1]}
	<button
		type="button"
		class={[d.box.kind, d.isToday && 'now']}
		style:--c={papers[day % 3]}
		style:--d={day}
		aria-pressed={shown === d}
		aria-label={`Jour ${day}${d.open ? ` : ${d.lot.title}` : `, ${d.status}`}`}
		onclick={() => select(day)}
	>
		{#if !d.open}<Bow class="bow" />{/if}
		<span>{day}</span>
	</button>
{/snippet}

<div class="alt">
	<div class="layout">
		<section class="title">
			<h1>Calendrier <em>de l'avent</em> <span>{editionYear}</span></h1>
			<p>24 jours, 24 cadeaux, un tirage chaque matin à 8h.</p>
		</section>

		<section class="tree" aria-labelledby="tree-title">
			<h2 id="tree-title" class="sr-only">Les 24 cadeaux</h2>
			{#if cal.days.length}
				<div class="fir">
					<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
						<path
							d="M50 0 L63 17 L57 17 L72 35 L65 35 L81 55 L73 55 L90 76 L82 76 L100 100 L0 100 L18 76 L10 76 L27 55 L19 55 L35 35 L28 35 L43 17 L37 17 Z"
						/>
					</svg>
					<Logo class="star" strokeWidth={16} />
					<i style="--x: -1; --y: 0.2; --w: 0.2"></i>
					<i style="--x: 0.72; --y: 0; --w: 0.28; --delay: 0.8s"></i>
					<i style="--x: 0.95; --y: 0.8; --w: 0.16; --delay: 1.6s"></i>
					{#each tiers as tier, i (i)}
						<div class="tier">
							{#each tier as day (day)}{@render gift(day)}{/each}
						</div>
					{/each}
				</div>
				<div class="trunk"></div>
				<div class="tier foot">
					{#each underTree as day (day)}{@render gift(day)}{/each}
				</div>
			{/if}
		</section>

		<section class="detail" bind:this={panel} aria-live="polite">
			{#if shown}
				<article class="today">
					<p class="label">{shown.isToday ? "Aujourd'hui" : `Jour ${shown.lot.day}`} · {shown.date}</p>
					<h2>{shown.open ? shown.lot.title : 'Encore emballé'}</h2>
					{#if shown.open}
						<p class="desc">{shown.lot.description}</p>
					{/if}
					<div class="result">
						{#if shown.winners.length}
							<p class="small">{shown.winners.length > 1 ? 'Les gagnants' : 'Le gagnant'}</p>
							<ul>
								{#each shown.winners as winner, i (winner.id)}
									<li in:reveal={{ delay: 150 + i * 160 }}>{winner.display}</li>
								{/each}
							</ul>
						{:else}
							<p class="status">{shown.status}</p>
						{/if}
						{#if shown.proof}
							<p class="small">
								<a href={shown.proof.href}>Round drand n° {shown.proof.round}</a> · {shown.proof.candidates} participants en
								lice
							</p>
						{/if}
					</div>
				</article>
				{#if next && next !== shown}
					<article class="next">
						<Bow class="knot" />
						<p class="label">Demain · {next.date}</p>
						<h3>{next.lot.title}</h3>
						<p>{next.lot.description}</p>
					</article>
				{/if}
			{/if}
		</section>
	</div>
</div>

<style>
	.alt {
		--s: min(11.8vw, 4.75rem);
		--g: calc(var(--s) * 0.16);
		display: flex;
		flex: 1;
		flex-direction: column;
	}
	a {
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 0.2em;
	}

	.layout {
		display: grid;
		flex: 1;
		align-content: start;
		gap: 1.75rem;
		padding: 1rem 0 2.5rem;
	}
	h1,
	h2,
	h3,
	.result li,
	.status,
	button {
		font-family: var(--font-serif);
	}
	h1 {
		font-size: clamp(2.6rem, 10vw, 4.75rem);
		font-weight: 700;
		line-height: 0.98;
		letter-spacing: -0.025em;
		text-wrap: balance;
	}
	h1 em {
		font-weight: 600;
		color: var(--pine);
	}
	h1 span {
		color: var(--red);
	}
	.title p {
		margin-top: 0.9rem;
		max-width: 26ch;
		font-size: 1.125rem;
	}
	.label,
	.small {
		font-size: 0.8125rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
	.small {
		font-weight: 500;
	}

	/* ---------- Tree ---------- */
	.tree {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-height: calc(var(--s) * 10);
	}
	.fir {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--g);
		padding-top: calc(var(--s) * 1.5);
	}
	.fir svg {
		position: absolute;
		top: calc(var(--s) * 0.9);
		left: 50%;
		width: min(calc(var(--s) * 8.6), calc(100vw - 1.5rem));
		height: calc(100% - var(--s) * 0.65);
		translate: -50% 0;
		fill: var(--pine);
	}
	.alt :global(.star) {
		position: absolute;
		top: 0;
		left: 50%;
		width: calc(var(--s) * 1.4);
		translate: -50% 0;
		color: var(--mustard);
	}
	/* Sparkles around the star, twinkling in turn. */
	.fir i {
		position: absolute;
		top: calc(var(--s) * var(--y));
		left: calc(50% + var(--s) * var(--x));
		width: calc(var(--s) * var(--w));
		aspect-ratio: 1;
		background: var(--mustard);
		clip-path: polygon(50% 0, 60% 40%, 100% 50%, 60% 60%, 50% 100%, 40% 60%, 0 50%, 40% 40%);
		animation: twinkle 2.4s var(--delay, 0s) ease-in-out infinite both;
	}
	@keyframes twinkle {
		0%,
		100% {
			scale: 0;
			opacity: 0;
		}
		50% {
			scale: 1;
			opacity: 1;
		}
	}
	.tier {
		position: relative;
		display: flex;
		gap: var(--g);
	}
	.trunk {
		width: calc(var(--s) * 0.7);
		height: calc(var(--s) * 0.5);
		margin-top: calc(var(--s) * 0.24);
		background: #6b4a2f;
	}
	.foot {
		margin-top: calc(var(--s) * -0.15);
	}

	/* A wrapped gift: flat paper, a cream ribbon cross, the bow, the day on a tag. */
	button {
		position: relative;
		display: grid;
		place-items: center;
		width: var(--s);
		aspect-ratio: 1;
		border-radius: calc(var(--s) * 0.08);
		background:
			linear-gradient(var(--ribbon) 0 0) center / 14% 100% no-repeat,
			linear-gradient(var(--ribbon) 0 0) center / 100% 14% no-repeat,
			var(--c);
		box-shadow: inset 0 0 0 1.5px rgb(0 0 0 / 22%);
		font-size: calc(var(--s) * 0.24);
		font-weight: 700;
		font-variant-numeric: tabular-nums lining-nums;
		cursor: pointer;
		transition: translate 0.12s;
		animation: rise 0.45s calc(var(--d) * 35ms) both cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	button span {
		position: relative;
		display: grid;
		place-items: center;
		width: 44%;
		aspect-ratio: 1;
		margin-top: 30%;
		border-radius: 50%;
		background: var(--ribbon);
		color: var(--ink);
	}
	button :global(.bow) {
		position: absolute;
		top: 2%;
		left: 18%;
		width: 64%;
	}
	button:hover {
		translate: 0 -3px;
	}
	button:active {
		translate: 0 1px;
	}
	button:focus-visible,
	button[aria-pressed='true'] {
		outline: 3px solid var(--ink);
		outline-offset: 2px;
	}
	.fir button:focus-visible,
	.fir button[aria-pressed='true'] {
		outline-color: var(--paper);
	}
	/* Unwrapped: the open box, with the day in the paper's colour. */
	button:not(.locked) {
		background: #fbf6ea;
		box-shadow: inset 0 0 0 calc(var(--s) * 0.05) var(--c);
		font-size: calc(var(--s) * 0.44);
	}
	button:not(.locked) span {
		width: auto;
		aspect-ratio: auto;
		margin: 0;
		background: none;
		color: var(--c);
	}
	button.revealed {
		background: var(--c);
	}
	button.revealed span {
		color: #fbf6ea;
	}
	button.now {
		background: var(--mustard);
		box-shadow: inset 0 0 0 calc(var(--s) * 0.05) var(--ink);
	}
	button.now span {
		color: var(--ink);
	}
	@keyframes rise {
		from {
			opacity: 0;
			translate: 0 1.5rem;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.fir i,
		button {
			animation: none;
			transition: none;
		}
	}

	/* ---------- Today and tomorrow ---------- */
	.today {
		padding: 1.5rem;
		border-radius: 0.5rem;
		background: var(--pine);
		color: var(--paper);
	}
	.today .label {
		color: var(--mustard);
	}
	.today h2 {
		margin-top: 0.6rem;
		font-size: clamp(2rem, 6vw, 2.9rem);
		font-weight: 700;
		line-height: 1;
		letter-spacing: -0.02em;
	}
	.desc {
		margin-top: 0.5rem;
		font-size: 1.0625rem;
	}
	.result {
		margin-top: 1.25rem;
		padding-top: 1rem;
		border-top: 1px solid rgb(242 234 217 / 30%);
	}
	.result ul {
		margin: 0.2rem 0 0.9rem;
	}
	.result li,
	.status {
		font-size: 1.75rem;
		font-weight: 600;
		line-height: 1.2;
		font-variant-numeric: tabular-nums lining-nums;
	}
	.status {
		margin-bottom: 0.25rem;
	}
	.next {
		position: relative;
		margin-top: 1rem;
		padding: 1.25rem 5.5rem 1.25rem 1.5rem;
		overflow: hidden;
		border-radius: 0.5rem;
		background: linear-gradient(var(--ribbon) 0 0) right 2.4rem top / 0.9rem 100% no-repeat, var(--red);
		color: #fff;
	}
	.next :global(.knot) {
		position: absolute;
		top: 50%;
		right: 0.85rem;
		width: 4rem;
		translate: 0 -50%;
	}
	.next h3 {
		margin-top: 0.4rem;
		font-size: 1.5rem;
		font-weight: 700;
		line-height: 1.1;
	}

	/* Desktop, as on the current site: title and today on the left, the tree on the right. */
	@media (min-width: 64rem) {
		.alt {
			--s: min(5.2vw, 4.75rem);
		}
		.layout {
			grid-template-columns: 1fr 1fr;
			grid-template-rows: 1fr auto auto 1fr;
			gap: 2rem 4rem;
		}
		.title,
		.detail {
			grid-column: 1;
			width: 100%;
			max-width: 36rem;
			margin: 0 auto;
		}
		.title {
			grid-row: 2;
		}
		.detail {
			grid-row: 3;
		}
		.tree {
			grid-column: 2;
			grid-row: 1 / -1;
			align-self: center;
		}
	}
</style>
