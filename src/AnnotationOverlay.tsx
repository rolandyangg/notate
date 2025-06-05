import React, { useState, useRef, useEffect } from 'react';
import type { BlockNoteEditor } from "@blocknote/core";

interface Annotation {
  id: string;
  startPoint: { x: number; y: number };
  textBox: { x: number; y: number };
  text: string;
  isEditing: boolean;
  blockId?: string;  // ID of the block this annotation is attached to
}

interface DragState {
  id: string;
  type: 'textbox' | 'point' | 'annotation-creation';
  startX: number;
  startY: number;
}

interface BlockPosition {
  index: number;
  top: number;
  height: number;
  blockId: string | null;
}

interface AnnotationOverlayProps {
  editor: BlockNoteEditor<any, any, any>;
  annotations: Annotation[];
  setAnnotations: React.Dispatch<React.SetStateAction<Annotation[]>>;
  isAnnotationMode: boolean;
  setIsAnnotationMode: React.Dispatch<React.SetStateAction<boolean>>;
}

export const AnnotationOverlay = ({ 
  editor, 
  annotations, 
  setAnnotations,
  isAnnotationMode,
  setIsAnnotationMode
}: AnnotationOverlayProps) => {
  const annotationsRef = useRef<Annotation[]>([]);
  const [currentAnnotation, setCurrentAnnotation] = useState<Partial<Annotation> | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const blockPositionsRef = useRef<BlockPosition[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [overlayDimensions, setOverlayDimensions] = useState({ width: 0, height: 0 });

  // Add keyboard event listener for Tab+C to start/stop annotation mode
  useEffect(() => {
    let isTabPressed = false;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Track Tab key press
      if (e.code === 'Tab') {
        e.preventDefault(); // Prevent default tab behavior
        isTabPressed = true;
        return;
      }
      
      // Check for Tab+C combination
      if (isTabPressed && e.code === 'KeyC') {
        e.preventDefault();
        setIsAnnotationMode(prev => !prev);
      }
      
      // Check if escape is pressed and we're in annotation mode
      if ((e.key === 'Escape' || e.code === 'Escape') && isAnnotationMode) {
        e.preventDefault();
        setIsAnnotationMode(false);
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
  }, [isAnnotationMode]);

  // Update ref when annotations change
  useEffect(() => {
    annotationsRef.current = annotations;
  }, [annotations]);

  // Track block positions
  useEffect(() => {
    const updateBlockPositions = () => {
      const editorElement = document.querySelector('.blocknote-editor');
      if (!editorElement) return;

      const editorRect = editorElement.getBoundingClientRect();
      const blockElements = editorElement.querySelectorAll('.bn-block');
      const blocks = editor.document;

      const newPositions: BlockPosition[] = Array.from(blockElements).map((element, index) => {
        const rect = element.getBoundingClientRect();
        const blockId = blocks[index]?.id;
        
        return {
          index,
          top: rect.top - editorRect.top,
          height: rect.height,
          blockId
        };
      });

      // Update annotations if block positions have changed
      if (blockPositionsRef.current.length > 0) {
        const updatedAnnotations = annotationsRef.current.map(annotation => {
          if (!annotation.blockId) return annotation;

          const oldPosition = blockPositionsRef.current.find(pos => pos.blockId === annotation.blockId);
          const newPosition = newPositions.find(pos => pos.blockId === annotation.blockId);
          
          if (!oldPosition || !newPosition) return annotation;

          const yOffset = newPosition.top - oldPosition.top;
          
          if (yOffset !== 0) {
            return {
              ...annotation,
              startPoint: {
                ...annotation.startPoint,
                y: annotation.startPoint.y + yOffset
              },
              textBox: {
                ...annotation.textBox,
                y: annotation.textBox.y + yOffset
              }
            };
          }
          return annotation;
        });

        setAnnotations(updatedAnnotations);
      }

      blockPositionsRef.current = newPositions;
    };

    // Subscribe to BlockNote editor events
    editor.onChange(() => {
      requestAnimationFrame(updateBlockPositions);
    });

    // Update positions on scroll and resize
    const handleScroll = () => requestAnimationFrame(updateBlockPositions);
    const handleResize = () => requestAnimationFrame(updateBlockPositions);

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    // Initial position update
    updateBlockPositions();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [editor]);

  // Add dynamic sizing effect
  useEffect(() => {
    const updateOverlaySize = () => {
      const editorElement = document.querySelector('.blocknote-editor');
      if (!editorElement) return;

      const parentContainer = editorElement.parentElement;
      if (!parentContainer) return;
      
      // Get the maximum height of all content
      const maxHeight = Math.max(
        parentContainer.scrollHeight,
        parentContainer.offsetHeight,
        parentContainer.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight,
        document.documentElement.clientHeight
      );
      
      const width = parentContainer.offsetWidth;
      const height = maxHeight;

      setOverlayDimensions({ width, height });
    };

    // Initial setup
    updateOverlaySize();
    
    // Update on resize and scroll
    window.addEventListener('resize', updateOverlaySize);
    window.addEventListener('scroll', updateOverlaySize);

    return () => {
      window.removeEventListener('resize', updateOverlaySize);
      window.removeEventListener('scroll', updateOverlaySize);
    };
  }, []);

  // Handle mouse move for dragging
  const handleMouseMove = (e: MouseEvent) => {
    if (!dragState) return;

    const editorElement = document.querySelector('.blocknote-editor');
    if (!editorElement) return;

    // const editorRect = editorElement.getBoundingClientRect();
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;

    if (dragState.type === 'annotation-creation') {
      // Update the current annotation's textbox position during creation
      setCurrentAnnotation(prev => {
        if (!prev) return null;

        // Calculate new position relative to editor
        const newX = prev.startPoint!.x + dx;
        const newY = prev.startPoint!.y + dy;

        return {
          ...prev,
          textBox: {
            x: newX,
            y: newY
          }
        };
      });
    } else {
      // Handle existing annotation dragging
      setAnnotations(annotations.map(ann => {
        if (ann.id === dragState.id) {
          if (dragState.type === 'textbox') {
            return {
              ...ann,
              textBox: {
                x: ann.textBox.x + dx,
                y: ann.textBox.y + dy
              }
            };
          } else {
            return {
              ...ann,
              startPoint: {
                x: ann.startPoint.x + dx,
                y: ann.startPoint.y + dy
              }
            };
          }
        }
        return ann;
      }));

      setDragState({
        ...dragState,
        startX: e.clientX,
        startY: e.clientY
      });
    }
  };

  // Handle mouse up to end dragging
  const handleMouseUp = () => {
    if (dragState?.type === 'annotation-creation' && currentAnnotation) {
      // Create the new annotation
      const newAnnotation: Annotation = {
        ...currentAnnotation as Annotation,
        textBox: currentAnnotation.textBox || currentAnnotation.startPoint!,
        text: '',
        isEditing: true,
      };
      setAnnotations(prevAnnotations => [...prevAnnotations, newAnnotation]);
      setCurrentAnnotation(null);
      setIsAnnotationMode(false);
    }
    setDragState(null);
    setIsDragging(false);
  };

  // Handle mouse down for starting annotation creation
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isAnnotationMode) return;

    const blocks = editor.document;
    let clickedBlock = null;
    
    const editorElement = document.querySelector('.blocknote-editor');
    if (editorElement) {
      const rect = editorElement.getBoundingClientRect();
      const blockElements = editorElement.querySelectorAll('.bn-block');

      // Use mouse position directly for initial placement
      const x = e.pageX;
      const y = e.pageY;

      for (const blockElement of blockElements) {
        const blockRect = blockElement.getBoundingClientRect();
        const blockRelativeTop = blockRect.top - rect.top;
        const blockRelativeBottom = blockRect.bottom - rect.top;
        
        if (
          e.clientX >= blockRect.left &&
          e.clientX <= blockRect.right &&
          (e.clientY - rect.top) >= blockRelativeTop &&
          (e.clientY - rect.top) <= blockRelativeBottom
        ) {
          const blockIndex = Array.from(blockElements).indexOf(blockElement);
          if (blockIndex !== -1 && blocks[blockIndex]) {
            clickedBlock = blocks[blockIndex];
            break;
          }
        }
      }

      setCurrentAnnotation({
        id: `annotation-${Date.now()}`,
        startPoint: { x, y },
        textBox: { x, y },
        blockId: clickedBlock?.id
      });

      setDragState({
        id: `annotation-${Date.now()}`,
        type: 'annotation-creation',
        startX: e.clientX,
        startY: e.clientY
      });
      setIsDragging(true);
    }
  };

  // Add and remove event listeners for drag
  useEffect(() => {
    if (dragState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, currentAnnotation]);

  // Handle text changes
  const handleTextChange = (id: string, text: string) => {
    setAnnotations(annotations.map(ann => 
      ann.id === id ? { ...ann, text, isEditing: false } : ann
    ));
  };

  // Draw arrow between points
  const drawArrow = (start: { x: number; y: number }, end: { x: number; y: number }, id: string) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    const length = Math.sqrt(dx * dx + dy * dy);

    return (
      <>
        {/* Circle at the start point */}
        <div
          onMouseDown={(e) => {
            e.stopPropagation();
            setDragState({
              id,
              type: 'point',
              startX: e.clientX,
              startY: e.clientY
            });
          }}
          style={{
            position: 'absolute',
            left: start.x - 4,
            top: start.y - 4,
            width: '8px',
            height: '8px',
            backgroundColor: '#666',
            borderRadius: '50%',
            cursor: 'move',
            pointerEvents: 'auto',
          }}
        />
        {/* Line connecting circle to text box */}
        <div
          style={{
            position: 'absolute',
            left: start.x,
            top: start.y,
            width: length,
            height: '2px',
            backgroundColor: '#666',
            transform: `rotate(${angle}deg)`,
            transformOrigin: '0 0',
            pointerEvents: 'none',
          }}
        />
      </>
    );
  };

  return (
    <>
      {/* Overlay for annotation placement */}
      {isAnnotationMode && (
        <div
          ref={overlayRef}
          onMouseDown={handleMouseDown}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: overlayDimensions.width || '100%',
            height: overlayDimensions.height || '100%',
            zIndex: 999,
            cursor: 'crosshair',
          }}
        >
          {!isDragging && (
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
              }}
            >
              Click and drag to add a comment
            </div>
          )}
          {currentAnnotation && isDragging && (
            <>
              {drawArrow(currentAnnotation.startPoint!, currentAnnotation.textBox!, currentAnnotation.id!)}
              <div
                style={{
                  position: 'absolute',
                  left: currentAnnotation.textBox!.x,
                  top: currentAnnotation.textBox!.y,
                  backgroundColor: '#dddddd',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px',
                  zIndex: 1000,
                  opacity: 0.5,
                }}
              >
                <div style={{
                  width: '204px',
                  minHeight: '68px',
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                  fontSize: '14px',
                  lineHeight: '1.5',
                }}>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Existing Annotations */}
      {annotations.map(annotation => (
        <div key={annotation.id} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
          {/* Arrow */}
          {drawArrow(annotation.startPoint, annotation.textBox, annotation.id)}
          
          {/* Text Box */}
          <div
            onMouseDown={(e) => {
              e.stopPropagation();
              setDragState({
                id: annotation.id,
                type: 'textbox',
                startX: e.clientX,
                startY: e.clientY
              });
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setAnnotations(annotations.map(ann =>
                ann.id === annotation.id ? { ...ann, isEditing: true } : ann
              ));
            }}
            style={{
              position: 'absolute',
              left: annotation.textBox.x,
              top: annotation.textBox.y,
              backgroundColor: '#dddddd',
              border: 'none',
              borderRadius: '4px',
              padding: '8px',
              zIndex: 1000,
              cursor: 'move',
              pointerEvents: 'auto',
            }}
          >
            {annotation.isEditing ? (
              <div style={{ position: 'relative' }}>
                <textarea
                  autoFocus
                  value={annotation.text}
                  onChange={(e) => {
                    setAnnotations(annotations.map(ann =>
                      ann.id === annotation.id ? { ...ann, text: e.target.value } : ann
                    ));
                  }}
                  onBlur={(e) => {
                    // Only handle blur if we're not clicking the delete button
                    if (!e.relatedTarget?.matches('button')) {
                      handleTextChange(annotation.id, e.target.value);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleTextChange(annotation.id, e.currentTarget.value);
                      setAnnotations(annotations.map(ann =>
                        ann.id === annotation.id ? { ...ann, isEditing: false } : ann
                      ));
                    } else if (e.key === 'Tab') {
                      e.preventDefault();
                      const start = e.currentTarget.selectionStart;
                      const end = e.currentTarget.selectionEnd;
                      const newValue = annotation.text.substring(0, start) + '\t' + annotation.text.substring(end);
                      setAnnotations(annotations.map(ann =>
                        ann.id === annotation.id ? { ...ann, text: newValue } : ann
                      ));
                      // Move cursor after the tab
                      setTimeout(() => {
                        e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 1;
                      }, 0);
                    }
                  }}
                  style={{
                    width: '180px',
                    minHeight: '60px',
                    border: 'none',
                    resize: 'both',
                    paddingRight: '24px', // Make room for the delete button
                    backgroundColor: '#dddddd',
                    outline: 'none',
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                    fontSize: '14px',
                    lineHeight: '1.5',
                  }}
                />
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setAnnotations(annotations.filter(ann => ann.id !== annotation.id));
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '20px',
                    height: '20px',
                    padding: '0',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#000',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    lineHeight: '1',
                    fontWeight: 'bold',
                  }}
                >
                  ×
                </button>
              </div>
            ) : (
              <div style={{
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                fontSize: '14px',
                lineHeight: '1.5',
              }}>
                {annotation.text || 'Double-click to edit'}
              </div>
            )}
          </div>
        </div>
      ))}
    </>
  );
};