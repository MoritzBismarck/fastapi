// CLIENT/src/routes/api/login/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, fetch }) => {
    const body = await request.json();
    
    try {
        // Transform to match OAuth2PasswordRequestForm which expects username (not email)
        const formData = new URLSearchParams();
        formData.append('username', body.email); // Using email as username
        formData.append('password', body.password);
        
        // Forward the request to your FastAPI backend
        const response = await fetch('http://127.0.0.1:8000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            // Add username to the response for client-side storage
            return json({
                ...data,
                username: body.email  // Store the email as username
            });
        } else {
            const errorData = await response.json().catch(() => 
                ({ detail: 'Authentication failed' })
            );
            return json(errorData, { status: response.status });
        }
    } catch (error) {
        console.error('Error connecting to backend:', error);
        return json(
            { detail: 'Failed to connect to authentication service' }, 
            { status: 500 }
        );
    }
};