<script lang="ts">
	import { onMount } from 'svelte';
	import { asset, resolve } from '$app/paths';
	import type { DayCard } from '#lib/content.ts';
	import { gsap, prefersMotion, scrollToTarget, ScrollTrigger, seeded } from '#lib/motion.ts';

	let { days }: { days: DayCard[] } = $props();

	let root = $state<HTMLElement>();
	let track = $state<HTMLElement>();
	let stringPath = $state<SVGPathElement>();
	let currentDay = $state(1);

	/** Photos were shuffled once into static/prints, one file per day. */
	const PRINT_COUNT = 30;
	const printFor = (day: number) =>
		day <= PRINT_COUNT
			? asset(`prints/day-${String(day).padStart(2, '0')}.webp` as Parameters<typeof asset>[0])
			: undefined;

	const slots = $derived.by(() => {
		const random = seeded(12);
		return days.map((slot) => ({ ...slot, tilt: (random() - 0.5) * 2.6 }));
	});

	/** The card's title flies up to become the article's heading in the view transition. */
	function liftCard(event: MouseEvent) {
		const card = event.currentTarget as HTMLElement;
		card.querySelector<HTMLElement>('.title')!.style.viewTransitionName = 'page-title';
	}

	onMount(() => {
		if (!root || !track || !prefersMotion()) return;
		const wrap = root;
		const line = track;
		const SWING_REACH = 420;
		const STRING_REST = 16;
		const context = gsap.context(() => {
			const swings = gsap.utils.toArray<HTMLElement>('.swing');
			const physics = swings.map((node, index) => ({
				node,
				offset: 0,
				width: 0,
				angle: 0,
				velocity: (index % 2 ? 1 : -1) * 1.4,
				looseness: 0.75 + ((index * 37) % 10) / 16,
				light: -1,
				attended: false,
				set: gsap.quickSetter(node, 'rotation', 'deg')
			}));
			const setX = gsap.quickSetter(line, 'x', 'px');

			/* Layout is read once per refresh, never inside the animation frame. */
			let distance = 0;
			let viewport = window.innerWidth;
			const measure = () => {
				distance = line.scrollWidth - window.innerWidth;
				viewport = window.innerWidth;
				physics.forEach((card) => {
					card.offset = card.node.offsetLeft;
					card.width = card.node.offsetWidth;
				});
				const pegStart = swings[0].offsetLeft + swings[0].offsetWidth / 2;
				const pegStep = swings[1].offsetLeft - swings[0].offsetLeft;
				let d = 'M0 24';
				swings.forEach((_, index) => {
					const peg = pegStart + pegStep * index;
					d += `Q${peg - pegStep / 2} ${24 + STRING_REST} ${peg} 24`;
				});
				d += `Q${line.scrollWidth - pegStep / 2} ${24 + STRING_REST} ${line.scrollWidth} 24`;
				stringPath?.setAttribute('d', d);
			};
			measure();

			let x = 0;
			let lastX = 0;
			let inView = false;
			let drawnSag = 1;

			ScrollTrigger.create({
				trigger: wrap,
				start: 'top top',
				end: 'bottom bottom',
				onRefresh: (self) => {
					measure();
					x = -distance * self.progress;
					setX(x);
				},
				onUpdate: (self) => {
					x = -distance * self.progress;
					setX(x);
					currentDay = Math.min(days.length, Math.floor(self.progress * days.length) + 1);
				}
			});
			ScrollTrigger.create({
				trigger: wrap,
				start: 'top bottom',
				end: 'bottom top',
				onToggle: (self) => {
					inView = self.isActive;
				}
			});

			const tick = () => {
				if (!inView) return;
				const speed = x - lastX;
				lastX = x;

				for (const card of physics) {
					const near = card.offset > -x - SWING_REACH && card.offset < -x + viewport + SWING_REACH;
					if (!near) continue;

					/* A print comes up out of the dark as it reaches the middle of the room. */
					const fromCentre = Math.abs(card.offset + card.width / 2 + x - viewport / 2);
					const target = card.attended
						? 1
						: Math.max(
								0.24,
								Math.min(1, 1.18 - (fromCentre / Math.max(viewport * 0.6, 560)) * 0.95)
							);
					const light = card.light < 0 ? target : card.light + (target - card.light) * 0.16;
					if (Math.abs(light - card.light) > 0.004) {
						card.light = light;
						card.node.style.opacity = light.toFixed(3);
					}

					/* Prints hang from one clip, so scroll speed pushes them like wind. */
					if (speed === 0 && Math.abs(card.angle) < 0.02 && Math.abs(card.velocity) < 0.02)
						continue;
					card.velocity += -card.angle * 0.035 + speed * 0.005 * card.looseness;
					card.velocity *= 0.95;
					card.angle += card.velocity;
					card.set(Math.max(-18, Math.min(18, card.angle)));
				}

				/* The string sags by stretching its layer, so it is never redrawn while scrolling. */
				const sag = 1 + Math.min(1, Math.abs(speed) / 28);
				if (stringPath?.parentElement && Math.abs(sag - drawnSag) > 0.01) {
					stringPath.parentElement.style.transform = `scaleY(${sag.toFixed(3)})`;
					drawnSag = sag;
				}
			};
			gsap.ticker.add(tick);

			/* Brushing past a print sets it moving and brings it into the light. */
			const cardFor = (event: Event) => physics.find((entry) => entry.node === event.currentTarget);
			const attend = (event: Event) => {
				const card = cardFor(event);
				if (!card) return;
				card.attended = true;
				if (event.type === 'pointerenter') card.velocity += (Math.random() > 0.5 ? 1 : -1) * 1.1;
			};
			const release = (event: Event) => {
				const card = cardFor(event);
				if (card) card.attended = false;
			};
			swings.forEach((node) => {
				node.addEventListener('pointerenter', attend);
				node.addEventListener('pointerleave', release);
				node.addEventListener('focusin', attend);
				node.addEventListener('focusout', release);
			});

			return () => {
				gsap.ticker.remove(tick);
				swings.forEach((node) => {
					node.removeEventListener('pointerenter', attend);
					node.removeEventListener('pointerleave', release);
					node.removeEventListener('focusin', attend);
					node.removeEventListener('focusout', release);
				});
			};
		}, wrap);

		/* Tabbing to a card that is out of view scrolls the page to it. */
		const onFocus = (event: FocusEvent) => {
			const target = event.target as Element;
			const card = target.closest('.slot') as HTMLElement | null;
			if (!card || !target.matches(':focus-visible')) return;
			const range = wrap.offsetHeight - window.innerHeight;
			const share = card.offsetLeft / (line.scrollWidth - card.offsetWidth);
			scrollToTarget(wrap.offsetTop + range * share);
		};
		wrap.addEventListener('focusin', onFocus);

		return () => {
			wrap.removeEventListener('focusin', onFocus);
			context.revert();
		};
	});
