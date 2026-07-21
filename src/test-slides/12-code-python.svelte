<script lang="ts">
	import { BaseSlide, Code } from 'reveal-svelte';
</script>

<BaseSlide>
	<h2>Python with Line Highlighting</h2>
	<Code
		code={`def fibonacci(n):
    if n <= 1:
        return n
    
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    
    return b

result = fibonacci(10)
print(f"The 10th Fibonacci number is: {result}")`}
		language="python"
		lineNumbers={true}
		highlightLines={[5, 6, 7]}
		copyButton={true}
	/>
</BaseSlide>
