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
export declare function computeGanttScale(startMs: number, endMs: number, locale?: string): GanttScale;
