import React, { useState, useEffect } from 'react';
import { getComments, addComment, deleteComment, likeComment, unlikeComment } from '../services/socialService';
import './CommentSection.css';

function CommentSection({ targetType, targetId, currentUser }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchComments();
  }, [targetType, targetId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const result = await getComments(targetType, targetId, 50, 0, 'newest');
      setComments(result.comments || []);
      setError(null);
    } catch (err) {
      setError('Failed to load comments');
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const result = await addComment(
        targetType,
        targetId,
        newComment.trim(),
        replyingTo
      );
      
      if (result.comment) {
        if (replyingTo) {
          // Add reply to parent comment
          setComments(prev => prev.map(c => {
            if (c._id === replyingTo) {
              return {
                ...c,
                replies: [...(c.replies || []), result.comment]
              };
            }
            return c;
          }));
        } else {
          // Add new top-level comment
          setComments(prev => [result.comment, ...prev]);
        }
        setNewComment('');
        setReplyingTo(null);
      }
    } catch (err) {
      setError('Failed to post comment');
      console.error('Error posting comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;

    try {
      await deleteComment(commentId);
      setComments(prev => prev.filter(c => c._id !== commentId));
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  const handleLikeComment = async (commentId, isLiked) => {
    try {
      if (isLiked) {
        await unlikeComment(commentId);
      } else {
        await likeComment(commentId);
      }
      
      // Update local state
      setComments(prev => prev.map(c => {
        if (c._id === commentId) {
          return {
            ...c,
            likes: isLiked ? c.likes - 1 : c.likes + 1,
            isLiked: !isLiked
          };
        }
        return c;
      }));
    } catch (err) {
      console.error('Error liking comment:', err);
    }
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
      }
    }
    return 'Just now';
  };

  const renderComment = (comment, isReply = false) => (
    <div key={comment._id} className={`comment-item ${isReply ? 'reply' : ''}`}>
      <div className="comment-avatar">
        {(comment.user?.username || 'U').charAt(0).toUpperCase()}
      </div>
      <div className="comment-content">
        <div className="comment-header">
          <span className="comment-username">
            {comment.user?.username || 'Anonymous'}
          </span>
          <span className="comment-time">
            {formatTimeAgo(comment.createdAt)}
          </span>
        </div>
        <p className="comment-text">{comment.content}</p>
        <div className="comment-actions">
          <button
            className={`comment-action-btn ${comment.isLiked ? 'liked' : ''}`}
            onClick={() => handleLikeComment(comment._id, comment.isLiked)}
          >
            {comment.isLiked ? '❤️' : '🤍'} {comment.likes || 0}
          </button>
          {!isReply && (
            <button
              className="comment-action-btn reply-btn"
              onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
            >
              💬 Reply
            </button>
          )}
          {currentUser && comment.user?._id === currentUser.id && (
            <button
              className="comment-action-btn delete-btn"
              onClick={() => handleDelete(comment._id)}
            >
              🗑️ Delete
            </button>
          )}
        </div>
        
        {replyingTo === comment._id && (
          <form className="reply-form" onSubmit={handleSubmit}>
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a reply..."
              className="reply-input"
              autoFocus
            />
            <button type="submit" disabled={submitting || !newComment.trim()}>
              {submitting ? '...' : 'Post'}
            </button>
            <button type="button" onClick={() => setReplyingTo(null)}>
              Cancel
            </button>
          </form>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="replies-container">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return <div className="comments-loading">Loading comments...</div>;
  }

  return (
    <div className="comment-section">
      <h4 className="comments-title">
        💬 Comments ({comments.length})
      </h4>

      <form className="comment-form" onSubmit={handleSubmit}>
        <div className="comment-input-wrapper">
          <div className="comment-user-avatar">
            {(currentUser?.username || 'U').charAt(0).toUpperCase()}
          </div>
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="comment-input"
            disabled={submitting}
          />
          <button
            type="submit"
            className="comment-submit-btn"
            disabled={submitting || !newComment.trim()}
          >
            {submitting ? '...' : 'Post'}
          </button>
        </div>
      </form>

      {error && <div className="comment-error">{error}</div>}

      <div className="comments-list">
        {comments.length === 0 ? (
          <div className="no-comments">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map(comment => renderComment(comment))
        )}
      </div>
    </div>
  );
}

export default CommentSection;
