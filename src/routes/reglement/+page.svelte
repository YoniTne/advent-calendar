<script lang="ts">
	import { commitment, editionYear, REPOSITORY_URL } from '#lib/data.js';

	const sections = [
		{
			title: 'Qui peut participer ?',
			body: [
				`Les étudiants et personnels de l'INSSET inscrits via le formulaire du club avant le 30 novembre ${editionYear}. La liste est figée à la clôture.`
			]
		},
		{
			title: 'Comment ça marche ?',
			body: [
				'Du 1er au 24 décembre, chaque case cache un lot. Il est dévoilé la veille à 18h.',
				'Le tirage a lieu chaque matin à 7h45, week-ends compris. Les gagnants apparaissent sur le site à 8h.',
				'Une même personne ne peut gagner qu’une seule fois sur tout le calendrier. Certains lots ont plusieurs gagnants.'
			]
		},
		{
			title: 'Récupérer son lot',
			body: [
				'Les gagnants sont prévenus par e-mail par le club. Les lots se récupèrent au local du club ; pour les tirages pendant les vacances, à la rentrée.',
				'Un lot non réclamé retourne dans l’armoire du club. Il n’y a pas de nouveau tirage.'
			]
		}
	];

	const proof = [
		{ label: 'Participants', value: String(commitment.participantCount) },
		{ label: 'Empreinte SHA-256 de la liste', value: commitment.listSha256, mono: true },
		{ label: 'Publiée le', value: commitment.publishedAt },
		{ label: 'Balise drand', value: `${commitment.drand.network} · ${commitment.drand.chainHash}`, mono: true }
	];
</script>

<svelte:head>
	<title>Règlement & fonctionnement · Calendrier de l'avent</title>
</svelte:head>

<div class="rules">
	<h1>Règlement <em>&amp; fonctionnement</em></h1>

	<!-- Desktop: the rules on the left, the fairness proof on the right. -->
	<div class="cols">
		<div>
			{#each sections as section (section.title)}
				<section class="rule">
					<h2>{section.title}</h2>
					{#each section.body as paragraph, i (i)}
						<p>{paragraph}</p>
					{/each}
				</section>
			{/each}
		</div>

		<section class="proof">
			<p class="label">La preuve</p>
			<h2>Un tirage vérifiable</h2>
			<p>
				Personne, pas même le club, ne peut choisir les gagnants. Le 1er décembre, nous publions l’empreinte de la liste
				des inscrits : la liste ne peut plus changer sans que ça se voie. Chaque matin, le hasard vient de
				<a href="https://drand.love">drand</a>, une balise publique qui produit toutes les 3 secondes un nombre
				aléatoire que personne ne peut prévoir. Le tirage utilise celui de 7h45 pile, et le programme qui calcule les
				gagnants est
				<a href={REPOSITORY_URL}>public</a> : chacun peut refaire le calcul.
			</p>
			<dl>
				{#each proof as item (item.label)}
					<div>
						<dt>{item.label}</dt>
						<dd class={{ mono: item.mono }}>{item.value}</dd>
					</div>
				{/each}
			</dl>
		</section>
	</div>
</div>

<style>
	.rules {
		width: 100%;
		max-width: 68rem;
		margin: 0 auto;
		padding: 1rem 0 2.5rem;
		line-height: 1.5;
	}
	h1,
	h2 {
		font-family: var(--font-serif);
		font-weight: 700;
		letter-spacing: -0.02em;
	}
	h1 {
		font-size: clamp(2.4rem, 8vw, 4rem);
		line-height: 1;
		text-wrap: balance;
	}
	h1 em {
		font-weight: 600;
		color: var(--pine);
	}
	h2 {
		font-size: 1.5rem;
		line-height: 1.15;
	}
	a {
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 0.2em;
	}
	.cols {
		display: grid;
		gap: 2rem;
		margin-top: 2rem;
	}
	.rule {
		padding: 1.1rem 0 1.4rem;
		border-top: 1.5px solid var(--ink);
	}
	.rule p {
		margin-top: 0.5rem;
		max-width: 62ch;
		font-size: 1.0625rem;
	}
	.proof {
		align-self: start;
		padding: 1.5rem;
		border-radius: 0.5rem;
		background: var(--pine);
		color: var(--paper);
	}
	.label {
		margin-bottom: 0.5rem;
		color: var(--mustard);
		font-size: 0.8125rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
	.proof > p:not(.label) {
		margin-top: 0.6rem;
	}
	dl {
		margin-top: 1.25rem;
	}
	dl div {
		padding: 0.7rem 0;
		border-top: 1px solid rgb(242 234 217 / 30%);
	}
	dt {
		font-size: 0.8125rem;
		font-weight: 500;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
	dd {
		margin-top: 0.15rem;
		overflow-wrap: anywhere;
		font-family: var(--font-serif);
		font-size: 1.25rem;
		font-weight: 600;
	}
	dd.mono {
		font-family: ui-monospace, 'Cascadia Mono', Menlo, monospace;
		font-size: 0.75rem;
		font-weight: 400;
	}

	@media (min-width: 64rem) {
		.cols {
			grid-template-columns: minmax(0, 1fr) minmax(0, 26rem);
			gap: 3.5rem;
		}
	}
</style>
