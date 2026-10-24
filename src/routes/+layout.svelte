<script lang="ts">
	import './layout.css';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import favicon from '#lib/assets/favicon.svg';
	import Lights from '#lib/components/decor/Lights.svelte';
	import Snow from '#lib/components/decor/Snow.svelte';
	import Splash from '#lib/components/decor/Splash.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const links = [
		{ href: resolve('/'), label: 'Calendrier' },
		{ href: resolve('/reglement'), label: 'Règlement' }
	];
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="theme-color" content="#f9f6ef" media="(prefers-color-scheme: light)" />
	<meta name="theme-color" content="#0c1916" media="(prefers-color-scheme: dark)" />
</svelte:head>

<Splash />
<Snow />

<header class="material sticky top-0 z-40">
	<nav class="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
		<a href={resolve('/')} class="flex items-center gap-2 font-semibold tracking-tight">
			<span aria-hidden="true" class="text-gold twinkle">✦</span>
			<span>Club électronique</span>
		</a>
		<ul class="flex gap-1 text-sm">
			{#each links as link (link.href)}
				<li>
					<a
						href={link.href}
						aria-current={page.url.pathname === link.href ? 'page' : undefined}
						class="rounded-full px-3 py-1.5 text-muted-foreground transition-colors duration-100 hover:text-foreground active:bg-secondary aria-[current=page]:bg-secondary aria-[current=page]:text-foreground"
					>
						{link.label}
					</a>
				</li>
			{/each}
		</ul>
	</nav>
	<div class="absolute inset-x-0 top-full"><Lights /></div>
</header>

<main class="mx-auto max-w-6xl px-4 pt-10 pb-16">
	{@render children()}
</main>

<footer class="mx-auto max-w-6xl px-4 pb-10 text-center text-xs text-muted-foreground">
	Club électronique de l'INSSET · Tirage vérifiable,
	<a class="underline underline-offset-2" href="https://github.com/YoniTne/advent-calendar">code public</a>
	· Photo :
	<a class="underline underline-offset-2" href="https://commons.wikimedia.org/wiki/File:Beaulieu_Christmas_Trees_(Unsplash).jpg"
		>Annie Spratt</a
	>, CC0
</footer>
