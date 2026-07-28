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
    /**
     * Tasks in the same section share a color and a legend entry; with `groups`
     * set on the chart, the section also becomes a collapsible row
     */
    section?: string;
    /** 0–100; when set, the bar renders as a track with a solid fill */
    progress?: number;
    /** Overrides the section color for this task */
    color?: string;
    /** Force milestone rendering even when `end` is set */
    milestone?: boolean;
    /**
     * Free-form note shown in the bar's detail popup. Plain text: newlines are
     * preserved, markup is not interpreted. Keep it to a few lines — a long one
     * scrolls, which is no use on a projector.
     */
    comment?: string;
}
export interface GanttChartProps {
    tasks: GanttTask[];
    /** true = current date, or an explicit date; draws a dashed marker line */
    today?: boolean | string | Date;
    /** Locale for axis labels and popup dates (defaults to the browser locale) */
    locale?: string;
    /** Legend label for tasks without a section (defaults per locale: cs → 'Ostatní', otherwise 'Other') */
    otherLabel?: string;
    /** Set false to keep `dependsOn` data but hide the arrows */
    dependencies?: boolean;
    /** Promotes each `section` to a collapsible group row with its own header */
    groups?: boolean;
    /**
     * Groups collapsed on first render — `true` for all of them, or a list of
     * section names. This seeds the initial state only; clicks take over after.
     */
    collapsed?: boolean | string[];
    /** Forces the legend on or off; by default it shows only when `groups` is off */
    legend?: boolean;
    /** Draws a rolled-up bar on an *expanded* group's header row */
    summaryBar?: boolean;
    /**
     * Set false to drop the detail popup — bars go back to plain, non-focusable
     * divs with a native `title`, for decks that don't want one tab stop per task
     */
    tooltip?: boolean;
    /**
     * Width (px) of the detail popup. A prop rather than a CSS custom property
     * because the placement math has to know it before the popup renders.
     */
    tooltipWidth?: number;
    width?: number;
    rowHeight?: number;
    /** Height of one packed sub-lane inside a collapsed group row */
    laneHeight?: number;
    /** Font size (px) of the labels drawn on or beside bars in a collapsed group */
    barLabelSize?: number;
    labelWidth?: number;
    class?: string;
}
