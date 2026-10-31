<script lang="ts">
	import { goto } from '$app/navigation';
	import { asset, resolve } from '$app/paths';
	import type { Inline } from '#lib/content.ts';
	import { author } from '#lib/site.ts';
	import { gsap, magnetic, prefersMotion } from '#lib/motion.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const showPrompt = $derived(data.title.toLowerCase() !== data.prompt.toLowerCase());

	const dayHref = (day: number) => resolve('/day/[day]', { day: String(day) });

	function onKey(event: KeyboardEvent) {
		if (event.altKey || event.ctrlKey || event.metaKey) return;
		if (event.key === 'ArrowRight' && data.next) goto(dayHref(data.next.day));
		if (event.key === 'ArrowLeft' && data.previous) goto(dayHref(data.previous.day));
	}

	/** Attachment re-run per article, so moving to the next day rebuilds every scroll effect. */
	const inkEffects = (dayNumber: number) => (root: HTMLElement) => {
		void dayNumber;
		if (!prefersMotion()) return;
		const context = gsap.context(() => {
			gsap.from('.numeral', { yPercent: 16, autoAlpha: 0, duration: 1.3, ease: 'expo.out' });
			gsap.from('.masthead-text > *', {
				y: 24,
				autoAlpha: 0,
				duration: 0.9,
				stagger: 0.08,
				delay: 0.15,
				ease: 'expo.out'
			});
			gsap.to('.numeral', {
				yPercent: 26,
				ease: 'none',
				scrollTrigger: { trigger: '.masthead', start: 'top top', end: 'bottom top', scrub: true }
			});

			gsap.utils.toArray<HTMLElement>('mark').forEach((mark) => {
				gsap.fromTo(
					mark,
					{ backgroundSize: '0% 100%' },
					{
						backgroundSize: '100% 100%',
						duration: 0.9,
						ease: 'power2.inOut',
						scrollTrigger: {
							trigger: mark,
							start: 'top 62%',
							toggleActions: 'play none none reverse'
						}
					}
				);
			});

			gsap.utils.toArray<SVGPathElement>('.squiggle path').forEach((path) => {
				gsap.fromTo(
					path,
					{ strokeDashoffset: 1 },
					{
						strokeDashoffset: 0,
						ease: 'none',
						scrollTrigger: { trigger: path, start: 'top 90%', end: 'top 60%', scrub: true }
					}
				);
			});

			/* The pen in the margin writes down the page at the reader's pace. */
			gsap
				.timeline({
					defaults: { ease: 'none' },
					scrollTrigger: {
						trigger: '.sheet',
						start: 'top 45%',
						end: 'bottom 75%',
						scrub: 0.3,
						invalidateOnRefresh: true
					}
				})
				.fromTo('.margin-line', { scaleY: 0 }, { scaleY: 1 }, 0)
				.fromTo('.margin-nib', { y: 0 }, { y: () => margin.offsetHeight }, 0);
		}, root);

		/* Every paragraph dries from faint to full ink as it reaches the reader. One observer
		   and a CSS fade, so long articles cost nothing per scroll frame. */
		const margin = root.querySelector<HTMLElement>('.margin')!;
		const below = window.innerHeight * 0.9;
		const blocks = [...root.querySelectorAll<HTMLElement>('.ink')].filter(
			(block) => block.getBoundingClientRect().top > below
		);
		blocks.forEach((block) => block.classList.add('drying'));
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (!entry.isIntersecting && entry.boundingClientRect.top > 0) continue;
					entry.target.classList.remove('drying');
					observer.unobserve(entry.target);
				}
			},
			{ rootMargin: '0px 0px -10% 0px' }
		);
		blocks.forEach((block) => observer.observe(block));

		return () => {
			observer.disconnect();
			context.revert();
		};
	};
</script>

<svelte:window onkeydown={onKey} />

<svelte:head>
	<title>Day {data.day}: {data.title} | {author}</title>
	<meta name="description" content="{author}, day {data.day} of the 30 day writing challenge." />
	<meta property="og:title" content="Day {data.day}: {data.title}" />
	<meta property="og:image" content={asset('collage/photo.webp')} />
</svelte:head>

