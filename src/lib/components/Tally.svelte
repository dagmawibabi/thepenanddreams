<script lang="ts">
	import { onMount } from 'svelte';
	import { numberWord, type DayCard } from '#lib/content.ts';
	import { gsap, prefersMotion, seeded } from '#lib/motion.ts';
	import Pen from './Pen.svelte';

	let { days, noDayMissed }: { days: DayCard[]; noDayMissed: boolean } = $props();

	const written = $derived(days.filter((slot) => slot.title).length);

	let root = $state<HTMLElement>();
	let progress = $state(1);
	const shown = $derived(Math.round(written * progress));
	const left = $derived(days.length - written);

	const QUOTE = 'the goal is not perfection but consistency.';
	const words = QUOTE.split(' ');
	const BUNDLE = 5;

	/** Bundles of five: four upright strokes and one slashed across them. */
	const bundles = $derived.by(() => {
		const random = seeded(30);
		const wobble = (spread: number) => (random() - 0.5) * spread;
		return Array.from({ length: Math.ceil(days.length / BUNDLE) }, (_, bundle) =>
			days.slice(bundle * BUNDLE, bundle * BUNDLE + BUNDLE).map((slot, index) => {
				const isWritten = Boolean(slot.title);
				if (index === BUNDLE - 1) {
					return {
						written: isWritten,
						d: `M${1 + wobble(3)} ${70 + wobble(4)}Q50 ${50 + wobble(6)} ${108 + wobble(3)} ${22 + wobble(4)}`
					};
				}
				const x = 15 + index * 26;
				return {
					written: isWritten,
					d: `M${x + wobble(5)} ${8 + wobble(5)}Q${x + wobble(8)} 44 ${x + wobble(5)} ${84 + wobble(6)}`
				};
			})
		);
	});

	onMount(() => {
		if (!root || !prefersMotion()) return;
		const context = gsap.context(() => {
			progress = 0;
			const strokes = gsap.utils.toArray<SVGPathElement>('.written');
			gsap.set(strokes, { strokeDashoffset: 1 });

			const count = { value: 0 };
			gsap
				.timeline({
					defaults: { ease: 'none' },
					scrollTrigger: { trigger: '.marks', start: 'top 92%', end: 'top 45%', scrub: 0.4 }
				})
				.to(strokes, { strokeDashoffset: 0, duration: 0.07, stagger: 0.93 / strokes.length })
				.to(
					count,
					{
						value: 1,
						duration: 1,
						onUpdate: () => {
							progress = count.value;
						}
					},
					0
				);

			gsap.fromTo(
				'.word',
				{ opacity: 0.14 },
				{
					opacity: 1,
					stagger: 0.12,
					ease: 'none',
					scrollTrigger: { trigger: 'blockquote', start: 'top 88%', end: 'top 55%', scrub: true }
				}
			);
		}, root);
		return () => context.revert();
	});
</script>

<section bind:this={root} class="tally">
	<div class="inner">
		<h2>
			<span class="count">{shown}<span class="circled"><Pen kind="circle" /></span></span>
			<span class="of">
				of {days.length} days written{noDayMissed ? ', none missed.' : '.'}
				<span class="hand to-go">{left ? `${numberWord(left)} to go` : 'all done'}</span>
			</span>
		</h2>

		<div class="marks" aria-hidden="true">
			{#each bundles as strokes, index (index)}
				<svg viewBox="0 0 110 92">
					{#each strokes as stroke, strokeIndex (strokeIndex)}
						<path
							d={stroke.d}
							pathLength="1"
							class:written={stroke.written}
							class:waiting={!stroke.written}
						/>
					{/each}
				</svg>
			{/each}
		</div>

		<blockquote>
			<p>
				{#each words as word, index (index)}
					<span class="word">{word + ' '}</span>
				{/each}
			</p>
			<cite>Thepenanddreams, five days in</cite>
		</blockquote>
	</div>
</section>

<style>
	.tally {
		position: relative;
		z-index: 3;
		background: var(--ground);
		color: var(--paper);
	}

	.inner {
		max-width: 92rem;
		margin-inline: auto;
		padding: clamp(5rem, 12vw, 10rem) var(--gutter) clamp(7rem, 16vw, 14rem);
	}

	h2 {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: 0.25rem clamp(1.25rem, 3vw, 3rem);
		font-family: var(--display);
		font-weight: 400;
	}

	.count {
		position: relative;
		font-variation-settings: 'opsz' 24;
		min-width: 1.15em;
		font-size: clamp(9rem, 30vw, 28rem);
		line-height: 0.8;
		letter-spacing: -0.05em;
		font-variant-numeric: lining-nums;
	}

	.of {
		flex: 1 1 14rem;
		max-width: 13em;
		padding-bottom: clamp(0.25rem, 1.5vw, 1.5rem);
		font-size: clamp(1.9rem, 4vw, 3.75rem);
		line-height: 1.04;
		letter-spacing: -0.015em;
	}

	.circled {
		position: absolute;
		inset: 2% -9% -9% -11%;
		color: var(--accent);
	}

	.to-go {
		display: block;
		margin-top: 0.5rem;
		font-size: clamp(2rem, 3.4vw, 3.25rem);
		rotate: -3deg;
		transform-origin: 0 50%;
	}

	.marks {
		display: grid;
		grid-template-columns: repeat(6, minmax(0, 1fr));
		gap: clamp(0.75rem, 3vw, 3rem);
		margin-block: clamp(3.5rem, 8vw, 7rem);
	}

	svg {
		display: block;
		width: 100%;
		height: auto;
		overflow: visible;
	}

	path {
		fill: none;
		stroke: var(--paper);
		stroke-linecap: round;
		stroke-width: 1.3;
	}

	.written {
		stroke-dasharray: 1;
	}

	.waiting {
		opacity: 0.3;
		stroke-dasharray: 0.03 0.05;
	}

	blockquote {
		max-width: 46rem;
		margin-left: auto;
	}

	blockquote p {
		font-family: var(--display);
		font-size: clamp(2rem, 4.8vw, 4.25rem);
		font-style: normal;
		line-height: 1.08;
		letter-spacing: -0.015em;
	}

	.word {
		display: inline-block;
		white-space: pre;
	}

	cite {
		display: block;
		margin-top: 1.5rem;
		font-family: var(--ui);
		font-size: 0.95rem;
		font-style: normal;
		color: var(--dim-on-ground);
	}

	@media (max-width: 47.5rem) {
		.marks {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
</style>
