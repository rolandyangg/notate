import React, { useState, useRef, useEffect } from 'react';
import { HiPencil, HiOutlineTrash } from 'react-icons/hi';
import eraserIcon from './assets/eraser.svg';

interface ScribbleOverlayProps {
  isScribbleMode: boolean;
  setIsScribbleMode: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ScribbleOverlay = ({
  isScribbleMode,
  setIsScribbleMode
}: ScribbleOverlayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEraser, setIsEraser] = useState(false);
  const [isSpaceHeld, setIsSpaceHeld] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [backgroundState, setBackgroundState] = useState(false); // false = draw, true = erase
  const [strokeColor, setStrokeColor] = useState('#5A5A5A');
  const isMouseDown = useRef(false);
  const didDrawInStroke = useRef(false);

  // Initialize canvas once on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Set the canvas size accounting for device pixel ratio
      canvas.width = width * dpr;
      canvas.height = height * dpr;

      // Scale the context to match the device pixel ratio
      ctx.scale(dpr, dpr);

      // Set default drawing style
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };

    // Initial setup
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []); // Empty dependency array means this runs once on mount

  // Add spacebar and E key handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && isScribbleMode) {
        e.preventDefault();
        setIsSpaceHeld(true);
        setIsEraser(false);
      }
      if (e.code === "KeyE" && isScribbleMode) {
        e.preventDefault();
        setIsEraser(true);
        setIsSpaceHeld(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" && isScribbleMode) {
        e.preventDefault();
        setIsEraser(backgroundState);
        setIsSpaceHeld(false);
        stopDrawing();
      }
      if (e.code === "KeyE" && isScribbleMode) {
        e.preventDefault();
        setIsEraser(backgroundState);
        setIsSpaceHeld(false);
        stopDrawing();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isDrawing, isMouseDown]);

  // KeyBindings
  useEffect(() => {
    let isTabPressed = false;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Tab') {
        e.preventDefault();
        isTabPressed = true;
        return;
      }
      
      if (isTabPressed && e.code === 'KeyS') {
        e.preventDefault();
        setIsScribbleMode(prev => !prev);
      }
      
      if ((e.key === 'Escape' || e.code === 'Escape') && isScribbleMode) {
        e.preventDefault();
        setIsScribbleMode(false);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Tab') {
        isTabPressed = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isScribbleMode, setIsScribbleMode]);

  const startDrawing = (e: React.MouseEvent) => {
    if (!isScribbleMode) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    isMouseDown.current = true;
    didDrawInStroke.current = false;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      if (isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = 20;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineWidth = 2;
        ctx.strokeStyle = strokeColor;
      }
    }
  };

  const draw = (e: React.MouseEvent) => {
    if (!isScribbleMode) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Only start a stroke when spacebar is currently held or mouse is down
    const shouldStartStroke = (isSpaceHeld || isMouseDown.current) && !isDrawing;

    if (shouldStartStroke) {
      startDrawing(e);
      return;
    }

    if (isDrawing && (isSpaceHeld || isMouseDown.current)) {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.lineTo(x, y);
      ctx.stroke();
      didDrawInStroke.current = true;
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.closePath();
      ctx.globalCompositeOperation = 'source-over';
    }
    
    setIsDrawing(false);
    isMouseDown.current = false;
    didDrawInStroke.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Track mouse position
  useEffect(() => {
    if (!isScribbleMode) return;

    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isScribbleMode]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999,
        cursor: isScribbleMode ? (isEraser ? 'none' : 'crosshair') : 'default',
        pointerEvents: isScribbleMode ? 'auto' : 'none',
        backgroundColor: isScribbleMode ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: isScribbleMode ? 'auto' : 'none',
          cursor: isScribbleMode ? (isEraser ? 'none' : 'crosshair') : 'default',
        }}
      />
      {isScribbleMode && isEraser && (
        <div
          style={{
            position: 'fixed',
            width: '20px',
            height: '20px',
            pointerEvents: 'none',
            zIndex: 1000,
            transform: 'translate(-50%, -50%)',
            left: `${cursorPosition.x}px`,
            top: `${cursorPosition.y}px`,
          }}
        >
          <img 
            src={eraserIcon} 
            alt="Eraser cursor" 
            style={{ 
              width: '100%',
              height: '100%',
            }} 
          />
        </div>
      )}
      {isScribbleMode && (
        <>
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '4px',
              pointerEvents: 'none',
            }}
          >
            {isEraser ? 'Erase anywhere on the screen' : 'Draw anywhere on the screen'}
          </div>
          <div
            style={{
              position: 'fixed',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '20px',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                backgroundColor: '#f0f0f0',
                borderRadius: '8px',
                padding: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              <button
                onClick={() => {
                  setIsEraser(false);
                  setBackgroundState(false);
                }}
                style={{
                  padding: '8px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: !isEraser ? '#e0e0e0' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s',
                }}
              >
                <HiPencil size={24} color={!isEraser ? '#2196F3' : '#5A5A5A'} />
              </button>
              <button
                onClick={() => {
                  setIsEraser(true);
                  setBackgroundState(true);
                }}
                style={{
                  padding: '8px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: isEraser ? '#e0e0e0' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s',
                }}
              >
                <img 
                  src={eraserIcon} 
                  alt="Eraser" 
                  style={{ 
                    width: '24px', 
                    height: '24px',
                    opacity: isEraser ? 1 : 0.5,
                    filter: isEraser ? 'invert(45%) sepia(82%) saturate(1742%) hue-rotate(187deg) brightness(101%) contrast(101%)' : 'grayscale(100%)',
                  }} 
                />
              </button>
            </div>
            <div
              style={{
                display: 'flex',
                backgroundColor: '#f0f0f0',
                borderRadius: '8px',
                padding: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              <button
                onClick={() => setStrokeColor('#5A5A5A')}
                style={{
                  padding: '8px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: strokeColor === '#5A5A5A' ? '#e0e0e0' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s',
                }}
              >
                <div style={{ width: '24px', height: '24px', backgroundColor: '#5A5A5A', borderRadius: '50%' }} />
              </button>
              <button
                onClick={() => setStrokeColor('#FF0000')}
                style={{
                  padding: '8px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: strokeColor === '#FF0000' ? '#e0e0e0' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s',
                }}
              >
                <div style={{ width: '24px', height: '24px', backgroundColor: '#FF0000', borderRadius: '50%' }} />
              </button>
              <button
                onClick={() => setStrokeColor('#2196F3')}
                style={{
                  padding: '8px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: strokeColor === '#2196F3' ? '#e0e0e0' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s',
                }}
              >
                <div style={{ width: '24px', height: '24px', backgroundColor: '#2196F3', borderRadius: '50%' }} />
              </button>
            </div>
            <button
              onClick={clearCanvas}
              style={{
                padding: '8px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '44px',
                height: '44px',
              }}
            >
              <HiOutlineTrash size={24} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}; 