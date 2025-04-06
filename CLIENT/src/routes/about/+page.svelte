<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    
    // Check if user is authenticated
    let isAuthenticated = false;
    
    onMount(() => {
        // Simple check for authentication
        const token = localStorage.getItem('authToken');
        isAuthenticated = !!token;
    });
    
    // Function to handle return to dashboard
    function backToDashboard() {
        goto('/dashboard');
    }
</script>

<svelte:head>
    <title>About | Our Service</title>
</svelte:head>

<div class="font-mono max-w-3xl mx-auto p-4">
    <header class="mb-8">
        <h1 class="text-2xl font-bold mb-4">About Our Service</h1>
        
        {#if isAuthenticated}
            <button 
                class="border border-gray-500 bg-gray-200 px-4 py-1 font-mono hover:bg-gray-300 mb-4"
                on:click={backToDashboard}
            >
                Back to Dashboard
            </button>
        {:else}
            <a 
                href="/" 
                class="border border-gray-500 bg-gray-200 px-4 py-1 font-mono hover:bg-gray-300 inline-block mb-4"
            >
                Back to Home
            </a>
        {/if}
    </header>
    
    <main>
        <section class="mb-8">
            <h2 class="text-xl font-bold mb-4 border-b border-gray-300 pb-2">Our Mission</h2>
            <p class="mb-4">
                Our mission is to provide simple, reliable, and user-friendly services that help people connect 
                and share information effectively. We believe in the original spirit of the web: open, accessible, 
                and focused on content rather than flashy design.
            </p>
        </section>
        
        <section class="mb-8">
            <h2 class="text-xl font-bold mb-4 border-b border-gray-300 pb-2">Our Story</h2>
            <p class="mb-4">
                Founded in 2025, our service began as a project to explore the aesthetics and simplicity 
                of the early web while using modern technology under the hood. We wanted to create an experience 
                that recalls the straightforward nature of the first websites while providing the reliability and 
                security expected today.
            </p>
            <p class="mb-4">
                Our team consists of developers who appreciate both web history and modern best practices, 
                creating a unique blend of nostalgic design with contemporary functionality.
            </p>
        </section>
        
        <section class="mb-8">
            <h2 class="text-xl font-bold mb-4 border-b border-gray-300 pb-2">Technology Stack</h2>
            <p class="mb-4">
                Our service is built using a combination of modern technologies:
            </p>
            <ul class="list-disc pl-6 mb-4 space-y-2">
                <li>Frontend: SvelteKit with TypeScript</li>
                <li>Styling: Tailwind CSS (with intentional 90s-inspired aesthetics)</li>
                <li>Backend: FastAPI (Python)</li>
                <li>Database: PostgreSQL</li>
                <li>Authentication: JWT (JSON Web Tokens)</li>
            </ul>
        </section>
    </main>
    
    <footer class="mt-8 pt-4 border-t border-gray-400 text-gray-600 text-sm">
        <p>© 2025 Our Service. All rights reserved.</p>
        <p>Last updated: April 2025</p>
    </footer>
</div>