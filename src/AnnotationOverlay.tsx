import React, { useState, useRef, useEffect } from 'react';

interface Annotation {
  id: string;
  startPoint: { x: number; y: number };
  textBox: { x: number; y: number };
  text: string;
  isEditing: boolean;
}

export const AnnotationOverlay = () => {
  const [isAnnotationMode, setIsAnnotationMode] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentAnnotation, setCurrentAnnotation] = useState<Partial<Annotation> | null>(null);
  const [step, setStep] = useState<'idle' | 'selecting-point' | 'placing-textbox'>('idle');
  const overlayRef = useRef<HTMLDivElement>(null);

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
  const drawArrow = (start: { x: number; y: number }, end: { x: number; y: number }) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    const length = Math.sqrt(dx * dx + dy * dy);

    return (
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
      >
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: -4,
            width: 0,
            height: 0,
            borderLeft: '6px solid #666',
            borderTop: '4px solid transparent',
            borderBottom: '4px solid transparent',
          }}
        />
      </div>
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
          {drawArrow(annotation.startPoint, annotation.textBox)}
          
          {/* Text Box */}
          <div
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
            }}
          >
            {annotation.isEditing ? (
              <textarea
                autoFocus
                defaultValue={annotation.text}
                onBlur={(e) => handleTextChange(annotation.id, e.target.value)}
                style={{
                  width: '200px',
                  minHeight: '60px',
                  border: 'none',
                  resize: 'both',
                }}
              />
            ) : (
              <div
                onClick={() => setAnnotations(annotations.map(ann =>
                  ann.id === annotation.id ? { ...ann, isEditing: true } : ann
                ))}
                style={{ cursor: 'pointer' }}
              >
                {annotation.text || 'Click to edit'}
              </div>
            )}
          </div>
        </div>
      ))}
    </>
  );
};