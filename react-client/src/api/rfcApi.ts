// Create new file: react-client/src/api/rfcApi.ts

import { get, post, del } from './client';
import {
  RequestForCommentData,
  Feature,
  UserVoteSummary,
  Comment,
  CreateFeatureRequest,
  CreateCommentRequest,
  CreateReplyRequest,
  CommentReply
} from '../types/index';

// Main RFC page data
export const getRFCData = (): Promise<RequestForCommentData> =>
  get<RequestForCommentData>('/rfc');

// Feature endpoints
export const getFeatures = (): Promise<Feature[]> =>
  get<Feature[]>('/rfc/features');

export const getUserVoteSummary = (): Promise<UserVoteSummary> =>
  get<UserVoteSummary>('/rfc/features/user-votes');

export const voteForFeature = (featureId: number): Promise<any> =>
  post(`/rfc/features/${featureId}/vote`, {});

export const removeVoteFromFeature = (featureId: number): Promise<any> =>
  del(`/rfc/features/${featureId}/vote`);

export const createFeature = (feature: CreateFeatureRequest): Promise<Feature> =>
  post<Feature>('/rfc/features', feature);

// Comment endpoints
export const getComments = (): Promise<Comment[]> =>
  get<Comment[]>('/rfc/comments');

export const createComment = (comment: CreateCommentRequest): Promise<Comment> =>
  post<Comment>('/rfc/comments', comment);

export const createReply = (commentId: number, reply: CreateReplyRequest): Promise<CommentReply> =>
  post<CommentReply>(`/rfc/comments/${commentId}/replies`, reply);

export const likeComment = (commentId: number): Promise<{ message: string; liked: boolean }> =>
  post(`/rfc/comments/${commentId}/like`, {});

export const likeReply = (replyId: number): Promise<{ message: string; liked: boolean }> =>
  post(`/rfc/replies/${replyId}/like`, {});