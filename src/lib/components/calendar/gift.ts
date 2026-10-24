/** Wrapping colour of a day's gift, spread so that neighbours differ. */
export const giftColor = (day: number) => `var(--gift-${((day * 3) % 5) + 1})`;

export const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
