<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { numberWord, type DayCard } from '#lib/content.ts';
	import { gsap, prefersMotion } from '#lib/motion.ts';
	import Pen from './Pen.svelte';

	let { days }: { days: DayCard[] } = $props();

	const MINUTES_IN_DAY = 1440;
	const LATE_HOUR = 21;

	const toMinutes = (time: string) => {
		const [hours, minutes] = time.split(':').map(Number);
		return hours * 60 + minutes;
	};

	const clock = (minutes: number) => {
		const hour = Math.floor(minutes / 60);
		const mins = String(minutes % 60).padStart(2, '0');
		return `${hour % 12 || 12}:${mins} ${hour < 12 ? 'am' : 'pm'}`;
	};

	const rows = $derived(
		days
			.filter((slot) => slot.time && slot.title)
			.map((slot) => ({ day: slot.day, title: slot.title!, at: toMinutes(slot.time!) }))
	);

	const axisStart = $derived(
		Math.min(18, Math.floor(Math.min(...rows.map((row) => row.at), MINUTES_IN_DAY) / 60)) * 60
	);
	const place = (at: number) => ((at - axisStart) / (MINUTES_IN_DAY - axisStart)) * 100;

	const hours = $derived.by(() => {
		const marks = [];
		for (let at = axisStart; at <= MINUTES_IN_DAY; at += 120) marks.push(at);
		return marks;
	});

	const closest = $derived(rows.reduce((late, row) => (row.at > late.at ? row : late), rows[0]));
	const spare = $derived(closest ? MINUTES_IN_DAY - closest.at : 0);
	const lateCount = $derived(rows.filter((row) => row.at >= LATE_HOUR * 60).length);

	let hovered = $state<number>();
	const reading = $derived(rows.find((row) => row.day === hovered) ?? closest);

	const labelled = (day: number) => day === 1 || day % 5 === 0 || day === closest?.day;

	let root = $state<HTMLElement>();

	onMount(() => {
		if (!root || !prefersMotion()) return;
		const context = gsap.context(() => {
			gsap
				.timeline({
					defaults: { ease: 'none' },
					scrollTrigger: { trigger: '.chart', start: 'top 82%', end: 'bottom 96%', scrub: 0.3 }
				})
				.fromTo('.stem', { scaleX: 0 }, { scaleX: 1, duration: 0.14, stagger: 0.03 }, 0)
				.fromTo('.dot', { opacity: 0 }, { opacity: 1, duration: 0.05, stagger: 0.03 }, 0.1);
		}, root);
		return () => context.revert();
	});
</script>

