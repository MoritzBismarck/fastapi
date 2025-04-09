<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import type { User, Friendship } from '$lib/types';
    
    // State variables
    let users = $state<User[]>([]);
    let friends = $state<Friendship[]>([]);
    let isLoading = $state(true);
    let errorMessage = $state('');
    
    // Fetch users and friendships on mount
    onMount(async () => {
        // Check if user is authenticated
        const token = localStorage.getItem('authToken');
        
        if (!token) {
            // Redirect to login page if not authenticated
            goto('/');
            return;
        }
        
        try {
            // Load users
            const response = await fetch('/api/friends', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
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
    
    // Function to handle liking a user (sending a friend request)
    async function likeUser(userId: number) {
        try {
            const token = localStorage.getItem('authToken');
            
            const response = await fetch('/api/friends', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ addressee_id: userId })
            });
            
            if (response.ok) {
                // Update the UI to show the like was sent
                users = users.map(user => {
                    if (user.id === userId) {
                        return { ...user, liked: true };
                    }
                    return user;
                });
            } else {
                const error = await response.json();
                errorMessage = error.detail || 'Failed to send friend request';
            }
        } catch (error) {
            console.error('Error liking user:', error);
            errorMessage = 'An error occurred. Please try again.';
        }
    }
    
    // Function to handle removing a friendship
    async function removeFriendship(friendshipId: number) {
        try {
            const token = localStorage.getItem('authToken');
            
            const response = await fetch(`/api/friends/${friendshipId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                // Remove the friendship from the list
                friends = friends.filter(f => f.id !== friendshipId);
            } else {
                const error = await response.json();
                errorMessage = error.detail || 'Failed to remove friendship';
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
    <h1 class="text-2xl font-bold mb-6">Friends</h1>
    
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
            <h2 class="text-xl font-bold mb-4 border-b border-gray-300 pb-2">People</h2>
            
            {#if users.length > 0}
                <ul class="space-y-4">
                    {#each users as user}
                        <li class="border border-gray-300 p-4 flex justify-between items-center">
                            <div>
                                <p class="font-bold">{user.username}</p>
                            </div>
                            <button 
                                class="border border-gray-500 bg-gray-200 px-4 py-1 hover:bg-gray-300 {user.liked ? 'bg-gray-300' : ''}"
                                on:click={() => likeUser(user.id)}
                                disabled={user.liked}
                            >
                                {user.liked ? 'Liked' : 'Like'}
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