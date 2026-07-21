<script lang="ts">
	import { Table } from 'reveal-svelte';
	import type { TableColumn } from 'reveal-svelte';

	interface ProductData {
		id: number;
		name: string;
		category: string;
		price: number;
		stock: number;
		status: string;
	}

	const columns: TableColumn<ProductData>[] = [
		{ key: 'id', header: 'ID', width: '80px', align: 'center' },
		{ key: 'name', header: 'Product Name', sortable: true },
		{ key: 'category', header: 'Category', sortable: true },
		{ key: 'price', header: 'Price ($)', sortable: true, align: 'right' },
		{ key: 'stock', header: 'Stock', sortable: true, align: 'center' },
		{ key: 'status', header: 'Status', align: 'center' }
	];

	const data: ProductData[] = [
		{
			id: 1,
			name: 'Laptop Pro 15"',
			category: 'Electronics',
			price: 1299.99,
			stock: 45,
			status: 'Available'
		},
		{
			id: 2,
			name: 'Wireless Mouse',
			category: 'Accessories',
			price: 29.99,
			stock: 120,
			status: 'Available'
		},
		{
			id: 3,
			name: 'USB-C Cable',
			category: 'Accessories',
			price: 12.99,
			stock: 0,
			status: 'Out of Stock'
		},
		{
			id: 4,
			name: 'Monitor 27"',
			category: 'Electronics',
			price: 399.99,
			stock: 23,
			status: 'Available'
		},
		{
			id: 5,
			name: 'Mechanical Keyboard',
			category: 'Accessories',
			price: 149.99,
			stock: 67,
			status: 'Available'
		},
		{
			id: 6,
			name: 'Webcam HD',
			category: 'Electronics',
			price: 79.99,
			stock: 5,
			status: 'Low Stock'
		},
		{ id: 7, name: 'Desk Lamp', category: 'Office', price: 34.99, stock: 89, status: 'Available' },
		{
			id: 8,
			name: 'Ergonomic Chair',
			category: 'Furniture',
			price: 449.99,
			stock: 12,
			status: 'Available'
		}
	];
</script>

<section>
	<h2>Sortable Data Table</h2>
	<div class="content">
		<p class="description">Click any column header to sort</p>
		<Table {columns} {data} striped bordered />
	</div>
</section>

<style>
	section {
		height: 100%;
		display: flex;
		flex-direction: column;
		padding: 2rem;
		gap: 1rem;
	}

	h2 {
		color: var(--ctp-text);
		font-size: 2rem;
		margin: 0;
		text-align: center;
	}

	.content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		flex: 1;
		overflow: hidden;
	}

	.description {
		color: var(--ctp-subtext1);
		text-align: center;
		font-style: italic;
		margin: 0;
		font-size: 0.9rem;
	}
</style>
