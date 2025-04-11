<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import type { User, Friendship } from '$lib/types';
    
    // State variables
    let users = $state<User[]>([]);
    let friends = $state<Friendship[]>([]);
    let isLoading = $state(true);
    let errorMessage = $state('');

    onMount(async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            goto('/');
            return;
        }
        try {
            // Use the updated endpoint
            const response = await fetch('/api/friends', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                // The payload now includes processed "users" and "friends"
                users = data.users;
                friends = data.friends;
            } else {
                errorMessage = 'Failed to load users';
            }
        } catch (error) {
            console.error('Error loading friends data:', error);
            errorMessage = 'An error occurred. Please try again.';
        } finally {
            isLoading = false;
        }
    });

    // Toggle function uses the new "liked" and "friendshipId" fields
    async function toggleLike(user: User) {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        
        // If the user is already liked, retract the friend request
        if (user.liked && user.friendshipId) {
            try {
                const response = await fetch(`/api/friends/${user.friendshipId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    // Update the UI state: remove "like" and clear friendshipId
                    users = users.map(u => 
                        u.id === user.id ? { ...u, liked: false, friendshipId: null } : u
                    );
                } else {
                    const errorData = await response.json();
                    errorMessage = errorData.detail || 'Failed to retract friend request';
                }
            } catch (error) {
                console.error('Error retracting friend request:', error);
                errorMessage = 'An error occurred. Please try again.';
            }
        } else {
            // Otherwise, send a friend request
            try {
                const response = await fetch('/api/friends', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ addressee_id: user.id })
                });
                if (response.ok) {
                    const data = await response.json();
                    // Update the user object with new friendship data from backend
                    users = users.map(u => 
                        u.id === user.id ? { ...u, liked: true, friendshipId: data.id } : u
                    );
                } else {
                    const errorData = await response.json();
                    errorMessage = errorData.detail || 'Failed to send friend request';
                }
            } catch (error) {
                console.error('Error sending friend request:', error);
                errorMessage = 'An error occurred. Please try again.';
            }
        }
    }
    // Function to remove a friendship
    async function removeFriendship(friendshipId: number) {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
        const response = await fetch(`/api/friends/${friendshipId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            // Update your friends list on the frontend
            friends = friends.filter(f => f.id !== friendshipId);
        } else {
            const errorData = await response.json();
            errorMessage = errorData.detail || 'Failed to remove friendship';
        }
    } catch (error) {
        console.error('Error removing friendship:', error);
        errorMessage = 'An error occurred. Please try again.';
    }
}
</script>


<svelte:head>
    <title>Friends | Bone Social Web Project</title>
</svelte:head>

<main>
    {#if errorMessage}
        <div class="border border-red-500 p-2 mb-4 text-red-700 bg-red-100">
            {errorMessage}
        </div>
    {/if}
    
    {#if isLoading}
        <p>Loading...</p>
    {:else}
        <!-- Users section -->
        <section class="mb-8">
            <h2 class="text-xl font-bold mb-4 border-b border-gray-300 pb-2">People to friend</h2>
            
            {#if users.length > 0}
                <ul class="space-y-4">
                    {#each users as user}
                        <li class="border border-gray-300 p-4 flex justify-between items-center">
                            <div>
                                <p class="font-bold">{user.username}</p>
                            </div>
                            <button 
                                class="border border-gray-500 px-4 py-1 hover:bg-gray-300"
                                on:click={() => toggleLike(user)}
                            >
                                {user.liked ? 'Mog ni mehr' : 'Like'}
                            </button>
                        </li>
                    {/each}
                </ul>
            {:else}
                <p class="text-gray-600">No users found.</p>
            {/if}
        </section>
        
        <!-- Friends section -->
        <section>
            <h2 class="text-xl font-bold mb-4 border-b border-gray-300 pb-2">My Friends</h2>
            
            {#if friends.length > 0}
                <ul class="space-y-4">
                    {#each friends as friendship}
                        <li class="border border-gray-300 p-4 flex justify-between items-center">
                            <div>
                                <p class="font-bold">{friendship.friend.username}</p>
                            </div>
                            <button 
                                class="border border-gray-500 bg-red-100 text-red-700 px-4 py-1 hover:bg-red-200"
                                on:click={() => removeFriendship(friendship.id)}
                            >
                                Remove
                            </button>
                        </li>
                    {/each}
                </ul>
            {:else}
                <p class="text-gray-600">You don't have any friends yet.</p>
            {/if}
        </section>
    {/if}
</main>