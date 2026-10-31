<script lang="ts">
	import '@fontsource-variable/bodoni-moda/standard.css';
	import '@fontsource-variable/bodoni-moda/standard-italic.css';
	import '@fontsource-variable/instrument-sans/wght.css';
	import '@fontsource-variable/newsreader/wght.css';
	import '@fontsource-variable/newsreader/wght-italic.css';
	import '@fontsource/noto-serif-ethiopic/ethiopic-400.css';
	import '@fontsource/reenie-beanie/400.css';
	import mastheadFont from '@fontsource-variable/bodoni-moda/files/bodoni-moda-latin-standard-normal.woff2?url';
	import './layout.css';
	import { onMount } from 'svelte';
	import { afterNavigate, onNavigate } from '$app/navigation';
	import { asset } from '$app/paths';
	import Dino from '#lib/components/Dino.svelte';
	import Header from '#lib/components/Header.svelte';
	import InkTrail from '#lib/components/InkTrail.svelte';
	import { prefersMotion, ScrollTrigger, smoothScroll, startSmoothScroll } from '#lib/motion.ts';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	onMount(() => {
		const stop = startSmoothScroll();
		document.fonts?.ready.then(() => ScrollTrigger.refresh());
		return stop;
	});

	onNavigate((navigation) => {
		if (!document.startViewTransition || !prefersMotion()) return;
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});

	afterNavigate(({ type }) => {
		const lenis = smoothScroll();
		if (lenis) {
			lenis.resize();
			if (type !== 'popstate' && type !== 'enter')
				lenis.scrollTo(0, { immediate: true, force: true });
		}
		ScrollTrigger.refresh();
	});
</script>

<svelte:head>
	<link rel="icon" href={asset('favicon.png')} type="image/png" />
	<link rel="preload" as="font" type="font/woff2" href={mastheadFont} crossorigin="anonymous" />
</svelte:head>

<Header />
{@render children()}
<Dino />
<InkTrail />
