<script lang="ts">
	import { drawOnView } from '#lib/motion.ts';

	let { kind }: { kind: 'circle' | 'arrow' | 'underline' } = $props();

	const STROKES = {
		circle: {
			box: '0 0 180 110',
			paths: [
				'M70 8C30 4 5 22 5 52c0 34 40 52 88 50 48-2 84-22 80-56C169 16 124 1 74 7 60 9 49 12 40 18'
			]
		},
		arrow: { box: '0 0 100 64', paths: ['M97 8C70 44 40 54 8 44', 'M24 29 7 44l19 13'] },
		underline: { box: '0 0 200 14', paths: ['M3 9C40 3 92 12 197 5'] }
	};

	const stroke = $derived(STROKES[kind]);
</script>

<svg
	class="pen"
	viewBox={stroke.box}
	preserveAspectRatio={kind === 'circle' ? 'none' : undefined}
	aria-hidden="true"
	{@attach drawOnView}
>
	{#each stroke.paths as d, index (index)}
		<path {d} pathLength="1" />
	{/each}
</svg>

<style>
	.pen {
		display: block;
		width: 100%;
		height: 100%;
		overflow: visible;
		pointer-events: none;
	}

	path {
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-dasharray: 1;
	}
</style>
