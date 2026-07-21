import type {
	SlideComponentEntry,
	SlideEntry,
	SlideMarkdownEntry,
	SlideModule
} from '../types/slides.js';

export function extractSlideStem(path: string, ext: 'svelte' | 'md'): string {
	const re = ext === 'svelte' ? /\/slides\/(.+)\.svelte$/ : /\/slides\/(.+)\.md$/;
	return path.match(re)?.[1] ?? path;
}

export function parseNumericPrefix(value: string): {
	hasPrefix: boolean;
	prefix: number;
	rest: string;
} {
	const match = value.match(/^(\d+)(?:[-_\s](.*))?$/);
	if (!match) return { hasPrefix: false, prefix: Number.POSITIVE_INFINITY, rest: value };
	return { hasPrefix: true, prefix: Number(match[1]), rest: match[2] ?? '' };
}

export function compareOrder(a: string, b: string): number {
	const aKey = parseNumericPrefix(a);
	const bKey = parseNumericPrefix(b);

	if (aKey.hasPrefix && bKey.hasPrefix) {
		if (aKey.prefix !== bKey.prefix) return aKey.prefix - bKey.prefix;
		return aKey.rest.localeCompare(bKey.rest);
	}

	if (aKey.hasPrefix !== bKey.hasPrefix) return aKey.hasPrefix ? -1 : 1;
	return a.localeCompare(b);
}

export type OrderComparable = { order: string; type: SlideEntry['type']; id: string };

export function compareEntries(a: OrderComparable, b: OrderComparable): number {
	const orderResult = compareOrder(a.order, b.order);
	if (orderResult !== 0) return orderResult;
	if (a.type !== b.type) return a.type === 'component' ? -1 : 1;
	return a.id.localeCompare(b.id);
}

export function createMarkdownSlides(
	modules: Record<string, string>,
	componentIds: Set<string>
): SlideMarkdownEntry[] {
	const usedIds = new Set(componentIds);
	return Object.entries(modules)
		.map<SlideMarkdownEntry>(([path, markdown]) => {
			const stem = extractSlideStem(path, 'md');
			return {
				type: 'markdown',
				id: stem,
				order: stem,
				markdown,
				sourcePath: path
			};
		})
		.sort(compareEntries)
		.map((entry) => {
			if (!usedIds.has(entry.id)) {
				usedIds.add(entry.id);
				return entry;
			}

			let disambiguated = `${entry.id}--md`;
			let counter = 2;
			while (usedIds.has(disambiguated)) {
				disambiguated = `${entry.id}--md-${counter}`;
				counter += 1;
			}

			usedIds.add(disambiguated);
			return { ...entry, id: disambiguated };
		});
}

export function createSlideComponentEntries(
	modules: Record<string, SlideModule>
): SlideComponentEntry[] {
	return Object.entries(modules)
		.map<SlideComponentEntry>(([path, module]) => {
			const stem = extractSlideStem(path, 'svelte');
			return {
				type: 'component',
				id: stem,
				order: stem,
				component: module.default,
				title: module.metadata?.title
			};
		})
		.sort(compareEntries);
}

export function createSlideEntries({
	slideModules,
	markdownModules
}: {
	slideModules: Record<string, SlideModule>;
	markdownModules: Record<string, string>;
}): SlideEntry[] {
	const slideComponentEntries = createSlideComponentEntries(slideModules);
	const markdownSlides = createMarkdownSlides(
		markdownModules,
		new Set(slideComponentEntries.map((entry) => entry.id))
	);

	return [...slideComponentEntries, ...markdownSlides].sort(compareEntries);
}
