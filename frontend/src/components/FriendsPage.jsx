// frontend/src/components/FriendsPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api';
import './FriendsPage.css';

function FriendsPage({ user, sidebarExpanded }) {
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionSongName, setSessionSongName] = useState('');
  const [sessionSongUrl, setSessionSongUrl] = useState('');
  const [, setActiveSession] = useState(null);
  const messagesEndRef = useRef(null);

  const fetchFriends = useCallback(async () => {
    try {
      const response = await api.get('/friends');
      
      // Get accepted friends
      const acceptedFriends = response.data
        .filter(friend => friend.status === 'accepted')
        .map(friend => {
          const friendUser = friend.user1._id === user.id ? friend.user2 : friend.user1;
          return { ...friendUser, friendshipId: friend._id };
        });
      
      // Get pending incoming requests (where user2 is current user)
      const pending = response.data
        .filter(friend => friend.status === 'pending' && friend.user2._id === user.id)
        .map(friend => ({
          ...friend.user1,
          requestId: friend._id
        }));
      
      setFriends(acceptedFriends);
      setPendingRequests(pending);
      setLoading(false);
    } catch (error) {
      console.log('Error fetching friends:', error.message);
      setLoading(false);
    }
  }, [user.id]);

  // Accept friend request
  const acceptRequest = async (requestId) => {
    try {
      await api.put(`/friends/accept/${requestId}`);
      fetchFriends();
    } catch (error) {
      console.log('Error accepting request:', error.message);
    }
  };

  // Decline friend request
  const declineRequest = async (requestId) => {
    try {
      await api.delete(`/friends/${requestId}`);
      fetchFriends();
    } catch (error) {
      console.log('Error declining request:', error.message);
    }
  };

  // Fetch friends list
  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const fetchMessages = async (friendId) => {
    try {
      const response = await api.get(`/messages/${friendId}`);
      setMessages(response.data);
    } catch (error) {
      console.log('Error fetching messages:', error.message);
    }
  };

  // Poll for new messages every 3 seconds
  useEffect(() => {
    if (!selectedFriend) return;
    
    const interval = setInterval(() => {
      fetchMessages(selectedFriend._id);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [selectedFriend]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedFriend) return;

    try {
      await api.post(`/messages/${selectedFriend._id}`, {
        content: newMessage,
        type: 'text'
      });
      setNewMessage('');
      fetchMessages(selectedFriend._id);
    } catch (error) {
      console.log('Error sending message:', error.message);
    }
  };

  const createSession = async () => {
    if (!sessionSongName.trim() || !selectedFriend) return;

    try {
      const response = await api.post('/listening-sessions/create', {
        songName: sessionSongName,
        songUrl: sessionSongUrl,
        platform: 'youtube',
        friendId: selectedFriend._id
      });

      setSessionSongName('');
      setSessionSongUrl('');
      setShowSessionModal(false);
      setActiveSession(response.data.session);
      fetchMessages(selectedFriend._id);
    } catch (error) {
      console.log('Error creating session:', error.message);
    }
  };

  const joinSession = async (sessionId) => {
    try {
      const response = await api.post(`/listening-sessions/${sessionId}/join`);
      setActiveSession(response.data);
      alert(`Joined session: ${response.data.songName}`);
    } catch (error) {
      console.log('Error joining session:', error.message);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return <div className="friends-loading">Loading friends...</div>;
  }

  return (
    <div className={`friends-page ${sidebarExpanded ? 'sidebar-expanded' : ''}`}>
      {/* Friends Sidebar */}
      <div className="friends-sidebar">
        <div className="friends-sidebar-header">
          <h3>Friends</h3>
          <span className="friends-count">{friends.length}</span>
        </div>
        
        {/* Pending Requests Section */}
        {pendingRequests.length > 0 && (
          <div className="pending-requests">
            <div className="pending-header">
              <span>Pending Requests</span>
              <span className="pending-count">{pendingRequests.length}</span>
            </div>
            {pendingRequests.map(request => (
              <div key={request.requestId} className="pending-item">
                <div className="friend-avatar">
                  {request.username.charAt(0).toUpperCase()}
                </div>
                <div className="pending-info">
                  <span className="friend-name">{request.username}</span>
                </div>
                <div className="pending-actions">
                  <button 
                    className="accept-btn"
                    onClick={() => acceptRequest(request.requestId)}
                  >
                    ✓
                  </button>
                  <button 
                    className="decline-btn"
                    onClick={() => declineRequest(request.requestId)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="friends-list">
          {friends.length === 0 ? (
            <div className="no-friends">
              <p>No friends yet</p>
              <p className="no-friends-subtitle">Add friends to start chatting</p>
            </div>
          ) : (
            friends.map(friend => (
              <div
                key={friend._id}
                className={`friend-item ${selectedFriend?._id === friend._id ? 'active' : ''}`}
                onClick={() => setSelectedFriend(friend)}
              >
                <div className="friend-avatar">
                  {friend.username.charAt(0).toUpperCase()}
                </div>
                <div className="friend-info">
                  <span className="friend-name">{friend.username}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="chat-container">
        {selectedFriend ? (
          <>
            {/* Chat Header */}
            <div className="chat-header">
              <div className="chat-header-info">
                <div className="friend-avatar">
                  {selectedFriend.username.charAt(0).toUpperCase()}
                </div>
                <div className="chat-header-text">
                  <h4>{selectedFriend.username}</h4>
                </div>
              </div>
              <button 
                className="create-session-btn"
                onClick={() => setShowSessionModal(true)}
              >
                🎵 Create Session
              </button>
            </div>

            {/* Messages Area */}
            <div className="messages-area">
              {messages.length === 0 ? (
                <div className="no-messages">
                  <p>No messages yet</p>
                  <p>Send a message to start the conversation!</p>
                </div>
              ) : (
                messages.map(message => (
                  <div
                    key={message._id}
                    className={`message ${message.sender === user.id ? 'sent' : 'received'}`}
                  >
                    {message.type === 'session_invite' ? (
                      <div className="session-invite-message">
                        <p className="session-text">{message.content}</p>
                        {message.sender !== user.id && (
                          <button
                            className="join-session-btn"
                            onClick={() => joinSession(message.sessionData.sessionId)}
                          >
                            Join Session
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="message-text">{message.content}</p>
                    )}
                    <span className="message-time">
                      {formatTime(message.createdAt)}
                    </span>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form className="message-input-area" onSubmit={sendMessage}>
              <input
                type="text"
                className="message-input"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button type="submit" className="send-btn">
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <div className="no-chat-icon">👥</div>
            <h3>Select a friend to start chatting</h3>
            <p>Choose a friend from the sidebar to view messages and create listening sessions</p>
          </div>
        )}
      </div>

      {/* Create Session Modal */}
      {showSessionModal && (
        <div className="modal active" onClick={(e) => e.target === e.currentTarget && setShowSessionModal(false)}>
          <div className="modal-content session-modal">
            <button className="modal-close" onClick={() => setShowSessionModal(false)}>
              &times;
            </button>
            <h3>Create Listening Session</h3>
            <p className="session-description">
              Create a session to listen together with {selectedFriend?.username}
            </p>
            
            <div className="session-form">
              <div className="form-group">
                <label>Song Name *</label>
                <input
                  type="text"
                  placeholder="Enter song name"
                  value={sessionSongName}
                  onChange={(e) => setSessionSongName(e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label>Song URL (optional)</label>
                <input
                  type="text"
                  placeholder="YouTube or Spotify URL"
                  value={sessionSongUrl}
                  onChange={(e) => setSessionSongUrl(e.target.value)}
                />
              </div>
              
              <div className="session-form-actions">
                <button className="btn-secondary" onClick={() => setShowSessionModal(false)}>
                  Cancel
                </button>
                <button 
                  className="btn-primary"
                  onClick={createSession}
                  disabled={!sessionSongName.trim()}
                >
                  Create Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FriendsPage;
