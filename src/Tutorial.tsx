import React, { useState } from 'react';
import "@blocknote/core/fonts/inter.css";

interface TutorialProps {
  onDismiss: () => void;
}

interface TutorialSection {
  title: string;
  content: React.ReactNode;
}

export const Tutorial: React.FC<TutorialProps> = ({ onDismiss }) => {
  const [currentSection, setCurrentSection] = useState(0);

  const sections: TutorialSection[] = [
    {
      title: "Welcome! 🎉",
      content: (
        <div>
          <p>Welcome to your new note-taking app! Let's walk through each feature to help you get started.</p>
          <p>Use the navigation buttons below to move through the tutorial sections.</p>
        </div>
      )
    },
    {
      title: "Drawing Canvas ✏️",
      content: (
        <div>
          <p>The drawing canvas is a powerful tool for sketching and illustrating:</p>
          <ol>
            <li>Type <code>/drawing</code> anywhere to insert a canvas</li>
            <li>Hold <kbd>Space</kbd> while drawing to pan the canvas</li>
            <li>Use the toolbar to select different tools:
              <ul>
                <li>🖊️ Pen - For regular drawing</li>
                <li>⬜ Rectangle - Click and drag to draw shapes</li>
                <li>🔄 Undo/Redo - Fix mistakes easily</li>
                <li>🎨 Color picker - Choose your color</li>
              </ul>
            </li>
            <li>Scroll to zoom in/out of your drawing</li>
            <li>Click outside the canvas to continue writing</li>
          </ol>
        </div>
      )
    },
    {
      title: "Annotations 📝",
      content: (
        <div>
          <p>Add contextual notes anywhere in your document:</p>
          <ol>
            <li>Click the "Add Annotation" button in the top-right</li>
            <li>Click anywhere on your document to add a note</li>
            <li>Type your annotation in the popup</li>
            <li>Click outside or press Enter to save</li>
            <li>Hover over annotation markers to view them</li>
            <li>Click "Cancel Annotation" to exit annotation mode</li>
          </ol>
        </div>
      )
    },
    {
      title: "Saving Your Work 💾",
      content: (
        <div>
          <p>Never lose your work with our save/restore feature:</p>
          <ol>
            <li>Click "Export Notes" to save your current work
              <ul>
                <li>This saves everything: text, drawings, and annotations</li>
                <li>The file will be saved to your downloads folder</li>
              </ul>
            </li>
            <li>Click "Import Notes" to restore a previous session
              <ul>
                <li>Select your saved .json file</li>
                <li>All your content will be restored exactly as you left it</li>
              </ul>
            </li>
          </ol>
        </div>
      )
    }
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        position: 'relative',
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        maxWidth: '600px',
        width: '90%',
      }}>
        <button
          onClick={onDismiss}
          className="close-button"
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: '#666',
          }}
        >
          ×
        </button>

        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ 
            marginTop: 0,
            fontSize: '24px',
            fontWeight: 600,
            color: '#1a1a1a'
          }}>{sections[currentSection].title}</h1>
          {sections[currentSection].content}
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '2rem',
          borderTop: '1px solid #eee',
          paddingTop: '1rem'
        }}>
          <button
            onClick={() => setCurrentSection(prev => prev - 1)}
            disabled={currentSection === 0}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: currentSection === 0 ? '#ccc' : '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: currentSection === 0 ? 'default' : 'pointer',
              fontSize: '14px',
              fontFamily: 'inherit',
              fontWeight: 500
            }}
          >
            Previous
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            {sections.map((_, index) => (
              <div
                key={index}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: currentSection === index ? '#2196F3' : '#ccc'
                }}
              />
            ))}
          </div>
          {currentSection < sections.length - 1 ? (
            <button
              onClick={() => setCurrentSection(prev => prev + 1)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontFamily: 'inherit',
                fontWeight: 500
              }}
            >
              Next
            </button>
          ) : (
            <button
              onClick={onDismiss}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontFamily: 'inherit',
                fontWeight: 500
              }}
            >
              Start Taking Notes
            </button>
          )}
        </div>

        <style>{`
          p, li {
            color: #4a4a4a;
            line-height: 1.6;
            font-size: 14px;
          }
          
          code {
            background-color: #f5f5f5;
            padding: 2px 4px;
            border-radius: 4px;
            font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
            font-size: 13px;
          }
          
          kbd {
            background-color: #f8f9fa;
            border: 1px solid #d1d5db;
            border-radius: 3px;
            box-shadow: 0 1px 1px rgba(0,0,0,.05);
            padding: 2px 4px;
            font-size: 13px;
          }
          
          ul, ol {
            margin-top: 0.5rem;
            margin-bottom: 0.5rem;
          }
          
          li + li {
            margin-top: 0.5rem;
          }

          button {
            font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            font-size: 14px !important;
            font-weight: 500 !important;
            transition: background-color 0.2s ease !important;
            height: 32px !important;
            min-width: 80px !important;
            padding: 0 16px !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            white-space: nowrap !important;
            user-select: none !important;
            -webkit-user-select: none !important;
            touch-action: manipulation !important;
            position: relative !important;
            box-sizing: border-box !important;
          }

          button:hover {
            opacity: 0.9;
          }

          button:active {
            transform: scale(0.98);
          }

          .close-button {
            height: auto !important;
            min-width: auto !important;
            padding: 4px 8px !important;
          }
        `}</style>
      </div>
    </div>
  );
}; 