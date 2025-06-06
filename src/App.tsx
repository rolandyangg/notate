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

      const items = Array.from(dragEvent.dataTransfer?.items || []);
      const files = Array.from(dragEvent.dataTransfer?.files || []);
      
      // First try to get image from items (for URLs)
      const imageItem = items.find(item => item.type.startsWith('image'));
      if (imageItem) {
        const file = imageItem.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              // Get the drop position relative to the target block
              const blockElement = blockElements[blocks.indexOf(targetBlock)];
              const blockRect = blockElement.getBoundingClientRect();
              const dropPosition = dropY > blockRect.top + blockRect.height / 2 ? "after" : "before";

              editor.insertBlocks(
                [{
                  type: "imageUpload",
                  props: {
                    src: reader.result
                  }
                } as unknown as PartialBlock],
                targetBlock,
                dropPosition
              );
            }
          };
          reader.readAsDataURL(file);
          return;
        }
      }

      // Then try to get image from files
      const imageFile = files.find(file => file.type.startsWith('image/'));
      if (imageFile) {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            // Get the drop position relative to the target block
            const blockElement = blockElements[blocks.indexOf(targetBlock)];
            const blockRect = blockElement.getBoundingClientRect();
            const dropPosition = dropY > blockRect.top + blockRect.height / 2 ? "after" : "before";

            editor.insertBlocks(
              [{
                type: "imageUpload",
                props: {
                  src: reader.result
                }
              } as unknown as PartialBlock],
              targetBlock,
              dropPosition
            );
          }
        };
        reader.readAsDataURL(imageFile);
        return;
      }

      // Finally try to get image from URL
      const url = dragEvent.dataTransfer?.getData('text/uri-list') || dragEvent.dataTransfer?.getData('text/plain');
      if (url && url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        // Get the drop position relative to the target block
        const blockElement = blockElements[blocks.indexOf(targetBlock)];
        const blockRect = blockElement.getBoundingClientRect();
        const dropPosition = dropY > blockRect.top + blockRect.height / 2 ? "after" : "before";

        editor.insertBlocks(
          [{
            type: "imageUpload",
            props: {
              src: url
            }
          } as unknown as PartialBlock],
          targetBlock,
          dropPosition
        );
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
    // Debug state variables
    console.log('Current state variables:', {
      annotations: {
        raw: annotations,
        length: annotations.length,
        firstItem: annotations[0]
      },
      textboxes: {
        raw: textboxes,
        length: textboxes.length,
        firstItem: textboxes[0]
      }
    });

    // Get all drawing blocks and their canvas data
    const drawingBlocks = editor.document.filter(block => block.type === 'drawing');
    console.log('Found drawing blocks:', drawingBlocks.length);
    console.log('Drawing blocks details:', drawingBlocks.map(block => ({
      id: block.id,
      type: block.type,
      props: block.props
    })));

    // Get scribble overlay canvas data
    const scribbleCanvas = document.querySelector('.blocknote-container > div > canvas') as HTMLCanvasElement;
    let scribbleData = null;
    if (scribbleCanvas) {
      const ctx = scribbleCanvas.getContext('2d');
      if (ctx) {
        const imageData = ctx.getImageData(0, 0, scribbleCanvas.width, scribbleCanvas.height);
        const editorContainer = document.querySelector('.blocknote-container') as HTMLElement;
        const editorRect = editorContainer?.getBoundingClientRect();
        
        scribbleData = {
          width: scribbleCanvas.width,
          height: scribbleCanvas.height,
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
        console.log('Scribble overlay data:', {
          width: scribbleCanvas.width,
          height: scribbleCanvas.height,
          pixelDataLength: imageData.data.length,
          viewport: scribbleData.viewport
        });
      }
    } else {
      console.log('Scribble canvas not found');
    }

    // Log annotation tools data
    console.log('Exporting annotation tools data:', {
      annotations: {
        count: annotations.length,
        details: annotations.map(ann => ({
          id: ann.id,
          type: ann.type,
          startPoint: ann.startPoint,
          textBox: ann.textBox,
          text: ann.text,
          isEditing: ann.isEditing
        }))
      },
      textboxes: {
        count: textboxes.length,
        details: textboxes.map(tb => ({
          id: tb.id,
          x: tb.x,
          y: tb.y,
          text: tb.text,
          isEditing: tb.isEditing
        }))
      },
      scribbleData: scribbleData ? {
        width: scribbleData.width,
        height: scribbleData.height,
        pixelDataLength: scribbleData.pixelData.length
      } : null
    });

    // Debug DOM structure
    const editorElement = document.querySelector('.blocknote-editor');
    console.log('Editor element found:', !!editorElement);
    if (editorElement) {
      // Find all block containers
      const allBlockElements = editorElement.querySelectorAll('.bn-block[data-id]');
      console.log('All block elements found:', allBlockElements.length);
      allBlockElements.forEach(el => {
        console.log('Block element:', {
          id: el.getAttribute('data-id'),
          type: el.querySelector('.bn-block-content')?.getAttribute('data-content-type'),
          html: el.outerHTML
        });
      });
    }

    // Wait for blocks to be rendered
    const waitForBlocks = () => {
      return new Promise<void>((resolve) => {
        const checkBlocks = () => {
          const allBlocksRendered = drawingBlocks.every(block => {
            // Find the block container
            const blockElement = editorElement?.querySelector(`.bn-block[data-id="${block.id}"]`);
            // Find the canvas within the block's content
            const canvas = blockElement?.querySelector('canvas');
            const isRendered = blockElement && canvas;
            if (!isRendered) {
              console.log('Block not rendered:', {
                blockId: block.id,
                blockElementFound: !!blockElement,
                canvasFound: !!canvas
              });
            }
            return isRendered;
          });

          if (allBlocksRendered) {
            resolve();
          } else {
            setTimeout(checkBlocks, 100);
          }
        };
        checkBlocks();
      });
    };

    // Wait for blocks to be rendered (with a timeout)
    try {
      await Promise.race([
        waitForBlocks(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
    } catch (error) {
      console.error('Timeout waiting for blocks to render');
    }

    const drawingData = drawingBlocks.map(block => {
      // Find the block container
      const blockElement = editorElement?.querySelector(`.bn-block[data-id="${block.id}"]`);
      console.log('Block element found:', !!blockElement, 'for block ID:', block.id);
      console.log('Block element HTML:', blockElement?.outerHTML);
      
      const canvas = blockElement?.querySelector('canvas') as HTMLCanvasElement;
      console.log('Canvas found:', !!canvas, 'for block ID:', block.id);
      console.log('Canvas HTML:', canvas?.outerHTML);
      
      if (!canvas) return null;

      // Ensure the canvas is properly initialized
      const ctx = canvas.getContext('2d');
      console.log('Canvas context found:', !!ctx, 'for block ID:', block.id);
      
      if (!ctx) return null;

      // Get the raw pixel data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      console.log('ImageData dimensions:', {
        width: canvas.width,
        height: canvas.height,
        dataLength: imageData.data.length
      }, 'for block ID:', block.id);

      // Verify the drawing content
      const pixelData = imageData.data;
      let nonTransparentPixels = 0;
      let totalPixels = pixelData.length / 4; // Each pixel has 4 values (RGBA)
      
      // Count non-transparent pixels (where alpha > 0)
      for (let i = 3; i < pixelData.length; i += 4) {
        if (pixelData[i] > 0) {
          nonTransparentPixels++;
        }
      }
      
      console.log('Drawing content verification:', {
        totalPixels,
        nonTransparentPixels,
        percentageDrawn: (nonTransparentPixels / totalPixels * 100).toFixed(2) + '%',
        // Sample some pixel values to verify content
        samplePixels: Array.from(pixelData.slice(0, 20)) // First 5 pixels (20 values)
      });

      return {
        blockId: block.id,
        width: canvas.width,
        height: canvas.height,
        pixelData: Array.from(imageData.data)
      };
    }).filter(Boolean);

    console.log('Final drawing data to export:', drawingData);

    const data = {
      blocks: editor.document,
      annotations: annotations.map(ann => ({
        id: ann.id,
        type: ann.type,
        startPoint: ann.startPoint,
        textBox: ann.textBox,
        text: ann.text,
        isEditing: ann.isEditing
      })),
      textboxes: textboxes.map(tb => ({
        id: tb.id,
        x: tb.x,
        y: tb.y,
        text: tb.text,
        isEditing: tb.isEditing
      })),
      drawingData: drawingData,
      scribbleData: scribbleData
    };

    console.log('Final export data:', {
      blocksCount: data.blocks.length,
      annotationsCount: data.annotations.length,
      textboxesCount: data.textboxes.length,
      drawingDataCount: data.drawingData.length,
      hasScribbleData: !!data.scribbleData
    });

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'notes.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Show success message
    alert('Notes exported successfully!');
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Show confirmation dialog
    if (!window.confirm('Importing a file will replace all existing content. Are you sure you want to continue?')) {
      // Reset the file input
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        console.log('Imported data:', {
          blocks: data.blocks?.length,
          annotations: data.annotations?.length,
          textboxes: data.textboxes?.length,
          drawingData: data.drawingData?.length,
          hasScribbleData: !!data.scribbleData,
          firstDrawingData: data.drawingData?.[0] ? {
            blockId: data.drawingData[0].blockId,
            width: data.drawingData[0].width,
            height: data.drawingData[0].height,
            pixelDataLength: data.drawingData[0].pixelData.length,
            samplePixels: data.drawingData[0].pixelData.slice(0, 20) // First 5 pixels
          } : null
        });

        if (data.blocks) {
          editor.replaceBlocks(editor.document, data.blocks);
          
          // Wait for blocks to be rendered before restoring annotations
          const observer = new MutationObserver((_, obs) => {
            const editorElement = document.querySelector('.blocknote-editor');
            if (!editorElement) return;

            const editorRect = editorElement.getBoundingClientRect();
            const blockElements = editorElement.querySelectorAll('.bn-block');
            const blocks = editor.document;

            // Get block positions
            const blockPositions = Array.from(blockElements).map((element, index) => {
              const rect = element.getBoundingClientRect();
              const blockId = blocks[index]?.id;
              
              return {
                index,
                top: rect.top - editorRect.top,
                height: rect.height,
                blockId
              };
            });

            // Restore annotations with adjusted positions
            if (data.annotations) {
              const adjustedAnnotations = data.annotations.map((annotation: Annotation) => {
                if (!annotation.blockId) return annotation;

                const blockPosition = blockPositions.find(pos => pos.blockId === annotation.blockId);
                if (!blockPosition) return annotation;

                // Adjust the y positions based on the block's new position
                return {
                  ...annotation,
                  startPoint: {
                    ...annotation.startPoint,
                    y: blockPosition.top + (annotation.startPoint.y % blockPosition.height)
                  },
                  textBox: {
                    ...annotation.textBox,
                    y: blockPosition.top + (annotation.textBox.y % blockPosition.height)
                  }
                };
              });

              setAnnotations(adjustedAnnotations);
              console.log('Restored annotations with adjusted positions:', adjustedAnnotations.length);
            }

            // Restore textboxes
            if (data.textboxes) {
              setTextboxes(data.textboxes);
              console.log('Restored textboxes:', data.textboxes.length);
            }
            
            // Restore drawing data
            if (data.drawingData) {
              const drawingBlocks = editor.document.filter(block => block.type === 'drawing');
              console.log('Checking for drawing blocks to restore:', drawingBlocks.length);
              
              const renderedBlocks = drawingBlocks.every(block => {
                const blockElement = document.querySelector(`.bn-block[data-id="${block.id}"]`);
                const canvas = blockElement?.querySelector('canvas') as HTMLCanvasElement;
                const isRendered = blockElement && canvas;
                
                if (!isRendered) {
                  console.log('Block not yet rendered:', {
                    blockId: block.id,
                    blockElementFound: !!blockElement,
                    canvasFound: !!canvas
                  });
                }
                
                return isRendered;
              });

              if (renderedBlocks) {
                console.log('All blocks rendered, restoring drawing data');
                data.drawingData.forEach((drawing: { blockId: string; width: number; height: number; pixelData: number[] }) => {
                  const blockElement = document.querySelector(`.bn-block[data-id="${drawing.blockId}"]`);
                  const canvas = blockElement?.querySelector('canvas') as HTMLCanvasElement;
                  if (canvas) {
                    console.log('Restoring drawing for block:', {
                      blockId: drawing.blockId,
                      width: drawing.width,
                      height: drawing.height,
                      pixelDataLength: drawing.pixelData.length
                    });

                    // Set canvas dimensions
                    canvas.width = drawing.width;
                    canvas.height = drawing.height;
                    
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                      console.error('Failed to get canvas context');
                      return;
                    }

                    // Create ImageData from the saved pixel data
                    const imageData = new ImageData(
                      new Uint8ClampedArray(drawing.pixelData),
                      drawing.width,
                      drawing.height
                    );

                    // Put the image data back on the canvas
                    ctx.putImageData(imageData, 0, 0);

                    // Verify the restoration
                    const restoredImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    let nonTransparentPixels = 0;
                    for (let i = 3; i < restoredImageData.data.length; i += 4) {
                      if (restoredImageData.data[i] > 0) {
                        nonTransparentPixels++;
                      }
                    }
                    console.log('Restoration verification:', {
                      totalPixels: restoredImageData.data.length / 4,
                      nonTransparentPixels,
                      percentageDrawn: (nonTransparentPixels / (restoredImageData.data.length / 4) * 100).toFixed(2) + '%'
                    });
                  } else {
                    console.error('Canvas not found for block:', drawing.blockId);
                  }
                });

                // Restore scribble overlay data if present
                if (data.scribbleData) {
                  const scribbleCanvas = document.querySelector('.blocknote-container > div > canvas') as HTMLCanvasElement;
                  if (scribbleCanvas) {
                    const ctx = scribbleCanvas.getContext('2d');
                    if (ctx) {
                      // First, ensure the document has the correct scroll height
                      const originalViewport = data.scribbleData.viewport;
                      
                      // Force a reflow to ensure correct document height
                      document.body.style.minHeight = `${originalViewport.scrollHeight}px`;
                      
                      // Immediately scroll to simulate the original scroll position
                      const scrollRatio = originalViewport.scrollHeight > 0 
                        ? window.scrollY / originalViewport.scrollHeight 
                        : 0;
                      const targetScroll = Math.round(document.documentElement.scrollHeight * scrollRatio);
                      window.scrollTo(0, targetScroll);

                      // Wait for scroll and reflow to complete
                      requestAnimationFrame(() => {
                        // Calculate scale factors based on viewport changes
                        const currentViewport = {
                          scrollHeight: document.documentElement.scrollHeight,
                          scrollWidth: document.documentElement.scrollWidth,
                          clientHeight: document.documentElement.clientHeight,
                          clientWidth: document.documentElement.clientWidth,
                          devicePixelRatio: window.devicePixelRatio
                        };
                        
                        // Calculate scaling factors
                        const heightScale = currentViewport.scrollHeight / originalViewport.scrollHeight;
                        const widthScale = currentViewport.scrollWidth / originalViewport.scrollWidth;
                        const dprScale = currentViewport.devicePixelRatio / originalViewport.devicePixelRatio;

                        // Set canvas dimensions accounting for viewport changes
                        const scaledWidth = data.scribbleData.width * widthScale;
                        const scaledHeight = data.scribbleData.height * heightScale;
                        
                        // Update canvas style first to maintain aspect ratio
                        scribbleCanvas.style.width = `${scaledWidth / currentViewport.devicePixelRatio}px`;
                        scribbleCanvas.style.height = `${scaledHeight / currentViewport.devicePixelRatio}px`;
                        
                        // Set actual canvas dimensions
                        scribbleCanvas.width = scaledWidth;
                        scribbleCanvas.height = scaledHeight;
                        
                        // Initialize drawing settings
                        ctx.scale(currentViewport.devicePixelRatio, currentViewport.devicePixelRatio);
                        ctx.strokeStyle = '#000000';
                        ctx.lineWidth = 2;
                        ctx.lineCap = 'round';
                        ctx.lineJoin = 'round';

                        // Create a temporary canvas to scale the image data
                        const tempCanvas = document.createElement('canvas');
                        tempCanvas.width = data.scribbleData.width;
                        tempCanvas.height = data.scribbleData.height;
                        const tempCtx = tempCanvas.getContext('2d');
                        
                        if (tempCtx) {
                          // Put original image data into temp canvas
                          const imageData = new ImageData(
                            new Uint8ClampedArray(data.scribbleData.pixelData),
                            data.scribbleData.width,
                            data.scribbleData.height
                          );
                          tempCtx.putImageData(imageData, 0, 0);

                          // Scale and draw the image onto the main canvas
                          ctx.save();
                          ctx.scale(1/currentViewport.devicePixelRatio, 1/currentViewport.devicePixelRatio);
                          ctx.drawImage(
                            tempCanvas, 
                            0, 
                            0, 
                            data.scribbleData.width, 
                            data.scribbleData.height, 
                            0, 
                            0, 
                            scaledWidth * currentViewport.devicePixelRatio, 
                            scaledHeight * currentViewport.devicePixelRatio
                          );
                          ctx.restore();

                          console.log('Restored scribble overlay data with viewport scaling:', {
                            originalDimensions: {
                              width: data.scribbleData.width,
                              height: data.scribbleData.height
                            },
                            scaledDimensions: {
                              width: scaledWidth,
                              height: scaledHeight
                            },
                            scaleFactors: {
                              width: widthScale,
                              height: heightScale,
                              dpr: dprScale
                            },
                            scroll: {
                              original: originalViewport.scrollHeight,
                              current: currentViewport.scrollHeight,
                              targetScroll
                            }
                          });
                        }
                      });
                    }
                  } else {
                    console.error('Scribble canvas not found for restoration');
                  }
                }
              }
            }
            
            // Disconnect the observer once we're done
            obs.disconnect();

            // Show success message
            alert('Notes imported successfully!');
          });

          // Start observing the document for changes
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
