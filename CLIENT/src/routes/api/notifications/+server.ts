// CLIENT/src/routes/api/notifications/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// GET handler to fetch notifications
export const GET: RequestHandler = async ({ request, fetch, url }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
        return json({ detail: 'No authorization token provided' }, { status: 401 });
    }
    
    // Get query parameters
    const limit = url.searchParams.get('limit') || '20';
    const skip = url.searchParams.get('skip') || '0';
    const unreadOnly = url.searchParams.get('unread_only') || 'false';
    
    try {
        // Forward the request to your FastAPI backend
        const response = await fetch(
            `http://127.0.0.1:8000/notifications?limit=${limit}&skip=${skip}&unread_only=${unreadOnly}`, 
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
                ({ detail: 'Failed to fetch notifications' })
            );
            return json(errorData, { status: response.status });
        }
    } catch (error) {
        console.error('Error connecting to backend:', error);
        return json(
            { detail: 'Failed to connect to notifications service' }, 
            { status: 500 }
        );
    }
};

// PATCH handler to mark notification as read
export const PATCH: RequestHandler = async ({ request, fetch }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
        return json({ detail: 'No authorization token provided' }, { status: 401 });
    }
    
    try {
        const body = await request.json();
        const notificationId = body.notification_id;
        
        if (!notificationId) {
            return json({ detail: 'Notification ID is required' }, { status: 400 });
        }
        
        // Forward the request to your FastAPI backend
        const response = await fetch(`http://127.0.0.1:8000/notifications/${notificationId}/read`, {
            method: 'PATCH',
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
                ({ detail: 'Failed to mark notification as read' })
            );
            return json(errorData, { status: response.status });
        }
    } catch (error) {
        console.error('Error connecting to backend:', error);
        return json(
            { detail: 'Failed to connect to notifications service' }, 
            { status: 500 }
        );
    }
};