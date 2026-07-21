<script lang="ts">
	import { BaseSlide, Code } from 'reveal-svelte';
</script>

<BaseSlide>
	<h2>Code Syntax Highlighting</h2>
	<Code
		code={`interface User {
  id: number;
  name: string;
  email: string;
}

async function fetchUser(id: number): Promise<User> {
  const response = await fetch(\`/api/users/\${id}\`);
  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }
  return response.json();
}`}
		language="typescript"
		lineNumbers={true}
		copyButton={true}
	/>
</BaseSlide>
