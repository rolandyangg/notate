import React, { useState } from 'react';
import annotateIcon from './assets/annotate-icon.png';
import commentIcon from './assets/comment-icon.png';
import textboxIcon from './assets/textbox-icon.png';

interface OverlayToolbarProps {
  mode: 'comment-mode' | 'textbox-mode' | 'no-annotation-mode';
  setMode: (mode: 'comment-mode' | 'textbox-mode' | 'no-annotation-mode') => void;
}

export const OverlayToolbar: React.FC<OverlayToolbarProps> = ({ mode, setMode }) => {
  const [expanded, setExpanded] = useState(false);

  const handlePencilClick = () => {
    setExpanded((prev) => !prev);
  };

  const handleCommentClick = () => {
    setMode(mode === 'comment-mode' ? 'no-annotation-mode' : 'comment-mode');
  };

  const handleTextboxClick = () => {
    setMode(mode === 'textbox-mode' ? 'no-annotation-mode' : 'textbox-mode');
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 24,
        right: 24,
        zIndex: 1200,
        background: '#fff',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
        padding: '0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: expanded ? 6 : 0,
        transition: 'gap 0.2s',
        width: 56,
      }}
    >
      <button
        onClick={handlePencilClick}
        style={{
          background: '#5A5A5A',
          border: 'none',
          padding: 0,
          marginBottom: expanded ? 8 : 0,
          cursor: 'pointer',
          outline: 'none',
          borderRadius: '12px',
          width: 56,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'box-shadow 0.2s',
        }}
        aria-label="Expand annotation menu"
      >
        <img src={annotateIcon} alt="Annotate" style={{ height: 28, objectFit: 'contain' }} />
      </button>
      <div
        style={{
          height: expanded ? 120 : 0,
          overflow: 'hidden',
          transition: 'height 0.3s cubic-bezier(.4,0,.2,1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <button
          onClick={handleCommentClick}
          style={{
            opacity: expanded ? 1 : 0,
            transform: expanded ? 'scaleY(1)' : 'scaleY(0.8)',
            pointerEvents: expanded ? 'auto' : 'none',
            transition: 'opacity 0.2s, transform 0.2s',
            background: mode === 'comment-mode' ? '#e0e0e0' : 'none',
            border: 'none',
            padding: 0,
            margin: 0,
            cursor: 'pointer',
            outline: 'none',
            borderRadius: '12px',
            width: 50,
            height: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Comment mode"
        >
          <img src={commentIcon} alt="Comment" style={{ height: 20, objectFit: 'contain' }} />
        </button>
        <button
          onClick={handleTextboxClick}
          style={{
            opacity: expanded ? 1 : 0,
            transform: expanded ? 'scaleY(1)' : 'scaleY(0.8)',
            pointerEvents: expanded ? 'auto' : 'none',
            transition: 'opacity 0.2s, transform 0.2s',
            background: mode === 'textbox-mode' ? '#e0e0e0' : 'none',
            border: 'none',
            padding: 0,
            margin: 0,
            cursor: 'pointer',
            outline: 'none',
            borderRadius: '12px',
            width: 50,
            height: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Textbox mode"
        >
          <img src={textboxIcon} alt="Textbox" style={{ height: 38, objectFit: 'contain' }} />
        </button>
      </div>
    </div>
  );
}; 