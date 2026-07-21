import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
    viteConfig,
    defineConfig({
        test: {
            include: ['src/**/*.{test,spec}.{js,ts}'],
            environment: 'jsdom',
            setupFiles: ['./vitest.setup.ts'],
            globals: true,
            coverage: {
                provider: 'v8',
                include: ['src/lib/**/*'],
                exclude: ['src/lib/types/**/*']
            }
        },
        resolve: {
            conditions: ['browser', 'development']
        }
    })
);
