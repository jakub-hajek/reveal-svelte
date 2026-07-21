<script lang="ts" generics="T = Record<string, unknown>">
	import type { TableColumn } from '../../types/tables';

	interface Props {
		columns: TableColumn<T>[];
		data: T[];
		sortable?: boolean;
		striped?: boolean;
		bordered?: boolean;
	}

	let { columns, data, sortable = true, striped = false, bordered = false }: Props = $props();

	let sortColumn = $state<keyof T | null>(null);
	let sortDirection = $state<'asc' | 'desc'>('asc');

	let sortedData = $derived.by(() => {
		if (!sortColumn) return data;

		return [...data].sort((a, b) => {
			const aVal = a[sortColumn!];
			const bVal = b[sortColumn!];

			if (aVal === bVal) return 0;

			let comparison = 0;
			if (typeof aVal === 'string' && typeof bVal === 'string') {
				comparison = aVal.localeCompare(bVal);
			} else if (typeof aVal === 'number' && typeof bVal === 'number') {
				comparison = aVal - bVal;
			} else {
				comparison = String(aVal).localeCompare(String(bVal));
			}

			return sortDirection === 'asc' ? comparison : -comparison;
		});
	});

	function handleSort(column: TableColumn<T>) {
		const isSortable = sortable && column.sortable !== false;
		if (!isSortable) return;

		if (sortColumn === column.key) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = column.key;
			sortDirection = 'asc';
		}
	}

	function getCellValue(row: T, column: TableColumn<T>): string {
		const value = row[column.key];
		if (column.render) {
			const rendered = column.render(value, row);
			return typeof rendered === 'string' ? rendered : String(value);
		}
		return String(value ?? '');
	}
</script>

<div class="table-wrapper">
	<table class:striped class:bordered>
		<thead>
			<tr>
				{#each columns as column (column.key)}
					{@const isSortable = sortable && column.sortable !== false}
					<th
						style:width={column.width}
						style:text-align={column.align ?? 'left'}
						class:sortable={isSortable}
						class:active={sortColumn === column.key}
						onclick={() => handleSort(column)}
					>
						{column.header}
						{#if isSortable && sortColumn === column.key}
							<span class="sort-indicator">
								{sortDirection === 'asc' ? '▲' : '▼'}
							</span>
						{/if}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each sortedData as row (row)}
				<tr>
					{#each columns as column (column.key)}
						<td style:text-align={column.align ?? 'left'}>
							{getCellValue(row, column)}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.table-wrapper {
		width: 100%;
		overflow-x: auto;
		border-radius: 0.5rem;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		color: var(--theme-text);
		background-color: var(--theme-bg);
	}

	thead {
		background-color: var(--theme-surface-0);
	}

	th {
		padding: 0.75rem 1rem;
		font-weight: 600;
		color: var(--theme-secondary);
		text-align: left;
		border-bottom: 2px solid var(--theme-surface-2);
	}

	th.sortable {
		cursor: pointer;
		user-select: none;
		transition: background-color 0.2s;
	}

	th.sortable:hover {
		background-color: var(--theme-surface-1);
	}

	th.active {
		background-color: var(--theme-surface-1);
		color: var(--theme-heading);
	}

	.sort-indicator {
		margin-left: 0.5rem;
		font-size: 0.75rem;
		color: var(--theme-heading);
	}

	td {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--theme-surface-1);
	}

	tbody tr {
		transition: background-color 0.2s;
	}

	tbody tr:hover {
		background-color: var(--theme-surface-0);
	}

	table.striped tbody tr:nth-child(even) {
		background-color: var(--theme-surface-0);
	}

	table.striped tbody tr:nth-child(even):hover {
		background-color: var(--theme-surface-0);
	}

	table.bordered {
		border: 1px solid var(--theme-surface-2);
	}

	table.bordered td,
	table.bordered th {
		border-right: 1px solid var(--theme-surface-1);
	}

	table.bordered td:last-child,
	table.bordered th:last-child {
		border-right: none;
	}

	@media (max-width: 768px) {
		.table-wrapper {
			-webkit-overflow-scrolling: touch;
		}

		th,
		td {
			padding: 0.5rem 0.75rem;
			font-size: 0.9rem;
		}
	}
</style>
