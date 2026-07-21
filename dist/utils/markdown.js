import DOMPurify from 'dompurify';
import { marked } from 'marked';
let dompurifyHardened = false;
let markedConfigured = false;
const defaultMarkedOptions = {
    gfm: true,
    breaks: true
};
const defaultDOMPurifyConfig = {
    ALLOWED_TAGS: [
        'a',
        'blockquote',
        'br',
        'code',
        'del',
        'em',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'hr',
        'img',
        'li',
        'ol',
        'p',
        'pre',
        'strong',
        'table',
        'tbody',
        'td',
        'th',
        'thead',
        'tr',
        'ul'
    ],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'src', 'alt', 'class'],
    ALLOW_DATA_ATTR: false
};
function configureMarkedOnce() {
    if (markedConfigured)
        return;
    markedConfigured = true;
    marked.setOptions(defaultMarkedOptions);
}
function hardenDOMPurifyOnce() {
    if (dompurifyHardened)
        return;
    dompurifyHardened = true;
    // Defense-in-depth: DOMPurify already blocks `javascript:` URLs, but we
    // explicitly strip dangerous protocols on common URL-bearing attributes.
    DOMPurify.addHook('afterSanitizeAttributes', (node) => {
        const el = node;
        if (typeof el.getAttribute !== 'function' || typeof el.removeAttribute !== 'function')
            return;
        const urlAttrs = ['href', 'src', 'xlink:href'];
        for (const attr of urlAttrs) {
            const raw = el.getAttribute(attr);
            if (!raw)
                continue;
            const normalized = raw.replace(/\s+/g, '').toLowerCase();
            if (normalized.startsWith('javascript:') ||
                normalized.startsWith('vbscript:') ||
                normalized.startsWith('data:')) {
                el.removeAttribute(attr);
            }
        }
    });
}
/**
 * Render Markdown to HTML with safe defaults.
 *
 * - Uses a shared `marked` instance configured for GFM + hard line breaks.
 * - Sanitizes output with DOMPurify by default.
 */
export async function renderMarkdown(markdown, options = {}) {
    const { sanitize = true, markedOptions, dompurifyConfig } = options;
    configureMarkedOnce();
    const parsed = await marked.parse(markdown ?? '', markedOptions);
    if (!sanitize)
        return parsed;
    hardenDOMPurifyOnce();
    return DOMPurify.sanitize(parsed, {
        ...defaultDOMPurifyConfig,
        ...dompurifyConfig
    });
}
