<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { gsap, magnetic, prefersMotion } from '#lib/motion.ts';

	let root = $state<HTMLElement>();

	const OPENING = 'I love writing. And';
	const MARKED = 'to love something is to let it matter to you.';

	onMount(() => {
		if (!root || !prefersMotion()) return;
		const context = gsap.context(() => {
			gsap
				.timeline({
					defaults: { ease: 'none' },
					scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: true }
				})
				.fromTo('.word', { opacity: 0.1 }, { opacity: 1, duration: 0.05, stagger: 0.05 })
				.from('.from-day', { autoAlpha: 0, y: 16, duration: 0.15 }, '>-0.05');
		}, root);
		return () => context.revert();
	});
</script>

<section bind:this={root} class="quote">
	<div class="stage">
		<blockquote>
			{#each OPENING.split(' ') as word, index (index)}
				<span class="word">{word + ' '}</span>
			{/each}
			<em>
				{#each MARKED.split(' ') as word, index (index)}
					<span class="word">{word + ' '}</span>
				{/each}
			</em>
		</blockquote>
		<a class="from-day pill" href={resolve('/day/[day]', { day: '1' })} {@attach magnetic}>
			Read day 1, where it starts
		</a>
	</div>
</section>

<style>
	.quote {
		position: relative;
		z-index: 5;
		background: var(--ground);
		color: var(--paper);
	}

	.stage {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: center;
		gap: clamp(2rem, 5vw, 3.5rem);
		padding: clamp(5rem, 12svh, 8rem) var(--gutter);
	}

	blockquote {
		max-width: 17ch;
		font-family: var(--display);
		font-size: min(clamp(3rem, 10.5vw, 11rem), 15svh);
		line-height: 1;
		font-variation-settings: 'opsz' 36;
		letter-spacing: -0.03em;
	}

	blockquote em {
		margin-left: -0.25em;
	}

	.word {
		display: inline-block;
		white-space: pre;
	}

	@media (prefers-reduced-motion: no-preference) {
		.quote {
			height: 190svh;
		}

		.stage {
			position: sticky;
			top: 0;
			min-height: 100svh;
		}
	}
</style>
