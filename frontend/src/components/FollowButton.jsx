import React, { useState, useEffect } from 'react';
import { followUser, unfollowUser, checkFollowStatus } from '../services/socialService';
import './FollowButton.css';

function FollowButton({ userId, size = 'medium', showCounts = false }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followsYou, setFollowsYou] = useState(false);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkStatus();
  }, [userId]);

  const checkStatus = async () => {
    try {
      const status = await checkFollowStatus(userId);
      setIsFollowing(status.following);
      setFollowsYou(status.followsYou);
      
      if (showCounts) {
        // Note: We'd need a separate API call for counts
        // For now, we'll skip this
      }
    } catch (error) {
      console.error('Failed to check follow status:', error);
    }
  };

  const handleClick = async (e) => {
    if (e) {
      e.stopPropagation();
    }
    
    if (loading) return;
    
    setLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(userId);
        setIsFollowing(false);
      } else {
        await followUser(userId);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    } finally {
      setLoading(false);
    }
  };

  let buttonText;
  let buttonClass = 'follow-button';
  
  if (isFollowing && followsYou) {
    buttonText = 'Friends';
    buttonClass += ' friends';
  } else if (isFollowing) {
    buttonText = 'Following';
    buttonClass += ' following';
  } else if (followsYou) {
    buttonText = 'Follow Back';
    buttonClass += ' follow-back';
  } else {
    buttonText = 'Follow';
    buttonClass += ' not-following';
  }

  buttonClass += ` ${size}`;
  if (loading) buttonClass += ' loading';

  return (
    <button
      className={buttonClass}
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? '...' : buttonText}
    </button>
  );
}

export default FollowButton;
