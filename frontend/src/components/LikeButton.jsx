import React, { useState, useEffect } from 'react';
import { toggleLike, checkLike, getLikeCount } from '../services/socialService';
import './LikeButton.css';

function LikeButton({ targetType, targetId, initialCount = 0, showCount = true, size = 'medium' }) {
  const [isLiked, setIsLiked] = useState(false);
  const [count, setCount] = useState(initialCount || 0);
  const [loading, setLoading] = useState(false);

  const stringTargetId = String(targetId || '');

  useEffect(() => {
    // Check if user already liked this item
    const checkLikedStatus = async () => {
      try {
        const result = await checkLike(targetType, stringTargetId);
        setIsLiked(result.liked || result.hasLiked);
      } catch (error) {
        console.error('Failed to check like status:', error);
      }
    };

    // Get current like count
    const fetchCount = async () => {
      try {
        const result = await getLikeCount(targetType, stringTargetId);
        setCount(result.count ?? result.likeCount ?? 0);
      } catch (error) {
        console.error('Failed to fetch like count:', error);
      }
    };

    if (stringTargetId) {
      checkLikedStatus();
      fetchCount();
    }
  }, [targetType, stringTargetId]);

  const handleClick = async (e) => {
    if (e) {
      e.stopPropagation();
    }
    
    if (loading) return;
    
    setLoading(true);
    try {
      const result = await toggleLike(targetType, stringTargetId);
      setIsLiked(result.liked);
      setCount(result.count ?? result.likeCount ?? 0);
    } catch (error) {
      console.error('Failed to toggle like:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={`like-button ${isLiked ? 'liked' : ''} ${size} ${loading ? 'loading' : ''}`}
      onClick={handleClick}
      disabled={loading}
      title={isLiked ? 'Unlike' : 'Like'}
    >
      <span className="like-icon">
        {isLiked ? '❤️' : '🤍'}
      </span>
      {showCount && (
        <span className="like-count">
          {(count || 0).toLocaleString()}
        </span>
      )}
    </button>
  );
}

export default LikeButton;
