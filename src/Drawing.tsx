import {
    createReactBlockSpec,
  } from "@blocknote/react";
  import React, { useEffect, useRef, useState } from "react";
  
// Block spec definition
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
  
    // Listen for spacebar hold
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === "Space") {
          e.preventDefault(); // Prevent page scroll
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
  
    const startDrawing = (x: number, y: number) => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      ctx.beginPath();
      ctx.moveTo(x, y);
      isDrawing.current = true;
    };
  
    const draw = (x: number, y: number) => {
      if (!isDrawing.current) return;
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      ctx.lineTo(x, y);
      ctx.stroke();
    };
  
    const stopDrawing = () => {
      if (!isDrawing.current) return;
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
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
  
    return (
      <div>
        <p style={{ marginBottom: 4 }}>
          🖱️ Click and drag to draw, or press and hold <strong>Spacebar</strong> to draw by moving your mouse.
        </p>
        <canvas
          ref={canvasRef}
          width={400}
          height={200}
          style={{
            border: "1px solid #ccc",
            resize: "both",
            display: "block",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={stopDrawing}
        />
      </div>
    );
  };
  
  
// Block implementation
const drawingBlockImplementation: ReactCustomBlockImplementation<
typeof drawingBlockSpec
> = {
render: () => <DrawingCanvas />,
};

// Exported block for BlockNote
export const Drawing = createReactBlockSpec(
drawingBlockSpec,
drawingBlockImplementation
);
