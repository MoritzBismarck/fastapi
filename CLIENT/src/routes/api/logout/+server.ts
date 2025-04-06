// 2. Create CLIENT/src/routes/api/logout/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, fetch }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
        return json({ detail: 'No authorization token provided' }, { status: 401 });
    }
    
    try {
        // Forward the request to your FastAPI backend
        const response = await fetch('http://127.0.0.1:8000/logout', {
            method: 'POST',
            headers: {
                'Authorization': authHeader
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            return json(data);
        } else {
            const errorData = await response.json().catch(() => 
                ({ detail: 'Logout failed' })
            );
            return json(errorData, { status: response.status });
        }
    } catch (error) {
        console.error('Error connecting to backend:', error);
        return json(
            { detail: 'Failed to connect to logout service' }, 
            { status: 500 }
        );
    }
};