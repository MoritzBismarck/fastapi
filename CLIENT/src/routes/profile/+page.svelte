<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { logout } from '$lib/auth';
    
    // Using $state for reactive variables with Svelte 5 runes
    let username = $state('');
    let email = $state('');
    let isLoggingOut = $state(false);
    
    onMount(() => {
        // Check if user is authenticated
        const token = localStorage.getItem('authToken');
        
        if (!token) {
            // Redirect to login page if not authenticated
            goto('/');
            return;
        }
        
        // Get user info
        username = localStorage.getItem('username') || 'User';
        email = username; // In this example, username is the email
    });
    
    async function handleLogout() {
        isLoggingOut = true;
        const success = await logout();
        isLoggingOut = false;
        
        if (success) {
            goto('/');
        } else {
            // Handle logout failure - could show an error message
            // For now, we'll still clear local storage as a fallback
            localStorage.removeItem('authToken');
            localStorage.removeItem('username');
            goto('/');
        }
    }
</script>

<svelte:head>
    <title>Profile | Bone Social Web Project</title>
</svelte:head>

<main>
    <h2 class="text-xl font-bold mb-6">User Profile</h2>
    
    <div class="border border-gray-300 p-6 mb-8">
        <div class="mb-4">
            <label class="block text-gray-700 mb-1">Username:</label>
            <div class="border border-gray-300 p-2 bg-gray-50">{username}</div>
        </div>
        
        <div class="mb-4">
            <label class="block text-gray-700 mb-1">Account Created:</label>
            <div class="border border-gray-300 p-2 bg-gray-50">April 2025</div>
        </div>
        
        <div class="mt-6">
            <a href="#" 
               class="text-blue-700 underline hover:text-blue-900"
               on:click|preventDefault={handleLogout}>
               Logout
            </a>
        </div>
    </div>
    
    <footer class="mt-8 pt-4 border-t border-gray-400 text-gray-600 text-sm">
        <p>© 2025 Bone Social Web Project. All rights reserved.</p>
    </footer>
</main>