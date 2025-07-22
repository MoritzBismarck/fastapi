// react-client/src/types/index.ts

export interface MutualFriend {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  profile_picture?: string;
}

export type RelationshipStatus = "none" | "friends" | "request_sent" | "request_received";

// Simplified User interface - basic fields + optional friendship fields
export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  profile_picture?: string;
  created_at?: string;  // Optional - only needed for profile page
  // Optional friendship fields - only present when needed
  relationship?: RelationshipStatus;
  liked?: boolean;
  friendshipId?: number | null;
  hasLikedCurrentUser?: boolean;
  recommended?: boolean;
  mutual_friends?: MutualFriend[];
  same_time_join?: boolean;
}

export interface FriendUser {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  profile_picture?: string;
  mutual_friends?: MutualFriend[];
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
  relationship?: RelationshipStatus;
  friendshipId?: number | null;
}
  
export interface Friendship {
  id: number;
  friend: FriendUser;  // Updated to use FriendUser instead of User
  status: string;
  created_at: string;
  updated_at: string;
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

export interface ChatMessage {
  id: number;
  content: string;
  sender: {
    id: number;
    username: string;
    profile_picture?: string;
  };
  sent_at: string;
}

export interface EventChatInfo {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  location: string;
  cover_photo_url?: string;
  creator?: {
    id: number;
    username: string;
    profile_picture?: string;
  };
  match_participants: Array<{
    id: number;
    username: string;
    profile_picture?: string;
    email: string;
  }>;
}

// Response type for sending messages (what the backend returns)
export interface SendMessageResponse {
  id: number;
  content: string;
  sent_at: string;
  sender: {
    id: number;
    username: string;
    profile_picture?: string;
  };
  message: string;
}

// For creating messages (what we send to backend)
export interface CreateMessageRequest {
  content: string;
}

// Create new file: react-client/src/types/rfc.ts

export interface Feature {
  id: number;
  title: string;
  description: string;
  vote_count: number;
  created_at: string;
  updated_at: string;
  created_by?: number;
  user_has_voted: boolean;
}

export interface UserVoteSummary {
  total_votes: number;
  remaining_votes: number;
  voted_features: number[];
}

export interface CommentAuthor {
  id: number;
  username: string;
  profile_picture?: string;
}

export interface CommentReply {
  id: number;
  content: string;
  comment_id: number;
  author_id: number;
  like_count: number;
  created_at: string;
  updated_at: string;
  author: CommentAuthor;
  user_has_liked: boolean;
}

export interface Comment {
  id: number;
  content: string;
  author_id: number;
  like_count: number;
  reply_count: number;
  created_at: string;
  updated_at: string;
  author: CommentAuthor;
  user_has_liked: boolean;
  replies: CommentReply[];
}

export interface RequestForCommentData {
  features: Feature[];
  user_vote_summary: UserVoteSummary;
  comments: Comment[];
}

export interface CreateFeatureRequest {
  title: string;
  description: string;
}

export interface CreateCommentRequest {
  content: string;
}

export interface CreateReplyRequest {
  content: string;
}