{#snippet inlineText(parts: Inline[])}
	{#each parts as part, index (index)}
		{#if part.marked}
			<mark>{part.text}</mark>
		{:else if part.bold}
			<strong>{part.text}</strong>
		{:else if part.italic}
			<em>{part.text}</em>
		{:else}
			{part.text}
		{/if}
	{/each}
{/snippet}

{#key data.day}
	<div class="desk" {@attach inkEffects(data.day)}>
		<header class="masthead">
			<p class="numeral" aria-hidden="true">{data.day}</p>
			<div class="masthead-text">
				<p class="kicker">Day {data.day} of {data.ruler.length}</p>
				<h1>{data.title}</h1>
				{#if showPrompt}
					<p class="prompt hand">The prompt: {data.prompt}</p>
				{/if}
				<p class="meta">{data.date}, about {data.minutes} min to read</p>
			</div>
		</header>

		<article class="sheet">
			<div class="margin" aria-hidden="true">
				<span class="margin-line"></span>
				<span class="margin-nib">
					<svg viewBox="0 0 28 44" width="16" height="25">
						<path d="M14 44 5 21 9 3h10l4 18Z" fill="#14110e" />
						<circle cx="14" cy="22" r="2.4" fill="#f4f2ec" />
					</svg>
				</span>
			</div>

			<div class="body">
				{#each data.blocks as block, index (index)}
					{#if block.type === 'paragraph'}
						<p class="ink">{@render inlineText(block.inline)}</p>
					{:else if block.type === 'salutation'}
						<p class="salutation ink">{block.text}</p>
					{:else if block.type === 'list'}
						<ol>
							{#each block.items as item, itemIndex (itemIndex)}
								<li class="ink">{@render inlineText(item)}</li>
							{/each}
						</ol>
					{:else if block.type === 'break'}
						<svg class="squiggle" viewBox="0 0 160 20" aria-hidden="true">
							<path d="M4 10c14-12 22-12 36 0s22 12 36 0 22-12 36 0 22 12 44-2" pathLength="1" />
						</svg>
					{:else if block.type === 'note'}
						<p class="scribble hand ink">{block.text}</p>
					{/if}
				{/each}
			</div>
		</article>

		<nav class="turn" aria-label="Other days">
			{#if data.previous}
				<a class="turn-link back" href={dayHref(data.previous.day)}>
					<span class="turn-label">Day {data.previous.day}</span>
					<span class="turn-title">{data.previous.title}</span>
				</a>
			{/if}
			{#if data.next}
				<a class="turn-link forward" href={dayHref(data.next.day)}>
					<span class="turn-label">Day {data.next.day}</span>
					<span class="turn-title">{data.next.title}</span>
				</a>
			{:else}
				<p class="turn-link forward waiting">
					<span class="turn-label">Day {data.day + 1}</span>
					<span class="turn-title">Still being written</span>
				</p>
			{/if}
		</nav>

		<ol class="ruler" aria-label="All days">
			{#each data.ruler as slot (slot.day)}
				<li>
					{#if slot.title}
						<a
							href={dayHref(slot.day)}
							class:here={slot.day === data.day}
							aria-current={slot.day === data.day ? 'page' : undefined}
							aria-label="Day {slot.day}: {slot.title}"
							{@attach magnetic}
						>
							<span>{slot.day}</span>
						</a>
					{:else}
						<span class="unwritten" title="Day {slot.day} is still being written"></span>
					{/if}
				</li>
			{/each}
		</ol>
	</div>
{/key}

<style>
	.desk {
		min-height: 100svh;
		overflow: clip;
		background: var(--paper);
		color: var(--ink);
		padding-bottom: clamp(6rem, 10vw, 8rem);
	}

	.masthead {
		position: relative;
		max-width: 92rem;
		margin-inline: auto;
		padding: clamp(6.5rem, 15svh, 10rem) var(--gutter) clamp(3.5rem, 7vw, 6rem);
	}

	/* A very large, very quiet day number sits behind the title like a watermark. */
	.numeral {
		font-variation-settings: 'opsz' 18;
		position: absolute;
		top: clamp(2rem, 5svh, 4rem);
		right: var(--gutter);
		font-family: var(--display);
		font-size: clamp(14rem, 40vw, 38rem);
		font-style: normal;
		line-height: 0.85;
		letter-spacing: -0.05em;
		color: var(--paper-shade);
		font-variant-numeric: lining-nums;
		pointer-events: none;
	}

	.masthead-text {
		position: relative;
	}

	.kicker,
	.meta {
		font-family: var(--ui);
		font-size: 0.95rem;
		font-weight: 500;
	}

	.kicker {
		margin-bottom: clamp(1rem, 2.5vw, 2rem);
	}

	h1 {
		font-variation-settings: 'opsz' 36;
		view-transition-name: page-title;
		max-width: 14ch;
		font-family: var(--display);
		font-size: clamp(3rem, 8.4vw, 8.5rem);
		font-weight: 400;
		line-height: 0.98;
		letter-spacing: -0.03em;
	}

	.prompt {
		margin-top: 1rem;
		font-size: clamp(1.8rem, 3vw, 2.5rem);
		color: var(--accent-deep);
		rotate: -1deg;
		transform-origin: 0 50%;
	}

	.meta {
		margin-top: clamp(1.25rem, 2.5vw, 2rem);
		color: var(--dim-on-paper);
		font-weight: 400;
	}

	.sheet {
		position: relative;
		z-index: 2;
		width: min(42rem, 100% - 2 * var(--gutter));
		margin-inline: auto;
		padding-left: clamp(1.75rem, 4vw, 3rem);
	}

	.margin {
		position: absolute;
		top: 0.5rem;
		bottom: 0;
		left: 0;
		width: 1px;
		background: rgb(20 17 14 / 0.14);
	}

	.margin-line {
		position: absolute;
		inset: 0;
		background: var(--ink);
		transform-origin: 50% 0;
	}

	.margin-nib {
		position: absolute;
		left: 0.5px;
		top: 0;
		width: 0;
		height: 0;
	}

	.margin-nib svg {
		position: absolute;
		left: -8px;
		bottom: 0;
		transform-origin: 50% 100%;
		transform: rotate(14deg);
	}

	.ink {
		transition: opacity 0.7s ease-out;
	}

	:global(.ink.drying) {
		opacity: 0.12;
	}

	.body {
		font-size: clamp(1.2rem, 1.5vw, 1.34rem);
		line-height: 1.62;
	}

	.body p,
	.body ol {
		margin: 0 0 1.2em;
		white-space: pre-line;
		overflow-wrap: break-word;
	}

	.body > p:first-child:not(.salutation)::first-letter {
		float: left;
		padding: 0.06em 0.09em 0 0;
		font-family: var(--display);
		font-size: 4.3em;
		line-height: 0.78;
	}

	.salutation {
		font-family: var(--display);
		font-size: clamp(2.2rem, 4.5vw, 3.25rem);
		font-style: normal;
		line-height: 1.1;
	}

	.body ol {
		list-style: none;
		counter-reset: fact;
		padding: 0;
	}

	.body li {
		position: relative;
		counter-increment: fact;
		padding: 0.6em 0 0.6em 3rem;
		border-bottom: 1px solid rgb(20 17 14 / 0.12);
	}

	.body li::before {
		content: counter(fact);
		position: absolute;
		left: 0;
		top: 0.42em;
		font-family: var(--display);
		font-size: 1.5rem;
		font-variant-numeric: lining-nums;
		color: var(--dim-on-paper);
	}

	.body mark {
		color: inherit;
		background: linear-gradient(var(--tint), var(--tint)) no-repeat 0 0 / 100% 100%;
		-webkit-box-decoration-break: clone;
		box-decoration-break: clone;
	}

	.squiggle {
		display: block;
		width: 7rem;
		margin: 2.4em auto;
		overflow: visible;
	}

	.squiggle path {
		fill: none;
		stroke: var(--ink);
		stroke-width: 1.6;
		stroke-linecap: round;
		stroke-dasharray: 1;
	}

	.scribble {
		margin-top: 2em;
		font-size: clamp(1.8rem, 2.6vw, 2.2rem);
		color: var(--accent-deep);
		rotate: -1deg;
	}

	.turn {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		max-width: 92rem;
		margin: clamp(4.5rem, 10vw, 8rem) auto 0;
		padding-inline: var(--gutter);
	}

	.turn-link {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		padding: 1.4rem 0 1.75rem;
		border-top: 1px solid var(--ink);
		color: var(--ink);
		text-decoration: none;
	}

	.back {
		grid-column: 1;
		padding-right: 1.5rem;
	}

	.forward {
		grid-column: 2;
		padding-left: 1.5rem;
		align-items: flex-end;
		text-align: right;
	}

	.turn-label {
		font-family: var(--ui);
		font-size: 0.9rem;
		font-weight: 500;
	}

	.turn-title {
		font-family: var(--display);
		font-size: clamp(1.55rem, 3.7vw, 3.5rem);
		line-height: 1.05;
		letter-spacing: -0.02em;
		transition: translate 0.5s var(--spring);
	}

	a.turn-link:hover .turn-title,
	a.turn-link:focus-visible .turn-title {
		font-style: italic;
	}

	.back:hover .turn-title {
		translate: -0.25rem 0;
	}

	a.forward:hover .turn-title {
		translate: 0.25rem 0;
	}

	.waiting {
		color: var(--dim-on-paper);
	}

	.ruler {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.1rem;
		list-style: none;
		max-width: 92rem;
		margin: clamp(2.5rem, 6vw, 4.5rem) auto 0;
		padding-inline: var(--gutter);
	}

	.ruler a,
	.unwritten {
		position: relative;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		width: 1.5rem;
		height: 3.25rem;
		color: var(--ink);
		font-family: var(--ui);
		font-size: 0.72rem;
		font-weight: 500;
		text-decoration: none;
	}

	.ruler a::before,
	.unwritten::before {
		content: '';
		position: absolute;
		top: 0.2rem;
		width: 1px;
		height: 1.75rem;
		background: currentColor;
		transform-origin: 50% 0;
		transition: transform 0.25s var(--spring);
	}

	.unwritten {
		opacity: 0.25;
	}

	.ruler a span {
		opacity: 0;
		transition: opacity 0.15s;
	}

	.ruler a:hover::before,
	.ruler a:focus-visible::before,
	.here::before {
		transform: scaleY(1.25);
	}

	.ruler a:hover span,
	.ruler a:focus-visible span,
	.here span {
		opacity: 1;
	}

	.ruler .here {
		color: var(--accent);
	}

	@media (hover: none) {
		.ruler a span {
			opacity: 0.6;
		}
	}

	@media (max-width: 47.5rem) {
		.numeral {
			top: 3rem;
			right: 0.5rem;
		}

		h1 {
			font-variation-settings: 'opsz' 20;
		}
	}
</style>
