import { render } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import Table from './Table.svelte';

describe('Table component', () => {
    it('renders headers and data rows', () => {
        const { getByText, container } = render(Table, {
            props: {
                columns: [
                    { key: 'name', header: 'Name' },
                    { key: 'age', header: 'Age' }
                ],
                data: [
                    { name: 'Alice', age: 30 },
                    { name: 'Bob', age: 25 }
                ]
            }
        });

        expect(getByText('Name')).toBeInTheDocument();
        expect(getByText('Age')).toBeInTheDocument();
        expect(getByText('Alice')).toBeInTheDocument();
        expect(getByText('Bob')).toBeInTheDocument();

        const ths = container.querySelectorAll('th');
        expect(ths.length).toBe(2);

        const tds = container.querySelectorAll('td');
        expect(tds.length).toBe(4);
    });
});
