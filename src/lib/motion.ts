import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

const browser = typeof window !== 'undefined';

if (browser) gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

export const prefersMotion = () =>
	browser && window.matchMedia('(prefers-reduced-motion: no-preference)').matches;

export const hasFinePointer = () =>
	browser && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

let lenis: Lenis | undefined;

export const smoothScroll = () => lenis;

export function startSmoothScroll() {
	if (!prefersMotion()) return () => {};

	lenis = new Lenis({ lerp: 0.16, wheelMultiplier: 1 });
	lenis.on('scroll', ScrollTrigger.update);
	const tick = (time: number) => lenis?.raf(time * 1000);
	gsap.ticker.add(tick);
	gsap.ticker.lagSmoothing(0);

	return () => {
		gsap.ticker.remove(tick);
		lenis?.destroy();
		lenis = undefined;
	};
}

export function scrollToTarget(target: number | HTMLElement) {
	if (lenis) lenis.scrollTo(target, { duration: 1.3 });
	else if (typeof target === 'number') window.scrollTo({ top: target });
	else target.scrollIntoView();
}

/** Attachment: the element leans towards the pointer and springs back when it leaves. */
export function magnetic(node: HTMLElement) {
	if (!hasFinePointer() || !prefersMotion()) return;
	const toX = gsap.quickTo(node, 'x', { duration: 0.5, ease: 'power3' });
	const toY = gsap.quickTo(node, 'y', { duration: 0.5, ease: 'power3' });

	const move = (event: PointerEvent) => {
		const box = node.getBoundingClientRect();
		toX((event.clientX - box.left - box.width / 2) * 0.32);
		toY((event.clientY - box.top - box.height / 2) * 0.32);
	};
	const leave = () => {
		gsap.to(node, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.35)', overwrite: true });
	};

	node.addEventListener('pointermove', move);
	node.addEventListener('pointerleave', leave);
	return () => {
		node.removeEventListener('pointermove', move);
		node.removeEventListener('pointerleave', leave);
	};
}

/** Attachment: a pen stroke draws itself the first time it scrolls into view. */
export function drawOnView(node: SVGElement) {
	if (!prefersMotion()) return;
	const paths = [...node.querySelectorAll('path')];
	gsap.set(paths, { strokeDashoffset: 1 });
	const observer = new IntersectionObserver(
		([entry]) => {
			if (!entry.isIntersecting) return;
			observer.disconnect();
			gsap.to(paths, { strokeDashoffset: 0, duration: 0.8, stagger: 0.5, ease: 'power1.inOut' });
		},
		{ rootMargin: '0px 0px -18% 0px' }
	);
	observer.observe(node);
	return () => observer.disconnect();
}

/** Repeatable pseudo-random numbers, so server and browser draw the same scraps. */
export function seeded(seed: number) {
	let state = seed * 2654435761 + 1;
	return () => {
		state = (state * 1664525 + 1013904223) % 4294967296;
		return state / 4294967296;
	};
}
