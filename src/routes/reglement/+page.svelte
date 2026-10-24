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

<div class="max-w-3xl">
<h1 class="text-display">Règlement & fonctionnement</h1>

<div class="mt-8 space-y-8">
	{#each sections as section (section.title)}
		<section>
			<h2 class="text-xl font-semibold tracking-tight">{section.title}</h2>
			{#each section.body as paragraph, i (i)}
				<p class="mt-2 leading-relaxed text-muted-foreground">{paragraph}</p>
			{/each}
		</section>
	{/each}

	<section>
		<h2 class="text-xl font-semibold tracking-tight">Un tirage vérifiable</h2>
		<p class="mt-2 leading-relaxed text-muted-foreground">
			Personne, pas même le club, ne peut choisir les gagnants. Le 1er décembre, nous publions l’empreinte de la liste
			des inscrits : la liste ne peut plus changer sans que ça se voie. Chaque matin, le hasard vient de
			<a class="text-primary underline underline-offset-2" href="https://drand.love">drand</a>, une balise publique qui
			produit toutes les 3 secondes un nombre aléatoire que personne ne peut prévoir. Le tirage utilise celui de 7h45
			pile, et le programme qui calcule les gagnants est
			<a class="text-primary underline underline-offset-2" href={REPOSITORY_URL}>public</a> : chacun peut refaire le calcul.
		</p>
		<dl class="mt-4 divide-y divide-border rounded-2xl border border-border bg-card text-sm">
			{#each proof as item (item.label)}
				<div class="px-4 py-3">
					<dt class="text-muted-foreground">{item.label}</dt>
					<dd class={['mt-0.5 break-all', item.mono && 'font-mono text-xs']}>{item.value}</dd>
				</div>
			{/each}
		</dl>
	</section>
</div>
</div>
