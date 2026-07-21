export interface MathProps {
    latex: string;
    displayMode?: boolean;
}
export interface MarkdownProps {
    content: string;
    sanitize?: boolean;
}
export interface CodeProps {
    code: string;
    language: string;
    lineNumbers?: boolean;
    highlightLines?: number[];
    theme?: string;
    maxHeight?: string;
    copyButton?: boolean;
}
