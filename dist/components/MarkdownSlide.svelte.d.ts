import type { FooterConfig } from '../types/slides.js';
interface Props {
    /** Optional identifier used for error reporting. */
    id?: string;
    /** Optional source path used for error reporting. */
    sourcePath?: string;
    content: string;
    sanitize?: boolean;
    class?: string;
    background?: string;
    transition?: 'slide' | 'fade' | 'convex' | 'concave' | 'zoom';
    dataAutoAnimate?: boolean;
    footerConfig?: FooterConfig;
}
declare const MarkdownSlide: import("svelte").Component<Props, {}, "">;
type MarkdownSlide = ReturnType<typeof MarkdownSlide>;
export default MarkdownSlide;
