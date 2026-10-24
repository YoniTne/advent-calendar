<script lang="ts">
	import { onMount } from 'svelte';

	let canvas: HTMLCanvasElement;

	// Decorative only: Math.random is fine here, it never touches the draw.
	onMount(() => {
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		let width = 0;
		let height = 0;
		const resize = () => {
			const dpr = Math.min(devicePixelRatio, 2);
			width = innerWidth;
			height = innerHeight;
			canvas.width = width * dpr;
			canvas.height = height * dpr;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		};
		resize();
		addEventListener('resize', resize);

		const flakes = Array.from({ length: Math.round(Math.min(110, width / 9)) }, () => ({
			x: Math.random() * width,
			y: Math.random() * height,
			r: 0.8 + Math.random() * 2.4,
			speed: 0.25 + Math.random() * 0.8,
			phase: Math.random() * Math.PI * 2
		}));

		let frame = 0;
		let last = performance.now();
		const draw = (time: number) => {
			const step = Math.min(50, time - last) / 16.7;
			last = time;
			ctx.clearRect(0, 0, width, height);
			ctx.fillStyle = getComputedStyle(canvas).color;
			for (const f of flakes) {
				f.y += f.speed * step;
				f.phase += 0.012 * step;
				f.x += Math.sin(f.phase) * 0.35 * step;
				if (f.y > height + 4) {
					f.y = -4;
					f.x = Math.random() * width;
				}
				ctx.globalAlpha = 0.35 + f.r / 5;
				ctx.beginPath();
				ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
				ctx.fill();
			}
			frame = requestAnimationFrame(draw);
		};
		frame = requestAnimationFrame(draw);

		return () => {
			cancelAnimationFrame(frame);
			removeEventListener('resize', resize);
		};
	});
</script>

<canvas bind:this={canvas} aria-hidden="true" class="pointer-events-none fixed inset-0 -z-10 size-full text-(--snow)"
></canvas>
