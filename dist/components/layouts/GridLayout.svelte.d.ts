import type { Snippet } from 'svelte';
type $$ComponentProps = {
    items: Array<{
        id: string;
        content: Snippet | string;
    }>;
    columns?: number;
    gap?: string;
    background?: string;
    transition?: 'slide' | 'fade' | 'convex' | 'concave' | 'zoom';
};
declare const GridLayout: import("svelte").Component<$$ComponentProps, {}, "">;
type GridLayout = ReturnType<typeof GridLayout>;
export default GridLayout;
