<script lang="ts">
	import { flip } from 'svelte/animate';
	import { fade } from 'svelte/transition';
	import { resolve } from '$app/paths';
	import { numberWord, type DayCard } from '#lib/content.ts';
	import { prefersMotion, ScrollTrigger, smoothScroll } from '#lib/motion.ts';

	let { days }: { days: DayCard[] } = $props();

	const ALL = 'Everything';
	const SETTLE_MS = 450;

	let chosen = $state(ALL);

	const written = $derived(days.filter((slot) => slot.title));
	const themes = $derived([ALL, ...new Set(written.flatMap((slot) => slot.themes ?? []))]);
	const shown = $derived(
		chosen === ALL ? written : written.filter((slot) => slot.themes?.includes(chosen))
	);

	const motion = () => (prefersMotion() ? 1 : 0);

	/** The page changes height, so everything below re-measures once the rows settle. */
	function choose(theme: string) {
		chosen = theme;
		setTimeout(() => {
			smoothScroll()?.resize();
			ScrollTrigger.refresh();
		}, SETTLE_MS);
	}

	function liftTitle(event: MouseEvent) {
		const row = event.currentTarget as HTMLElement;
		row.querySelector<HTMLElement>('.title')!.style.viewTransitionName = 'page-title';
	}
</script>

<section class="index">
	<div class="inner">
		<header>
			<h2>Every page, by what it’s about.</h2>
			<p class="tally-word" aria-live="polite">
				<span class="hand">{numberWord(shown.length)} {shown.length === 1 ? 'page' : 'pages'}</span>
			</p>
		</header>

		<div class="themes" role="group" aria-label="Filter pages by theme">
			{#each themes as theme (theme)}
				<button
					type="button"
					class:on={chosen === theme}
					aria-pressed={chosen === theme}
					onclick={() => choose(theme)}
				>
					{theme}
				</button>
			{/each}
		</div>

		<ol>
			{#each shown as slot (slot.day)}
				<li
					animate:flip={{ duration: 400 * motion() }}
					transition:fade={{ duration: 180 * motion() }}
				>
					<a href={resolve('/day/[day]', { day: String(slot.day) })} onclick={liftTitle}>
						<span class="number">{slot.day}</span>
						<span class="title">{slot.title}</span>
						<span class="line">{slot.line}</span>
						<span class="length">{slot.minutes} min</span>
					</a>
				</li>
			{/each}
		</ol>
	</div>
</section>

<style>
	.index {
		position: relative;
		z-index: 6;
		background: var(--ground);
		color: var(--paper);
	}

	.inner {
		max-width: 92rem;
		margin-inline: auto;
		padding: clamp(3rem, 7vw, 6rem) var(--gutter) clamp(5rem, 10vw, 9rem);
	}

	header {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem 2rem;
	}

	h2 {
		max-width: 16ch;
		font-family: var(--display);
		font-size: clamp(2.6rem, 6vw, 6rem);
		font-weight: 400;
		font-variation-settings: 'opsz' 28;
		line-height: 1;
		letter-spacing: -0.025em;
	}

	.tally-word {
		margin: 0;
	}

	.tally-word .hand {
		font-size: clamp(2rem, 3vw, 2.9rem);
		display: inline-block;
		rotate: -2deg;
	}

	.themes {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-block: clamp(2rem, 4vw, 3rem);
	}

	button {
		padding: 0.5em 1em 0.55em;
		border: 1px solid rgb(244 242 236 / 0.28);
		border-radius: 999px;
		background: none;
		color: var(--paper);
		font-family: var(--ui);
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition:
			background 0.25s,
			color 0.25s,
			border-color 0.25s;
	}

	button:hover {
		border-color: var(--paper);
	}

	button.on {
		background: var(--paper);
		border-color: var(--paper);
		color: var(--ink);
	}

	ol {
		list-style: none;
		margin: 0;
		padding: 0;
		border-bottom: 1px solid rgb(244 242 236 / 0.16);
	}

	li {
		border-top: 1px solid rgb(244 242 236 / 0.16);
	}

	a {
		position: relative;
		display: grid;
		grid-template-columns: 3.5rem minmax(0, 6fr) minmax(0, 5fr) 4rem;
		align-items: baseline;
		gap: 1rem;
		padding: clamp(0.8rem, 1.4vw, 1.2rem) 0.75rem;
		color: var(--paper);
		text-decoration: none;
		transition: color 0.25s;
	}

	/* A sheet of paper slides up behind the row. */
	a::before {
		content: '';
		position: absolute;
		inset: 0;
		background: var(--paper);
		transform: scaleY(0);
		transform-origin: 50% 100%;
		transition: transform 0.35s var(--spring);
	}

	a > span {
		position: relative;
	}

	a:hover,
	a:focus-visible {
		color: var(--ink);
	}

	a:hover::before,
	a:focus-visible::before {
		transform: scaleY(1);
	}

	.number,
	.length {
		font-family: var(--ui);
		font-size: 0.85rem;
		font-weight: 500;
		font-variant-numeric: tabular-nums;
	}

	.length {
		text-align: right;
		color: var(--dim-on-ground);
		white-space: nowrap;
	}

	a:hover .length,
	a:focus-visible .length {
		color: var(--dim-on-paper);
	}

	.title {
		font-family: var(--display);
		font-size: clamp(1.5rem, 2.9vw, 2.9rem);
		font-variation-settings: 'opsz' 22;
		line-height: 1.08;
		letter-spacing: -0.018em;
	}

	a:hover .title,
	a:focus-visible .title {
		font-style: italic;
	}

	.line {
		font-size: clamp(1rem, 1.2vw, 1.15rem);
		font-style: italic;
		line-height: 1.3;
		color: var(--dim-on-ground);
		opacity: 0;
		transition: opacity 0.25s;
	}

	a:hover .line,
	a:focus-visible .line {
		opacity: 1;
		color: var(--dim-on-paper);
	}

	@media (max-width: 47.5rem) {
		a {
			grid-template-columns: 2.25rem minmax(0, 1fr) auto;
			padding-inline: 0.25rem;
		}

		.line {
			display: none;
		}
	}
</style>
