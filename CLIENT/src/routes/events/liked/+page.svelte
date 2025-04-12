<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    
    // Define the Event type
    interface Event {
        id: number;
        title: string;
        description: string;
        event_date: string;
        location?: string;
        created_at: string;
    }
    
    // Using $state for reactive variables with Svelte 5 runes
    let events = $state<Event[]>([]);
    let isLoading = $state(true);
    let errorMessage = $state('');
    
    // Function to format date
    function formatDate(dateString: string) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // Fetch liked events
    async function fetchLikedEvents() {
        isLoading = true;
        errorMessage = '';
        
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                goto('/');
                return;
            }
            
            const response = await fetch('/api/events/liked', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                events = await response.json();
            } else {
                const error = await response.json();
                errorMessage = error.detail || 'Failed to load liked events';
            }
        } catch (error) {
            console.error('Error fetching liked events:', error);
            errorMessage = 'An error occurred while loading liked events';
        } finally {
            isLoading = false;
        }
    }
    
    // Unlike an event
    async function unlikeEvent(eventId: number) {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                goto('/');
                return;
            }
            
            const response = await fetch('/api/events', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    event_id: eventId
                })
            });
            
            if (response.ok) {
                // Remove the event from the list
                events = events.filter(event => event.id !== eventId);
            } else {
                const error = await response.json();
                errorMessage = error.detail || 'Failed to unlike event';
            }
        } catch (error) {
            console.error('Error unliking event:', error);
            errorMessage = 'An error occurred while unliking the event';
        }
    }
    
    onMount(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            goto('/');
            return;
        }
        
        fetchLikedEvents();
    });
</script>

<svelte:head>
    <title>Liked Events | Bone Social Web Project</title>
</svelte:head>

<div class="max-w-lg mx-auto p-4">
    <div class="flex justify-between items-center mb-8">
        <h1 class="text-2xl font-bold">Liked Events</h1>
        <a href="/events" class="text-blue-700 underline hover:text-blue-900">
            Back to Events
        </a>
    </div>
    
    {#if errorMessage}
        <div class="border border-red-500 p-4 mb-6 text-red-700 bg-red-100 rounded">
            {errorMessage}
        </div>
    {/if}
    
    {#if isLoading}
        <div class="flex justify-center items-center h-64">
            <p class="text-gray-600">Loading liked events...</p>
        </div>
    {:else if events.length === 0}
        <div class="border border-gray-300 rounded p-6 text-center">
            <p class="mb-4">You haven't liked any events yet.</p>
            <a 
                href="/events" 
                class="border border-gray-500 bg-gray-200 px-4 py-2 rounded inline-block hover:bg-gray-300"
            >
                Discover Events
            </a>
        </div>
    {:else}
        <ul class="space-y-4">
            {#each events as event}
                <li class="border border-gray-300 rounded p-4 relative">
                    <div class="flex justify-between items-start mb-2">
                        <h2 class="text-lg font-bold">{event.title}</h2>
                        {#if event.location}
                            <div class="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                {event.location}
                            </div>
                        {/if}
                    </div>
                    
                    <div class="mb-3 text-sm">
                        <strong>When:</strong> {formatDate(event.event_date)}
                    </div>
                    
                    <p class="text-gray-600 mb-4">{event.description}</p>
                    
                    <button
                        on:click={() => unlikeEvent(event.id)}
                        class="text-red-600 text-sm hover:text-red-800 underline"
                    >
                        Unlike Event
                    </button>
                </li>
            {/each}
        </ul>
    {/if}
</div>