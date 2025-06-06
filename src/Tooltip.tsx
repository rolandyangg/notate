import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && tooltipRef.current && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      // Position the tooltip above the element
      setPosition({
        top: -tooltipRect.height - 8, // 8px gap
        left: (containerRect.width - tooltipRect.width) / 2
      });
    }
  }, [isVisible]);

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative' }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          style={{
            position: 'absolute',
            top: position.top,
            left: position.left,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '14px',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            fontWeight: 500,
            whiteSpace: 'nowrap',
            zIndex: 1100,
            pointerEvents: 'none',
            transform: 'translateY(0)',
            opacity: 1,
            transition: 'transform 0.2s ease, opacity 0.2s ease',
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
}; 