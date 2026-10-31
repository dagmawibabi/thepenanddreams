<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { author, channel } from '#lib/site.ts';
	import { magnetic } from '#lib/motion.ts';

	let tucked = $state(false);
	let pastHero = $state(false);

	const onHome = $derived(page.route.id === '/');
	const showName = $derived(!onHome || pastHero);

	onMount(() => {
		let last = window.scrollY;
		const onScroll = () => {
			const y = window.scrollY;
			if (Math.abs(y - last) > 6) {
				tucked = y > last && y > 200;
				last = y;
			}
			pastHero = y > window.innerHeight * 1.6;
		};
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});
</script>

<header class:tucked>
	<a class="name" class:gone={!showName} href={resolve('/')} {@attach magnetic}>{author}</a>
	<nav>
		<a href="{resolve('/')}#days" {@attach magnetic}>All 30 days</a>
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- external link -->
		<a href={channel} target="_blank" rel="noreferrer" {@attach magnetic}>Telegram</a>
	</nav>
</header>

<style>
	header {
		position: fixed;
		inset: 0 0 auto;
		z-index: 40;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.85rem var(--gutter);
		pointer-events: none;
		transition: transform 0.55s var(--spring);
	}

	header.tucked {
		transform: translateY(-120%);
	}

	.name,
	nav {
		background: rgb(14 11 8 / 0.82);
		color: var(--paper);
		border-radius: 999px;
		box-shadow: inset 0 0 0 1px rgb(244 242 236 / 0.16);
		pointer-events: auto;
	}

	.name {
		padding: 0.4rem 1rem 0.45rem;
		font-family: var(--display);
		font-size: 1.05rem;
		letter-spacing: -0.01em;
		text-decoration: none;
		white-space: nowrap;
		transition:
			opacity 0.4s,
			translate 0.5s var(--spring);
	}

	.name.gone {
		opacity: 0;
		translate: 0 -0.6rem;
		pointer-events: none;
	}

	nav {
		display: flex;
		gap: 0.15rem;
		padding: 0.2rem;
	}

	nav a {
		display: inline-block;
		padding: 0.35rem 0.85rem 0.4rem;
		border-radius: 999px;
		font-family: var(--ui);
		font-size: 0.85rem;
		font-weight: 500;
		text-decoration: none;
		white-space: nowrap;
		transition:
			background 0.25s,
			color 0.25s;
	}

	nav a:hover,
	nav a:focus-visible {
		background: var(--paper);
		color: var(--ink);
	}

	@media (max-width: 34rem) {
		.name {
			padding-inline: 0.75rem;
			font-size: 0.92rem;
		}

		nav a {
			padding-inline: 0.6rem;
			font-size: 0.78rem;
		}
	}
</style>
