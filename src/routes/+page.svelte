<script lang="ts">
	import { asset } from '$app/paths';
	import Footer from '#lib/components/Footer.svelte';
	import Facts from '#lib/components/Facts.svelte';
	import Happy from '#lib/components/Happy.svelte';
	import Hero from '#lib/components/Hero.svelte';
	import Index from '#lib/components/Index.svelte';
	import InkQuote from '#lib/components/InkQuote.svelte';
	import Midnight from '#lib/components/Midnight.svelte';
	import Scraps from '#lib/components/Scraps.svelte';
	import Tally from '#lib/components/Tally.svelte';
	import WashingLine from '#lib/components/WashingLine.svelte';
	import { author } from '#lib/site.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const description = $derived(
		`${author} is writing every day for ${data.days.length} days, one prompt at a time. Read every page so far.`
	);
</script>

<svelte:head>
	<title>{author}: {data.days.length} days of writing</title>
	<meta name="description" content={description} />
	<meta property="og:title" content="{author}: {data.days.length} days of writing" />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={asset('collage/photo.webp')} />
	<link rel="preload" as="image" href={asset('collage/photo-base.webp')} />
</svelte:head>

<main>
	<Hero />
	<Tally days={data.days} noDayMissed={data.noDayMissed} />
	<Midnight days={data.days} />
	<WashingLine days={data.days} />
	<Scraps asides={data.asides} />
	{#if data.facts}<Facts list={data.facts} />{/if}
	{#if data.happy}<Happy list={data.happy} />{/if}
	<Index days={data.days} />
	<InkQuote />
</main>
<Footer />
