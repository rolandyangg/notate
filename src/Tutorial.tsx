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
      title: "Annotations & Textboxes 📝",
      content: (
        <div>
          <p>Add contextual notes and textboxes anywhere in your document:</p>
          <h4>Keyboard Shortcuts</h4>
          <ul>
            <li><kbd>Tab</kbd> + <kbd>C</kbd> - Toggle annotation mode</li>
            <li><kbd>Tab</kbd> + <kbd>T</kbd> - Toggle textbox mode</li>
            <li><kbd>Esc</kbd> - Exit current mode</li>
          </ul>
          <h4>Adding Annotations</h4>
          <ol>
            <li>Press <kbd>Tab</kbd> + <kbd>C</kbd> or use the toolbar button</li>
            <li>Click where you want the arrow to point</li>
            <li>Click where you want to place the annotation text</li>
            <li>Type your annotation</li>
            <li>Press Enter or click outside to save</li>
          </ol>
          <h4>Adding Textboxes</h4>
          <ol>
            <li>Press <kbd>Tab</kbd> + <kbd>T</kbd> or use the toolbar button</li>
            <li>Click anywhere to place a textbox</li>
            <li>Type your text</li>
            <li>Press Enter or click outside to save</li>
          </ol>
          <p><strong>Tip:</strong> You can drag both annotations and textboxes to reposition them.</p>
        </div>
      )
    },
    {
      title: "Saving & Sharing 💾",
      content: (
        <div>
          <p>Your work is automatically saved as you type. To share or backup your notes:</p>
          <ol>
            <li>Click the "Export Notes" button</li>
            <li>Save the JSON file to your computer</li>
            <li>To restore: Click "Import Notes" and select your saved file</li>
          </ol>
          <p>The export includes all your notes, drawings, annotations, and textboxes!</p>
        </div>
      )
    }
  ];

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'white',
      padding: '24px',
      borderRadius: '12px',
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.1)',
      maxWidth: '600px',
      width: '90%',
      maxHeight: '80vh',
      overflow: 'auto',
      zIndex: 2000,
    }}>
      <button
        onClick={onDismiss}
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'none',
          border: 'none',
          fontSize: '24px',
          cursor: 'pointer',
          color: '#666',
        }}
      >
        ×
      </button>

      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ marginTop: 0 }}>{sections[currentSection].title}</h2>
        <div style={{
          fontSize: '16px',
          lineHeight: '1.5',
          color: '#333',
        }}>
          {sections[currentSection].content}
        </div>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '24px',
        borderTop: '1px solid #eee',
        paddingTop: '16px',
      }}>
        <button
          onClick={() => setCurrentSection(prev => prev - 1)}
          disabled={currentSection === 0}
          style={{
            padding: '8px 16px',
            backgroundColor: currentSection === 0 ? '#ccc' : '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: currentSection === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          Previous
        </button>
        <div style={{ color: '#666' }}>
          {currentSection + 1} of {sections.length}
        </div>
        <button
          onClick={() => currentSection === sections.length - 1 ? onDismiss() : setCurrentSection(prev => prev + 1)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {currentSection === sections.length - 1 ? 'Get Started!' : 'Next'}
        </button>
      </div>
    </div>
  );
}; 