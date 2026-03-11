// frontend/src/components/FriendsPage.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import api from '../api';
import './FriendsPage.css';

function FriendsPage({ user, sidebarExpanded, playlists = [] }) {
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionSongName, setSessionSongName] = useState('');
  const [sessionSongUrl, setSessionSongUrl] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState('');
  const [activeSession, setActiveSession] = useState(null);
  const [sessionPlaylist, setSessionPlaylist] = useState(null);
  const messagesEndRef = useRef(null);

  // Filter to only show current user's own playlists
  const userPlaylists = useMemo(() => {
    const userId = user?._id || user?.id;
    return playlists.filter(p => p.owner?._id === userId || p.owner === userId);
  }, [playlists, user]);

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
      const playlist = userPlaylists.find(p => p._id === selectedPlaylist);
      const response = await api.post('/listening-sessions/create', {
        songName: sessionSongName,
        songUrl: sessionSongUrl,
        platform: 'youtube',
        friendId: selectedFriend._id,
        playlistId: selectedPlaylist
      });

      setSessionSongName('');
      setSessionSongUrl('');
      setSelectedPlaylist('');
      setShowSessionModal(false);
      setActiveSession(response.data.session);
      setSessionPlaylist(playlist || null);
      fetchMessages(selectedFriend._id);
    } catch (error) {
      console.log('Error creating session:', error.message);
    }
  };

  const joinSession = async (sessionId) => {
    try {
      const response = await api.post(`/listening-sessions/${sessionId}/join`);
      setActiveSession(response.data);
      setSessionPlaylist(null);
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
            <div className="header-actions">
              <span className="friends-count">{friends.length}</span>
            </div>
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
                  {request.profileImage ? (
                    <img 
                      src={request.profileImage.startsWith('http') ? request.profileImage : `https://vibesync-n1fk.onrender.com${request.profileImage}`} 
                      alt={request.username}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    request.username?.charAt(0).toUpperCase()
                  )}
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
                  {friend.profileImage ? (
                    <img 
                      src={friend.profileImage.startsWith('http') ? friend.profileImage : `https://vibesync-n1fk.onrender.com${friend.profileImage}`} 
                      alt={friend.username} 
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    friend.username?.charAt(0).toUpperCase()
                  )}
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
                  {selectedFriend.profileImage ? (
                    <img 
                      src={selectedFriend.profileImage.startsWith('http') ? selectedFriend.profileImage : `https://vibesync-n1fk.onrender.com${selectedFriend.profileImage}`} 
                      alt={selectedFriend.username}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    selectedFriend.username?.charAt(0).toUpperCase()
                  )}
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
                messages.map(message => {
                    const senderId = message.sender?._id || message.sender;
                    const isSent = senderId === user.id || senderId === user._id;
                    return (
                      <div
                        key={message._id}
                        className={`message ${isSent ? 'sent' : 'received'}`}
                      >
                    {message.type === 'session_invite' ? (
                      <div className="session-invite-message">
                        <p className="session-text">
                          {message.sender?.username || message.sessionData?.hostUsername || 'Someone'} is listening to {message.sessionData?.songName || 'a song'}
                        </p>
                        {message.sender?._id !== user.id && message.sender !== user.id && (
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
                <label>Select Your Playlist</label>
                <select
                  value={selectedPlaylist}
                  onChange={(e) => setSelectedPlaylist(e.target.value)}
                >
                  <option value="">Select a playlist...</option>
                  {userPlaylists.map(playlist => (
                    <option key={playlist._id} value={playlist._id}>
                      {playlist.title || playlist.name} ({playlist.tracks?.length || 0} tracks)
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="session-form-actions">
                <button className="btn-secondary" onClick={() => {
                  setShowSessionModal(false);
                  setSelectedPlaylist('');
                }}>
                  Cancel
                </button>
                <button 
                  className="btn-primary"
                  onClick={() => {
                    const playlist = userPlaylists.find(p => p._id === selectedPlaylist);
                    if (playlist) {
                      setSessionSongName(playlist.title || playlist.name);
                      setSessionSongUrl(playlist.tracks?.[0]?.youtubeUrl || '');
                      createSession();
                    }
                  }}
                  disabled={!selectedPlaylist}
                >
                  Create Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Session Panel */}
      {activeSession && (
        <div className="session-panel">
          <div className="session-panel-header">
            <h4>Listening Session</h4>
            <button className="session-close-btn" onClick={() => setActiveSession(null)}>×</button>
          </div>
          <div className="session-panel-content">
            <div className="session-track-info">
              <h5>{activeSession.songName || 'No track'}</h5>
              {activeSession.songUrl && (
                <a href={activeSession.songUrl} target="_blank" rel="noopener noreferrer" className="session-track-link">
                  Open in YouTube
                </a>
              )}
            </div>
            {sessionPlaylist && sessionPlaylist.tracks && (
              <div className="session-playlist">
                <h6>Playlist: {sessionPlaylist.title}</h6>
                <div className="session-tracks-list">
                  {sessionPlaylist.tracks.map((track, idx) => (
                    <div key={idx} className="session-track-item">
                      <span className="track-number">{idx + 1}</span>
                      <span className="track-title">{track.title || track.name}</span>
                      <span className="track-artist">{track.artist}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FriendsPage;
