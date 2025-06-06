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
        // Use the overview endpoint instead of separate requests
        const response = await fetch('http://127.0.0.1:8000/users/overview', {
            headers: {
                'Authorization': authHeader
            }
        });
        
        if (!response.ok) {
            return json(
                { detail: 'Failed to fetch data from backend' }, 
                { status: response.status }
            );
        }
        
        // Just pass through the data from the backend
        const data = await response.json();
        return json(data);
        
    } catch (error) {
        console.error('Error connecting to backend:', error);
        return json(
            { detail: 'Failed to connect to friendship service' }, 
            { status: 500 }
        );
    }
};

// The POST and other methods can remain unchanged

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