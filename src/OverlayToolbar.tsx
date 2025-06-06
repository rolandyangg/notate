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
    setHoveredButton(buttonName);
  };

  const handleButtonMouseLeave = () => {
    setHoveredButton(null);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 24,
        right: 24,
        zIndex: 1200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: expanded || isHovered ? 10 : 0,
        transition: 'gap 0.2s',
        width: 56,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={handlePencilClick}
        onMouseEnter={() => handleButtonMouseEnter('menu')}
        onMouseLeave={handleButtonMouseLeave}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          marginBottom: 0,
          cursor: 'pointer',
          outline: 'none',
          borderRadius: expanded || isHovered ? '12px 12px 0 0' : '12px',
          width: 56,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
          backgroundColor: '#fff',
          transition: 'all 0.2s',
          position: 'relative',
          zIndex: 2,
        }}
        aria-label="Expand annotation menu"
      >
        {(mode === 'comment-mode' && !expanded && !isHovered) ? (
          <img src={commentIcon} alt="Comment" style={{ height: 20, objectFit: 'contain' }} />
        ) : (mode === 'textbox-mode' && !expanded && !isHovered) ? (
          <img src={textboxIcon} alt="Textbox" style={{ height: 38, objectFit: 'contain' }} />
        ) : (mode === 'scribble-mode' && !expanded && !isHovered) ? (
          <img 
            src={scribbleIcon} 
            alt="Scribble" 
            style={{ 
              height: 28, 
              objectFit: 'contain',
            }} 
          />
        ) : (
          <img 
            src={annotateIcon} 
            alt="Annotate" 
            style={{ 
              height: 28, 
              objectFit: 'contain',
              filter: 'brightness(0) saturate(100%) invert(35%) sepia(0%) saturate(0%) hue-rotate(147deg) brightness(97%) contrast(92%)'
            }} 
          />
        )}
        {hoveredButton === 'menu' && (
          <div 
            style={{
              position: 'absolute',
              right: '60px',
              top: '50%',
              transform: 'translateY(-50%)',
              padding: '6px 12px',
              background: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              fontWeight: 500,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: 1300,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}>
            Annotation Menu
            <div style={{
              position: 'absolute',
              left: '100%',
              top: '50%',
              transform: 'translateY(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid rgba(0, 0, 0, 0.8)',
              borderTop: '6px solid transparent',
              borderBottom: '6px solid transparent',
            }} />
          </div>
        )}
      </button>
      <div
        style={{
          position: 'relative',
          width: '100%',
          marginTop: -56,
        }}
      >
        {(expanded || isHovered) && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 56,
              height: '100%',
              backgroundColor: '#E0E0E0',
              zIndex: 1,
              borderRadius: '12px',
            }}
          />
        )}
        <div
          style={{
            height: expanded || isHovered ? 'auto' : 0,
            overflow: 'visible',
            transition: 'height 0.3s cubic-bezier(.4,0,.2,1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            position: 'relative',
            paddingTop: 56,
            paddingBottom: expanded || isHovered ? 30 : 0,
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
              background: 'none',
              border: 'none',
              padding: 0,
              margin: 0,
              cursor: 'pointer',
              outline: 'none',
              borderRadius: '12px',
              width: 56,
              height: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
              backgroundColor: mode === 'comment-mode' ? '#5A5A5A' : '#fff',
              position: 'relative',
              zIndex: 2,
            }}
            aria-label="Comment mode"
          >
            <img 
              src={mode === 'comment-mode' ? commentIconWhite : commentIcon} 
              alt="Comment" 
              style={{ height: 20, objectFit: 'contain' }} 
            />
            {hoveredButton === 'comment' && (
              <div 
                style={{
                  position: 'absolute',
                  right: '60px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: '6px 12px',
                  background: 'rgba(0, 0, 0, 0.8)',
                  color: 'white',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  zIndex: 1300,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}>
                Click and drag to add comment <br /> Tab+C
                <div style={{
                  position: 'absolute',
                  left: '100%',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '6px solid rgba(0, 0, 0, 0.8)',
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
              background: 'none',
              border: 'none',
              padding: 0,
              margin: 0,
              cursor: 'pointer',
              outline: 'none',
              borderRadius: '12px',
              width: 56,
              height: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
              backgroundColor: mode === 'textbox-mode' ? '#5A5A5A' : '#fff',
              position: 'relative',
              zIndex: 2,
            }}
            aria-label="Textbox mode"
          >
            <img 
              src={mode === 'textbox-mode' ? textboxIconWhite : textboxIcon} 
              alt="Textbox" 
              style={{ height: 38, objectFit: 'contain' }} 
            />
            {hoveredButton === 'textbox' && (
              <div 
                style={{
                  position: 'absolute',
                  right: '60px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: '6px 12px',
                  background: 'rgba(0, 0, 0, 0.8)',
                  color: 'white',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  zIndex: 1300,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}>
                Click to add textbox <br /> Tab+T
                <div style={{
                  position: 'absolute',
                  left: '100%',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '6px solid rgba(0, 0, 0, 0.8)',
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
              background: 'none',
              border: 'none',
              padding: 0,
              margin: 0,
              cursor: 'pointer',
              outline: 'none',
              borderRadius: '12px',
              width: 56,
              height: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
              backgroundColor: mode === 'scribble-mode' ? '#5A5A5A' : '#fff',
              position: 'relative',
              zIndex: 2,
            }}
            aria-label="Scribble mode"
          >
            <img 
              src={scribbleIcon} 
              alt="Scribble" 
              style={{ 
                height: 28, 
                objectFit: 'contain',
                filter: mode === 'scribble-mode' ? 'invert(1)' : 'none'
              }} 
            />
            {hoveredButton === 'scribble' && (
              <div 
                style={{
                  position: 'absolute',
                  right: '60px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: '6px 12px',
                  background: 'rgba(0, 0, 0, 0.8)',
                  color: 'white',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  zIndex: 1300,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}>
                Add scribble <br /> Tab+S
                <div style={{
                  position: 'absolute',
                  left: '100%',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '6px solid rgba(0, 0, 0, 0.8)',
                  borderTop: '6px solid transparent',
                  borderBottom: '6px solid transparent',
                }} />
              </div>
            )}
          </button>
          {(expanded || isHovered) && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 56,
                height: 28,
                backgroundColor: '#E0E0E0',
                borderRadius: '0 0 28px 28px',
                zIndex: 1,
                boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};