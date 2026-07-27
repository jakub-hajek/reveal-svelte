export type GanttTimeUnit = 'day' | 'week' | 'month' | 'quarter' | 'year';
export interface GanttTick {
    ms: number;
    label: string;
}
export interface GanttScale {
    min: number;
    max: number;
    unit: GanttTimeUnit;
    ticks: GanttTick[];
}
export declare function toUTCms(value: string | Date): number;
export declare function formatGanttDate(ms: number, locale?: string): string;
/** Half-width of the arrow head, in px; the connector line stops here. */
export declare const GANTT_ARROW_HEAD = 7;
/**
 * Orthogonal finish-to-start connector from (x1, y1) — the predecessor's end —
 * to (x2, y2) — the successor's start. Coordinates are px inside the plot
 * canvas. The line stops short of x2 to leave room for the arrow head.
 */
export declare function ganttDependencyPath(x1: number, y1: number, x2: number, y2: number, rowHeight: number): string;
/** Filled triangle pointing right, with its tip at (x, y). */
export declare function ganttArrowHead(x: number, y: number): string;
export declare function computeGanttScale(startMs: number, endMs: number, locale?: string): GanttScale;
