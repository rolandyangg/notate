import React, { useState, useRef, useEffect } from 'react';

interface Annotation {
  id: string;
  startPoint: { x: number; y: number };
  textBox: { x: number; y: number };
  text: string;
  isEditing: boolean;
}

interface DragState {
  id: string;
  type: 'textbox' | 'point';
  startX: number;
  startY: number;
}

export const AnnotationOverlay = () => {
  const [isAnnotationMode, setIsAnnotationMode] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentAnnotation, setCurrentAnnotation] = useState<Partial<Annotation> | null>(null);
  const [step, setStep] = useState<'idle' | 'selecting-point' | 'placing-textbox'>('idle');
  const [dragState, setDragState] = useState<DragState | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

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
      // First click - set the arrow point
      setCurrentAnnotation({
        id: `annotation-${Date.now()}`,
        startPoint: { x: e.clientX, y: e.clientY },
      });
      setStep('placing-textbox');
    } else if (step === 'placing-textbox') {
      // Second click - place the textbox
      if (currentAnnotation) {
        const newAnnotation: Annotation = {
          ...currentAnnotation as Annotation,
          textBox: { x: e.clientX, y: e.clientY },
          text: '',
          isEditing: true,
        };
        setAnnotations([...annotations, newAnnotation]);
        setCurrentAnnotation(null);
        setStep('idle');
        setIsAnnotationMode(false);
      }
    }
  };

  // Handle text changes
  const handleTextChange = (id: string, text: string) => {
    setAnnotations(annotations.map(ann => 
      ann.id === id ? { ...ann, text, isEditing: false } : ann
    ));
  };

  // Start annotation mode
  const startAnnotation = () => {
    setIsAnnotationMode(true);
    setStep('selecting-point');
  };

  // Cancel annotation mode
  const cancelAnnotation = () => {
    setIsAnnotationMode(false);
    setStep('idle');
    setCurrentAnnotation(null);
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
      {/* Annotation Button */}
      <button
        onClick={startAnnotation}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          padding: '8px 16px',
          backgroundColor: isAnnotationMode ? '#ff4444' : '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        {isAnnotationMode ? 'Cancel Annotation' : 'Add Annotation'}
      </button>

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
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '4px',
              padding: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
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
              <div>
                {annotation.text || 'Double-click to edit'}
              </div>
            )}
          </div>
        </div>
      ))}
    </>
  );
};