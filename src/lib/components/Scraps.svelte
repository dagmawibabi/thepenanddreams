<script lang="ts">
	import { onMount } from 'svelte';
	import type { Aside } from '#lib/content.ts';
	import { gsap, prefersMotion, seeded } from '#lib/motion.ts';

	let { asides }: { asides: Aside[] } = $props();

	let root = $state<HTMLElement>();

	/** Each scrap is cut by hand: straight-ish sides, and a rough tear along the bottom. */
	function cut(seed: number) {
		const random = seeded(seed + 3);
		const points = [`${random() * 1.5}% 0`, `${98.5 + random() * 1.5}% ${random() * 1.5}%`];
		for (let x = 100; x >= 0; x -= 6 + random() * 7) {
			points.push(`${x.toFixed(1)}% ${(94 + random() * 6).toFixed(1)}%`);
		}
		return `polygon(${points.join(',')})`;
	}

	const scraps = $derived(
		asides.map((aside, index) => {
			const random = seeded(index + 40);
			return { ...aside, shape: cut(index), tilt: (random() - 0.5) * 6 };
		})
	);
	const columns = $derived([
		scraps.filter((_, index) => index % 2 === 0),
		scraps.filter((_, index) => index % 2 === 1)
	]);

	onMount(() => {
		if (!root || !prefersMotion()) return;
		const context = gsap.context(() => {
			const drift = { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true };
			gsap.fromTo('.col-a', { y: 50 }, { y: -50, ease: 'none', scrollTrigger: drift });
			gsap.fromTo('.col-b', { y: 170 }, { y: -130, ease: 'none', scrollTrigger: drift });
		}, root);
		return () => context.revert();
	});
</script>

<section bind:this={root} class="scraps">
	<div class="inner">
		<header>
			<h2>Meanwhile, the author had complaints.</h2>
			<p>Things said on the channel between pages, while the challenge was still going.</p>
		</header>

		<div class="wall">
			{#each columns as column, columnIndex (columnIndex)}
				<div class="col {columnIndex ? 'col-b' : 'col-a'}">
					{#each column as scrap (scrap.text)}
						<figure style="--tilt:{scrap.tilt}deg;clip-path:{scrap.shape}">
							<blockquote class="hand">{scrap.text}</blockquote>
							<figcaption>Day {scrap.day}</figcaption>
						</figure>
					{/each}
				</div>
			{/each}
		</div>
	</div>
</section>

<style>
	.scraps {
		position: relative;
		z-index: 5;
		overflow: clip;
		background: var(--ground);
		color: var(--paper);
	}

	.inner {
		display: grid;
		grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
		gap: clamp(2rem, 5vw, 5rem);
		max-width: 92rem;
		margin-inline: auto;
		padding: clamp(6rem, 13vw, 11rem) var(--gutter) clamp(8rem, 17vw, 15rem);
	}

	header {
		position: sticky;
		top: 7rem;
		align-self: start;
	}

	h2 {
		font-family: var(--display);
		font-size: clamp(2.6rem, 5.6vw, 5.75rem);
		font-weight: 400;
		font-variation-settings: 'opsz' 28;
		line-height: 1;
		letter-spacing: -0.025em;
	}

	header p {
		max-width: 26rem;
		margin-top: 1.5rem;
		font-size: clamp(1.15rem, 1.5vw, 1.35rem);
		line-height: 1.4;
		color: var(--dim-on-ground);
	}

	.wall {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		align-items: start;
		gap: clamp(1rem, 2.5vw, 2.25rem);
	}

	.col {
		display: flex;
		flex-direction: column;
		gap: clamp(1rem, 2.5vw, 2.25rem);
		will-change: transform;
	}

	figure {
		margin: 0;
		padding: 1.4rem 1.4rem 2rem;
		background: #efecdf;
		color: var(--ink);
		rotate: var(--tilt);
		transition:
			rotate 0.5s var(--spring),
			scale 0.5s var(--spring);
	}

	figure:hover {
		rotate: 0deg;
		scale: 1.03;
	}

	blockquote {
		font-size: clamp(1.8rem, 2.5vw, 2.5rem);
		line-height: 1.02;
		color: var(--ink);
		overflow-wrap: break-word;
	}

	figcaption {
		margin-top: 1rem;
		font-family: var(--ui);
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--accent-deep);
	}

	@media (max-width: 47.5rem) {
		.inner {
			grid-template-columns: minmax(0, 1fr);
		}

		header {
			position: static;
		}

		.wall {
			gap: 0.75rem;
		}

		figure {
			padding: 1rem 1rem 1.6rem;
		}

		blockquote {
			font-size: 1.6rem;
		}
	}
</style>
