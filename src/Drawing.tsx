import {
  createReactBlockSpec,
  type ReactCustomBlockImplementation,
} from "@blocknote/react";
import React, { useEffect, useRef, useState } from "react";
import rough from "roughjs/bin/rough";
import { 
  FaPen, 
  FaMinus, 
  FaLongArrowAltRight, 
  FaSquare, 
  FaCircle, 
  FaFont,
  FaUndo,
  FaRedo,
  FaEraser
} from "react-icons/fa";

const drawingBlockSpec = {
  type: "drawing",
  propSchema: {},
  content: "none" as const,
};

interface TextElement {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
  isEditing: boolean;
  isSelected: boolean;
}

export const DrawingCanvas = ({ backgroundImage }: { backgroundImage?: string }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const roughCanvasRef = useRef<ReturnType<typeof rough.canvas> | null>(null);
    const isDrawing = useRef(false);
    const isMouseDown = useRef(false);
    const didDrawInStroke = useRef(false);
    const startX = useRef(0);
    const startY = useRef(0);
    const currentX = useRef(0);
    const currentY = useRef(0);
    const lastSavedSnapshot = useRef<string>("");
    const containerRef = useRef<HTMLDivElement>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);

  
    const [isSpaceHeld, setIsSpaceHeld] = useState(false);
    const [size, setSize] = useState({ width: 800, height: 400 });
    const [brushColor, setBrushColor] = useState("#333");
    const [brushSize, setBrushSize] = useState(2);
    const [tool, setTool] = useState("pen");
    const [isHovered, setIsHovered] = useState(false);
    const [isCanvasFocused, setIsCanvasFocused] = useState(false);
    const [fontSize, setFontSize] = useState(16);

  
    const undoStack = useRef<string[]>([]);
    const redoStack = useRef<string[]>([]);
    const [textElements, setTextElements] = useState<TextElement[]>([]);
    const [activeTextInput, setActiveTextInput] = useState<{x: number; y: number} | null>(null);
    const [textInputValue, setTextInputValue] = useState('');
    const [selectedText, setSelectedText] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const dragStart = useRef<{x: number; y: number}>({ x: 0, y: 0 });
    const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
          if (
            containerRef.current?.contains(e.target as Node) ||
            toolbarRef.current?.contains(e.target as Node)
          ) {
            setIsHovered(true);
          } else {
            setIsHovered(false);
          }
        };
      
        document.addEventListener("mousedown", handleClick);
        return () => {
          document.removeEventListener("mousedown", handleClick);
        };
      }, []);
      
  
      useEffect(() => {
        if (canvasRef.current) {
          roughCanvasRef.current = rough.canvas(canvasRef.current);
          const ctx = canvasRef.current.getContext("2d")!;
      
          if (backgroundImage) {
            setBrushColor("#ff0000"); // ✅ Set brush to red
      
            const img = new Image();
            img.onload = () => {
              const newSize = {
                width: img.naturalWidth,
                height: img.naturalHeight,
              };
              setSize(newSize);
              setTimeout(() => {
                ctx.clearRect(0, 0, newSize.width, newSize.height);
                ctx.drawImage(img, 0, 0, newSize.width, newSize.height);
                saveState();
              }, 0);
            };
            img.src = backgroundImage;
          } else {
            saveState();
          }
        }
      }, [backgroundImage]);
      
  
    const saveState = () => {
      if (!canvasRef.current) return;

      // Always render text to temporary canvas to ensure proper state saving
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvasRef.current.width;
      tempCanvas.height = canvasRef.current.height;
      const tempCtx = tempCanvas.getContext('2d')!;
      
      // Copy current canvas state
      tempCtx.drawImage(canvasRef.current, 0, 0);
      
      // If using text tool, render current text elements
      if (tool === 'text' && textElements.length > 0) {
        textElements.forEach(element => {
          tempCtx.font = `${element.fontSize}px Arial`;
          tempCtx.fillStyle = element.color;
          tempCtx.fillText(element.text, element.x, element.y);
        });
      }
      
      const dataURL = tempCanvas.toDataURL();
      if (dataURL && undoStack.current[undoStack.current.length - 1] !== dataURL) {
        undoStack.current.push(dataURL);
        redoStack.current = [];
        lastSavedSnapshot.current = dataURL;
      }
    };
  
    const restoreState = (dataURL: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d")!;
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = dataURL;
    };
  
    const handleUndo = () => {
      if (undoStack.current.length < 2) return;
      if (tool === 'text') {
        renderTextToCanvas();
        setTextElements([]);
      }
      const current = undoStack.current.pop();
      if (current) redoStack.current.push(current);
      restoreState(undoStack.current[undoStack.current.length - 1]);
      lastSavedSnapshot.current = undoStack.current[undoStack.current.length - 1];
    };
  
    const handleRedo = () => {
      if (redoStack.current.length === 0) return;
      if (tool === 'text') {
        renderTextToCanvas();
        setTextElements([]);
      }
      const next = redoStack.current.pop()!;
      undoStack.current.push(next);
      restoreState(next);
      lastSavedSnapshot.current = next;
    };
  
    const handleClearCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      saveState();
    };
  
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
          if (!(isHovered || isCanvasFocused)) return;
      
          const isInput = ["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName);
          if (!isInput && (e.ctrlKey || e.metaKey) && e.code === "KeyZ") {
            e.preventDefault();
            if (e.shiftKey) {
              handleRedo();
            } else {
              handleUndo();
            }
          }
        };
      
        document.addEventListener("keydown", handler, true);
        return () => {
          document.removeEventListener("keydown", handler, true);
        };
      }, [isHovered, isCanvasFocused]);
      
      
  
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === "Space") {
          e.preventDefault();
          setIsSpaceHeld(true);
        }
      };
      const handleKeyUp = (e: KeyboardEvent) => {
        if (e.code === "Space") {
          e.preventDefault();
          setIsSpaceHeld(false);
          // if ((tool === "line" || tool === "rect" || tool === "ellipse") && isDrawing.current) {
          //   stopDrawing();
          // }
          stopDrawing(); 
        }
      };
  
      const canvas = canvasRef.current;
      if (!canvas) return;
  
      const handleMouseEnter = () => {
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
      };
  
      const handleMouseLeave = () => {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
        setIsSpaceHeld(false);
        stopDrawing();
      };
  
      canvas.addEventListener("mouseenter", handleMouseEnter);
      canvas.addEventListener("mouseleave", handleMouseLeave);
  
      return () => {
        canvas.removeEventListener("mouseenter", handleMouseEnter);
        canvas.removeEventListener("mouseleave", handleMouseLeave);
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
      };
    }, [tool]);
  
    const startDrawing = (x: number, y: number) => {
      startX.current = x;
      startY.current = y;
      currentX.current = x;
      currentY.current = y;
      isDrawing.current = true;
      didDrawInStroke.current = false;
    };
  
    // Add arrow drawing function
    const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, color: string, lineWidth: number) => {
      // Calculate proportional measurements based on line width
      const headLength = lineWidth * 4; // Length of arrow head scales with line width
      const headWidth = Math.PI / 6; // 30 degrees angle for arrow head
      
      const angle = Math.atan2(toY - fromY, toX - fromX);
      
      // Draw the main line
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
      
      // Calculate arrow head points
      const tip = { x: toX, y: toY };
      const left = {
        x: toX - headLength * Math.cos(angle - headWidth),
        y: toY - headLength * Math.sin(angle - headWidth)
      };
      const right = {
        x: toX - headLength * Math.cos(angle + headWidth),
        y: toY - headLength * Math.sin(angle + headWidth)
      };
      
      // Draw the arrow head
      ctx.beginPath();
      ctx.moveTo(tip.x, tip.y);
      ctx.lineTo(left.x, left.y);
      ctx.lineTo(right.x, right.y);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      
      // Draw outline for the arrow head to match line thickness
      ctx.beginPath();
      ctx.moveTo(tip.x, tip.y);
      ctx.lineTo(left.x, left.y);
      ctx.lineTo(right.x, right.y);
      ctx.closePath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth / 2;
      ctx.stroke();
    };

    const draw = (x: number, y: number) => {
      if (!isDrawing.current || !roughCanvasRef.current) return;
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      const rc = roughCanvasRef.current;

      currentX.current = x;
      currentY.current = y;

      if (tool === 'pen') {
        rc.line(startX.current, startY.current, x, y, {
          stroke: brushColor,
          strokeWidth: brushSize,
        });
        startX.current = x;
        startY.current = y;
        didDrawInStroke.current = true;
      } else {
        // Restore the last saved snapshot
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          if (tool === 'line') {
            rc.line(startX.current, startY.current, currentX.current, currentY.current, {
              stroke: brushColor,
              strokeWidth: brushSize,
            });
          } else if (tool === 'arrow') {
            drawArrow(
              ctx,
              startX.current,
              startY.current,
              currentX.current,
              currentY.current,
              brushColor,
              brushSize
            );
          } else if (tool === 'rect') {
            const width = currentX.current - startX.current;
            const height = currentY.current - startY.current;
            rc.rectangle(startX.current, startY.current, width, height, {
              stroke: brushColor,
              strokeWidth: brushSize,
            });
          } else if (tool === 'ellipse') {
            const cx = (startX.current + currentX.current) / 2;
            const cy = (startY.current + currentY.current) / 2;
            const rx = Math.abs(currentX.current - startX.current) / 2;
            const ry = Math.abs(currentY.current - startY.current) / 2;
            rc.ellipse(cx, cy, rx * 2, ry * 2, {
              stroke: brushColor,
              strokeWidth: brushSize,
            });
          }
        };
        img.src = lastSavedSnapshot.current;
      }
    };
      
  
    const stopDrawing = () => {
      if (!isDrawing.current || !roughCanvasRef.current) return;
      isDrawing.current = false;
      const rc = roughCanvasRef.current;
      const ctx = canvasRef.current!.getContext('2d')!;

      if (tool === 'line') {
        rc.line(startX.current, startY.current, currentX.current, currentY.current, {
          stroke: brushColor,
          strokeWidth: brushSize,
        });
      } else if (tool === 'arrow') {
        drawArrow(
          ctx,
          startX.current,
          startY.current,
          currentX.current,
          currentY.current,
          brushColor,
          brushSize
        );
      } else if (tool === 'rect') {
        const width = currentX.current - startX.current;
        const height = currentY.current - startY.current;
        rc.rectangle(startX.current, startY.current, width, height, {
          stroke: brushColor,
          strokeWidth: brushSize,
        });
      } else if (tool === 'ellipse') {
        const cx = (startX.current + currentX.current) / 2;
        const cy = (startY.current + currentY.current) / 2;
        const rx = Math.abs(currentX.current - startX.current) / 2;
        const ry = Math.abs(currentY.current - startY.current) / 2;
        rc.ellipse(cx, cy, rx * 2, ry * 2, {
          stroke: brushColor,
          strokeWidth: brushSize,
        });
      }
      if ((tool === 'line' || tool === 'rect' || tool === 'ellipse' || tool === 'arrow') || (tool === 'pen' && didDrawInStroke.current)) {
        saveState();
      }
    };
  
    const handleMouseDown = (e: React.MouseEvent) => {
      if (tool === 'text') return; // Don't start drawing if using text tool
      isMouseDown.current = true;
      const rect = canvasRef.current!.getBoundingClientRect();
      startDrawing(e.clientX - rect.left, e.clientY - rect.top);
    };
  
    const handleMouseMove = (e: React.MouseEvent) => {
      if (tool === 'text') return; // Don't handle drawing moves if using text tool
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Only start a stroke when spacebar is currently held or mouse is down
      const shouldStartStroke = (isSpaceHeld || isMouseDown.current) && !isDrawing.current;

      if (shouldStartStroke) {
        startDrawing(x, y);
        return;
      }

      if (isDrawing.current) {
        draw(x, y);
      }
    };

  
    const handleMouseUp = () => {
      isMouseDown.current = false;
      stopDrawing();
    };
  
    const handleResizeMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation(); // Stop event propagation
      const canvas = canvasRef.current!;
      const imageDataURL = canvas.toDataURL();
      const aspectRatio = size.width / size.height;
      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = size.width;

      // Create handlers outside of the resize div's scope
      const onMouseMove = (e: MouseEvent) => {
        const delta = Math.max(e.clientX - startX, e.clientY - startY);
        const newWidth = Math.max(100, startWidth + delta);
        const newHeight = newWidth / aspectRatio;

        setSize(() => {
          setTimeout(() => {
            const ctx = canvas.getContext("2d")!;
            const img = new Image();
            img.onload = () => {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, newWidth, newHeight);
            };
            img.src = imageDataURL;
          }, 0);
          return { width: newWidth, height: newHeight };
        });
      };

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        saveState(); // Save state after resize
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    };

    // Handle canvas click for text tool
    const handleCanvasClick = (e: React.MouseEvent) => {
      if (tool !== 'text') return;
      
      e.preventDefault();
      e.stopPropagation();

      // Get click coordinates relative to the container
      const rect = containerRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Define resize handle area (slightly larger than the visible handle for better UX)
      const resizeHandleArea = {
        right: size.width,
        bottom: size.height,
        width: 20, // Slightly larger than the visible 16px handle
        height: 20
      };

      // Check if click is in resize handle area
      const isInResizeArea = 
        x >= resizeHandleArea.right - resizeHandleArea.width && 
        y >= resizeHandleArea.bottom - resizeHandleArea.height;

      // Only create new text if not clicking in resize area
      if (!isInResizeArea) {
        // Deselect any selected text
        setTextElements(prev => prev.map(el => ({ ...el, isSelected: false })));
        setSelectedText(null);

        setActiveTextInput({ x, y });
        setTextInputValue('');
      }
    };

    // Handle text input completion
    const handleTextComplete = () => {
      if (!activeTextInput || !textInputValue.trim()) {
        setActiveTextInput(null);
        setTextInputValue('');
        return;
      }

      const newText: TextElement = {
        id: Date.now().toString(),
        x: activeTextInput.x,
        y: activeTextInput.y,
        text: textInputValue,
        fontSize,
        color: brushColor,
        isEditing: false,
        isSelected: false
      };

      setTextElements(prev => [...prev, newText]);
      setActiveTextInput(null);
      setTextInputValue('');
    };

    // Handle text element selection
    const handleTextClick = (e: React.MouseEvent, id: string) => {
      if (tool !== 'text') return;
      e.stopPropagation();
      
      setTextElements(prev => prev.map(el => ({
        ...el,
        isSelected: el.id === id
      })));
      setSelectedText(id);
    };

    // Handle text dragging
    const handleTextMouseDown = (e: React.MouseEvent, id: string) => {
      if (tool !== 'text') return;
      e.stopPropagation();

      const rect = canvasRef.current!.getBoundingClientRect();
      dragStart.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      setIsDragging(true);
      setSelectedText(id);
      setTextElements(prev => prev.map(el => ({
        ...el,
        isSelected: el.id === id
      })));
    };

    const handleTextMouseMove = (e: React.MouseEvent) => {
      if (!isDragging || !selectedText) return;

      const rect = canvasRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const dx = x - dragStart.current.x;
      const dy = y - dragStart.current.y;

      setTextElements(prev => prev.map(el => 
        el.id === selectedText
          ? {
              ...el,
              x: el.x + dx,
              y: el.y + dy
            }
          : el
      ));

      dragStart.current = { x, y };
    };

    // Handle text resizing
    const handleTextResize = (e: React.MouseEvent, id: string) => {
      if (tool !== 'text') return;
      e.stopPropagation();
      setIsResizing(true);
      setSelectedText(id);
    };

    const handleResizeMouseMove = (e: React.MouseEvent) => {
      if (!isResizing || !selectedText) return;

      const rect = canvasRef.current!.getBoundingClientRect();
      const y = e.clientY - rect.top;
      
      setTextElements(prev => prev.map(el => 
        el.id === selectedText
          ? {
              ...el,
              fontSize: Math.max(12, Math.abs(y - el.y) * 2)
            }
          : el
      ));
    };

    // Add event listeners for drag and resize
    useEffect(() => {
      const handleMouseUp = () => {
        setIsDragging(false);
        setIsResizing(false);
      };

      window.addEventListener('mouseup', handleMouseUp);
      return () => window.removeEventListener('mouseup', handleMouseUp);
    }, []);

    // Handle tool changes
    useEffect(() => {
      if (tool !== 'text') {
        // Create a temporary canvas to ensure proper rendering
        const tempCanvas = document.createElement('canvas');
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d')!;
        
        // Copy current canvas state
        tempCtx.drawImage(canvas, 0, 0);
        
        // Render text elements
        textElements.forEach(element => {
          tempCtx.font = `${element.fontSize}px Arial`;
          tempCtx.fillStyle = element.color;
          tempCtx.fillText(element.text, element.x, element.y);
        });
        
        // Copy back to main canvas
        const ctx = canvas.getContext('2d')!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(tempCanvas, 0, 0);
        
        // Save state and clear text elements
        const dataURL = canvas.toDataURL();
        if (dataURL && undoStack.current[undoStack.current.length - 1] !== dataURL) {
          undoStack.current.push(dataURL);
          redoStack.current = [];
          lastSavedSnapshot.current = dataURL;
        }
        
        setTextElements([]);
        setSelectedText(null);
        setActiveTextInput(null);
      }
    }, [tool]);

    // Modify the renderTextToCanvas function
    const renderTextToCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      // Create a temporary canvas
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d')!;
      
      // Copy current canvas state
      tempCtx.drawImage(canvas, 0, 0);
      
      // Render text elements
      textElements.forEach(element => {
        tempCtx.font = `${element.fontSize}px Arial`;
        tempCtx.fillStyle = element.color;
        // Adjust the text baseline to match the overlay positioning
        tempCtx.textBaseline = 'middle';
        tempCtx.fillText(element.text, element.x, element.y);
      });
      
      // Copy back to main canvas
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(tempCanvas, 0, 0);
    };

    // Handle text editing
    const startEditing = (id: string) => {
      if (tool !== 'text') return;
      setTextElements(prev => prev.map(el => ({
        ...el,
        isEditing: el.id === id,
        isSelected: el.id === id
      })));
      setSelectedText(id);
    };

    const handleTextEdit = (id: string, newText: string) => {
      setTextElements(prev => prev.map(el => 
        el.id === id
          ? {
              ...el,
              text: newText,
              isEditing: false
            }
          : el
      ));
    };

    // Handle tool changes
    useEffect(() => {
      if (tool !== 'text') {
        // Create a temporary canvas to ensure proper rendering
        const tempCanvas = document.createElement('canvas');
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d')!;
        
        // Copy current canvas state
        tempCtx.drawImage(canvas, 0, 0);
        
        // Render text elements
        textElements.forEach(element => {
          tempCtx.font = `${element.fontSize}px Arial`;
          tempCtx.fillStyle = element.color;
          tempCtx.fillText(element.text, element.x, element.y);
        });
        
        // Copy back to main canvas
        const ctx = canvas.getContext('2d')!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(tempCanvas, 0, 0);
        
        // Save state and clear text elements
        const dataURL = canvas.toDataURL();
        if (dataURL && undoStack.current[undoStack.current.length - 1] !== dataURL) {
          undoStack.current.push(dataURL);
          redoStack.current = [];
          lastSavedSnapshot.current = dataURL;
        }
        
        setTextElements([]);
        setSelectedText(null);
        setActiveTextInput(null);
      }
    }, [tool]);

    // Update toolbar position when canvas size changes
    useEffect(() => {
      const updateToolbarPosition = () => {
        if (canvasRef.current && containerRef.current) {
          const containerRect = containerRef.current.getBoundingClientRect();
          
          setToolbarPosition({
            top: containerRect.top,
            left: containerRect.left + (containerRect.width / 2)
          });
        }
      };

      // Initial position
      updateToolbarPosition();

      // Update position on resize
      const resizeObserver = new ResizeObserver(updateToolbarPosition);
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      // Update position on scroll
      const handleScroll = () => {
        updateToolbarPosition();
      };
      window.addEventListener('scroll', handleScroll);

      return () => {
        resizeObserver.disconnect();
        window.removeEventListener('scroll', handleScroll);
      };
    }, []);

  return (
    <div
      contentEditable={false}
      ref={containerRef}
      style={{
        position: "relative",
        display: "inline-block",
        border: "1px solid #ccc",
        width: size.width,
        height: size.height,
        overflow: "hidden"
      }}
      onMouseMove={(e) => {
        if (tool === 'text') {
          handleTextMouseMove(e);
          handleResizeMouseMove(e);
        }
      }}
    >
      {/* Text Layer */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: tool === 'text' ? 'auto' : 'none',
          zIndex: 1,
          overflow: 'visible',
          minWidth: size.width,
          minHeight: size.height
        }}
        onClick={handleCanvasClick}
      >
        {/* Existing Text Elements */}
        {textElements.map(element => (
          <div
            key={element.id}
            style={{
              position: 'absolute',
              left: Math.min(element.x, size.width - 20),
              top: element.y - (element.fontSize / 2),
              cursor: tool === 'text' ? 'move' : 'default',
              zIndex: 2,
            }}
            onClick={(e) => handleTextClick(e, element.id)}
            onMouseDown={(e) => handleTextMouseDown(e, element.id)}
          >
            <div
              style={{
                font: `${element.fontSize}px Arial`,
                color: element.color,
                userSelect: 'none',
                padding: '2px',
                whiteSpace: 'nowrap',
                border: element.isSelected ? '1px dashed #666' : 'none',
                position: 'relative',
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                startEditing(element.id);
              }}
            >
              {element.isEditing ? (
                <input
                  autoFocus
                  value={element.text}
                  onChange={(e) => {
                    setTextElements(prev => prev.map(el =>
                      el.id === element.id ? { ...el, text: e.target.value } : el
                    ));
                  }}
                  onBlur={() => handleTextEdit(element.id, element.text)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleTextEdit(element.id, element.text);
                    }
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    font: `${element.fontSize}px Arial`,
                    color: element.color,
                    padding: '2px',
                    margin: 0,
                    width: 'auto'
                  }}
                />
              ) : (
                <>
                  {element.text}
                  {element.isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: -10,
                        right: -10,
                        width: 10,
                        height: 10,
                        backgroundColor: '#666',
                        cursor: 'nwse-resize',
                        borderRadius: '50%',
                      }}
                      onMouseDown={(e) => handleTextResize(e, element.id)}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        ))}

        {/* Active Text Input */}
        {activeTextInput && (
          <div
            style={{
              position: 'absolute',
              left: Math.min(activeTextInput.x, size.width - 20),
              top: activeTextInput.y - (fontSize / 2),
              zIndex: 2,
            }}
          >
            <input
              autoFocus
              value={textInputValue}
              onChange={(e) => setTextInputValue(e.target.value)}
              onBlur={handleTextComplete}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleTextComplete();
                }
              }}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                font: `${fontSize}px Arial`,
                color: brushColor,
                padding: '2px',
                margin: 0,
                width: 'auto'
              }}
            />
          </div>
        )}
      </div>

      <canvas
        tabIndex={0}
        ref={canvasRef}
        onFocus={() => setIsCanvasFocused(true)}
        onBlur={() => setIsCanvasFocused(false)}
        width={size.width}
        height={size.height}
        style={{ 
          display: "block", 
          width: "100%", 
          height: "100%",
          pointerEvents: tool === 'text' ? 'none' : 'auto'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={stopDrawing}
      />

      {/* Modern resize handle */}
      <div
        onMouseDown={handleResizeMouseDown}
        style={{
          position: "absolute",
          right: 4,
          bottom: 4,
          width: 32,
          height: 32,
          cursor: "nwse-resize",
          zIndex: 3,
          pointerEvents: "auto",
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.2s ease',
          backgroundColor: 'transparent'
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
          }}
        >
          {/* Background circle for better visibility */}
          <circle
            cx="16"
            cy="16"
            r="16"
            fill="white"
            opacity="0.8"
          />
          
          {/* Main diagonal arrow line */}
          <line
            x1="8"
            y1="8"
            x2="24"
            y2="24"
            stroke="#666"
            strokeWidth="3"
          />
          
          {/* Arrow heads */}
          {/* Top-left arrow head */}
          <path
            d="M8,8 L8,14 L14,8 Z"
            fill="#666"
          />
          
          {/* Bottom-right arrow head */}
          <path
            d="M24,24 L18,24 L24,18 Z"
            fill="#666"
          />
        </svg>
      </div>
      {isHovered && (
        <div
          ref={toolbarRef}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            transform: `translate(calc(${toolbarPosition.left}px - 50%), calc(${toolbarPosition.top}px - 100%))`,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            backgroundColor: "#fff",
            border: "1px solid #ccc",
            borderRadius: 8,
            boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.15)",
            padding: "6px 10px",
            zIndex: 1000,
            minWidth: "fit-content",
            whiteSpace: "nowrap",
            maxWidth: "max-content",
            pointerEvents: "auto",
          }}
        >
          {/* Tool Buttons */}
          <div style={{ display: 'flex', gap: 4, borderRight: '1px solid #ddd', paddingRight: 8, flexShrink: 0 }}>
            <button
              onClick={() => setTool('pen')}
              style={{
                fontSize: 16,
                backgroundColor: tool === 'pen' ? '#e0e0e0' : '#fff',
                color: '#333',
                border: 'none',
                borderRadius: 4,
                padding: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                flexShrink: 0,
              }}
              title="Pen Tool"
            >
              <FaPen size={14} />
            </button>
            <button
              onClick={() => setTool('line')}
              style={{
                fontSize: 16,
                backgroundColor: tool === 'line' ? '#e0e0e0' : '#fff',
                color: '#333',
                border: 'none',
                borderRadius: 4,
                padding: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                flexShrink: 0,
              }}
              title="Line Tool"
            >
              <FaMinus size={14} />
            </button>
            <button
              onClick={() => setTool('arrow')}
              style={{
                fontSize: 16,
                backgroundColor: tool === 'arrow' ? '#e0e0e0' : '#fff',
                color: '#333',
                border: 'none',
                borderRadius: 4,
                padding: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                flexShrink: 0,
              }}
              title="Arrow Tool"
            >
              <FaLongArrowAltRight size={14} />
            </button>
            <button
              onClick={() => setTool('rect')}
              style={{
                fontSize: 16,
                backgroundColor: tool === 'rect' ? '#e0e0e0' : '#fff',
                color: '#333',
                border: 'none',
                borderRadius: 4,
                padding: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                flexShrink: 0,
              }}
              title="Rectangle Tool"
            >
              <FaSquare size={14} />
            </button>
            <button
              onClick={() => setTool('ellipse')}
              style={{
                fontSize: 16,
                backgroundColor: tool === 'ellipse' ? '#e0e0e0' : '#fff',
                color: '#333',
                border: 'none',
                borderRadius: 4,
                padding: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                flexShrink: 0,
              }}
              title="Circle Tool"
            >
              <FaCircle size={14} />
            </button>
            <button
              onClick={() => setTool('text')}
              style={{
                fontSize: 16,
                backgroundColor: tool === 'text' ? '#e0e0e0' : '#fff',
                color: '#333',
                border: 'none',
                borderRadius: 4,
                padding: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                flexShrink: 0,
              }}
              title="Text Tool"
            >
              <FaFont size={14} />
            </button>
          </div>

          {/* Undo/Redo Buttons */}
          <div style={{ display: 'flex', gap: 4, borderRight: '1px solid #ddd', paddingRight: 8, flexShrink: 0 }}>
            <button
              onClick={handleUndo}
              style={{
                fontSize: 16,
                backgroundColor: '#fff',
                color: '#333',
                border: 'none',
                borderRadius: 4,
                padding: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                flexShrink: 0,
              }}
              title="Undo"
            >
              <FaUndo size={14} />
            </button>
            <button
              onClick={handleRedo}
              style={{
                fontSize: 16,
                backgroundColor: '#fff',
                color: '#333',
                border: 'none',
                borderRadius: 4,
                padding: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                flexShrink: 0,
              }}
              title="Redo"
            >
              <FaRedo size={14} />
            </button>
            <button
              onClick={handleClearCanvas}
              style={{
                fontSize: 16,
                backgroundColor: '#fff',
                color: '#333',
                border: 'none',
                borderRadius: 4,
                padding: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                flexShrink: 0,
              }}
              title="Clear Canvas"
            >
              <FaEraser size={14} />
            </button>
          </div>

          {/* Brush Size */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, borderRight: '1px solid #ddd', paddingRight: 8, flexShrink: 0 }}>
            <input
              type="range"
              min={1}
              max={20}
              value={tool === 'text' ? fontSize : brushSize}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (tool === 'text') {
                  setFontSize(value);
                } else {
                  setBrushSize(value);
                }
              }}
              style={{
                width: 80,
                cursor: "pointer",
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 12, color: "#333", minWidth: 24, flexShrink: 0 }}>
              {tool === 'text' ? fontSize : brushSize}px
            </span>
          </div>

          {/* Color Picker */}
          <div style={{ flexShrink: 0 }}>
            <input
              type="color"
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              style={{
                width: 32,
                height: 32,
                padding: 2,
                border: 'none',
                borderRadius: 4,
                cursor: "pointer",
                background: "none",
                flexShrink: 0,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const drawingBlockImplementation: ReactCustomBlockImplementation<typeof drawingBlockSpec, any, any> = {
  render: () => <DrawingCanvas />,
};

export const Drawing = createReactBlockSpec(drawingBlockSpec, drawingBlockImplementation);