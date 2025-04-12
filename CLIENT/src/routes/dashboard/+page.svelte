<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    
    // Sample data for services
    const liveServices = [
        { id: 1, name: 'Event Matcher', description: 'Find and join events with your friends', route: '/events'},
        { id: 2, name: 'Friend Finder', description: 'Find and connect with friends', route: '/friends' } 
    ];
    
    const upcomingServices = [
        { id: 1, name: 'User Profiles', description: 'Customizable user profiles with avatars' },
        { id: 2, name: 'Messaging', description: 'Direct messaging between users' },
        { id: 3, name: 'Notifications', description: 'Real-time notification system' }
    ];
    
    onMount(() => {
        // Check if user is authenticated by looking for token in localStorage
        const token = localStorage.getItem('authToken');
        
        if (!token) {
            // Redirect to login page if not authenticated
            goto('/');
        }
    });
</script>

<svelte:head>
    <title>Dashboard | Bone Social Web Project</title>
</svelte:head>

<main>
    <section id="live-services" class="mb-8">
        <h2 class="text-xl font-bold mb-4 border-b border-gray-300 pb-2">Live Services</h2>
        
        {#if liveServices.length > 0}
            <ul class="space-y-4">
                {#each liveServices as service}
                    <li class="border border-gray-300 p-4">
                        <h3 class="font-bold">{service.name}</h3>
                        <p>{service.description}</p>
                        <a href={service.route} class="text-blue-700 underline hover:text-blue-900 mt-2 inline-block">
                            Access Service
                        </a>
                    </li>
                {/each}
            </ul>
        {:else}
            <p class="text-gray-600">No live services available at the moment.</p>
        {/if}
    </section>
    
    <section id="upcoming-services" class="mb-8">
        <h2 class="text-xl font-bold mb-4 border-b border-gray-300 pb-2">Coming Soon</h2>
        
        {#if upcomingServices.length > 0}
            <ul class="space-y-4">
                {#each upcomingServices as service}
                    <li class="border border-gray-300 p-4 bg-gray-50">
                        <h3 class="font-bold">{service.name}</h3>
                        <p>{service.description}</p>
                        <span class="text-gray-600 text-sm mt-1 inline-block">
                            Coming soon...
                        </span>
                    </li>
                {/each}
            </ul>
        {:else}
            <p class="text-gray-600">No upcoming services planned at the moment.</p>
        {/if}
    </section>
    
    <footer class="mt-8 pt-4 border-t border-gray-400 text-gray-600 text-sm">
        <p>© 2025 Bone Social Web Project. All rights reserved.</p>
    </footer>
</main>