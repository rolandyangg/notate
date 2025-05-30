import {
  BlockNoteEditor,
  filterSuggestionItems,
  insertOrUpdateBlock,
  BlockNoteSchema,
  defaultBlockSpecs,
} from "@blocknote/core";
import type { PartialBlock } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import {
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useCreateBlockNote,
} from "@blocknote/react";
import { HiPencilAlt, HiPhotograph } from "react-icons/hi"; // drawing icon
import { Drawing } from "./Drawing.tsx"
import { Image } from "./Image";
import { AnnotationOverlay } from "./AnnotationOverlay";
import { Tutorial } from "./Tutorial";
import { useState, useRef } from "react";
import { TextboxOverlay } from "./TextboxOverlay";
import { OverlayToolbar } from "./OverlayToolbar";

// Custom "Drawing Block" menu item
const insertDrawingBlockItem = (editor: BlockNoteEditor) => ({
  title: "Insert Drawing Block",
  onItemClick: () =>
    insertOrUpdateBlock(editor, {
      type: "drawing",
      props: {},
    } as unknown as PartialBlock),
  aliases: ["drawing", "sketch", "paint"],
  group: "Other",
  icon: <HiPencilAlt size={18} />,
  subtext: "Insert a drawable canvas block",
});

const insertImageBlockItem = (editor: BlockNoteEditor) => ({
  title: "Insert Image Block",
  onItemClick: () =>
    insertOrUpdateBlock(editor, {
      type: "imageUpload",
      props: {},
    } as unknown as PartialBlock),
  aliases: ["image"],
  group: "Other",
  icon: <HiPhotograph size={18} />,
  subtext: "Insert an annotatable image block",
});

// List containing all default Slash Menu Items, as well as our custom one.
const getCustomSlashMenuItems = (editor: BlockNoteEditor) => [
  insertDrawingBlockItem(editor),
  insertImageBlockItem(editor),
  ...getDefaultReactSlashMenuItems(editor).filter(item =>
    !["Image", "Video", "Audio", "File", "Emoji"].includes(item.title))
];

const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    drawing: Drawing,
    imageUpload: Image
  }
});

function App() {
  const editor = useCreateBlockNote({ 
    schema,
    initialContent: [
      {
        type: "heading",
        content: "[Document Title]",
        props: { level: 1 }
      },
      {
        type: "paragraph",
        content: "Your notes here."
      }
    ]
  });
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [textboxes, setTextboxes] = useState<any[]>([]);
  const [mode, setMode] = useState<'comment-mode' | 'textbox-mode' | 'no-annotation-mode'>('no-annotation-mode');
  const [showTutorial, setShowTutorial] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wrapper functions to maintain compatibility with existing components
  const setIsAnnotationMode = (value: boolean | ((prev: boolean) => boolean)) => {
    if (typeof value === 'function') {
      const newValue = value(mode === 'comment-mode');
      setMode(newValue ? 'comment-mode' : 'no-annotation-mode');
    } else {
      setMode(value ? 'comment-mode' : 'no-annotation-mode');
    }
  };

  const setIsTextboxMode = (value: boolean | ((prev: boolean) => boolean)) => {
    if (typeof value === 'function') {
      const newValue = value(mode === 'textbox-mode');
      setMode(newValue ? 'textbox-mode' : 'no-annotation-mode');
    } else {
      setMode(value ? 'textbox-mode' : 'no-annotation-mode');
    }
  };

  // Helper function to check if a mode is active
  const isModeActive = (modeToCheck: 'comment-mode' | 'textbox-mode') => {
    return mode === modeToCheck;
  };

  const handleExport = () => {
    // Get all drawing blocks and their canvas data
    const drawingBlocks = editor.document.filter(block => block.type === 'drawing');
    const drawingData = drawingBlocks.map(block => {
      // Find the canvas element within the block's container
      const blockElement = document.querySelector(`[data-block-id="${block.id}"]`);
      const canvas = blockElement?.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return null;

      // Ensure the canvas is properly initialized
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Get the raw pixel data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      return {
        blockId: block.id,
        width: canvas.width,
        height: canvas.height,
        pixelData: Array.from(imageData.data)
      };
    }).filter(Boolean);

    const data = {
      blocks: editor.document,
      annotations: annotations,
      drawingData: drawingData
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'notes.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.blocks) {
          editor.replaceBlocks(editor.document, data.blocks);
          
          // Restore drawing data after a short delay to ensure blocks are rendered
          if (data.drawingData) {
            setTimeout(() => {
              data.drawingData.forEach((drawing: { blockId: string; width: number; height: number; pixelData: number[] }) => {
                const blockElement = document.querySelector(`[data-block-id="${drawing.blockId}"]`);
                const canvas = blockElement?.querySelector('canvas') as HTMLCanvasElement;
                if (canvas) {
                  // Set canvas dimensions
                  canvas.width = drawing.width;
                  canvas.height = drawing.height;
                  
                  const ctx = canvas.getContext('2d');
                  if (!ctx) return;

                  // Create ImageData from the saved pixel data
                  const imageData = new ImageData(
                    new Uint8ClampedArray(drawing.pixelData),
                    drawing.width,
                    drawing.height
                  );

                  // Put the image data back on the canvas
                  ctx.putImageData(imageData, 0, 0);
                }
              });
            }, 1000); // Increased delay to ensure blocks are fully rendered and initialized
          }
        }
        if (data.annotations) {
          setAnnotations(data.annotations);
        }
      } catch (error) {
        console.error('Error importing file:', error);
        alert('Error importing file. Please make sure it is a valid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="blocknote-container">
      <OverlayToolbar mode={mode} setMode={setMode} />
      {showTutorial && (
        <Tutorial onDismiss={() => setShowTutorial(false)} />
      )}
      <div style={{ 
        position: 'fixed', 
        bottom: '20px', 
        right: '20px', 
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <button
          onClick={() => setShowTutorial(true)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#9C27B0',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Show Tutorial
        </button>
        <button
          onClick={handleExport}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Export Notes
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: '8px 16px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Import Notes
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          style={{ display: 'none' }}
        />
      </div>
      <BlockNoteView
        editor={editor}
        theme="light"
        className="blocknote-editor"
        slashMenu={false}
        style={{
          margin: '60px 40px 40px 40px', // top, right, bottom, left
          maxWidth: 'calc(100% - 80px)', // Account for left and right margins
        }}
      >
        <SuggestionMenuController
          triggerCharacter={"/"}
          getItems={async (query) =>
            filterSuggestionItems(getCustomSlashMenuItems(editor as any), query)
          }
        />
      </BlockNoteView>
      <AnnotationOverlay 
        editor={editor} 
        annotations={annotations} 
        setAnnotations={setAnnotations}
        isAnnotationMode={isModeActive('comment-mode')}
        setIsAnnotationMode={setIsAnnotationMode}
      />
      <TextboxOverlay
        editor={editor}
        textboxes={textboxes}
        setTextboxes={setTextboxes}
        isTextboxMode={isModeActive('textbox-mode')}
        setIsTextboxMode={setIsTextboxMode}
      />
    </div>
  );
}

export default App;
