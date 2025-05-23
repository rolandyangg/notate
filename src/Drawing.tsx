import {
    createReactBlockSpec,
    type ReactCustomBlockImplementation,
  } from "@blocknote/react";
  import React, { useEffect, useRef, useState } from "react";
  import rough from "roughjs/bin/rough";
  
  const drawingBlockSpec = {
    type: "drawing",
    propSchema: {},
    content: "none" as const,
  };
  
  const DrawingCanvas = () => {
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
  
    const [isSpaceHeld, setIsSpaceHeld] = useState(false);
    const [size, setSize] = useState({ width: 400, height: 200 });
    const [brushColor, setBrushColor] = useState("#333");
    const [brushSize, setBrushSize] = useState(2);
    const [tool, setTool] = useState("pen");
  
    const undoStack = useRef<string[]>([]);
    const redoStack = useRef<string[]>([]);
  
    useEffect(() => {
      if (canvasRef.current) {
        roughCanvasRef.current = rough.canvas(canvasRef.current);
        saveState();
      }
    }, []);
  
    const saveState = () => {
      const dataURL = canvasRef.current?.toDataURL();
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
      const current = undoStack.current.pop();
      if (current) redoStack.current.push(current);
      restoreState(undoStack.current[undoStack.current.length - 1]);
      lastSavedSnapshot.current = undoStack.current[undoStack.current.length - 1];
    };
  
    const handleRedo = () => {
      if (redoStack.current.length === 0) return;
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
        if ((e.ctrlKey || e.metaKey) && e.code === "KeyZ") {
          e.preventDefault();
          if (e.shiftKey) handleRedo();
          else handleUndo();
        }
      };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }, []);
  
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
          if (tool === "line" && isDrawing.current) {
            stopDrawing();
          }
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
  
    const draw = (x: number, y: number) => {
      if (!isDrawing.current || !roughCanvasRef.current) return;
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      const rc = roughCanvasRef.current;
  
      if (tool === "pen") {
        rc.line(startX.current, startY.current, x, y, {
          stroke: brushColor,
          strokeWidth: brushSize,
        });
        startX.current = x;
        startY.current = y;
        didDrawInStroke.current = true;
      } else if (tool === "line") {
        currentX.current = x;
        currentY.current = y;
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          rc.line(startX.current, startY.current, currentX.current, currentY.current, {
            stroke: brushColor,
            strokeWidth: brushSize,
          });
        };
        img.src = lastSavedSnapshot.current;
      }
    };
  
    const stopDrawing = () => {
      if (!isDrawing.current || !roughCanvasRef.current) return;
      isDrawing.current = false;
  
      const rc = roughCanvasRef.current;
      if (tool === "line") {
        rc.line(startX.current, startY.current, currentX.current, currentY.current, {
          stroke: brushColor,
          strokeWidth: brushSize,
        });
        saveState();
      } else if (tool === "pen" && didDrawInStroke.current) {
        saveState();
      }
    };
  
    const handleMouseDown = (e: React.MouseEvent) => {
      isMouseDown.current = true;
      const rect = canvasRef.current!.getBoundingClientRect();
      startDrawing(e.clientX - rect.left, e.clientY - rect.top);
    };
  
    const handleMouseMove = (e: React.MouseEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if ((isMouseDown.current || isSpaceHeld) && !isDrawing.current) {
        startDrawing(x, y);
      }
      if (isMouseDown.current || isSpaceHeld) {
        draw(x, y);
      }
    };
  
    const handleMouseUp = () => {
      isMouseDown.current = false;
      stopDrawing();
    };
  
    const handleResizeMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current!;
      const imageDataURL = canvas.toDataURL();
      const aspectRatio = size.width / size.height;
      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = size.width;
  
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
      };
  
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    };
  
    return (
      <div
        contentEditable={false}
        style={{
          position: "relative",
          display: "inline-block",
          border: "1px solid #ccc",
          width: size.width,
          height: size.height,
        }}
      >
        <canvas
          ref={canvasRef}
          width={size.width}
          height={size.height}
          style={{ display: "block", width: "100%", height: "100%" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={stopDrawing}
        />
        <div
          onMouseDown={handleResizeMouseDown}
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            width: 16,
            height: 16,
            background: "#ccc",
            cursor: "nwse-resize",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 4,
            left: 4,
            display: "flex",
            gap: 6,
            backgroundColor: "rgba(255,255,255,0.7)",
            padding: "2px 6px",
            borderRadius: 4,
          }}
        >
          <button onClick={handleUndo} style={{ fontSize: 12 }}>↶ Undo</button>
          <button onClick={handleRedo} style={{ fontSize: 12 }}>↷ Redo</button>
          <button onClick={handleClearCanvas} style={{ fontSize: 12 }}>🧹 Clear</button>
        </div>
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 4,
            backgroundColor: "rgba(255,255,255,0.7)",
            padding: "4px 6px",
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <label style={{ fontSize: 12 }}>🎨</label>
          <input
            type="color"
            value={brushColor}
            onChange={(e) => setBrushColor(e.target.value)}
            style={{ width: 24, height: 24, border: "none", cursor: "pointer" }}
          />
          <label style={{ fontSize: 12 }}>✏️</label>
          <input
            type="range"
            min={1}
            max={20}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            style={{ width: 80 }}
          />
          <label style={{ fontSize: 12 }}>🛠</label>
          <select value={tool} onChange={(e) => setTool(e.target.value)} style={{ fontSize: 12 }}>
            <option value="pen">Pen</option>
            <option value="line">Line</option>
          </select>
        </div>
      </div>
    );
  };
  
  const drawingBlockImplementation: ReactCustomBlockImplementation<
    typeof drawingBlockSpec
  > = {
    render: () => <DrawingCanvas />,
  };
  
  export const Drawing = createReactBlockSpec(
    drawingBlockSpec,
    drawingBlockImplementation
  );
  