</script>

{#snippet photo(day: number)}
	{@const src = printFor(day)}
	{#if src}
		<span class="photo">
			<img
				{src}
				alt=""
				width="720"
				height="900"
				loading="lazy"
				decoding="async"
				draggable="false"
			/>
		</span>
	{/if}
{/snippet}

<section bind:this={root} id="days" class="line" style="--count:{days.length}">
	<div class="stage">
		<header>
			<h2>Pick a day</h2>
			<p class="counter" aria-hidden="true">
				Day <span>{currentDay}</span> of {days.length}
			</p>
		</header>

		<div bind:this={track} class="track">
			<svg class="string" aria-hidden="true">
				<path bind:this={stringPath} d="M0 24H20000" />
			</svg>

			<ol class="cards">
				{#each slots as slot (slot.day)}
					<li class="slot">
						<div class="swing">
							<svg class="clip" viewBox="0 0 26 34" aria-hidden="true">
								<path d="M7 13 10 1h6l3 12Z" fill="none" stroke="#b8b4aa" stroke-width="1.3" />
								<path d="M2 13h22l-2 21H4Z" fill="#26231f" stroke="#55514a" stroke-width="0.8" />
							</svg>
							{#if slot.title}
								<a
									class="card"
									style="--tilt:{slot.tilt}deg"
									href={resolve('/day/[day]', { day: String(slot.day) })}
									onclick={liftCard}
								>
									{@render photo(slot.day)}
									<span class="open hand" aria-hidden="true">read it</span>
									<span class="caption">
										<span class="numeral"><span class="sr-only">Day </span>{slot.day}</span>
										<span class="text">
											<span class="title">{slot.title}</span>
											<span class="excerpt">{slot.line}</span>
										</span>
									</span>
								</a>
							{:else}
								<div class="card blank" style="--tilt:{slot.tilt}deg">
									{@render photo(slot.day)}
									<span class="caption">
										<span class="numeral"><span class="sr-only">Day </span>{slot.day}</span>
										<span class="text">
											<span class="title">{slot.prompt}</span>
											<span class="excerpt">Still being written</span>
										</span>
									</span>
								</div>
							{/if}
						</div>
					</li>
				{/each}
			</ol>
		</div>
	</div>
</section>

<style>
	.line {
		--step: clamp(19rem, 29vw, 27rem);
		--pad: clamp(2rem, 14vw, 14rem);
		--hang: clamp(10rem, 25svh, 14rem);
		position: relative;
		z-index: 4;
		background: var(--ground);
		color: var(--paper);
	}

	.stage {
		position: relative;
		overflow: clip;
		background: var(--ground);
	}

	header {
		position: absolute;
		inset: clamp(4.5rem, 10svh, 6rem) var(--gutter) auto;
		z-index: 1;
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		pointer-events: none;
	}

	h2 {
		font-family: var(--display);
		font-size: clamp(2.75rem, 6vw, 5.5rem);
		font-weight: 400;
		line-height: 1;
		letter-spacing: -0.025em;
	}

	.counter {
		font-family: var(--ui);
		font-size: clamp(0.9rem, 1.1vw, 1.05rem);
		font-weight: 500;
		color: var(--dim-on-ground);
		font-variant-numeric: tabular-nums;
	}

	.counter span {
		color: var(--paper);
	}

	.track {
		position: relative;
		width: max-content;
		padding-inline: var(--pad);
		padding-top: var(--hang);
		will-change: transform;
	}

	.string {
		position: absolute;
		left: 0;
		top: calc(var(--hang) - 24px);
		width: 100%;
		height: 90px;
		overflow: visible;
		pointer-events: none;
		transform-origin: 0 24px;
	}

	.string path {
		fill: none;
		stroke: var(--paper);
		stroke-width: 1;
		opacity: 0.45;
	}

	.cards {
		display: flex;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.slot {
		flex: none;
		width: var(--step);
		display: flex;
		justify-content: center;
	}

	.swing {
		position: relative;
		width: calc(var(--step) - 2.25rem);
		transform-origin: 50% 0;
	}

	.clip {
		position: absolute;
		z-index: 2;
		top: -0.8rem;
		left: 50%;
		width: 1.25rem;
		height: auto;
		translate: -50% 0;
		transition: scale 0.25s var(--spring);
	}

	.swing:hover .clip,
	.swing:focus-within .clip {
		scale: 1.14;
	}

	.card {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
		height: clamp(25rem, 62svh, 37rem);
		padding: 0.7rem 0.7rem 1rem;
		color: var(--ink);
		background: var(--paper);
		rotate: var(--tilt);
		text-decoration: none;
		transform-origin: 50% 0;
		transition:
			rotate 0.6s var(--spring),
			scale 0.6s var(--spring);
	}

	a.card:hover,
	a.card:focus-visible {
		rotate: 0deg;
		scale: 1.025;
	}

	.photo {
		position: relative;
		flex: 1;
		min-height: 0;
		overflow: clip;
		background: var(--paper-shade);
	}

	.photo img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		/* Most of these are portraits, so favour the top of the frame. */
		object-position: 50% 26%;
		transition: scale 0.9s var(--spring);
		user-select: none;
	}

	a.card:hover .photo img,
	a.card:focus-visible .photo img {
		scale: 1.045;
	}

	.caption {
		display: flex;
		flex: none;
		align-items: flex-start;
		gap: 0.8rem;
		padding-inline: 0.3rem;
	}

	.numeral {
		flex: none;
		font-family: var(--display);
		font-variation-settings: 'opsz' 18;
		font-size: clamp(3.25rem, 4.6vw, 4.5rem);
		line-height: 0.92;
		letter-spacing: -0.04em;
		font-variant-numeric: lining-nums;
	}

	/* The numeral slips into italic and the title gains an underline as the pen arrives. */
	a.card:hover .numeral,
	a.card:focus-visible .numeral {
		font-style: italic;
	}

	.open {
		position: absolute;
		top: 1.3rem;
		right: 1.3rem;
		padding: 0 0.5rem 0.15rem;
		background: var(--paper);
		color: var(--accent-deep);
		font-size: 1.75rem;
		opacity: 0;
		rotate: -6deg;
		translate: 0 0.4rem;
		transition:
			opacity 0.25s,
			translate 0.5s var(--spring);
	}

	a.card:hover .open,
	a.card:focus-visible .open {
		opacity: 1;
		translate: 0 0;
	}

	@media (hover: none) {
		.open {
			opacity: 0.8;
			translate: 0 0;
		}
	}

	.text {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		min-width: 0;
	}

	.title {
		font-family: var(--display);
		font-size: clamp(1.15rem, 1.5vw, 1.4rem);
		font-weight: 500;
		line-height: 1.12;
		letter-spacing: -0.012em;
		background: linear-gradient(currentColor, currentColor) no-repeat 0 100% / 0% 1px;
		transition: background-size 0.5s var(--spring);
	}

	a.card:hover .title,
	a.card:focus-visible .title {
		background-size: 100% 1px;
	}

	.excerpt {
		display: -webkit-box;
		overflow: hidden;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		font-size: clamp(0.98rem, 1.1vw, 1.08rem);
		font-style: italic;
		line-height: 1.28;
		color: var(--dim-on-paper);
	}

	.blank {
		background: var(--ground);
		color: var(--paper);
		box-shadow: inset 0 0 0 1px rgb(244 242 236 / 0.28);
	}

	.blank .excerpt {
		color: var(--dim-on-ground);
	}

	/* Not written yet: the print is still developing. */
	.blank .photo img {
		opacity: 0.4;
		filter: grayscale(1);
	}

	@media (prefers-reduced-motion: no-preference) {
		/* Permanent layers: creating one as a card comes on screen is what caused dropped frames. */
		.swing {
			will-change: transform, opacity;
		}

		.string {
			will-change: transform;
		}

		.line {
			/* The cards travel faster than the page scrolls, so the line never drags. */
			height: calc(100svh + (var(--count) * var(--step) + 2 * var(--pad) - 100vw) * 0.6);
		}

		.stage {
			position: sticky;
			top: 0;
			height: 100svh;
		}
	}

	/* Without motion the line is an ordinary sideways-scrolling row. */
	@media (prefers-reduced-motion: reduce) {
		.stage {
			overflow-x: auto;
			padding-bottom: 5rem;
		}

		header {
			position: sticky;
			left: 0;
			inset-inline: 0;
			padding: 4.5rem var(--gutter) 0;
		}

		.counter {
			display: none;
		}

		.track {
			padding-top: 4rem;
		}

		.string {
			display: none;
		}
	}

	@media (max-width: 47.5rem) {
		.line {
			--step: 76vw;
			--pad: 12vw;
		}
	}
</style>
