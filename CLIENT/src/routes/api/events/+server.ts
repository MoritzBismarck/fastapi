// CLIENT/src/routes/api/events/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// GET handler to fetch events from the backend
export const GET: RequestHandler = async ({ request, fetch, url }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
        return json({ detail: 'No authorization token provided' }, { status: 401 });
    }
    
    // Get query parameters
    const limit = url.searchParams.get('limit') || '10';
    const skip = url.searchParams.get('skip') || '0';
    const excludeLiked = url.searchParams.get('exclude_liked') || 'true';
    
    try {
        // Forward the request to your FastAPI backend
        const response = await fetch(
            `http://127.0.0.1:8000/events?limit=${limit}&skip=${skip}&exclude_liked=${excludeLiked}`, 
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
                ({ detail: 'Failed to fetch events' })
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

// POST handler to like an event
export const POST: RequestHandler = async ({ request, fetch, url }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
        return json({ detail: 'No authorization token provided' }, { status: 401 });
    }
    
    try {
        const body = await request.json();
        const eventId = body.event_id;
        
        if (!eventId) {
            return json({ detail: 'Event ID is required' }, { status: 400 });
        }
        
        // Forward the request to your FastAPI backend
        const response = await fetch(`http://127.0.0.1:8000/events/${eventId}/like`, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            return json(data);
        } else {
            const errorData = await response.json().catch(() => 
                ({ detail: 'Failed to like event' })
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

// DELETE handler to unlike an event
export const DELETE: RequestHandler = async ({ request, fetch, url }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
        return json({ detail: 'No authorization token provided' }, { status: 401 });
    }
    
    try {
        const body = await request.json();
        const eventId = body.event_id;
        
        if (!eventId) {
            return json({ detail: 'Event ID is required' }, { status: 400 });
        }
        
        // Forward the request to your FastAPI backend
        const response = await fetch(`http://127.0.0.1:8000/events/${eventId}/like`, {
            method: 'DELETE',
            headers: {
                'Authorization': authHeader
            }
        });
        
        if (response.ok) {
            return new Response(null, { status: 204 });
        } else {
            const errorData = await response.json().catch(() => 
                ({ detail: 'Failed to unlike event' })
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