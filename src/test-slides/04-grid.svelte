<script lang="ts">
	import { GridLayout } from 'reveal-svelte';

	const items = [
		{ id: '1', content: 'Item 1: Fast' },
		{ id: '2', content: 'Item 2: Flexible' },
		{ id: '3', content: 'Item 3: Responsive' },
		{ id: '4', content: 'Item 4: Beautiful' }
	];
</script>

<GridLayout {items} columns={2} gap="1.5rem" />
