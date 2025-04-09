// /Users/moritzvonbismarck/Desktop/Bones Social/Learning/CLIENT/src/routes/api/friends/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import type { User, Friendship } from '$lib/types';

// GET handler to fetch users and friendships
export const GET: RequestHandler = async ({ request, fetch }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
        return json({ detail: 'No authorization token provided' }, { status: 401 });
    }
    
    try {
        // Fetch all users
        const usersResponse = await fetch('http://127.0.0.1:8000/users', {
            headers: {
                'Authorization': authHeader
            }
        });
        
        // Fetch current user's friendships
        const friendshipsResponse = await fetch('http://127.0.0.1:8000/friendships', {
            headers: {
                'Authorization': authHeader
            }
        });
        
        if (!usersResponse.ok || !friendshipsResponse.ok) {
            return json(
                { detail: 'Failed to fetch data from backend' }, 
                { status: 500 }
            );
        }
        
        const users: User[] = await usersResponse.json();
        const friendships: Friendship[] = await friendshipsResponse.json();
        
        // Process users with friendship information
        const processedUsers = users.map((user: User) => {
            // Check if user has sent a request to current user
            const hasLikedCurrentUser = friendships.some(
                (f: Friendship) => f.friend.id === user.id && 
                     f.status === 'pending'
            );
            
            // Check if current user has already liked this user
            const isLikedByCurrentUser = friendships.some(
                (f: Friendship) => f.friend.id === user.id
            );
            
            return {
                ...user,
                hasLikedCurrentUser,
                liked: isLikedByCurrentUser
            };
        });
        
        // Sort users - those who liked current user should be at the top
        const sortedUsers = processedUsers.sort((a: User, b: User) => {
            if (a.hasLikedCurrentUser && !b.hasLikedCurrentUser) return -1;
            if (!a.hasLikedCurrentUser && b.hasLikedCurrentUser) return 1;
            return 0;
        });
        
        // Get established friendships (status === 'accepted')
        const establishedFriendships = friendships.filter(
            (f: Friendship) => f.status === 'accepted'
        );
        
        return json({
            users: sortedUsers,
            friends: establishedFriendships
        });
    } catch (error) {
        console.error('Error connecting to backend:', error);
        return json(
            { detail: 'Failed to connect to friendship service' }, 
            { status: 500 }
        );
    }
};

// POST handler to send a friend request
export const POST: RequestHandler = async ({ request, fetch }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
        return json({ detail: 'No authorization token provided' }, { status: 401 });
    }
    
    try {
        const body = await request.json();
        
        // Forward the request to your FastAPI backend
        const response = await fetch('http://127.0.0.1:8000/friendships', {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            return json(data);
        } else {
            return json(data, { status: response.status });
        }
    } catch (error) {
        console.error('Error connecting to backend:', error);
        return json(
            { detail: 'Failed to connect to friendship service' }, 
            { status: 500 }
        );
    }
};