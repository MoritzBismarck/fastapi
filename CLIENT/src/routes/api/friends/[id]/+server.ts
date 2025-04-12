// /Users/moritzvonbismarck/Desktop/Bones Social/Learning/CLIENT/src/routes/api/friends/[id]/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ params, request, fetch }) => {
    const friendshipId = params.id;
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
        return json({ detail: 'No authorization token provided' }, { status: 401 });
    }
    
    try {
        const body = await request.json();
        console.log(`PUT request to /api/friends/${friendshipId}`, body);
        
        // Forward the request to your FastAPI backend
        const response = await fetch(`http://127.0.0.1:8000/friendships/${friendshipId}`, {
            method: 'PUT',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        
        // Log response status
        console.log(`Backend response status: ${response.status}`);
        
        // Get response data regardless of status
        const responseText = await response.text();
        console.log(`Backend response: ${responseText}`);
        
        // Try to parse as JSON if possible
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            data = { detail: responseText || 'Invalid response from server' };
        }
        
        if (response.ok) {
            return json(data);
        } else {
            return json(data, { status: response.status });
        }
    } catch (error) {
        console.error('Error connecting to backend:', error);
        return json(
            { detail: `Failed to connect to friendship service:` }, 
            { status: 500 }
        );
    }
};

export const DELETE: RequestHandler = async ({ params, request, fetch }) => {
    const friendshipId = params.id;
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
        return json({ detail: 'No authorization token provided' }, { status: 401 });
    }
    
    try {
        // Forward the request to your FastAPI backend
        const response = await fetch(`http://127.0.0.1:8000/friendships/${friendshipId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': authHeader
            }
        });
        
        if (response.ok) {
            return new Response(null, { status: 204 });
        } else {
            const errorData = await response.json().catch(() => 
                ({ detail: 'Failed to delete friendship' })
            );
            return json(errorData, { status: response.status });
        }
    } catch (error) {
        console.error('Error connecting to backend:', error);
        return json(
            { detail: 'Failed to connect to friendship service' }, 
            { status: 500 }
        );
    }
};