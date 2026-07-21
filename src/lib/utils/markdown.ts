import DOMPurify from 'dompurify';
import { marked } from 'marked';

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

let dompurifyHardened = false;
let markedConfigured = false;

const defaultMarkedOptions: MarkedOptions = {
	gfm: true,
	breaks: true
};

const defaultDOMPurifyConfig: DOMPurifyConfig = {
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
	if (markedConfigured) return;
	markedConfigured = true;
	marked.setOptions(defaultMarkedOptions);
}

function hardenDOMPurifyOnce() {
	if (dompurifyHardened) return;
	dompurifyHardened = true;

	// Defense-in-depth: DOMPurify already blocks `javascript:` URLs, but we
	// explicitly strip dangerous protocols on common URL-bearing attributes.
	DOMPurify.addHook('afterSanitizeAttributes', (node) => {
		const el = node as unknown as {
			getAttribute?: (name: string) => string | null;
			removeAttribute?: (name: string) => void;
		};
		if (typeof el.getAttribute !== 'function' || typeof el.removeAttribute !== 'function') return;

		const urlAttrs = ['href', 'src', 'xlink:href'] as const;
		for (const attr of urlAttrs) {
			const raw = el.getAttribute(attr);
			if (!raw) continue;

			const normalized = raw.replace(/\s+/g, '').toLowerCase();
			if (
				normalized.startsWith('javascript:') ||
				normalized.startsWith('vbscript:') ||
				normalized.startsWith('data:')
			) {
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
export async function renderMarkdown(markdown: string, options: RenderMarkdownOptions = {}) {
	const { sanitize = true, markedOptions, dompurifyConfig } = options;
	configureMarkedOnce();
	const parsed = await marked.parse(markdown ?? '', markedOptions);
	if (!sanitize) return parsed;

	hardenDOMPurifyOnce();
	return DOMPurify.sanitize(parsed, {
		...defaultDOMPurifyConfig,
		...dompurifyConfig
	});
}
