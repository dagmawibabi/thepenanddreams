<script lang="ts">
	import { onMount } from 'svelte';
	import { asset } from '$app/paths';
	import { dino } from '#lib/dino.svelte.ts';
	import { gsap, hasFinePointer, prefersMotion } from '#lib/motion.ts';
	import Wordmark from './Wordmark.svelte';

	let root = $state<HTMLElement>();

	onMount(() => {
		if (!root || !prefersMotion()) return;
		const el = root;
		dino.hidden = true;

		const context = gsap.context(() => {
			const letters = gsap.utils.toArray<HTMLElement>('.mark .letter');
			const notes = { one: '.cut-note-1', two: '.cut-note-2' };

			/* Page load: the masthead rises, the photo develops, then the scraps land. */
			gsap.set('.until-placed', { visibility: 'visible' });

			gsap
				.timeline({ defaults: { ease: 'expo.out' } })
				.from(letters, { yPercent: 118, duration: 1.2, stagger: 0.03 })
				.from(
					'.print',
					{ clipPath: 'inset(100% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut' },
					0.1
				)
				.from('.print img', { scale: 1.3, duration: 1.8 }, 0.1)
				.from('.slap-1', { autoAlpha: 0, scale: 1.35, rotation: -7, duration: 0.8 }, 1.05)
				.from('.slap-2', { autoAlpha: 0, scale: 1.35, rotation: 6, duration: 0.8 }, 1.2)
				.from(
					'.slap-3',
					{ autoAlpha: 0, y: 90, rotation: 10, duration: 1, ease: 'back.out(1.7)' },
					1.35
				)
				.from('.intro-line', { autoAlpha: 0, y: 10, duration: 0.8 }, 1.7);

			/* Scroll: all sizes are read fresh on refresh. */
			const place = (selector: string, narrow: [number, number], wide: [number, number]) => {
				const node = el.querySelector<HTMLElement>(selector)!;
				const collage = el.querySelector<HTMLElement>('.collage')!;
				const stage = el.querySelector<HTMLElement>('.stage')!;
				const isNarrow = () => window.innerWidth < 760;
				const target = () => (isNarrow() ? narrow : wide);
				return {
					x: () =>
						target()[0] * stage.clientWidth -
						(collage.offsetLeft + node.offsetLeft + node.offsetWidth / 2),
					y: () =>
						target()[1] * stage.clientHeight -
						(collage.offsetTop + node.offsetTop + node.offsetHeight / 2),
					scale: () => {
						const goal = isNarrow() ? window.innerWidth * 0.66 : window.innerWidth * 0.27;
						return Math.min(goal / node.offsetWidth, 2.1);
					}
				};
			};

			const fall = () => window.innerHeight * 1.25;

			gsap
				.timeline({
					defaults: { ease: 'none' },
					scrollTrigger: {
						trigger: el,
						start: 'top top',
						end: 'bottom bottom',
						scrub: true,
						invalidateOnRefresh: true,
						onUpdate: (self) => {
							dino.hidden = self.progress < 0.3;
						},
						onLeave: () => {
							dino.hidden = false;
						},
						onEnterBack: () => {
							dino.hidden = false;
						},
						onLeaveBack: () => {
							dino.hidden = true;
						}
					}
				})
				.to('.hint', { autoAlpha: 0, y: -16, duration: 0.06 }, 0)
				/* The camera pushes into the sweater until the sweater is the page. */
				.to('.print-scrub', { scale: 4.4, duration: 0.42, ease: 'power2.in' }, 0.02)
				.to('.print-scrub', { opacity: 0, duration: 0.1 }, 0.34)
				.to('.mark-scrub', { yPercent: -125, duration: 0.3, ease: 'power2.in' }, 0.14)
				.to('.cut-dino', { y: -46, x: 22, rotation: 10, duration: 0.07, ease: 'power2.out' }, 0.04)
				.to('.cut-dino', { y: fall, x: 90, rotation: 44, duration: 0.18, ease: 'power2.in' }, 0.11)
				.to(
					notes.one,
					{
						...place(notes.one, [0.42, 0.2], [0.17, 0.46]),
						rotation: -5,
						duration: 0.3,
						ease: 'power2.out'
					},
					0.08
				)
				.to(
					notes.two,
					{
						...place(notes.two, [0.58, 0.82], [0.83, 0.56]),
						rotation: 4,
						duration: 0.3,
						ease: 'power2.out'
					},
					0.16
				)
				.fromTo(
					'.statement',
					{ opacity: 0, y: 34 },
					{ opacity: 1, y: 0, duration: 0.13, ease: 'power2.out' },
					0.4
				)
				.to('.statement', { opacity: 0, y: -34, duration: 0.09, ease: 'power2.in' }, 0.76)
				.to(notes.one, { y: `+=${fall()}`, rotation: -30, duration: 0.22, ease: 'power2.in' }, 0.74)
				.to(notes.two, { y: `+=${fall()}`, rotation: 24, duration: 0.22, ease: 'power2.in' }, 0.78);

			/* Pointer: every scrap floats at its own depth. */
			if (hasFinePointer()) {
				const layers = gsap.utils.toArray<HTMLElement>('[data-depth]').map((node) => ({
					depth: Number(node.dataset.depth),
					x: gsap.quickTo(node, 'x', { duration: 1, ease: 'power3' }),
					y: gsap.quickTo(node, 'y', { duration: 1, ease: 'power3' })
				}));
				const move = (event: PointerEvent) => {
					const dx = event.clientX / window.innerWidth - 0.5;
					const dy = event.clientY / window.innerHeight - 0.5;
					layers.forEach((layer) => {
						layer.x(dx * layer.depth);
						layer.y(dy * layer.depth);
					});
				};
				el.addEventListener('pointermove', move);
				return () => el.removeEventListener('pointermove', move);
			}
		}, el);

		return () => {
			context.revert();
			dino.hidden = false;
		};
	});
