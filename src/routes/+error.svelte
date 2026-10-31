<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>Page not found</title>
</svelte:head>

<main>
	<h1>
		{page.status === 404 ? 'This page hasn’t been written yet.' : page.error?.message}
	</h1>
	<a href={resolve('/')}>Go back to all the days</a>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: center;
		gap: 2rem;
		min-height: 100svh;
		padding: var(--gutter);
	}

	h1 {
		max-width: 12em;
		font-family: var(--display);
		font-size: clamp(3rem, 8vw, 7rem);
		font-weight: 400;
		line-height: 1;
	}

	a {
		font-family: var(--ui);
		font-size: 1rem;
	}
</style>
