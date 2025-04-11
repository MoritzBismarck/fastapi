export interface User {
    id: number;
    username: string;
    email: string;
    liked?: boolean;
    hasLikedCurrentUser?: boolean;
    friendshipId?: number | null;
}

export interface Friendship {
    id: number;
    status: string;
    created_at: string;
    updated_at: string;
    friend: User;
}