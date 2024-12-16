<script lang="ts">
	import Icon from '@iconify/svelte';

	let email = '';
	let newPassword = '';
	let confirmNewPassword = '';
	let showNewPassword = false;
	let showConfirmNewPassword = false;

	function handleResetPassword() {
		// Implement password reset logic here
		console.log('Password reset attempted', { email, newPassword, confirmNewPassword });
	}

	function togglePasswordVisibility(field: 'newPassword' | 'confirmNewPassword') {
		if (field === 'newPassword') {
			showNewPassword = !showNewPassword;
		} else {
			showConfirmNewPassword = !showConfirmNewPassword;
		}
	}
</script>

<div class="reset-password-container">
	<h2>Reset Your Password</h2>

	<form on:submit|preventDefault={handleResetPassword}>
		<div class="input-group">
			<input type="email" bind:value={email} placeholder="Email" required />
		</div>

		<button type="submit" class="reset-btn">Reset Password</button>
	</form>

	<p class="login-link">
		<a href="/auth/login">Back to Login</a>
	</p>
</div>

<style>
	.reset-password-container {
		max-width: 400px;
		margin: 2rem auto;
		padding: 2rem;
		border: 1px solid #ddd;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		background-color: white;
	}

	h2 {
		text-align: center;
		margin-bottom: 1.5rem;
	}

	.input-group {
		margin-bottom: 1rem;
		position: relative;
	}

	input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
		box-sizing: border-box;
	}

	.reset-btn {
		width: 100%;
		padding: 0.75rem;
		background-color: #007bff;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		margin-top: 1rem;
	}

	.login-link {
		text-align: center;
		margin-top: 1rem;
		font-size: 0.9rem;
	}

	.login-link a {
		color: #007bff;
		text-decoration: none;
	}

	.login-link a:hover {
		text-decoration: underline;
	}
</style>
