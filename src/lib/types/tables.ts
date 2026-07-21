import type { ComponentType } from 'svelte';

export interface TableColumn<T = Record<string, unknown>> {
	key: keyof T;
	header: string;
	sortable?: boolean;
	width?: string;
	align?: 'left' | 'center' | 'right';
	render?: (value: T[keyof T], row: T) => string | ComponentType;
}

export interface TableProps<T = Record<string, unknown>> {
	columns: TableColumn<T>[];
	data: T[];
	sortable?: boolean;
	striped?: boolean;
	bordered?: boolean;
}
