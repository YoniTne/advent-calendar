import { backOut, cubicOut } from 'svelte/easing';
import type { TransitionConfig } from 'svelte/transition';

/** Winners rise softly into place; a plain cross-fade when the user prefers reduced motion. */
export function reveal(_node: Element, { delay = 0 } = {}): TransitionConfig {
	const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
	return {
		delay: reduced ? 0 : delay,
		duration: reduced ? 200 : 420,
		easing: cubicOut,
		css: (t, u) => (reduced ? `opacity: ${t}` : `opacity: ${t}; transform: translateY(${u * 8}px) scale(${0.96 + 0.04 * t})`)
	};
}

/** Gifts pop in with a little overshoot; a fade when the user prefers reduced motion. */
export function pop(_node: Element, { delay = 0 } = {}): TransitionConfig {
	const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
	return {
		delay: reduced ? 0 : delay,
		duration: reduced ? 200 : 520,
		easing: backOut,
		css: (t) => (reduced ? `opacity: ${t}` : `opacity: ${Math.min(1, t * 1.5)}; transform: scale(${0.6 + 0.4 * t})`)
	};
}
