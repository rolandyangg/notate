import React, { useState, useRef, useEffect } from 'react';
import { createReactBlockSpec } from "@blocknote/react";

// Define the annotation block specification
const annotationBlockSpec = {
  type: "annotation",
  propSchema: {
    text: { default: "" },
    position: { default: { x: 0, y: 0 } },
    targetId: { default: "" }, // ID of the block this annotation is attached to
    arrowDirection: { default: "right" }, // 'left', 'right', 'up', 'down'
  },
  content: "none" as const,
};

// Annotation component
const AnnotationBox = ({ block, editor }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(block.props.text);
  const annotationRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLElement | null>(null);

  // Find and track the target element
  useEffect(() => {
    const targetElement = document.getElementById(block.props.targetId);
    if (targetElement) {
      targetRef.current = targetElement;
      updatePosition();
    }
  }, [block.props.targetId]);

  // Update position when window resizes
  useEffect(() => {
    const handleResize = () => {
      updatePosition();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update position based on target element
  const updatePosition = () => {
    if (!targetRef.current || !annotationRef.current) return;

    const targetRect = targetRef.current.getBoundingClientRect();
    const annotationRect = annotationRef.current.getBoundingClientRect();
    
    // Calculate position based on arrow direction
    let x = 0, y = 0;
    switch (block.props.arrowDirection) {
      case 'right':
        x = targetRect.right + 10;
        y = targetRect.top + (targetRect.height / 2) - (annotationRect.height / 2);
        break;
      case 'left':
        x = targetRect.left - annotationRect.width - 10;
        y = targetRect.top + (targetRect.height / 2) - (annotationRect.height / 2);
        break;
      // Add cases for 'up' and 'down' as needed
    }

    // Update the annotation position
    editor.updateBlock(block, {
      props: {
        ...block.props,
        position: { x, y }
      }
    });
  };

  // Handle text changes
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  // Save text when editing is done
  const handleBlur = () => {
    setIsEditing(false);
    editor.updateBlock(block, {
      props: {
        ...block.props,
        text
      }
    });
  };

  return (
    <div
      ref={annotationRef}
      style={{
        position: 'absolute',
        left: block.props.position.x,
        top: block.props.position.y,
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: '4px',
        padding: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: 1000,
      }}
    >
      {isEditing ? (
        <textarea
          value={text}
          onChange={handleTextChange}
          onBlur={handleBlur}
          autoFocus
          style={{
            width: '200px',
            minHeight: '60px',
            border: 'none',
            resize: 'both',
          }}
        />
      ) : (
        <div
          onClick={() => setIsEditing(true)}
          style={{ cursor: 'pointer' }}
        >
          {text || 'Click to add annotation'}
        </div>
      )}
      {/* Arrow component */}
      <div
        style={{
          position: 'absolute',
          width: '20px',
          height: '2px',
          backgroundColor: '#ccc',
          ...getArrowStyles(block.props.arrowDirection)
        }}
      />
    </div>
  );
};

// Helper function to get arrow styles based on direction
const getArrowStyles = (direction: string) => {
  switch (direction) {
    case 'right':
      return {
        left: '-20px',
        top: '50%',
        transform: 'translateY(-50%)',
      };
    case 'left':
      return {
        right: '-20px',
        top: '50%',
        transform: 'translateY(-50%)',
      };
    // Add cases for 'up' and 'down'
    default:
      return {};
  }
};

// Create the annotation block implementation
const annotationBlockImplementation = {
  render: (props: any) => <AnnotationBox {...props} />,
};

export const Annotation = createReactBlockSpec(
  annotationBlockSpec,
  annotationBlockImplementation
);