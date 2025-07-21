// Create new file: react-client/src/components/CommentSystem.tsx

import React, { useState } from 'react';
import { Comment, CreateCommentRequest, CreateReplyRequest } from '../types/index';
import { createComment, createReply, likeComment, likeReply } from '../api/rfcApi';
import Button from './Button';

interface CommentSystemProps {
  comments: Comment[];
  onUpdate: () => void;
}

const CommentSystem: React.FC<CommentSystemProps> = ({ comments, onUpdate }) => {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [likingComment, setLikingComment] = useState<number | null>(null);
  const [likingReply, setLikingReply] = useState<number | null>(null);

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await createComment({ content: newComment });
      setNewComment('');
      onUpdate();
    } catch (error) {
      console.error('Error creating comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateReply = async (commentId: number) => {
    if (!replyText.trim()) return;

    setIsSubmitting(true);
    try {
      await createReply(commentId, { content: replyText });
      setReplyText('');
      setReplyingTo(null);
      // Force a complete refresh to get updated replies
      onUpdate();
    } catch (error) {
      console.error('Error creating reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: number) => {
    setLikingComment(commentId);
    try {
      await likeComment(commentId);
      onUpdate();
    } catch (error) {
      console.error('Error liking comment:', error);
    } finally {
      setLikingComment(null);
    }
  };

  const handleLikeReply = async (replyId: number) => {
    setLikingReply(replyId);
    try {
      await likeReply(replyId);
      onUpdate();
    } catch (error) {
      console.error('Error liking reply:', error);
    } finally {
      setLikingReply(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <h2 className="text-xl font-bold">Comments</h2>

      {/* Create Comment Form */}
      <div className="border-2 border-gray-300 p-4 rounded">
        <form onSubmit={handleCreateComment} className="space-y-2">
          <textarea
            placeholder="Share your thoughts..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full p-2 border-2 border-gray-300 rounded font-mono resize-none"
            rows={3}
            required
          />
          <Button 
            type="submit" 
            disabled={isSubmitting || !newComment.trim()}
            size="sm"
          >
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </form>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="border-2 border-gray-300 p-4 rounded">
              {/* Comment Header */}
              <div className="flex items-center gap-2 mb-2">
                {comment.author.profile_picture ? (
                  <img 
                    src={comment.author.profile_picture} 
                    alt={comment.author.username}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    {comment.author.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-bold">{comment.author.username}</div>
                  <div className="text-xs text-gray-500">{formatDate(comment.created_at)}</div>
                </div>
              </div>

              {/* Comment Content */}
              <p className="mb-3">{comment.content}</p>

              {/* Comment Actions */}
              <div className="flex items-center gap-4 text-sm">
                <button
                  onClick={() => handleLikeComment(comment.id)}
                  disabled={likingComment === comment.id}
                  className={`flex items-center gap-1 hover:text-blue-600 ${
                    comment.user_has_liked ? 'text-blue-600 font-bold' : 'text-gray-600'
                  }`}
                >
                  {likingComment === comment.id ? '...' : '👍'} {comment.like_count}
                </button>
                
                <button
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  className="text-gray-600 hover:text-blue-600"
                >
                  💬 Reply
                </button>

                {comment.reply_count > 0 && (
                  <span className="text-gray-500">
                    {comment.reply_count} repl{comment.reply_count === 1 ? 'y' : 'ies'}
                  </span>
                )}
              </div>

              {/* Reply Form */}
              {replyingTo === comment.id && (
                <div className="mt-3 ml-4 border-l-2 border-gray-300 pl-4">
                  <div className="space-y-2">
                    <textarea
                      placeholder="Write a reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="w-full p-2 border-2 border-gray-300 rounded font-mono resize-none"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleCreateReply(comment.id)}
                        disabled={isSubmitting || !replyText.trim()}
                        size="sm"
                      >
                        {isSubmitting ? 'Replying...' : 'Reply'}
                      </Button>
                      <Button
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyText('');
                        }}
                        variant="secondary"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Replies */}
              {comment.replies.length > 0 && (
                <div className="mt-4 ml-4 border-l-2 border-gray-300 pl-4 space-y-3">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="bg-gray-50 p-3 rounded">
                      {/* Reply Header */}
                      <div className="flex items-center gap-2 mb-2">
                        {reply.author.profile_picture ? (
                          <img 
                            src={reply.author.profile_picture} 
                            alt={reply.author.username}
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs">
                            {reply.author.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-sm">{reply.author.username}</div>
                          <div className="text-xs text-gray-500">{formatDate(reply.created_at)}</div>
                        </div>
                      </div>

                      {/* Reply Content */}
                      <p className="text-sm mb-2">{reply.content}</p>

                      {/* Reply Actions */}
                      <button
                        onClick={() => handleLikeReply(reply.id)}
                        disabled={likingReply === reply.id}
                        className={`flex items-center gap-1 text-xs hover:text-blue-600 ${
                          reply.user_has_liked ? 'text-blue-600 font-bold' : 'text-gray-600'
                        }`}
                      >
                        {likingReply === reply.id ? '...' : '👍'} {reply.like_count}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSystem;