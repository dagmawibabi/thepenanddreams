<script lang="ts">
	import { onMount } from 'svelte';
	import { asset, resolve } from '$app/paths';
	import { numberWord, type DayList } from '#lib/content.ts';
	import { gsap, prefersMotion } from '#lib/motion.ts';

	let { list }: { list: DayList } = $props();

	const ROWS = 3;
	const rows = $derived(
		Array.from({ length: ROWS }, (_, row) => list.items.filter((_, index) => index % ROWS === row))
	);
	const count = $derived(numberWord(list.items.length));

	let root = $state<HTMLElement>();

	onMount(() => {
		if (!root || !prefersMotion()) return;
		const belts = [...root.querySelectorAll<HTMLElement>('.belt')].map((node, index) => ({
			node,
			direction: index % 2 ? 1 : -1,
			width: 0,
			x: 0
		}));

		const measure = () => {
			belts.forEach((belt) => {
				belt.width = belt.node.scrollWidth / 2;
			});
		};
		const observer = new ResizeObserver(measure);
		belts.forEach((belt) => observer.observe(belt.node));

		let inView = false;
		const visibility = new IntersectionObserver(([entry]) => {
			inView = entry.isIntersecting;
		});
		visibility.observe(root);

		/* A slow drift, sped up by scrolling, in the direction of the scroll. */
		let lastY = window.scrollY;
		let push = 0;
		const tick = () => {
			if (!inView) {
				lastY = window.scrollY;
				return;
			}
			const y = window.scrollY;
			push += ((y - lastY) * 0.7 - push) * 0.16;
			lastY = y;
			for (const belt of belts) {
				if (!belt.width) continue;
				belt.x += (0.45 + Math.abs(push)) * belt.direction * (push < 0 ? -1 : 1);
				belt.x = ((belt.x % belt.width) + belt.width) % belt.width;
				belt.node.style.transform = `translate3d(${(-belt.x).toFixed(1)}px, 0, 0)`;
			}
		};
		gsap.ticker.add(tick);

		return () => {
			gsap.ticker.remove(tick);
			observer.disconnect();
			visibility.disconnect();
		};
	});
</script>

<section bind:this={root} class="happy">
	<header>
		<h2>
			<span class="capital">{count}</span> things that make the author happy.
		</h2>
		<a class="more hand" href={resolve('/day/[day]', { day: String(list.day) })}>
			all of them, from day {list.day}
		</a>
	</header>

	<ol class="sr-only">
		{#each list.items as item (item)}
			<li>{item}</li>
		{/each}
	</ol>

	<div class="rows" aria-hidden="true">
		{#each rows as row, rowIndex (rowIndex)}
			<div class="row">
				<div class="belt">
					{#each [0, 1] as copy (copy)}
						<div class="copy" class:second={copy === 1}>
							{#each row as item, itemIndex (item)}
								<span class="item" class:slanted={(itemIndex + rowIndex) % 2 === 1}>{item}</span>
								{#if itemIndex === 2}
									<img
										src={asset('collage/dino.webp')}
										alt=""
										width="524"
										height="454"
										loading="lazy"
									/>
								{:else}
									<i></i>
								{/if}
							{/each}
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</section>

<style>
	.happy {
		position: relative;
		z-index: 6;
		overflow: clip;
		background: var(--ground);
		color: var(--paper);
		padding-block: clamp(6rem, 13vw, 11rem);
	}

	header {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.75rem 2rem;
		padding-inline: var(--gutter);
		margin-bottom: clamp(2.5rem, 5vw, 4.5rem);
	}

	h2 {
		max-width: 20ch;
		font-family: var(--display);
		font-size: clamp(2.2rem, 4.4vw, 4.5rem);
		font-weight: 400;
		font-variation-settings: 'opsz' 28;
		line-height: 1.02;
		letter-spacing: -0.02em;
	}

	.capital {
		display: inline-block;
	}

	.capital::first-letter {
		text-transform: uppercase;
	}

	.more {
		font-size: clamp(1.8rem, 2.6vw, 2.5rem);
		text-decoration: none;
		rotate: -2deg;
		transition: rotate 0.4s var(--spring);
	}

	.more:hover,
	.more:focus-visible {
		rotate: 1deg;
	}

	.rows {
		display: flex;
		flex-direction: column;
		gap: clamp(0.25rem, 1vw, 0.75rem);
	}

	.row {
		overflow: clip;
	}

	.belt {
		display: flex;
		width: max-content;
		will-change: transform;
	}

	.copy {
		display: flex;
		align-items: center;
		flex: none;
	}

	.item {
		font-family: var(--display);
		font-size: clamp(2.75rem, 8vw, 8.5rem);
		font-variation-settings: 'opsz' 28;
		line-height: 1.12;
		letter-spacing: -0.025em;
		white-space: nowrap;
	}

	.slanted {
		font-style: normal;
		color: var(--dim-on-ground);
	}

	i {
		flex: none;
		width: 0.7rem;
		height: 0.7rem;
		margin-inline: clamp(1rem, 3vw, 2.75rem);
		border-radius: 50%;
		background: var(--accent);
	}

	img {
		flex: none;
		width: clamp(3rem, 7vw, 7rem);
		height: auto;
		margin-inline: clamp(1rem, 3vw, 2.75rem);
		image-rendering: pixelated;
	}

	@media (prefers-reduced-motion: reduce) {
		.belt {
			width: auto;
		}

		.copy {
			flex-wrap: wrap;
		}

		.second {
			display: none;
		}

		.item {
			white-space: normal;
			font-size: clamp(2rem, 5vw, 4rem);
		}
	}
</style>
