import type { SlideComponentEntry, SlideEntry, SlideMarkdownEntry, SlideModule } from '../types/slides.js';
export declare function extractSlideStem(path: string, ext: 'svelte' | 'md'): string;
export declare function parseNumericPrefix(value: string): {
    hasPrefix: boolean;
    prefix: number;
    rest: string;
};
export declare function compareOrder(a: string, b: string): number;
export type OrderComparable = {
    order: string;
    type: SlideEntry['type'];
    id: string;
};
export declare function compareEntries(a: OrderComparable, b: OrderComparable): number;
export declare function createMarkdownSlides(modules: Record<string, string>, componentIds: Set<string>): SlideMarkdownEntry[];
export declare function createSlideComponentEntries(modules: Record<string, SlideModule>): SlideComponentEntry[];
export declare function createSlideEntries({ slideModules, markdownModules }: {
    slideModules: Record<string, SlideModule>;
    markdownModules: Record<string, string>;
}): SlideEntry[];
