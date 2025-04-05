<script lang="ts">
    let username = '';
    let password = '';
    let isLoading = false;
    let errorMessage = '';
    
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
                // Redirect to a protected page on successful login
                window.location.href = '/dashboard';
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

<div class="font-mono max-w-3xl mx-auto p-4" style="font-family: Courier, monospace;">
    <h1 class="text-2xl font-bold mb-4">Welcome to Our Site</h1>
    
    <p class="mb-4">This is a simple information page about this website.</p>
    
    <p class="mb-6">The purpose of this website is to demonstrate the early web aesthetic, 
    similar to the first websites created at CERN in the early 1990s.</p>
    
    <h2 class="text-xl font-bold mb-2">About This Site</h2>
    
    <p class="mb-4">This site was built using modern technology (SvelteKit with TypeScript and Tailwind) 
    with an intentional aesthetic that recalls the early World Wide Web Project pages from CERN.</p>
    
    <p class="mb-6">The design is intentionally minimal and functional, focusing on content rather than presentation.</p>
    
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
    
    <h2 class="text-xl font-bold mb-2">Navigation</h2>
    
    <ul class="list-disc pl-6 mb-6">
        <li class="mb-1"><a href="/" class="text-blue-700 underline hover:text-blue-900">Home</a></li>
        <li class="mb-1"><a href="/about" class="text-blue-700 underline hover:text-blue-900">About</a></li>
        <li class="mb-1"><a href="/contact" class="text-blue-700 underline hover:text-blue-900">Contact</a></li>
    </ul>
    
    <hr class="border-gray-400 my-6">
    
    <address class="italic mb-4">
        Webmaster: <a href="mailto:webmaster@example.com" class="text-blue-700 underline hover:text-blue-900">webmaster@example.com</a><br>
        Last Updated: April 2025
    </address>
</div>