type $$ComponentProps = {
    src?: Record<string, unknown>;
    elements?: unknown[];
    appState?: Record<string, unknown>;
    files?: Record<string, unknown>;
    width?: string;
    height?: string;
    exportPadding?: number;
    handDrawn?: boolean;
    class?: string;
};
declare const Excalidraw: import("svelte").Component<$$ComponentProps, {}, "">;
type Excalidraw = ReturnType<typeof Excalidraw>;
export default Excalidraw;
