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
  mutual_friends?: MutualFriend[];
  same_time_join?: boolean;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  profile_picture?: string;
  created_at: string;
  mutual_friends?: MutualFriend[];
  relationship?: 'none' | 'friends' | 'request_sent' | 'request_received';
  friendshipId?: number | null;
}

export interface MutualFriend {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  profile_picture?: string;
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
  location: string;
  cover_photo_url?: string;
  guest_limit?: number;
  rsvp_close_time?: string;
  visibility: 'PUBLIC' | 'PRIVATE' | 'FRIENDS';
  creator_id: number;
  status: string;
  created_at: string;
  updated_at: string;
  last_edited_at?: string;
  interested_count: number;
  going_count: number;
  liked_by_current_user?: boolean;
  liked_by_friends?: User[];
  creator?: {
    id: number;
    username: string;
    profile_picture?: string;
  };
  current_user_rsvp?: {
    status: 'GOING' | 'CANCELLED';  // Remove 'INTERESTED'
    responded_at: string;
  };
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

export type RSVPStatus = 'GOING' | 'CANCELLED';  // Remove 'INTERESTED'

export interface RSVP {
  user_id: number;
  event_id: number;
  status: RSVPStatus;
  responded_at: string;
}

