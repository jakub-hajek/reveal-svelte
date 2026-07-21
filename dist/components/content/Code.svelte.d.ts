import 'svelte-highlight/styles/atom-one-dark.css';
import type { Snippet } from 'svelte';
interface Props {
    code?: string;
    language?: string;
    filename?: string;
    lineNumbers?: boolean;
    highlightLines?: number[];
    maxHeight?: string;
    copyButton?: boolean;
    children?: Snippet;
}
declare const Code: import("svelte").Component<Props, {}, "">;
type Code = ReturnType<typeof Code>;
export default Code;
