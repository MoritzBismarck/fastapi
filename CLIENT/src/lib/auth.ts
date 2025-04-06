// 1. Add to CLIENT/src/lib/auth.ts (create this file if it doesn't exist)
export async function logout() {
    const token = localStorage.getItem('authToken');
    if (!token) return true; // Already logged out
    
    try {
        const response = await fetch('/api/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            // Clear local storage
            localStorage.removeItem('authToken');
            localStorage.removeItem('username');
            return true;
        } else {
            console.error('Logout failed');
            return false;
        }
    } catch (error) {
        console.error('Error during logout:', error);
        return false;
    }
}