import type { ChartData, ChartOptions } from '../../types/charts';
type $$ComponentProps = {
    data: ChartData;
    options?: ChartOptions;
    width?: number;
    height?: number;
    class?: string;
};
declare const BarChart: import("svelte").Component<$$ComponentProps, {}, "">;
type BarChart = ReturnType<typeof BarChart>;
export default BarChart;
