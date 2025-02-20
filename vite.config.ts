import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		coverage: {
            enabled: true,
            reporter: ['text-summary'], // Only output the coverage summary to the terminal
			include: ['src/**/*.server.ts'],
            exclude: ['src/**/*.svelte']
        }
	}
});
 
