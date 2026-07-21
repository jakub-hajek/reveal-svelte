import type { Config as DOMPurifyConfig } from 'dompurify';
import type { MarkedOptions } from 'marked';
export interface RenderMarkdownOptions {
    /** Sanitize generated HTML via DOMPurify. Defaults to true. */
    sanitize?: boolean;
    /** Extra options applied to the shared `marked` instance. */
    markedOptions?: MarkedOptions;
    /** Extra DOMPurify config merged with safe defaults when sanitize=true. */
    dompurifyConfig?: DOMPurifyConfig;
}
/**
 * Render Markdown to HTML with safe defaults.
 *
 * - Uses a shared `marked` instance configured for GFM + hard line breaks.
 * - Sanitizes output with DOMPurify by default.
 */
export declare function renderMarkdown(markdown: string, options?: RenderMarkdownOptions): Promise<string>;
