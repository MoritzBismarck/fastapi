<script lang="ts">
    import { onMount } from 'svelte';
    
    interface Notification {
        id: number;
        content: string;
        is_read: boolean;
        created_at: string;
    }
    
    // State variables
    let notifications = $state<Notification[]>([]);
    let unreadCount = $state(0);
    let isOpen = $state(false);
    let isLoading = $state(true);
    let error = $state('');
    
    // Format the date to be more readable
    function formatDate(dateString: string) {
        const date = new Date(dateString);
        
        // If it's today, just show the time
        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
            return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
        }
        
        // If it's within the last week, show the day and time
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        if (date > lastWeek) {
            return date.toLocaleDateString(undefined, { weekday: 'short' }) + 
                   ' ' + date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
        }
        
        // Otherwise, show the full date
        return date.toLocaleDateString();
    }
    
    // Toggle the notification dropdown
    function toggleNotifications() {
        isOpen = !isOpen;
        if (isOpen) {
            // Always fetch fresh notifications when opening the panel
            fetchNotifications();
        }
    }
    
    // Close the notification dropdown when clicking outside
    function handleClickOutside(event: MouseEvent) {
        if (isOpen) {
            const target = event.target as Node;
            const notificationPanel = document.getElementById('notification-panel');
            const notificationButton = document.getElementById('notification-button');
            
            if (notificationPanel && notificationButton) {
                if (!notificationPanel.contains(target) && !notificationButton.contains(target)) {
                    isOpen = false;
                }
            }
        }
    }
    
    // Fetch notifications from the server
    async function fetchNotifications() {
        isLoading = true;
        error = '';
        
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;
            
            const response = await fetch('/api/notifications', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                notifications = await response.json();
                unreadCount = notifications.filter(n => !n.is_read).length;
            } else {
                const errorData = await response.json();
                error = errorData.detail || 'Failed to load notifications';
            }
        } catch (e) {
            console.error('Error fetching notifications:', e);
            error = 'Failed to load notifications';
        } finally {
            isLoading = false;
        }
    }
    
    // Mark a notification as read
    async function markAsRead(id: number) {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;
            
            const response = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    notification_id: id
                })
            });
            
            if (response.ok) {
                // Update local state
                notifications = notifications.map(n => 
                    n.id === id ? { ...n, is_read: true } : n
                );
                unreadCount = Math.max(0, unreadCount - 1);
            }
        } catch (e) {
            console.error('Error marking notification as read:', e);
        }
    }
    
    // Handle document clicks
    onMount(() => {
        document.addEventListener('click', handleClickOutside);
        
        // Fetch notifications once on mount
        fetchNotifications();
        
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    });
</script>

<div class="relative">
    <button 
        id="notification-button"
        class="text-blue-700 hover:text-blue-900 underline"
        on:click={toggleNotifications}
        aria-label="Notifications"
    >
        Notifications
        {#if unreadCount > 0}
            <span class="text-red-500 font-bold ml-1">({unreadCount})</span>
        {/if}
    </button>
    
    <!-- Notification Panel -->
    {#if isOpen}
        <div 
            id="notification-panel"
            class="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50 border border-gray-200"
        >
            <div class="p-3 bg-gray-100 border-b border-gray-200">
                <h3 class="text-sm font-medium text-gray-700">Notifications</h3>
            </div>
            
            <div class="max-h-96 overflow-y-auto">
                {#if isLoading}
                    <div class="p-4 text-center text-gray-500">
                        Loading notifications...
                    </div>
                {:else if error}
                    <div class="p-4 text-center text-red-500">
                        {error}
                    </div>
                {:else if notifications.length === 0}
                    <div class="p-4 text-center text-gray-500">
                        No notifications yet.
                    </div>
                {:else}
                    <ul>
                        {#each notifications as notification}
                            <li 
                                class="border-b border-gray-100 last:border-b-0"
                                class:bg-blue-50={!notification.is_read}
                            >
                                <button 
                                    on:click={() => markAsRead(notification.id)}
                                    class="p-3 w-full text-left hover:bg-gray-50 transition-colors duration-150"
                                >
                                    <div class="text-sm">{notification.content}</div>
                                    <div class="text-xs text-gray-500 mt-1">
                                        {formatDate(notification.created_at)}
                                    </div>
                                </button>
                            </li>
                        {/each}
                    </ul>
                {/if}
            </div>
        </div>
    {/if}
</div>