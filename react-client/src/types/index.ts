export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  profile_picture?: string;
  created_at?: string;
}
  
  export interface Friendship {
    id: number;
    status: string;
    created_at: string;
    updated_at: string;
    friend: User;
  }
  
  export interface Event {
    id: number;
    title: string;
    description: string;
    event_date: string;
    location?: string;
    created_at: string;
  }
  
  export interface Notification {
    id: number;
    content: string;
    is_read: boolean;
    created_at: string;
  }