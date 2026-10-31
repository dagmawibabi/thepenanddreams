<script lang="ts">
	import { author } from '#lib/site.ts';
	import { gsap, hasFinePointer, prefersMotion } from '#lib/motion.ts';

	let { reactive = true }: { reactive?: boolean } = $props();

	const letters = [...author];

	/** Letters shy away from the pen as it passes over them, like wet ink being nudged. */
	function nudged(node: HTMLElement) {
		if (!reactive || !hasFinePointer() || !prefersMotion()) return;
		const spans = [...node.querySelectorAll<HTMLElement>('.letter')];
		const setters = spans.map((span) => ({
			y: gsap.quickTo(span, 'y', { duration: 0.55, ease: 'power3' }),
			rotation: gsap.quickTo(span, 'rotation', { duration: 0.7, ease: 'power3' })
		}));

		/* Measured once on entry, not on every pointer move, and only letters in reach animate. */
		let boxes: DOMRect[] = [];
		const pulled = spans.map(() => false);

		const enter = () => {
			boxes = spans.map((span) => span.getBoundingClientRect());
		};
		const move = (event: PointerEvent) => {
			boxes.forEach((box, index) => {
				const dx = event.clientX - (box.left + box.width / 2);
				const dy = event.clientY - (box.top + box.height / 2);
				const pull = Math.max(0, 1 - Math.hypot(dx, dy) / (box.height * 0.9));
				if (pull === 0 && !pulled[index]) return;
				pulled[index] = pull > 0;
				setters[index].y(-pull * box.height * 0.2);
				setters[index].rotation(pull * (dx > 0 ? -11 : 11));
			});
		};
		const leave = () => {
			setters.forEach((setter, index) => {
				if (!pulled[index]) return;
				pulled[index] = false;
				setter.y(0);
				setter.rotation(0);
			});
		};

		node.addEventListener('pointerenter', enter);
		node.addEventListener('pointermove', move);
		node.addEventListener('pointerleave', leave);
		return () => {
			node.removeEventListener('pointerenter', enter);
			node.removeEventListener('pointermove', move);
			node.removeEventListener('pointerleave', leave);
		};
	}
</script>

<span class="wordmark" aria-label={author} role="img" {@attach nudged}>
	{#each letters as letter, index (index)}
		<span class="letter" aria-hidden="true">{letter}</span>
	{/each}
</span>

<style>
	.wordmark {
		display: inline-flex;
		font-family: var(--display);
		font-weight: 400;
		/* Sturdier hairlines than the face's largest optical size, which vanish on screen. */
		font-variation-settings: 'opsz' 36;
		letter-spacing: -0.03em;
		line-height: 1;
		white-space: nowrap;
	}

	.letter {
		display: inline-block;
	}
</style>