{#if closest}
	<section bind:this={root} class="midnight">
		<div class="inner">
			<h2>
				Day {closest.day} went up with {numberWord(spare)}
				{spare === 1 ? 'minute' : 'minutes'} to spare.
			</h2>
			<p class="sub">
				{lateCount} of {rows.length} pages were posted after {LATE_HOUR - 12} pm. Each line is one night,
				running until the post went up.
			</p>

			<p class="reading" aria-hidden="true">
				<strong>Day {reading.day}, {clock(reading.at)}</strong>
				<span>{reading.title}</span>
			</p>

			<div class="chart">
				<div class="plot">
					<div class="chart-grid" aria-hidden="true">
						{#each hours as at (at)}
							<span class:twelve={at === MINUTES_IN_DAY} style="left:{place(at)}%">
								<em>{at === MINUTES_IN_DAY ? 'midnight' : clock(at).replace(':00', '')}</em>
							</span>
						{/each}
					</div>

					<ol>
						{#each rows as row (row.day)}
							<li>
								<a
									class="row"
									class:closest={row.day === closest.day}
									href={resolve('/day/[day]', { day: String(row.day) })}
									aria-label="Day {row.day}, posted {clock(row.at)}: {row.title}"
									onpointerenter={() => (hovered = row.day)}
									onpointerleave={() => (hovered = undefined)}
									onfocus={() => (hovered = row.day)}
									onblur={() => (hovered = undefined)}
								>
									<span class="label" class:quiet={!labelled(row.day)}>{row.day}</span>
									<span class="track">
										<span class="stem" style="width:{place(row.at)}%"></span>
										<span class="dot" style="left:{place(row.at)}%"></span>
									</span>
								</a>
							</li>
						{/each}
					</ol>
				</div>

				<p class="note hand" aria-hidden="true" style="--row:{rows.indexOf(closest)}">
					<span class="arrow"><Pen kind="arrow" /></span>
					{numberWord(spare)} minutes!
				</p>
			</div>
		</div>
	</section>
{/if}

<style>
	.midnight {
		position: relative;
		z-index: 3;
		background: var(--ground);
		color: var(--paper);
	}

	.inner {
		max-width: 92rem;
		margin-inline: auto;
		padding: clamp(2rem, 6vw, 5rem) var(--gutter) clamp(6rem, 13vw, 11rem);
	}

	h2 {
		max-width: 16ch;
		font-family: var(--display);
		font-size: clamp(2.6rem, 7vw, 7rem);
		font-weight: 400;
		font-variation-settings: 'opsz' 28;
		line-height: 1;
		letter-spacing: -0.025em;
	}

	.sub {
		max-width: 34rem;
		margin-top: clamp(1.25rem, 2.5vw, 2rem);
		font-size: clamp(1.15rem, 1.5vw, 1.35rem);
		line-height: 1.4;
		color: var(--dim-on-ground);
	}

	.reading {
		display: flex;
		flex-wrap: wrap;
		gap: 0.2rem 0.9rem;
		min-height: 3.2rem;
		margin-top: clamp(2.5rem, 5vw, 4rem);
		font-family: var(--ui);
		font-size: 0.95rem;
		color: var(--dim-on-ground);
	}

	.reading strong {
		font-weight: 500;
		color: var(--paper);
	}

	.chart {
		position: relative;
		margin-top: 2.25rem;
		padding-right: clamp(0.5rem, 17vw, 15rem);
	}

	.plot {
		--label: 2rem;
		position: relative;
	}

	.chart-grid {
		position: absolute;
		inset: 0 0 0 var(--label);
		pointer-events: none;
	}

	.chart-grid span {
		position: absolute;
		top: -0.25rem;
		bottom: 0;
		width: 1px;
		background: rgb(244 242 236 / 0.1);
	}

	.chart-grid em {
		position: absolute;
		bottom: 100%;
		left: 0;
		translate: -50% -0.3rem;
		font-family: var(--ui);
		font-size: 0.78rem;
		font-style: normal;
		white-space: nowrap;
		color: var(--dim-on-ground);
	}

	.chart-grid .twelve {
		width: 1px;
		background: var(--accent);
	}

	.chart-grid .twelve em {
		color: var(--accent);
		font-weight: 500;
	}

	ol {
		position: relative;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.row {
		display: grid;
		grid-template-columns: var(--label) 1fr;
		align-items: center;
		height: clamp(1.05rem, 2.4svh, 1.35rem);
		color: var(--paper);
		text-decoration: none;
	}

	.label {
		font-family: var(--ui);
		font-size: 0.72rem;
		font-variant-numeric: tabular-nums;
		color: var(--dim-on-ground);
	}

	.label.quiet {
		opacity: 0;
	}

	.track {
		position: relative;
		display: block;
		height: 100%;
	}

	.stem {
		position: absolute;
		top: 50%;
		left: 0;
		height: 2px;
		margin-top: -1px;
		background: rgb(244 242 236 / 0.34);
		transform-origin: 0 50%;
		transition: background 0.2s;
	}

	.dot {
		position: absolute;
		top: 50%;
		width: 8px;
		height: 8px;
		margin: -4px 0 0 -4px;
		border-radius: 50%;
		background: var(--paper);
		transition: scale 0.25s var(--spring);
	}

	.row:hover .stem,
	.row:focus-visible .stem {
		background: var(--paper);
	}

	.row:hover .label,
	.row:focus-visible .label {
		opacity: 1;
		color: var(--paper);
	}

	.row:hover .dot,
	.row:focus-visible .dot {
		scale: 1.5;
	}

	.closest .stem {
		background: var(--accent);
	}

	.closest .dot {
		background: var(--accent);
		scale: 1.4;
	}

	/* The note points at the latest row, in the space past midnight. */
	.note {
		position: absolute;
		right: 0;
		top: calc(var(--row) * clamp(1.05rem, 2.4svh, 1.35rem) - 0.75rem);
		width: clamp(0.5rem, 15vw, 13rem);
		margin: 0;
		font-size: clamp(1.8rem, 2.8vw, 2.75rem);
		rotate: -3deg;
	}

	.arrow {
		display: block;
		width: 3.5rem;
		height: 2.25rem;
		margin-bottom: 0.25rem;
	}

	@media (max-width: 47.5rem) {
		.chart {
			padding-right: 0;
		}

		.note {
			display: none;
		}

		.plot {
			margin-right: 1.25rem;
		}
	}
</style>
