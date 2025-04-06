<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    
    // Using $state for reactive variables with Svelte 5 runes
    let username = $state('');
    let email = $state('');
    
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
    
    function handleLogout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        goto('/');
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
            <label class="block text-gray-700 mb-1">Email:</label>
            <div class="border border-gray-300 p-2 bg-gray-50">{email}</div>
        </div>
        
        <div class="mb-4">
            <label class="block text-gray-700 mb-1">Account Created:</label>
            <div class="border border-gray-300 p-2 bg-gray-50">April 2025</div>
        </div>
        
        <div class="mt-6">
            <button 
                class="border border-red-500 bg-red-100 text-red-700 px-4 py-1 hover:bg-red-200"
                on:click={handleLogout}
            >
                Logout
            </button>
        </div>
    </div>
    
    <footer class="mt-8 pt-4 border-t border-gray-400 text-gray-600 text-sm">
        <p>© 2025 Bone Social Web Project. All rights reserved.</p>
    </footer>
</main>