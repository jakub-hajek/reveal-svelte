import type { Snippet } from 'svelte';
interface Props {
    background?: string;
    transition?: 'slide' | 'fade' | 'convex' | 'concave' | 'zoom';
    dataAutoAnimate?: boolean;
    children?: Snippet;
}
declare const BaseSlide: import("svelte").Component<Props, {}, "">;
type BaseSlide = ReturnType<typeof BaseSlide>;
export default BaseSlide;
