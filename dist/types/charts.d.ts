import type { ChartData as ChartJSData, ChartOptions as ChartJSOptions } from 'chart.js';
export type ChartData = ChartJSData;
export type ChartOptions = ChartJSOptions;
export interface ChartProps {
    data: ChartData;
    options?: ChartOptions;
    width?: number;
    height?: number;
}
export interface GanttTask {
    label: string;
    /** Stable key for `dependsOn` references; defaults to `label` */
    id?: string;
    /** `id` (or `label`) of the task(s) this one follows; draws finish-to-start arrows */
    dependsOn?: string | string[];
    /** ISO date string (e.g. '2026-03-01') or Date */
    start: string | Date;
    /** Omit for a milestone (single point in time) */
    end?: string | Date;
    /** Tasks in the same section share a color; sections appear in the legend */
    section?: string;
    /** 0–100; when set, the bar renders as a track with a solid fill */
    progress?: number;
    /** Overrides the section color for this task */
    color?: string;
    /** Force milestone rendering even when `end` is set */
    milestone?: boolean;
}
export interface GanttChartProps {
    tasks: GanttTask[];
    /** true = current date, or an explicit date; draws a dashed marker line */
    today?: boolean | string | Date;
    /** Locale for axis labels and tooltips (defaults to the browser locale) */
    locale?: string;
    /** Legend label for tasks without a section (defaults per locale: cs → 'Ostatní', otherwise 'Other') */
    otherLabel?: string;
    /** Set false to keep `dependsOn` data but hide the arrows */
    dependencies?: boolean;
    width?: number;
    rowHeight?: number;
    labelWidth?: number;
}
