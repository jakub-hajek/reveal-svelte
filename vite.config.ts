import { fileURLToPath } from 'node:url';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		// The dev/test harness imports the library by its package name, whose
		// exports map points at the built dist/. Resolve to the live source
		// instead so the harness gets HMR and never requires a prior build.
		alias: {
			'reveal-svelte': fileURLToPath(new URL('./src/lib', import.meta.url))
		}
	},
	server: {
		allowedHosts: ['docker-main.zamekhome']
	}
});
