<script lang="ts">
	import './layout.css';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import favicon from '#lib/assets/favicon.svg';
	import Logo from '#lib/components/decor/Logo.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="theme-color" content="#f2ead9" />
</svelte:head>

<header class="flex h-15 items-center justify-between gap-4 px-[clamp(1rem,4vw,3rem)] text-[0.9375rem] font-medium">
	<a href={resolve('/')} class="flex items-center gap-2.5 whitespace-nowrap">
		<Logo class="w-6.5 text-(--red)" strokeWidth={14} />
		Club électronique · INSSET
	</a>
	<a
		href={resolve('/reglement')}
		aria-current={page.url.pathname === resolve('/reglement') ? 'page' : undefined}
		class="underline decoration-1 underline-offset-4 aria-[current=page]:no-underline"
	>
		Règlement
	</a>
</header>

<main class="flex w-full flex-1 flex-col px-[clamp(1rem,4vw,3rem)]">
	{@render children()}
</main>

<footer class="px-4 py-4 text-center text-[0.8125rem]">
	Club électronique de l'INSSET · Tirage vérifiable,
	<a class="underline decoration-1 underline-offset-4" href="https://github.com/YoniTne/advent-calendar">code public</a>
</footer>
