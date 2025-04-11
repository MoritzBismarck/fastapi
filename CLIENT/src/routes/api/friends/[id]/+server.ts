// /Users/moritzvonbismarck/Desktop/Bones Social/Learning/CLIENT/src/routes/api/friends/[id]/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

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