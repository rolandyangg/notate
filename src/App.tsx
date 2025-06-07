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
import { HiPencilAlt, HiPhotograph, HiSave, HiUpload, HiQuestionMarkCircle } from "react-icons/hi"; // drawing icon, save icon
import { Drawing } from "./Drawing.tsx"
import { Image } from "./Image";
import { AnnotationOverlay } from "./AnnotationOverlay";
import { Tutorial } from "./Tutorial";
import { useState, useRef, useEffect } from "react";
import { TextboxOverlay } from "./TextboxOverlay";
import { OverlayToolbar } from "./OverlayToolbar";
import { ScribbleOverlay } from "./ScribbleOverlay";
import { initialContent } from "./initialContent";
import { Tooltip } from "./Tooltip";

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

// Create a filtered version of defaultBlockSpecs without the image block
const { image: _, ...filteredSpecs } = defaultBlockSpecs;

// Create schema with filtered block specs and our custom blocks
const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...filteredSpecs,
    drawing: Drawing,
    imageUpload: Image
  } as any
});

interface Annotation {
  id: string;
  startPoint: { x: number; y: number };
  textBox: { x: number; y: number };
  text: string;
  isEditing: boolean;
  blockId?: string;
}

function App() {
  const editor = useCreateBlockNote({ 
    schema,
    initialContent: initialContent as any
  });
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [textboxes, setTextboxes] = useState<any[]>([]);
  const [mode, setMode] = useState<'comment-mode' | 'textbox-mode' | 'scribble-mode' | 'no-annotation-mode'>('no-annotation-mode');
  const [showTutorial, setShowTutorial] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add clipboard paste handler
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      // Only handle paste if we're focused in the editor
      if (!editor.getTextCursorPosition()) return;
      
      const items = Array.from(e.clipboardData?.items || []);
      const imageItem = items.find(item => item.type.startsWith('image'));
      
      if (imageItem) {
        // Check if we're pasting onto an imageUpload block
        const currentBlock = editor.getTextCursorPosition()?.block;
        if (currentBlock?.type === 'imageUpload') {
          // Let the imageUpload block handle it
          return;
        }

        e.preventDefault();
        const blob = imageItem.getAsFile();
        if (!blob) return;

        try {
          // Create a promise to handle the image loading
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            const timeoutId = setTimeout(() => {
              reject(new Error("File reading timed out"));
            }, 5000); // 5 second timeout

            reader.onload = () => {
              clearTimeout(timeoutId);
              if (typeof reader.result === 'string') {
                resolve(reader.result);
              } else {
                reject(new Error("Invalid file data"));
              }
            };
            reader.onerror = () => {
              clearTimeout(timeoutId);
              reject(reader.error);
            };
            reader.readAsDataURL(blob);
          });

          // Validate the image before inserting
          await new Promise<void>((resolve, reject) => {
            const img = document.createElement('img');
            const timeoutId = setTimeout(() => {
              reject(new Error("Image loading timed out"));
            }, 10000); // 10 second timeout

            img.onload = () => {
              clearTimeout(timeoutId);
              // Get the current block
              const currentBlock = editor.getTextCursorPosition()?.block;
              if (!currentBlock) {
                reject(new Error("No current block found"));
                return;
              }

              // Create and insert the image upload block with a slight delay
              setTimeout(() => {
                editor.insertBlocks(
                  [{
                    type: "imageUpload",
                    props: {
                      src: dataUrl,
                      width: img.naturalWidth,
                      height: img.naturalHeight
                    }
                  } as unknown as PartialBlock],
                  currentBlock,
                  "after"
                );
                resolve();
              }, 100);
            };

            img.onerror = () => {
              clearTimeout(timeoutId);
              reject(new Error("Failed to load image"));
            };

            img.src = dataUrl;
          });
        } catch (error) {
          console.error("Error processing pasted image:", error);
          // You might want to show a toast or some UI feedback here
        }
      }
    };

    // Use capture phase to ensure we handle the event before other handlers
    document.addEventListener('paste', handlePaste, true);
    return () => document.removeEventListener('paste', handlePaste, true);
  }, [editor]);

  // Add drag and drop handler for the editor
  useEffect(() => {
    const handleDragOver = (e: Event) => {
      const dragEvent = e as DragEvent;
      dragEvent.preventDefault();
      dragEvent.stopPropagation();
    };

    const handleDrop = async (e: Event) => {
      const dragEvent = e as DragEvent;
      dragEvent.preventDefault();
      dragEvent.stopPropagation();

      // Get the current block based on drop position
      const editorElement = document.querySelector('.blocknote-editor');
      if (!editorElement) return;

      const editorRect = editorElement.getBoundingClientRect();
      const dropY = dragEvent.clientY - editorRect.top + editorElement.scrollTop;

      // Find the block closest to the drop position
      const blocks = editor.document;
      const blockElements = editorElement.querySelectorAll('.bn-block');
      let targetBlock = blocks[0];
      let minDistance = Infinity;

      blockElements.forEach((element, index) => {
        const rect = element.getBoundingClientRect();
        const blockMiddle = rect.top + rect.height / 2 - editorRect.top;
        const distance = Math.abs(dropY - blockMiddle);
        if (distance < minDistance) {
          minDistance = distance;
          targetBlock = blocks[index];
        }
      });

      if (!targetBlock) return;

      // Check if we're dropping onto an imageUpload block
      if (targetBlock.type === 'imageUpload') {
        // Let the imageUpload block handle it
        return;
      }

      const items = Array.from(dragEvent.dataTransfer?.items || []);
      const files = Array.from(dragEvent.dataTransfer?.files || []);
      
      // First try to get image from items (for URLs)
      const imageItem = items.find(item => item.type.startsWith('image'));
      if (imageItem) {
        const file = imageItem.getAsFile();
        if (file) {
          try {
            // Create a promise to handle the image loading
            const dataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              const timeoutId = setTimeout(() => {
                reject(new Error("File reading timed out"));
              }, 5000); // 5 second timeout

              reader.onload = () => {
                clearTimeout(timeoutId);
                if (typeof reader.result === 'string') {
                  resolve(reader.result);
                } else {
                  reject(new Error("Invalid file data"));
                }
              };
              reader.onerror = () => {
                clearTimeout(timeoutId);
                reject(reader.error);
              };
              reader.readAsDataURL(file);
            });

            // Validate the image before inserting
            await new Promise<void>((resolve, reject) => {
              const img = document.createElement('img');
              const timeoutId = setTimeout(() => {
                reject(new Error("Image loading timed out"));
              }, 10000); // 10 second timeout

              img.onload = () => {
                clearTimeout(timeoutId);
                // Get the drop position relative to the target block
                const blockElement = blockElements[blocks.indexOf(targetBlock)];
                const blockRect = blockElement.getBoundingClientRect();
                const dropPosition = dropY > blockRect.top + blockRect.height / 2 ? "after" : "before";

                // Insert the block with a slight delay
                setTimeout(() => {
                  editor.insertBlocks(
                    [{
                      type: "imageUpload",
                      props: {
                        src: dataUrl,
                        width: img.naturalWidth,
                        height: img.naturalHeight
                      }
                    } as unknown as PartialBlock],
                    targetBlock,
                    dropPosition
                  );
                  resolve();
                }, 100);
              };

              img.onerror = () => {
                clearTimeout(timeoutId);
                reject(new Error("Failed to load image"));
              };

              img.src = dataUrl;
            });
          } catch (error) {
            console.error("Error processing dropped image:", error);
            // You might want to show a toast or some UI feedback here
          }
          return;
        }
      }

      // Then try to get image from files
      const imageFile = files.find(file => file.type.startsWith('image/'));
      if (imageFile) {
        try {
          // Create a promise to handle the image loading
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            const timeoutId = setTimeout(() => {
              reject(new Error("File reading timed out"));
            }, 5000); // 5 second timeout

            reader.onload = () => {
              clearTimeout(timeoutId);
              if (typeof reader.result === 'string') {
                resolve(reader.result);
              } else {
                reject(new Error("Invalid file data"));
              }
            };
            reader.onerror = () => {
              clearTimeout(timeoutId);
              reject(reader.error);
            };
            reader.readAsDataURL(imageFile);
          });

          // Validate the image before inserting
          await new Promise<void>((resolve, reject) => {
            const img = document.createElement('img');
            const timeoutId = setTimeout(() => {
              reject(new Error("Image loading timed out"));
            }, 10000); // 10 second timeout

            img.onload = () => {
              clearTimeout(timeoutId);
              // Get the drop position relative to the target block
              const blockElement = blockElements[blocks.indexOf(targetBlock)];
              const blockRect = blockElement.getBoundingClientRect();
              const dropPosition = dropY > blockRect.top + blockRect.height / 2 ? "after" : "before";

              // Insert the block with a slight delay
              setTimeout(() => {
                editor.insertBlocks(
                  [{
                    type: "imageUpload",
                    props: {
                      src: dataUrl,
                      width: img.naturalWidth,
                      height: img.naturalHeight
                    }
                  } as unknown as PartialBlock],
                  targetBlock,
                  dropPosition
                );
                resolve();
              }, 100);
            };

            img.onerror = () => {
              clearTimeout(timeoutId);
              reject(new Error("Failed to load image"));
            };

            img.src = dataUrl;
          });
        } catch (error) {
          console.error("Error processing dropped image file:", error);
          // You might want to show a toast or some UI feedback here
        }
        return;
      }

      // Finally try to get image from URL
      const url = dragEvent.dataTransfer?.getData('text/uri-list') || dragEvent.dataTransfer?.getData('text/plain');
      if (url && url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        try {
          // Validate the image before inserting
          await new Promise<void>((resolve, reject) => {
            const img = document.createElement('img');
            const timeoutId = setTimeout(() => {
              reject(new Error("Image loading timed out"));
            }, 10000); // 10 second timeout

            img.onload = () => {
              clearTimeout(timeoutId);
              // Get the drop position relative to the target block
              const blockElement = blockElements[blocks.indexOf(targetBlock)];
              const blockRect = blockElement.getBoundingClientRect();
              const dropPosition = dropY > blockRect.top + blockRect.height / 2 ? "after" : "before";

              // Insert the block with a slight delay
              setTimeout(() => {
                editor.insertBlocks(
                  [{
                    type: "imageUpload",
                    props: {
                      src: url,
                      width: img.naturalWidth,
                      height: img.naturalHeight
                    }
                  } as unknown as PartialBlock],
                  targetBlock,
                  dropPosition
                );
                resolve();
              }, 100);
            };

            img.onerror = () => {
              clearTimeout(timeoutId);
              reject(new Error("Failed to load image"));
            };

            img.src = url;
          });
        } catch (error) {
          console.error("Error processing dropped image URL:", error);
          // You might want to show a toast or some UI feedback here
        }
      }
    };

    const editorElement = document.querySelector('.blocknote-editor');
    if (editorElement) {
      editorElement.addEventListener('dragover', handleDragOver);
      editorElement.addEventListener('drop', handleDrop);

      return () => {
        editorElement.removeEventListener('dragover', handleDragOver);
        editorElement.removeEventListener('drop', handleDrop);
      };
    }
  }, [editor]);

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

  const setIsScribbleMode = (value: boolean | ((prev: boolean) => boolean)) => {
    if (typeof value === 'function') {
      const newValue = value(mode === 'scribble-mode');
      setMode(newValue ? 'scribble-mode' : 'no-annotation-mode');
    } else {
      setMode(value ? 'scribble-mode' : 'no-annotation-mode');
    }
  };

  // Helper function to check if a mode is active
  const isModeActive = (modeToCheck: 'comment-mode' | 'textbox-mode' | 'scribble-mode') => {
    return mode === modeToCheck;
  };

  const handleExport = async () => {
    // Get all drawing blocks and their canvas data
    const drawingBlocks = editor.document.filter(block => block.type === 'drawing');

    // Get scribble overlay canvas data
    const scribbleCanvas = document.querySelector('.blocknote-container > div > canvas') as HTMLCanvasElement;
    let scribbleData = null;
    if (scribbleCanvas) {
      const ctx = scribbleCanvas.getContext('2d');
      if (ctx) {
        const imageData = ctx.getImageData(0, 0, scribbleCanvas.width, scribbleCanvas.height);
        const editorContainer = document.querySelector('.blocknote-container') as HTMLElement;
        const editorRect = editorContainer?.getBoundingClientRect();
        
        // Store the original canvas style dimensions
        const originalWidth = scribbleCanvas.style.width;
        const originalHeight = scribbleCanvas.style.height;
        const originalTransform = scribbleCanvas.style.transform;
        
        scribbleData = {
          width: scribbleCanvas.width,
          height: scribbleCanvas.height,
          styleWidth: originalWidth,
          styleHeight: originalHeight,
          transform: originalTransform,
          pixelData: Array.from(imageData.data),
          viewport: {
            scrollHeight: document.documentElement.scrollHeight,
            scrollWidth: document.documentElement.scrollWidth,
            clientHeight: document.documentElement.clientHeight,
            clientWidth: document.documentElement.clientWidth,
            editorHeight: editorRect?.height || 0,
            editorWidth: editorRect?.width || 0,
            devicePixelRatio: window.devicePixelRatio
          }
        };
      }
    }

    const data = {
      blocks: editor.document,
      annotations,
      textboxes,
      drawingData: drawingBlocks.map(block => {
        const blockElement = document.querySelector(`.bn-block[data-id="${block.id}"]`);
        const canvas = blockElement?.querySelector('canvas') as HTMLCanvasElement;
        if (!canvas) return null;

        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        return {
          blockId: block.id,
          width: canvas.width,
          height: canvas.height,
          pixelData: Array.from(imageData.data)
        };
      }).filter(Boolean),
      scribbleData
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

    if (!window.confirm('Importing a file will replace all existing content. Are you sure you want to continue?')) {
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        if (data.blocks) {
          editor.replaceBlocks(editor.document, data.blocks);
          
          // Wait for blocks to be rendered before restoring annotations
          const observer = new MutationObserver((_, obs) => {
            const editorElement = document.querySelector('.blocknote-editor');
            if (!editorElement) return;

            // Restore annotations and textboxes
            if (data.annotations) setAnnotations(data.annotations);
            if (data.textboxes) setTextboxes(data.textboxes);
            
            // Restore drawing data
            if (data.drawingData) {
              data.drawingData.forEach((drawing: any) => {
                const blockElement = document.querySelector(`.bn-block[data-id="${drawing.blockId}"]`);
                const canvas = blockElement?.querySelector('canvas') as HTMLCanvasElement;
                if (!canvas || !drawing.pixelData) return;

                canvas.width = drawing.width;
                canvas.height = drawing.height;
                
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                const imageData = new ImageData(
                  new Uint8ClampedArray(drawing.pixelData),
                  drawing.width,
                  drawing.height
                );
                ctx.putImageData(imageData, 0, 0);
              });
            }

            // Restore scribble overlay data
            if (data.scribbleData) {
              const scribbleCanvas = document.querySelector('.blocknote-container > div > canvas') as HTMLCanvasElement;
              if (scribbleCanvas && data.scribbleData.pixelData) {
                // Set the canvas dimensions and styles
                scribbleCanvas.width = data.scribbleData.width;
                scribbleCanvas.height = data.scribbleData.height;
                if (data.scribbleData.styleWidth) scribbleCanvas.style.width = data.scribbleData.styleWidth;
                if (data.scribbleData.styleHeight) scribbleCanvas.style.height = data.scribbleData.styleHeight;
                if (data.scribbleData.transform) scribbleCanvas.style.transform = data.scribbleData.transform;

                const ctx = scribbleCanvas.getContext('2d');
                if (ctx) {
                  const imageData = new ImageData(
                    new Uint8ClampedArray(data.scribbleData.pixelData),
                    data.scribbleData.width,
                    data.scribbleData.height
                  );
                  ctx.putImageData(imageData, 0, 0);
                }
              }
            }

            obs.disconnect();
            alert('Notes imported successfully!');
          });

          observer.observe(document.body, {
            childList: true,
            subtree: true
          });
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
        right: '24px', 
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <Tooltip text="Export Notes">
          <button
            onClick={handleExport}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              margin: 0,
              cursor: 'pointer',
              outline: 'none',
              borderRadius: '12px',
              width: 56,
              height: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
              backgroundColor: '#fff',
            }}
            aria-label="Export Notes"
          >
            <HiSave size={24} color="#5A5A5A" />
          </button>
        </Tooltip>
        <Tooltip text="Import Notes">
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              margin: 0,
              cursor: 'pointer',
              outline: 'none',
              borderRadius: '12px',
              width: 56,
              height: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
              backgroundColor: '#fff',
            }}
            aria-label="Import Notes"
          >
            <HiUpload size={24} color="#5A5A5A" />
          </button>
        </Tooltip>
        <Tooltip text="Show Help">
          <button
            onClick={() => setShowTutorial(true)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              margin: 0,
              cursor: 'pointer',
              outline: 'none',
              borderRadius: '12px',
              width: 56,
              height: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
              backgroundColor: '#fff',
            }}
            aria-label="Show Help"
          >
            <HiQuestionMarkCircle size={24} color="#5A5A5A" />
          </button>
        </Tooltip>
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
        textboxes={textboxes}
        setTextboxes={setTextboxes}
        isTextboxMode={isModeActive('textbox-mode')}
        setIsTextboxMode={setIsTextboxMode}
      />
      <ScribbleOverlay
        isScribbleMode={isModeActive('scribble-mode')}
        setIsScribbleMode={setIsScribbleMode}
      />
    </div>
  );
}

export default App;
