<script lang="ts">
    import '../app.css';
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    
    // Using $state for reactive variables with Svelte 5 runes
    let isAuthenticated = $state(false);
    let username = $state('');
    
    // Check authentication status
    function checkAuth() {
        const token = localStorage.getItem('authToken');
        isAuthenticated = !!token;
        if (isAuthenticated) {
            username = localStorage.getItem('username') || 'User';
        }
    }
    
    // Run on mount
    onMount(() => {
        checkAuth();
    });
    
    // Use $effect to react to page changes
    $effect(() => {
        if ($page) {
            checkAuth();
        }
    });
    
    // Get the children props
    let { children } = $props();
</script>

<div class="font-mono max-w-4xl mx-auto p-4">
    {#if isAuthenticated && $page.url.pathname !== '/'}
        <header class="mb-8 border-b border-gray-400 pb-4">
            <div class="flex justify-between items-center">
                <h1 class="text-2xl font-bold">Bone Social Web Project</h1>
                <div class="flex items-center">
                    {#if $page.url.pathname !== '/dashboard'}
                        <a 
                            href="/dashboard"
                            class="border border-gray-500 bg-gray-200 px-4 py-1 hover:bg-gray-300 mr-3"
                        >
                            Home
                        </a>
                    {/if}
                    <a 
                        href="/profile"
                        class="border border-gray-500 bg-gray-200 px-4 py-1 hover:bg-gray-300"
                    >
                        {username}
                    </a>
                </div>
            </div>
        </header>
    {/if}
    
    {@render children()}
</div>
