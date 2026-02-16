import React, { useState, useEffect } from 'react';
import { getUserBoards, addItemToBoard, createBoard } from '../services/socialService';
import './SaveToBoard.css';

function SaveToBoard({ isOpen, onClose, track, currentUser }) {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      fetchBoards();
    }
  }, [isOpen, currentUser]);

  const fetchBoards = async () => {
    try {
      setLoading(true);
      const result = await getUserBoards();
      setBoards(result.boards || []);
      setError(null);
    } catch (err) {
      setError('Failed to load boards');
      console.error('Error fetching boards:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToBoard = async (boardId) => {
    if (!track) return;

    setSaving(true);
    try {
      await addItemToBoard(boardId, {
        itemType: 'track',
        itemId: track.id.toString(),
        title: track.title,
        artist: track.artist,
        coverArt: track.image,
        source: 'vibesync'
      });
      
      onClose();
    } catch (err) {
      setError('Failed to save to board');
      console.error('Error saving to board:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;

    setCreating(true);
    try {
      const result = await createBoard({
        name: newBoardName.trim(),
        description: '',
        type: 'music',
        isPublic: true
      });

      if (result.board) {
        setBoards(prev => [result.board, ...prev]);
        setNewBoardName('');
        setCreating(false);
      }
    } catch (err) {
      setError('Failed to create board');
      console.error('Error creating board:', err);
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="save-to-board-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="save-to-board-modal">
        <div className="save-to-board-header">
          <h3>Save to Board</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {track && (
          <div className="save-to-board-track">
            <img src={track.image} alt={track.title} className="track-thumb" />
            <div className="track-info">
              <h4>{track.title}</h4>
              <p>{track.artist}</p>
            </div>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <form className="create-board-form" onSubmit={handleCreateBoard}>
          <input
            type="text"
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            placeholder="Create new board..."
            className="create-board-input"
          />
          <button 
            type="submit" 
            className="create-board-btn"
            disabled={creating || !newBoardName.trim()}
          >
            {creating ? '...' : 'Create'}
          </button>
        </form>

        <div className="boards-list">
          {loading ? (
            <div className="loading">Loading boards...</div>
          ) : boards.length === 0 ? (
            <div className="no-boards">
              <p>No boards yet</p>
              <p className="hint">Create your first board above</p>
            </div>
          ) : (
            boards.map(board => (
              <button
                key={board._id}
                className="board-item"
                onClick={() => handleSaveToBoard(board._id)}
                disabled={saving}
              >
                <div className="board-cover">
                  {board.coverImage ? (
                    <img src={board.coverImage} alt={board.name} />
                  ) : (
                    <div className="board-placeholder">
                      {(board.items?.length || 0) > 0 ? '🎵' : '📁'}
                    </div>
                  )}
                </div>
                <div className="board-info">
                  <h5>{board.name}</h5>
                  <p>{board.items?.length || 0} items</p>
                </div>
                <span className="save-icon">+</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default SaveToBoard;
