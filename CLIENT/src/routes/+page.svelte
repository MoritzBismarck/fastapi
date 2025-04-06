<script lang="ts">
    import { goto } from '$app/navigation';
    
    // Using $state for reactive variables with Svelte 5 runes
    let username = $state('');
    let password = $state('');
    let isLoading = $state(false);
    let errorMessage = $state('');
    
    async function handleLogin() {
        isLoading = true;
        errorMessage = '';
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    email: username,
                    password: password
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                console.log('Login successful');
                
                // Store the token and username in localStorage
                localStorage.setItem('authToken', data.access_token);
                localStorage.setItem('username', data.username || username);
                
                // Redirect to the dashboard page
                goto('/dashboard');
            } else {
                errorMessage = data.detail || 'Login failed. Please try again.';
            }
        } catch (error) {
            console.error('Login error:', error);
            errorMessage = 'An error occurred. Please try again.';
        } finally {
            isLoading = false;
        }
    }
</script>

<svelte:head>
    <title>Login | Bone Social Web Project</title>
</svelte:head>

<div class="py-4">
    <h1 class="text-2xl font-bold mb-4">Welcome to Bone Social Web Project</h1>
    
    <p class="mb-4">This is a simple social web platform for demonstration purposes.</p>
    
    <p class="mb-6">The purpose of this website is to demonstrate a minimal and functional design 
    with modern technology under the hood.</p>
    
    <hr class="border-gray-400 my-6">
    
    <h2 class="text-xl font-bold mb-4">Login</h2>
    
    {#if errorMessage}
        <div class="border border-red-500 p-2 mb-4 text-red-700 bg-red-100">
            {errorMessage}
        </div>
    {/if}
    
    <form on:submit|preventDefault={handleLogin} class="mb-6">
        <div class="mb-4">
            <label for="username-input" class="block mb-1">Email:</label>
            <input 
                id="username-input"
                type="email" 
                bind:value={username} 
                class="border border-gray-500 p-1 w-64 font-mono bg-white"
                required
            >
        </div>
        
        <div class="mb-4">
            <label for="password-input" class="block mb-1">Password:</label>
            <input 
                id="password-input"
                type="password" 
                bind:value={password} 
                class="border border-gray-500 p-1 w-64 font-mono bg-white"
                required
            >
        </div>
        
        <button 
            type="submit" 
            class="border border-gray-500 bg-gray-200 px-4 py-1 font-mono hover:bg-gray-300"
            disabled={isLoading}
        >
            {isLoading ? 'Processing...' : 'Login'}
        </button>
    </form>
    
    <p class="mb-6">Don't have an account? <a href="/signup" class="text-blue-700 underline hover:text-blue-900">Create one here</a>.</p>
    
    <hr class="border-gray-400 my-6">
    
    <address class="italic mb-4">
        Webmaster: <a href="mailto:webmaster@example.com" class="text-blue-700 underline hover:text-blue-900">webmaster@example.com</a><br>
        Last Updated: April 2025
    </address>
</div>