</script>

<section bind:this={root} class="hero">
	<div class="stage">
		<h1 class="mark">
			<span class="mark-scrub">
				<span class="mark-clip"><Wordmark /></span>
			</span>
		</h1>

		<div class="collage">
			<div class="print-scrub">
				<div data-depth="12">
					<div class="print until-placed">
						<img
							src={asset('collage/photo-base.webp')}
							alt="A young woman with a chestnut bob, standing among friends, wearing a black sweater."
							width="960"
							height="960"
							fetchpriority="high"
						/>
					</div>
				</div>
			</div>

			<div class="cut cut-note-1">
				<div data-depth="30">
					<div class="slap slap-1 until-placed">
						<img
							src={asset('collage/note-1.webp')}
							alt="Handwritten note: You write so beautifully."
							width="552"
							height="240"
						/>
					</div>
				</div>
			</div>

			<div class="cut cut-note-2">
				<div data-depth="40">
					<div class="slap slap-2 until-placed">
						<img
							src={asset('collage/note-2.webp')}
							alt="Torn handwritten note: The inside of your head must be a terrible place."
							width="672"
							height="440"
						/>
					</div>
				</div>
			</div>

			<div class="cut cut-dino">
				<div data-depth="54">
					<div class="slap slap-3 until-placed">
						<img
							class="pixels"
							src={asset('collage/dino.webp')}
							alt="A pixelated green dinosaur stitched on the sweater."
							width="524"
							height="454"
						/>
					</div>
				</div>
			</div>
		</div>

		<p class="statement">Thirty prompts.<br />Thirty days.<br /><em>One pen.</em></p>

		<p class="hint hand" aria-hidden="true">
			<span class="intro-line until-placed">keep scrolling, the notes come off</span>
		</p>
	</div>
</section>

<style>
	.hero {
		position: relative;
		background: var(--ground);
	}

	.stage {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		overflow: clip;
		padding-top: clamp(3.75rem, 8svh, 5rem);
	}

	.mark {
		position: relative;
		z-index: 6;
		font-weight: 400;
		/* The name is 8.1em wide in this face, so this keeps all of it on screen. */
		font-size: min(calc((100vw - 2 * var(--gutter)) / 8.2), 24svh);
		color: var(--paper);
	}

	.mark-scrub {
		display: block;
	}

	/* Masks the letters as they rise; the padding leaves room for the descenders. */
	.mark-clip {
		display: block;
		overflow: clip;
		padding-block: 0.08em 0.16em;
	}

	.collage {
		--side: min(66svh, 84vw);
		position: relative;
		z-index: 2;
		width: var(--side);
		height: var(--side);
		margin-top: calc(var(--side) * -0.075);
		flex: none;
	}

	.print-scrub {
		position: absolute;
		inset: 0;
		transform-origin: 50% 90%;
		will-change: transform, opacity;
	}

	[data-depth] {
		will-change: transform;
	}

	.print {
		position: relative;
		overflow: clip;
	}

	/* The sweater dissolves into the page, so there is no edge when the camera pushes in. */
	.print::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(transparent 58%, var(--ground) 100%);
		pointer-events: none;
	}

	.print img,
	.cut img {
		display: block;
		width: 100%;
		height: auto;
		user-select: none;
	}

	/* Positions come straight from where each scrap sat in the 640px picture. */
	.cut {
		position: absolute;
		will-change: transform;
	}

	.cut-note-1 {
		left: 0;
		top: 34.8%;
		width: 43.1%;
		z-index: 4;
	}

	.cut-note-2 {
		left: 46.7%;
		top: 49.4%;
		width: 52.5%;
		z-index: 5;
	}

	.cut-dino {
		left: 40.5%;
		top: 64.5%;
		width: 40.9%;
		z-index: 3;
	}

	.slap-1,
	.slap-2 {
		filter: drop-shadow(0 14px 18px rgb(0 0 0 / 0.5));
	}

	.pixels {
		image-rendering: pixelated;
		mask-image: linear-gradient(#000 84%, transparent);
	}

	.statement {
		font-family: var(--display);
		line-height: 1.04;
		letter-spacing: -0.015em;
		text-align: center;
	}

	.hint {
		position: absolute;
		z-index: 7;
		right: var(--gutter);
		bottom: clamp(1.25rem, 4svh, 2.5rem);
		max-width: 11em;
		font-size: clamp(1.7rem, 2.2vw, 2.2rem);
		text-align: right;
		rotate: -2deg;
	}

	.intro-line {
		display: inline-block;
	}

	@media (prefers-reduced-motion: no-preference) {
		.hero {
			height: 300svh;
		}

		.stage {
			position: sticky;
			top: 0;
			height: 100svh;
		}

		.statement {
			position: absolute;
			z-index: 3;
			top: 50%;
			left: 50%;
			margin: -1.6em 0 0;
			translate: -50% 0;
			opacity: 0;
			font-size: clamp(2.5rem, 3.7vw, 4rem);
			white-space: nowrap;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.stage {
			min-height: 100svh;
			padding-bottom: 5rem;
		}

		.statement {
			margin-top: 4rem;
			font-size: clamp(2.5rem, 6vw, 4.5rem);
		}

		.hint {
			display: none;
		}
	}

	@media (max-width: 47.5rem) {
		.stage {
			justify-content: center;
			padding-top: 3rem;
			padding-bottom: 3rem;
		}

		.collage {
			margin-top: -0.75rem;
		}

		.hint {
			left: 0;
			right: 0;
			bottom: 1.5rem;
			max-width: none;
			text-align: center;
		}
	}
</style>
