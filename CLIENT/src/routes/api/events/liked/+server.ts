// CLIENT/src/routes/api/events/liked/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// GET handler to fetch liked events
export const GET: RequestHandler = async ({ request, fetch, url }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
        return json({ detail: 'No authorization token provided' }, { status: 401 });
    }
    
    // Get query parameters
    const limit = url.searchParams.get('limit') || '20';
    const skip = url.searchParams.get('skip') || '0';
    
    try {
        // Forward the request to your FastAPI backend
        const response = await fetch(
            `http://127.0.0.1:8000/events/liked?limit=${limit}&skip=${skip}`, 
            {
                headers: {
                    'Authorization': authHeader
                }
            }
        );
        
        if (response.ok) {
            const data = await response.json();
            return json(data);
        } else {
            const errorData = await response.json().catch(() => 
                ({ detail: 'Failed to fetch liked events' })
            );
            return json(errorData, { status: response.status });
        }
    } catch (error) {
        console.error('Error connecting to backend:', error);
        return json(
            { detail: 'Failed to connect to events service' }, 
            { status: 500 }
        );
    }
};