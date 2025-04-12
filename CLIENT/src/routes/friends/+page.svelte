<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    
    // Define user type with the new relationship field
    interface User {
        id: number;
        username: string;
        email: string; // Added email property
        relationship: string; // "none", "friends", "request_sent", "request_received"
        friendshipId: number | null;
        liked: boolean;
        hasLikedCurrentUser: boolean;
    }
    
    interface Friend {
        id: number;
        friend: {
            id: number;
            username: string;
            email: string;
        };
        status: string;
    }
    
    // State variables
    let users = $state<User[]>([]);
    let friends = $state<Friend[]>([]);
    let isLoading = $state(true);
    let errorMessage = $state('');

    onMount(async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            goto('/');
            return;
        }
        
        try {
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

    // Toggle function now handles both sending and retracting friend requests
    async function toggleFriendship(user: User) {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    
    // If the user has sent a request that we need to accept
    if (user.relationship === 'request_received' && user.friendshipId) {
        try {
            // Use PUT to update the existing friendship
            const response = await fetch(`/api/friends/${user.friendshipId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'accepted' })
            });
            
            if (response.ok) {
                // Move this user to the friends list
                const updatedFriendship = await response.json();
                
                // Update the users list to remove this user
                users = users.filter(u => u.id !== user.id);
                
                // Add to friends list with the proper structure
                friends = [...friends, {
                    id: updatedFriendship.id,
                    friend: {
                        id: user.id,
                        username: user.username,
                        email: user.email // Ensure email is included
                    },
                    status: 'accepted'
                }];
            } else {
                const errorData = await response.json();
                errorMessage = errorData.detail || 'Failed to accept friend request';
            }
        } catch (error) {
            console.error('Error accepting friend request:', error);
            errorMessage = 'An error occurred. Please try again.';
        }
    }
    // If there's already a friendship (sent request), retract it
    else if (user.relationship === 'request_sent' && user.friendshipId) {
        try {
            const response = await fetch(`/api/friends/${user.friendshipId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                // Update the user's relationship status
                users = users.map(u => 
                    u.id === user.id ? { 
                        ...u, 
                        relationship: 'none', 
                        liked: false, 
                        friendshipId: null 
                    } : u
                );
            } else {
                const errorData = await response.json();
                errorMessage = errorData.detail || 'Failed to retract friend request';
            }
        } catch (error) {
            console.error('Error retracting friend request:', error);
            errorMessage = 'An error occurred. Please try again.';
        }
    } 
    // If no friendship, send a new request
    else if (user.relationship === 'none') {
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
                // Update the user's relationship status
                users = users.map(u => 
                    u.id === user.id ? { 
                        ...u, 
                        relationship: 'request_sent', 
                        liked: true, 
                        friendshipId: data.id 
                    } : u
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
    // If they're already friends, remove the friendship
    else if (user.relationship === 'friends' && user.friendshipId) {
        try {
            const response = await fetch(`/api/friends/${user.friendshipId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                // Update the user's relationship status and remove from friends list
                users = users.map(u => 
                    u.id === user.id ? { 
                        ...u, 
                        relationship: 'none', 
                        liked: false, 
                        friendshipId: null 
                    } : u
                );
                friends = friends.filter(f => f.id !== user.friendshipId);
            } else {
                const errorData = await response.json();
                errorMessage = errorData.detail || 'Failed to remove friendship';
            }
        } catch (error) {
            console.error('Error removing friendship:', error);
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
                // Find the friend to update in the users list too
                const removedFriend = friends.find(f => f.id === friendshipId);
                if (removedFriend) {
                    users = users.map(u => 
                        u.id === removedFriend.friend.id ? {
                            ...u,
                            relationship: 'none',
                            liked: false,
                            friendshipId: null
                        } : u
                    );
                }
                // Remove from friends list
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
    
    // Helper function to determine button text based on relationship
    function getButtonText(user: User) {
        switch (user.relationship) {
            case 'none': 
                return 'Like';
            case 'request_sent': 
                return 'Mog ni mehr';
            case 'request_received': 
                return 'Accept';
            case 'friends': 
                return 'Remove';
            default: 
                return 'Like';
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
                                <!-- Show a special message for users who have sent a request -->
                                {#if user.relationship === 'request_received'}
                                    <p class="text-sm text-green-700">Sent you a friend request!</p>
                                {/if}
                            </div>
                            
                            <!-- Only show button for non-friends -->
                            {#if user.relationship !== 'friends'}
                                <button 
                                    class="border border-gray-500 px-4 py-1 hover:bg-gray-300"
                                    on:click={() => toggleFriendship(user)}
                                >
                                    {getButtonText(user)}
                                </button>
                            {/if}
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