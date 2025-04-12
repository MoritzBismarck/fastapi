<script lang="ts">
    export let event: {
        id: number;
        title: string;
        description: string;
        event_date: string;
        location?: string;
        created_at: string;
    };
    
    export let onLike: () => void = () => {};
    export let onSkip: () => void = () => {};
    
    // Format the date to be more readable
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
</script>

<div class="border border-gray-300 rounded p-6 max-w-md w-full mx-auto bg-white shadow-md">
    <div class="flex justify-between items-start mb-4">
        <h2 class="text-xl font-bold">{event.title}</h2>
        {#if event.location}
            <div class="text-sm text-gray-600">{event.location}</div>
        {/if}
    </div>
    
    <div class="mb-4">
        <div class="text-sm font-bold mb-1">When:</div>
        <div>{formatDate(event.event_date)}</div>
    </div>
    
    <div class="mb-6">
        <div class="text-sm font-bold mb-1">Description:</div>
        <p class="whitespace-pre-line">{event.description}</p>
    </div>
    
    <div class="flex justify-between pt-4 border-t border-gray-200">
        <button 
            on:click={onSkip}
            class="border border-gray-300 px-6 py-2 rounded hover:bg-gray-100"
            aria-label="Skip event"
        >
            Skip
        </button>
        
        <button 
            on:click={onLike}
            class="border border-green-500 bg-green-100 text-green-800 px-6 py-2 rounded hover:bg-green-200"
            aria-label="Like event"
        >
            Like
        </button>
    </div>
</div>