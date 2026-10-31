<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { numberWord, type DayList } from '#lib/content.ts';
	import { dino } from '#lib/dino.svelte.ts';
	import { gsap, magnetic, prefersMotion } from '#lib/motion.ts';
	import Pen from './Pen.svelte';

	let { list }: { list: DayList } = $props();

	const LONG_FACT = 95;

	let root = $state<HTMLElement>();
	let sentence = $state<HTMLElement>();
	let current = $state(-1);
	let bag: number[] = [];

	const shownIndex = $derived(current < 0 ? list.start : current);
	const fact = $derived(list.items[shownIndex]);

	/** Deals every fact once before any repeats, like a shuffled deck. */
	function deal() {
		if (!bag.length) {
			bag = list.items.map((_, index) => index).filter((index) => index !== shownIndex);
			for (let i = bag.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[bag[i], bag[j]] = [bag[j], bag[i]];
			}
		}
		return bag.pop()!;
	}

	function another() {
		const next = deal();
		dino.hops += 1;
		if (!sentence || !prefersMotion()) {
			current = next;
			return;
		}
		gsap
			.timeline()
			.to(sentence, { yPercent: -12, opacity: 0, duration: 0.2, ease: 'power2.in' })
			.call(() => {
				current = next;
			})
			.fromTo(
				sentence,
				{ yPercent: 16, opacity: 0 },
				{ yPercent: 0, opacity: 1, duration: 0.55, ease: 'expo.out' }
			);
	}

	onMount(() => {
		if (!root || !prefersMotion()) return;
		const context = gsap.context(() => {
			/* The dark page opens up to reveal a white panel as it arrives. */
			gsap.fromTo(
				'.panel',
				{ clipPath: 'inset(9% 7% 9% 7%)' },
				{
					clipPath: 'inset(0% 0% 0% 0%)',
					ease: 'none',
					scrollTrigger: { trigger: root, start: 'top 95%', end: 'top 25%', scrub: true }
				}
			);
		}, root);
		return () => context.revert();
	});
</script>

<section bind:this={root} class="facts">
	<div class="panel">
		<div class="top">
			<h2>{numberWord(list.items.length)} facts about the author, one at a time.</h2>
			<p class="which" aria-hidden="true">
				<span class="hand">no. {shownIndex + 1}</span>
				<span class="under"><Pen kind="underline" /></span>
			</p>
		</div>

		<p
			bind:this={sentence}
			class="sentence"
			class:long={fact.length > LONG_FACT}
			aria-live="polite"
		>
			{fact}
		</p>

		<div class="actions">
			<button class="pill solid" type="button" onclick={another} {@attach magnetic}>
				Another one
			</button>
			<a class="more" href={resolve('/day/[day]', { day: String(list.day) })}>
				Read the whole list on day {list.day}
			</a>
		</div>
	</div>
</section>

<style>
	.facts {
		--pill-fill: var(--accent-deep);
		--pill-text: var(--paper);
		position: relative;
		z-index: 6;
		background: var(--ground);
	}

	.panel {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: clamp(2.5rem, 5vw, 4rem);
		min-height: 100svh;
		padding: clamp(5rem, 11svh, 7rem) var(--gutter) clamp(5.5rem, 11svh, 7rem);
		background: var(--paper);
		color: var(--ink);
	}

	.top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 2rem;
	}

	h2 {
		max-width: 22ch;
		font-family: var(--ui);
		font-size: clamp(1rem, 1.3vw, 1.2rem);
		font-weight: 500;
		line-height: 1.3;
	}

	h2::first-letter {
		text-transform: uppercase;
	}

	.which {
		margin: 0;
		text-align: right;
	}

	.which .hand {
		color: var(--accent-deep);
		font-size: clamp(2.5rem, 5vw, 4.5rem);
		white-space: nowrap;
	}

	.under {
		display: block;
		color: var(--accent-deep);
		height: 0.8rem;
	}

	.sentence {
		max-width: 19ch;
		min-height: 3.1em;
		margin: 0;
		font-family: var(--display);
		font-size: clamp(2.5rem, 7.2vw, 7.5rem);
		font-variation-settings: 'opsz' 28;
		line-height: 1.02;
		letter-spacing: -0.025em;
	}

	.sentence.long {
		max-width: 30ch;
		font-size: clamp(1.9rem, 4.4vw, 4.6rem);
		line-height: 1.08;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1rem 1.75rem;
	}

	button {
		background: var(--ink);
		color: var(--paper);
		border-color: var(--ink);
		cursor: pointer;
	}

	.solid:hover,
	.solid:focus-visible {
		border-color: var(--accent-deep);
	}

	.more {
		font-family: var(--ui);
		font-size: 0.95rem;
		font-weight: 500;
		color: var(--ink);
		text-underline-offset: 0.25em;
	}
</style>
