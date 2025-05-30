export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  profile_picture?: string;
  created_at?: string;
  relationship?: 'none' | 'friends' | 'request_sent' | 'request_received';
  friendshipId?: number | null;
  liked?: boolean;
  hasLikedCurrentUser?: boolean;
}
  
  export interface Friendship {
    id: number;
    status: string;
    created_at: string;
    updated_at: string;
    friend: User;
  }
  
  export interface CreatorInfo {
    id: number;
    username: string;
    profile_picture?: string;
  }
  
  export interface Event {
    id: number;
    title: string;
    description: string;
    start_date: string;
    end_date?: string;
    start_time?: string;
    end_time?: string;
    all_day: boolean;
    place: string;
    image_url?: string;
    created_at: string;
    created_by: number;
    liked_by_friends?: User[];
    creator?: CreatorInfo; // Add creator information
  }
  
  export interface Notification {
    id: number;
    content: string;
    is_read: boolean;
    created_at: string;
  }

  export interface LoginCredentials {
  emailOrUsername: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}