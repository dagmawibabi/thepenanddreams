<script lang="ts">
	import { onMount } from 'svelte';
	import { asset } from '$app/paths';
	import { author, channel } from '#lib/site.ts';
	import { gsap, magnetic, prefersMotion } from '#lib/motion.ts';
	import Wordmark from './Wordmark.svelte';

	let root = $state<HTMLElement>();

	onMount(() => {
		if (!root || !prefersMotion()) return;
		const context = gsap.context(() => {
			gsap.from('.signature .letter', {
				yPercent: 118,
				duration: 0.1,
				stagger: 0.05,
				ease: 'none',
				scrollTrigger: {
					trigger: '.signature',
					start: 'top 98%',
					end: 'bottom bottom',
					scrub: true
				}
			});
			gsap.from('.print', {
				y: 110,
				rotation: 7,
				scrollTrigger: { trigger: root, start: 'top 85%', end: 'top 25%', scrub: true }
			});
		}, root);
		return () => context.revert();
	});
</script>

<footer bind:this={root}>
	<div class="top">
		<div class="print">
			<img
				src={asset('collage/photo.webp')}
				alt="Magazine collage with two handwritten notes: You write so beautifully, and The inside of your head must be a terrible place."
				width="640"
				height="640"
				loading="lazy"
			/>
		</div>
		<div class="invite">
			<p>New pages go up on Telegram first, usually late at night.</p>
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- external link -->
			<a class="pill" href={channel} target="_blank" rel="noreferrer" {@attach magnetic}>
				Read along on Telegram
			</a>
		</div>
	</div>
	<div class="signature" aria-label={author}>
		<span class="clip"><Wordmark /></span>
		<p class="say hand" aria-hidden="true">the pen and dreams, all one word</p>
	</div>
</footer>

<style>
	footer {
		--pill-fill: var(--ink);
		--pill-text: var(--paper);
		position: relative;
		z-index: 6;
		overflow: clip;
		background: var(--paper);
		color: var(--ink);
		padding: clamp(4rem, 9vw, 8rem) var(--gutter) clamp(5rem, 9vw, 7rem);
	}

	.top {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: clamp(2rem, 6vw, 5rem);
	}

	.print {
		width: min(70vw, 24rem);
		rotate: -2deg;
		transition: rotate 0.7s var(--spring);
	}

	.print:hover {
		rotate: 0deg;
	}

	img {
		display: block;
		width: 100%;
		height: auto;
	}

	.invite {
		flex: 1 1 18rem;
		max-width: 32rem;
	}

	p {
		margin-bottom: 1.5rem;
		font-family: var(--display);
		font-size: clamp(1.7rem, 3.2vw, 2.75rem);
		line-height: 1.1;
		letter-spacing: -0.015em;
	}

	.signature {
		margin-top: clamp(3rem, 7vw, 6rem);
		font-size: calc((100vw - 2 * var(--gutter)) / 8.2);
	}

	.say {
		margin: 0.5rem 0 0;
		font-family: var(--hand);
		font-size: clamp(1.9rem, 3vw, 3rem);
		letter-spacing: 0;
		line-height: 1;
		color: var(--accent-deep);
		text-align: right;
		rotate: -1.5deg;
	}

	.clip {
		display: block;
		overflow: clip;
		padding-block: 0.08em 0.16em;
	}
</style>
