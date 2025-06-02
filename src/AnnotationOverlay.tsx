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
  type: 'textbox' | 'point';
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
  const [step, setStep] = useState<'selecting-point' | 'placing-textbox'>('selecting-point');
  const [dragState, setDragState] = useState<DragState | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const blockPositionsRef = useRef<BlockPosition[]>([]);

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

  // Handle mouse move for dragging
  const handleMouseMove = (e: MouseEvent) => {
    if (!dragState) return;

    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;

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
  };

  // Handle mouse up to end dragging
  const handleMouseUp = () => {
    setDragState(null);
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
  }, [dragState]);

  // Handle click events for annotation placement
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (!isAnnotationMode) return;

    if (step === 'selecting-point') {
      const blocks = editor.document;
      let clickedBlock = null;
      
      const editorElement = document.querySelector('.blocknote-editor');
      if (editorElement) {
        const blockElements = editorElement.querySelectorAll('.bn-block');

        for (const blockElement of blockElements) {
          const rect = blockElement.getBoundingClientRect();
          
          if (
            e.clientX >= rect.left &&
            e.clientX <= rect.right &&
            e.clientY >= rect.top &&
            e.clientY <= rect.bottom
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
          startPoint: { x: e.clientX, y: e.clientY },
          blockId: clickedBlock?.id
        });
        setStep('placing-textbox');
      }
    } else if (step === 'placing-textbox') {
      if (currentAnnotation) {
        const newAnnotation: Annotation = {
          ...currentAnnotation as Annotation,
          textBox: { x: e.clientX, y: e.clientY },
          text: '',
          isEditing: true,
        };
        setAnnotations(prevAnnotations => [...prevAnnotations, newAnnotation]);
        setCurrentAnnotation(null);
        setStep('selecting-point'); // Go directly to selecting-point for next annotation
      }
    }
  };

  // Handle text changes
  const handleTextChange = (id: string, text: string) => {
    setAnnotations(annotations.map(ann => 
      ann.id === id ? { ...ann, text, isEditing: false } : ann
    ));
  };

  // Effect to handle annotation mode changes
  useEffect(() => {
    if (isAnnotationMode) {
      setStep('selecting-point');
    } else {
      setCurrentAnnotation(null);
    }
  }, [isAnnotationMode]);

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
          onClick={handleOverlayClick}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
            cursor: 'crosshair',
          }}
        >
          {step === 'selecting-point' && (
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
              Click where you want the arrow to point to
            </div>
          )}
          {step === 'placing-textbox' && (
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
              Click where you want to place the text box
            </div>
          )}
        </div>
      )}

      {/* Existing Annotations */}
      {annotations.map(annotation => (
        <div key={annotation.id}>
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
                    width: '200px',
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