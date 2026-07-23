import type { GanttTask } from '../../types/charts';
type $$ComponentProps = {
    tasks: GanttTask[];
    today?: boolean | string | Date;
    locale?: string;
    otherLabel?: string;
    width?: number;
    rowHeight?: number;
    labelWidth?: number;
    class?: string;
};
declare const GanttChart: import("svelte").Component<$$ComponentProps, {}, "">;
type GanttChart = ReturnType<typeof GanttChart>;
export default GanttChart;
