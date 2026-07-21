import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import Code from './Code.svelte';
describe('Code component', () => {
    it('renders code with hljs class', () => {
        const { container } = render(Code, {
            props: {
                code: 'console.log("hello");',
                language: 'javascript'
            }
        });
        const codeEl = container.querySelector('code');
        expect(codeEl).toHaveClass('hljs');
        // Check for content using a partial match or checking multiple spans
        expect(codeEl?.textContent).toContain('console.log("hello");');
    });
    it('renders filename and copy button', async () => {
        const { getByText } = render(Code, {
            props: {
                code: 'const x = 1;',
                filename: 'test.ts',
                copyButton: true
            }
        });
        expect(getByText('test.ts')).toBeInTheDocument();
        const copyBtn = getByText('📋 Copy');
        expect(copyBtn).toBeInTheDocument();
        // Mock clipboard
        const writeText = vi.fn().mockResolvedValue(undefined);
        vi.stubGlobal('navigator', {
            clipboard: { writeText }
        });
        await fireEvent.click(copyBtn);
        expect(writeText).toHaveBeenCalledWith('const x = 1;');
        expect(getByText('✓ Copied')).toBeInTheDocument();
    });
    it('renders line numbers', () => {
        const { container } = render(Code, {
            props: {
                code: 'line 1\nline 2',
                lineNumbers: true,
                highlightLines: [1]
            }
        });
        const lineNums = container.querySelectorAll('.line-number');
        expect(lineNums.length).toBe(2);
        expect(lineNums[0]).toHaveClass('highlighted');
        expect(lineNums[1]).not.toHaveClass('highlighted');
    });
});
