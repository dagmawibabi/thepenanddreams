<script lang="ts">
	import { onMount } from 'svelte';
	import { asset } from '$app/paths';
	import { page } from '$app/state';
	import { dino } from '#lib/dino.svelte.ts';
	import { gsap, prefersMotion } from '#lib/motion.ts';

	let walker = $state<HTMLElement>();
	let body = $state<HTMLElement>();
	let ready = $state(false);
	let percent = $state(0);
	let said = $state<string>();

	const LINES = [
		'rawr',
		'I used to live on a sweater',
		'the notes are not about me',
		'I only have the one pose',
		'keep reading',
		'rawr, but politely'
	];
	let lineIndex = 0;
	let hushTimer: ReturnType<typeof setTimeout>;

	$effect(() => {
		if (dino.hops) hop();
	});

	onMount(() => {
		if (!walker || !body) return;
		const walkerEl = walker;
		const bodyEl = body;
		ready = true;
		const moving = prefersMotion();

		/* Page size is only read when it changes, never inside the animation frame. */
		let room = 1;
		let travel = 0;
		const measure = () => {
			room = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
			travel = window.innerWidth - walkerEl.offsetWidth;
			lastY = -1;
		};
		const observer = new ResizeObserver(measure);
		observer.observe(document.body);
		observer.observe(walkerEl);

		let x = 0;
		let phase = 0;
		let facing = 1;
		let lastY = -1;
		let stride = 0;

		const tick = () => {
			if (dino.hidden) return;
			const y = window.scrollY;
			const target = (Math.min(1, Math.max(0, y / room)) * travel) | 0;
			const moved = lastY < 0 ? 0 : y - lastY;
			if (moved === 0 && lastY >= 0 && Math.abs(target - x) < 0.5 && stride < 0.02) return;
			lastY = y;

			percent = Math.round(Math.min(1, Math.max(0, y / room)) * 100);
			x = moving ? x + (target - x) * 0.12 : target;
			walkerEl.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
			if (!moving) return;

			if (Math.abs(moved) > 0.4) {
				phase += Math.min(Math.abs(moved), 40) * 0.055;
				facing = moved > 0 ? -1 : 1;
			}
			stride += ((Math.abs(target - x) > 1 ? 1 : 0) - stride) * 0.15;
			const rotation = Math.sin(phase) * 5 * stride;
			const lift = -Math.abs(Math.sin(phase)) * 9 * stride;
			bodyEl.style.transform = `translate3d(0, ${lift.toFixed(1)}px, 0) rotate(${rotation.toFixed(2)}deg) scaleX(${facing})`;
		};

		gsap.ticker.add(tick);
		return () => {
			gsap.ticker.remove(tick);
			observer.disconnect();
		};
	});

	function poke() {
		said = LINES[lineIndex++ % LINES.length];
		clearTimeout(hushTimer);
		hushTimer = setTimeout(() => (said = undefined), 2400);
		hop();
	}

	function hop() {
		if (!walker || !prefersMotion()) return;
		const leap = walker.querySelector('.leap');
		gsap
			.timeline()
			.to(leap, { scaleY: 0.82, scaleX: 1.1, duration: 0.09, transformOrigin: '50% 100%' })
			.to(leap, { y: -110, scaleY: 1.08, scaleX: 0.95, duration: 0.26, ease: 'power2.out' })
			.to(leap, { y: 0, scaleY: 1, scaleX: 1, duration: 0.5, ease: 'bounce.out' });
	}
</script>

<div class="track" class:shown={ready && !dino.hidden} class:reading={page.route.id !== '/'}>
	<button bind:this={walker} class="walker" onclick={poke} aria-label="Poke the dinosaur">
		<span class="flag hand" class:speaking={said} aria-live="polite">
			{said ?? `${percent}% of the way`}
		</span>
		<span class="leap">
			<span bind:this={body} class="body">
				<img src={asset('collage/dino.webp')} alt="" width="524" height="454" draggable="false" />
			</span>
		</span>
	</button>
</div>

<style>
	.track {
		position: fixed;
		inset: auto 0 0;
		z-index: 30;
		height: 0;
		transform: translateY(16rem);
		transition: transform 0.7s cubic-bezier(0.3, 1.3, 0.5, 1);
	}

	.track.shown {
		transform: none;
	}

	.walker {
		position: absolute;
		left: 0;
		bottom: 0;
		width: clamp(4.75rem, 8vw, 7.5rem);
		padding: 0;
		background: none;
		border: 0;
		cursor: pointer;
		will-change: transform;
	}

	/* Smaller on an article, where it walks past lines people are reading. */
	.reading .walker {
		width: clamp(3.25rem, 4.5vw, 4.5rem);
	}

	.leap,
	.body {
		display: block;
	}

	.body {
		transform-origin: 50% 100%;
		will-change: transform;
	}

	img {
		display: block;
		width: 100%;
		height: auto;
		image-rendering: pixelated;
		/* The picture crops the legs at the knee, so the screen edge has to as well. */
		margin-bottom: -3px;
	}

	.flag {
		position: absolute;
		bottom: 92%;
		left: 50%;
		padding: 0.15rem 0.7rem 0.3rem;
		background: var(--paper);
		color: var(--ink);
		font-size: 1.45rem;
		white-space: nowrap;
		box-shadow: 0 2px 5px rgb(0 0 0 / 0.3);
		opacity: 0;
		transform: translate(-50%, 0.5rem);
		transition:
			opacity 0.2s,
			transform 0.3s cubic-bezier(0.3, 1.5, 0.5, 1);
		pointer-events: none;
	}

	.flag.speaking,
	.walker:hover .flag,
	.walker:focus-visible .flag {
		opacity: 1;
		transform: translate(-50%, 0);
	}
</style>
