export function extractSlideStem(path, ext) {
    const re = ext === 'svelte' ? /\/slides\/(.+)\.svelte$/ : /\/slides\/(.+)\.md$/;
    return path.match(re)?.[1] ?? path;
}
export function parseNumericPrefix(value) {
    const match = value.match(/^(\d+)(?:[-_\s](.*))?$/);
    if (!match)
        return { hasPrefix: false, prefix: Number.POSITIVE_INFINITY, rest: value };
    return { hasPrefix: true, prefix: Number(match[1]), rest: match[2] ?? '' };
}
export function compareOrder(a, b) {
    const aKey = parseNumericPrefix(a);
    const bKey = parseNumericPrefix(b);
    if (aKey.hasPrefix && bKey.hasPrefix) {
        if (aKey.prefix !== bKey.prefix)
            return aKey.prefix - bKey.prefix;
        return aKey.rest.localeCompare(bKey.rest);
    }
    if (aKey.hasPrefix !== bKey.hasPrefix)
        return aKey.hasPrefix ? -1 : 1;
    return a.localeCompare(b);
}
export function compareEntries(a, b) {
    const orderResult = compareOrder(a.order, b.order);
    if (orderResult !== 0)
        return orderResult;
    if (a.type !== b.type)
        return a.type === 'component' ? -1 : 1;
    return a.id.localeCompare(b.id);
}
export function createMarkdownSlides(modules, componentIds) {
    const usedIds = new Set(componentIds);
    return Object.entries(modules)
        .map(([path, markdown]) => {
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
export function createSlideComponentEntries(modules) {
    return Object.entries(modules)
        .map(([path, module]) => {
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
export function createSlideEntries({ slideModules, markdownModules }) {
    const slideComponentEntries = createSlideComponentEntries(slideModules);
    const markdownSlides = createMarkdownSlides(markdownModules, new Set(slideComponentEntries.map((entry) => entry.id)));
    return [...slideComponentEntries, ...markdownSlides].sort(compareEntries);
}
