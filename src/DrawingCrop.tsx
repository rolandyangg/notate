import {
    createReactBlockSpec,
    type ReactCustomBlockImplementation,
  } from "@blocknote/react";
  import React, { useEffect, useRef, useState } from "react";
  
  const drawingBlockSpec = {
    type: "drawing",
    propSchema: {},
    content: "none" as const,
  };
  
  const DrawingCanvas = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawing = useRef(false);
    const isMouseDown = useRef(false);
    const [isSpaceHeld, setIsSpaceHeld] = useState(false);
    const [size, setSize] = useState({ width: 400, height: 200 });
  
    // Spacebar drawing logic
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === "Space") {
          e.preventDefault();
          setIsSpaceHeld(true);
        }
      };
      const handleKeyUp = (e: KeyboardEvent) => {
        if (e.code === "Space") {
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
    }, []);
  
    // Drawing handlers
    const startDrawing = (x: number, y: number) => {
      const ctx = canvasRef.current!.getContext("2d")!;
      ctx.beginPath();
      ctx.moveTo(x, y);
      isDrawing.current = true;
    };
  
    const draw = (x: number, y: number) => {
      if (!isDrawing.current) return;
      const ctx = canvasRef.current!.getContext("2d")!;
      ctx.lineTo(x, y);
      ctx.stroke();
    };
  
    const stopDrawing = () => {
      if (!isDrawing.current) return;
      const ctx = canvasRef.current!.getContext("2d")!;
      ctx.closePath();
      isDrawing.current = false;
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
  
    // Resize without clearing
    const handleResizeMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      const oldImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = size.width;
      const startHeight = size.height;
  
      const onMouseMove = (e: MouseEvent) => {
        const newWidth = Math.max(100, startWidth + (e.clientX - startX));
        const newHeight = Math.max(100, startHeight + (e.clientY - startY));
  
        // TEMP: Wait to redraw after canvas renders
        setSize(prev => {
          setTimeout(() => {
            const newCanvas = canvasRef.current!;
            const newCtx = newCanvas.getContext("2d")!;
            newCtx.putImageData(oldImageData, 0, 0);
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
          style={{
            display: "block",
            width: "100%",
            height: "100%",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={stopDrawing}
        />
        {/* Resize handle */}
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
  