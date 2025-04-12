<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import EventCard from '$lib/components/EventCard.svelte';
    
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
    let currentEventIndex = $state(0);
    let isLoading = $state(true);
    let errorMessage = $state('');
    let noMoreEvents = $state(false);
    
    // Function to get the current event
    function getCurrentEvent() {
        return events.length > 0 ? events[currentEventIndex] : null;
    }
    
    // Handle loading more events when we're running low
    async function fetchEvents() {
        isLoading = true;
        errorMessage = '';
        
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                goto('/');
                return;
            }
            
            const response = await fetch('/api/events', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.length === 0) {
                    noMoreEvents = true;
                } else {
                    events = data;
                    currentEventIndex = 0;
                    noMoreEvents = false;
                }
            } else {
                const error = await response.json();
                errorMessage = error.detail || 'Failed to load events';
            }
        } catch (error) {
            console.error('Error fetching events:', error);
            errorMessage = 'An error occurred while loading events';
        } finally {
            isLoading = false;
        }
    }
    
    // Function to handle liking an event
    async function likeEvent() {
        const currentEvent = getCurrentEvent();
        if (!currentEvent) return;
        
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                goto('/');
                return;
            }
            
            const response = await fetch('/api/events', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    event_id: currentEvent.id
                })
            });
            
            if (response.ok) {
                // Move to the next event
                moveToNextEvent();
            } else {
                const error = await response.json();
                errorMessage = error.detail || 'Failed to like event';
            }
        } catch (error) {
            console.error('Error liking event:', error);
            errorMessage = 'An error occurred while liking the event';
        }
    }
    
    // Function to handle skipping an event
    function skipEvent() {
        moveToNextEvent();
    }
    
    // Function to move to the next event
    function moveToNextEvent() {
        if (currentEventIndex < events.length - 1) {
            currentEventIndex++;
        } else {
            // We've reached the end of our current batch
            // Load more events
            fetchEvents();
        }
    }
    
    onMount(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            goto('/');
            return;
        }
        
        fetchEvents();
    });
</script>

<svelte:head>
    <title>Events | Bone Social Web Project</title>
</svelte:head>

<div class="max-w-lg mx-auto p-4">
    <h1 class="text-2xl font-bold">Events</h1>
    <a href="/events/liked" class="text-blue-700 underline hover:text-blue-900">
        My Liked Events
    </a>
    
    
    {#if errorMessage}
        <div class="border border-red-500 p-4 mb-6 text-red-700 bg-red-100 rounded">
            {errorMessage}
        </div>
    {/if}
    
    {#if isLoading}
        <div class="flex justify-center items-center h-64">
            <p class="text-gray-600">Loading events...</p>
        </div>
    {:else if noMoreEvents}
        <div class="border border-gray-300 rounded p-6 text-center">
            <p class="mb-4">No more events to show right now.</p>
            <button 
                on:click={fetchEvents}
                class="border border-gray-500 px-4 py-2 hover:bg-gray-100"
            >
                Refresh
            </button>
        </div>
    {:else if getCurrentEvent() !== null}
        <div class="card-deck-container relative">
            <EventCard 
                event={getCurrentEvent()!}
                onLike={likeEvent}
                onSkip={skipEvent}
            />
        </div>
    {:else}
        <div class="border border-gray-300 rounded p-6 text-center">
            <p>No events found.</p>
        </div>
    {/if}
</div>