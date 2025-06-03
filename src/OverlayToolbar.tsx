import React, { useState } from 'react';
import annotateIcon from './assets/annotate-icon.png';
import commentIcon from './assets/comment-icon.png';
import textboxIcon from './assets/textbox-icon.png';
import commentIconWhite from './assets/comment-white.png';
import textboxIconWhite from './assets/textbox-white.png';
import scribbleIcon from './assets/scribble-icon.png';

interface OverlayToolbarProps {
  mode: 'comment-mode' | 'textbox-mode' | 'scribble-mode' | 'no-annotation-mode';
  setMode: (mode: 'comment-mode' | 'textbox-mode' | 'scribble-mode' | 'no-annotation-mode') => void;
}

export const OverlayToolbar: React.FC<OverlayToolbarProps> = ({ mode, setMode }) => {
  const [expanded, setExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handlePencilClick = () => {
    if (expanded) {
      setExpanded(false);
      setIsHovered(false);
    } else {
      setExpanded(true);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleCommentClick = () => {
    setMode(mode === 'comment-mode' ? 'no-annotation-mode' : 'comment-mode');
  };

  const handleTextboxClick = () => {
    setMode(mode === 'textbox-mode' ? 'no-annotation-mode' : 'textbox-mode');
  };

  const handleScribbleClick = () => {
    setMode(mode === 'scribble-mode' ? 'no-annotation-mode' : 'scribble-mode');
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
        gap: expanded || isHovered ? 6 : 0,
        transition: 'gap 0.2s',
        width: 56,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={handlePencilClick}
        style={{
          background: '#5A5A5A',
          border: 'none',
          padding: 0,
          marginBottom: expanded || isHovered ? 8 : 0,
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
        {(mode === 'comment-mode' && !expanded && !isHovered) ? (
          <img src={commentIconWhite} alt="Comment" style={{ height: 20, objectFit: 'contain' }} />
        ) : (mode === 'textbox-mode' && !expanded && !isHovered) ? (
          <img src={textboxIconWhite} alt="Textbox" style={{ height: 38, objectFit: 'contain' }} />
        ) : (mode === 'scribble-mode' && !expanded && !isHovered) ? (
          <img 
            src={scribbleIcon} 
            alt="Scribble" 
            style={{ 
              height: 28, 
              objectFit: 'contain',
              filter: 'invert(1)'
            }} 
          />
        ) : (
          <img src={annotateIcon} alt="Annotate" style={{ height: 28, objectFit: 'contain' }} />
        )}
      </button>
      <div
        style={{
          height: expanded || isHovered ? 180 : 0,
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
            opacity: expanded || isHovered ? 1 : 0,
            transform: expanded || isHovered ? 'scaleY(1)' : 'scaleY(0.8)',
            pointerEvents: expanded || isHovered ? 'auto' : 'none',
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
            opacity: expanded || isHovered ? 1 : 0,
            transform: expanded || isHovered ? 'scaleY(1)' : 'scaleY(0.8)',
            pointerEvents: expanded || isHovered ? 'auto' : 'none',
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
        <button
          onClick={handleScribbleClick}
          style={{
            opacity: expanded || isHovered ? 1 : 0,
            transform: expanded || isHovered ? 'scaleY(1)' : 'scaleY(0.8)',
            pointerEvents: expanded || isHovered ? 'auto' : 'none',
            transition: 'opacity 0.2s, transform 0.2s',
            background: mode === 'scribble-mode' ? '#e0e0e0' : 'none',
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
          aria-label="Scribble mode"
        >
          <img 
            src={scribbleIcon} 
            alt="Scribble" 
            style={{ 
              height: 28, 
              objectFit: 'contain',
              filter: mode === 'scribble-mode' ? 'brightness(0) saturate(100%) invert(37%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(90%) contrast(90%)' : 'none'
            }} 
          />
        </button>
      </div>
    </div>
  );
}; 