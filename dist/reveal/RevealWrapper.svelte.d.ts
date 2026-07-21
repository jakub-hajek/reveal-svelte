import type { Snippet } from 'svelte';
import type { RevealConfig } from '../types/reveal.js';
export interface Props {
    config?: RevealConfig;
    class?: string;
    children?: Snippet;
}
declare const RevealWrapper: import("svelte").Component<Props, {}, "">;
type RevealWrapper = ReturnType<typeof RevealWrapper>;
export default RevealWrapper;
