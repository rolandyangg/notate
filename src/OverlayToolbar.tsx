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
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

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

  const handleButtonMouseEnter = (buttonName: string) => {
    console.log('handleButtonMouseEnter is called on', buttonName);
    setHoveredButton(buttonName);
  };

  const handleButtonMouseLeave = () => {
    console.log('handleButtonMouseLeave is called');
    setHoveredButton(null);
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
          overflow: 'visible', // Changed from 'hidden' to 'visible' to show tooltips
          transition: 'height 0.3s cubic-bezier(.4,0,.2,1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          position: 'relative',
        }}
      >
        <button
          onClick={handleCommentClick}
          onMouseEnter={() => handleButtonMouseEnter('comment')}
          onMouseLeave={handleButtonMouseLeave}
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
            position: 'relative', // Added for tooltip positioning
          }}
          aria-label="Comment mode"
        >
          <img src={commentIcon} alt="Comment" style={{ height: 20, objectFit: 'contain' }} />
          {hoveredButton === 'comment' && (
            <div 
              style={{
                position: 'absolute',
                right: '60px', // Changed from left: '-120px' to right: '60px'
                top: '50%',
                transform: 'translateY(-50%)', // Center vertically
                padding: '6px 12px',
                background: '#5A5A5A',
                color: 'white',
                borderRadius: '6px',
                fontSize: '12px',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                zIndex: 1300, // Increased z-index
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}>
              Click and drag to add comment <br /> Tab+C
              {/* Arrow pointing to the button */}
              <div style={{
                position: 'absolute',
                left: '100%',
                top: '50%',
                transform: 'translateY(-50%)',
                width: 0,
                height: 0,
                borderLeft: '6px solid #5A5A5A',
                borderTop: '6px solid transparent',
                borderBottom: '6px solid transparent',
              }} />
            </div>
          )}
        </button>
        <button
          onClick={handleTextboxClick}
          onMouseEnter={() => handleButtonMouseEnter('textbox')}
          onMouseLeave={handleButtonMouseLeave}
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
            position: 'relative', // Added for tooltip positioning
          }}
          aria-label="Textbox mode"
        >
          <img src={textboxIcon} alt="Textbox" style={{ height: 38, objectFit: 'contain' }} />
          {hoveredButton === 'textbox' && (
            <div 
              style={{
                position: 'absolute',
                right: '60px', // Changed from left: '-120px' to right: '60px'
                top: '50%',
                transform: 'translateY(-50%)', // Center vertically
                padding: '6px 12px',
                background: '#5A5A5A',
                color: 'white',
                borderRadius: '6px',
                fontSize: '12px',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                zIndex: 1300, // Increased z-index
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}>
              Click to add textbox <br /> Tab+T
              {/* Arrow pointing to the button */}
              <div style={{
                position: 'absolute',
                left: '100%',
                top: '50%',
                transform: 'translateY(-50%)',
                width: 0,
                height: 0,
                borderLeft: '6px solid #5A5A5A',
                borderTop: '6px solid transparent',
                borderBottom: '6px solid transparent',
              }} />
            </div>
          )}
        </button>
        <button
          onClick={handleScribbleClick}
          onMouseEnter={() => handleButtonMouseEnter('scribble')}
          onMouseLeave={handleButtonMouseLeave}
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
            position: 'relative', // Added for tooltip positioning
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
          {hoveredButton === 'scribble' && (
            <div 
              style={{
                position: 'absolute',
                right: '60px', // Changed from left: '-120px' to right: '60px'
                top: '50%',
                transform: 'translateY(-50%)', // Center vertically
                padding: '6px 12px',
                background: '#5A5A5A',
                color: 'white',
                borderRadius: '6px',
                fontSize: '12px',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                zIndex: 1300, // Increased z-index
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}>
              Add scribble <br /> Tab+S
              {/* Arrow pointing to the button */}
              <div style={{
                position: 'absolute',
                left: '100%',
                top: '50%',
                transform: 'translateY(-50%)',
                width: 0,
                height: 0,
                borderLeft: '6px solid #5A5A5A',
                borderTop: '6px solid transparent',
                borderBottom: '6px solid transparent',
              }} />
            </div>
          )}
        </button>
      </div>
    </div>
  );
};