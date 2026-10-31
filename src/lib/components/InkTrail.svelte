<script lang="ts">
	import { onMount } from 'svelte';
	import { gsap, hasFinePointer, prefersMotion } from '#lib/motion.ts';

	let canvas = $state<HTMLCanvasElement>();
	let nib = $state<HTMLElement>();
	let active = $state(false);

	const TRAIL_LIFE = 800;

	onMount(() => {
		if (!canvas || !nib || !hasFinePointer() || !prefersMotion()) return;
		const surface = canvas;
		const pen = nib;
		active = true;
		document.documentElement.classList.add('has-nib');

		const context = surface.getContext('2d')!;
		const points: { x: number; y: number; t: number }[] = [];
		const toX = gsap.quickSetter(pen, 'x', 'px');
		const toY = gsap.quickSetter(pen, 'y', 'px');
		const toLean = gsap.quickSetter(pen, 'rotation', 'deg');
		let lean = 0;
		let lastX = 0;
		let drawing = false;

		const resize = () => {
			const scale = Math.min(window.devicePixelRatio, 1.5);
			surface.width = window.innerWidth * scale;
			surface.height = window.innerHeight * scale;
			context.setTransform(scale, 0, 0, scale, 0, 0);
			context.lineCap = 'round';
			context.strokeStyle = '#e56a2b';
		};

		const move = (event: PointerEvent) => {
			points.push({ x: event.clientX, y: event.clientY, t: performance.now() });
			toX(event.clientX);
			toY(event.clientY);
			lean += (event.clientX - lastX) * 0.5;
			lastX = event.clientX;
			const target = event.target as Element | null;
			pen.classList.toggle('over-link', !!target?.closest?.('a, button'));
			pen.classList.add('placed');
			if (!drawing) {
				drawing = true;
				surface.style.visibility = 'visible';
				gsap.ticker.add(draw);
			}
		};
		const down = () => pen.classList.add('pressed');
		const up = () => pen.classList.remove('pressed');

		/* Only runs while there is ink to fade, and the canvas is hidden the rest of the time. */
		function draw() {
			const now = performance.now();
			while (points.length && now - points[0].t > TRAIL_LIFE) points.shift();
			context.clearRect(0, 0, window.innerWidth, window.innerHeight);
			for (let i = 1; i < points.length; i++) {
				const life = 1 - (now - points[i].t) / TRAIL_LIFE;
				context.globalAlpha = life * 0.85;
				context.lineWidth = 0.5 + life * 1.3;
				context.beginPath();
				context.moveTo(points[i - 1].x, points[i - 1].y);
				context.lineTo(points[i].x, points[i].y);
				context.stroke();
			}
			lean *= 0.86;
			toLean(Math.max(-28, Math.min(28, lean)));
			if (points.length === 0 && Math.abs(lean) < 0.1) {
				drawing = false;
				surface.style.visibility = 'hidden';
				gsap.ticker.remove(draw);
			}
		}

		resize();
		window.addEventListener('resize', resize);
		window.addEventListener('pointermove', move, { passive: true });
		window.addEventListener('pointerdown', down);
		window.addEventListener('pointerup', up);

		return () => {
			document.documentElement.classList.remove('has-nib');
			window.removeEventListener('resize', resize);
			window.removeEventListener('pointermove', move);
			window.removeEventListener('pointerdown', down);
			window.removeEventListener('pointerup', up);
			gsap.ticker.remove(draw);
		};
	});
</script>

<canvas bind:this={canvas} class:active aria-hidden="true"></canvas>
<div bind:this={nib} class="nib" class:active aria-hidden="true">
	<svg viewBox="0 0 28 44" width="20" height="31">
		<path d="M14 44 5 21 9 3h10l4 18Z" fill="#0e0b08" stroke="#f4f2ec" stroke-width="1.4" />
		<path d="M14 44V24" stroke="#f4f2ec" stroke-width="1.2" />
		<circle cx="14" cy="22" r="2.4" fill="#f4f2ec" />
	</svg>
</div>

<style>
	canvas {
		display: none;
		position: fixed;
		inset: 0;
		width: 100vw;
		height: 100vh;
		z-index: 70;
		pointer-events: none;
		visibility: hidden;
	}

	canvas.active {
		display: block;
	}

	.nib {
		display: none;
		position: fixed;
		left: 0;
		top: 0;
		z-index: 75;
		width: 0;
		height: 0;
		pointer-events: none;
		visibility: hidden;
		will-change: transform;
	}

	.nib.active {
		display: block;
	}

	:global(.nib.placed) {
		visibility: visible;
	}

	/* The tip of the nib is the true hotspot, and it sits on the pointer position. */
	svg {
		position: absolute;
		left: -10px;
		bottom: 0;
		transform-origin: 50% 100%;
		transform: rotate(-32deg);
		transition: transform 0.3s cubic-bezier(0.3, 1.6, 0.5, 1);
	}

	:global(.nib.over-link) svg {
		transform: rotate(-8deg) scale(1.3);
	}

	:global(.nib.pressed) svg {
		transform: rotate(-32deg) scale(0.82);
	}

	:global(html.has-nib),
	:global(html.has-nib *) {
		cursor: none !important;
	}
</style>
