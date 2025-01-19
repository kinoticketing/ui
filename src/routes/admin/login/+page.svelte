<script lang="ts">
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';

	let code = '';
	let error = '';

	const handleSubmit: SubmitFunction = () => {
		return async ({ result }) => {
			if (result.type === 'redirect') {
				await goto(result.location);
			} else if (result.type === 'failure') {
				error = 'Invalid admin code';
			}
		};
	};
</script>

// src/routes/admin/login/+page.svelte
<div class="admin-login">
	<h1>Admin Login</h1>

	<form method="POST" use:enhance={handleSubmit}>
		{#if error}
			<div class="error">{error}</div>
		{/if}

		<div class="form-group">
			<label for="code">Admin Code</label>
			<input type="password" id="code" name="code" bind:value={code} required />
		</div>

		<button type="submit">Login</button>
	</form>
</div>

<style>
	.admin-login {
		max-width: 400px;
		margin: 4rem auto;
		padding: 2rem;
		background-color: white;
		border-radius: 0.75rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	h1 {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
		text-align: center;
	}

	.form-group {
		margin-bottom: 1.5rem;
		margin-right: 2rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		color: #4b5563;
	}

	input {
		width: 100%;
		padding: 0.75rem 1rem;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		background-color: white;
	}

	input:focus {
		outline: none;
		border-color: #2563eb;
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
	}

	button {
		width: 100%;
		padding: 0.75rem 1.5rem;
		background-color: #2563eb;
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	button:hover {
		background-color: #1d4ed8;
	}

	.error {
		background-color: #fee2e2;
		border: 1px solid #fecaca;
		color: #dc2626;
		padding: 0.75rem;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
	}
</style>
