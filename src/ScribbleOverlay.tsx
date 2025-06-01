import React, { useState, useRef, useEffect } from 'react';

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

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || !isScribbleMode) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();

    setLastX(x);
    setLastY(y);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.closePath();
    }
    
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999,
        cursor: isScribbleMode ? 'crosshair' : 'default',
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
        }}
      />
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
            Draw anywhere on the screen
          </div>
          <button
            onClick={clearCanvas}
            style={{
              position: 'fixed',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '8px 16px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              pointerEvents: 'auto',
            }}
          >
            Clear Drawing
          </button>
        </>
      )}
    </div>
  );
}; 