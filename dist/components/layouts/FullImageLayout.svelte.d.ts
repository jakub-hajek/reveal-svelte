import type { Snippet } from 'svelte';
type $$ComponentProps = {
    imageUrl: string;
    alt?: string;
    overlay?: Snippet;
    overlayPosition?: 'top' | 'center' | 'bottom';
    darken?: number;
    background?: string;
    transition?: 'slide' | 'fade' | 'convex' | 'concave' | 'zoom';
};
declare const FullImageLayout: import("svelte").Component<$$ComponentProps, {}, "">;
type FullImageLayout = ReturnType<typeof FullImageLayout>;
export default FullImageLayout;
