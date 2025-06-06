import {
    createReactBlockSpec,
    type ReactCustomBlockImplementation,
  } from "@blocknote/react";
  import React, { useRef, useEffect, useState } from "react";
  import { DrawingCanvas } from "./Drawing.tsx"; // Make sure this path is correct
  
  const imageUploadBlockSpec = {
    type: "imageUpload",
    propSchema: {
      src: { default: "" },
      canvasData: { default: "" },
      width: { default: 800 },
      height: { default: 400 }
    },
    content: "none" as const,
  };
  
  const ImageUploadCanvas = ({ block, editor }: any) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [imageError, setImageError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const validateAndUpdateImage = async (dataUrl: string) => {
      setIsLoading(true);
      try {
        // Create a new image and wait for it to load
        await new Promise<void>((resolve, reject) => {
          const img = document.createElement('img');
          
          const timeoutId = setTimeout(() => {
            reject(new Error("Image loading timed out"));
          }, 10000); // 10 second timeout

          img.onload = () => {
            clearTimeout(timeoutId);
            // Update the block with a slight delay to ensure the editor is ready
            setTimeout(() => {
              editor.updateBlock(block, {
                type: "imageUpload",
                props: {
                  src: dataUrl,
                  canvasData: "",
                  width: img.naturalWidth,
                  height: img.naturalHeight
                }
              });
              setImageError(null);
              setIsLoading(false);
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
        console.error("Error processing image:", error);
        setImageError("Failed to process image. Please try again.");
        setIsLoading(false);
        throw error;
      }
    };

    // Handle clipboard paste events
    useEffect(() => {
      const handlePaste = async (e: ClipboardEvent) => {
        // Check if we're the focused block or if the paste happened inside our container
        const isBlockFocused = editor.getTextCursorPosition()?.block?.id === block.id;
        const isPasteInContainer = containerRef.current?.contains(e.target as Node);
        
        // Only handle paste if it's in our block or container
        if (!isBlockFocused && !isPasteInContainer) return;

        const items = Array.from(e.clipboardData?.items || []);
        const imageItem = items.find(item => item.type.startsWith('image'));
        
        if (imageItem) {
          // Stop the event from propagating to prevent double paste
          e.preventDefault();
          e.stopPropagation();
          
          const blob = imageItem.getAsFile();
          if (!blob) return;

          try {
            setIsLoading(true);
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

            await validateAndUpdateImage(dataUrl);
          } catch (error) {
            console.error("Error processing pasted image:", error);
            setImageError("Failed to process pasted image. Please try again.");
            setIsLoading(false);
          }
        }
      };

      // Use capture phase to ensure we handle the event before other handlers
      document.addEventListener('paste', handlePaste, true);
      return () => document.removeEventListener('paste', handlePaste, true);
    }, [block, editor]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
  
      if (!file.type.startsWith("image/")) {
        setImageError("Please upload a valid image file.");
        return;
      }
  
      try {
        setIsLoading(true);
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

        await validateAndUpdateImage(dataUrl);
      } catch (error) {
        console.error("Error processing uploaded image:", error);
        setImageError("Failed to process uploaded image. Please try again.");
        setIsLoading(false);
      }
    };
  
    const handleUploadClick = () => {
      inputRef.current?.click();
    };
  
    const uploaded = Boolean(block.props.src);

    // Validate the existing image if it's already uploaded
    useEffect(() => {
      if (uploaded && block.props.src) {
        validateAndUpdateImage(block.props.src).catch(() => {
          setImageError("Failed to load image");
        });
      }
    }, [block.props.src]);

    // Handle drag and drop events
    useEffect(() => {
      const handleDragEnter = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!uploaded) {
          setIsDragging(true);
        }
      };

      const handleDragLeave = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const target = e.currentTarget as HTMLElement;
        const relatedTarget = e.relatedTarget as Node;
        if (target && !target.contains(relatedTarget)) {
          setIsDragging(false);
        }
      };

      const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
      };

      const handleDrop = async (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (uploaded) return;

        const items = Array.from(e.dataTransfer?.items || []);
        const files = Array.from(e.dataTransfer?.files || []);
        
        // First try to get image from items (for URLs)
        const imageItem = items.find(item => item.type.startsWith('image'));
        if (imageItem) {
          const file = imageItem.getAsFile();
          if (file) {
            try {
              setIsLoading(true);
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

              await validateAndUpdateImage(dataUrl);
            } catch (error) {
              console.error("Error processing dropped image:", error);
              setImageError("Failed to process dropped image. Please try again.");
              setIsLoading(false);
            }
            return;
          }
        }

        // Then try to get image from files
        const imageFile = files.find(file => file.type.startsWith('image/'));
        if (imageFile) {
          try {
            setIsLoading(true);
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

            await validateAndUpdateImage(dataUrl);
          } catch (error) {
            console.error("Error processing dropped image file:", error);
            setImageError("Failed to process dropped image file. Please try again.");
            setIsLoading(false);
          }
          return;
        }

        // Finally try to get image from URL
        const url = e.dataTransfer?.getData('text/uri-list') || e.dataTransfer?.getData('text/plain');
        if (url && url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          try {
            setIsLoading(true);
            await validateAndUpdateImage(url);
          } catch (error) {
            console.error("Error processing dropped image URL:", error);
            setImageError("Failed to process dropped image URL. Please try again.");
            setIsLoading(false);
          }
        }
      };

      const container = containerRef.current;
      if (container) {
        container.addEventListener('dragenter', handleDragEnter);
        container.addEventListener('dragleave', handleDragLeave);
        container.addEventListener('dragover', handleDragOver);
        container.addEventListener('drop', handleDrop);

        return () => {
          container.removeEventListener('dragenter', handleDragEnter);
          container.removeEventListener('dragleave', handleDragLeave);
          container.removeEventListener('dragover', handleDragOver);
          container.removeEventListener('drop', handleDrop);
        };
      }
    }, [uploaded]);
  
    if (imageError) {
      return (
        <div
          ref={containerRef}
          contentEditable={false}
          style={{
            fontFamily: "'Inter', sans-serif",
            position: "relative",
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            flexDirection: "column",
            gap: 10,
            width: "100%",
            maxWidth: 400,
            margin: "20px",
            padding: 20,
            borderRadius: 12,
            border: "1px solid #e0e0e0",
            backgroundColor: "#fff4f4",
            textAlign: "center",
          }}
        >
          <div style={{ color: '#dc3545', marginBottom: '10px' }}>
            {imageError}
          </div>
          <button
            onClick={handleUploadClick}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 14,
              fontWeight: 500,
              backgroundColor: "#fff",
              color: "#333",
              border: "1px solid #ccc",
              borderRadius: 8,
              padding: "10px 16px",
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </div>
      );
    }
  
    return uploaded ? (
        <DrawingCanvas 
          backgroundImage={block.props.src} 
          block={block} 
          editor={editor} 
        />
      ) : (
        <div
          ref={containerRef}
          contentEditable={false}
          style={{
            fontFamily: "'Inter', sans-serif",
            position: "relative",
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            flexDirection: "column",
            gap: 10,
            width: "100%",
            maxWidth: 400,
            margin: "20px",
            padding: 20,
            borderRadius: 12,
            border: isDragging ? "2px dashed #2196F3" : "1px solid #e0e0e0",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
            backgroundColor: isDragging ? "#e3f2fd" : "#ffffff",
            textAlign: "left",
            transition: "all 0.2s ease-in-out",
            opacity: isLoading ? 0.7 : 1,
            pointerEvents: isLoading ? "none" : "auto",
          }}
        >
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '10px', 
            color: isDragging ? '#1976d2' : '#666'
          }}>
            {isLoading ? 'Processing image...' : (isDragging ? 'Drop image here' : 'Click to upload, paste, or drag an image here')}
          </div>
          <button
            onClick={handleUploadClick}
            disabled={isLoading}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 14,
              fontWeight: 500,
              backgroundColor: "#fff",
              color: isLoading ? "#999" : "#333",
              border: "1px solid #ccc",
              borderRadius: 8,
              padding: "10px 16px",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "background-color 0.2s ease-in-out",
              opacity: isLoading ? 0.7 : 1,
            }}
            onMouseEnter={(e) =>
              !isLoading && (e.currentTarget.style.backgroundColor = "#f2f2f2")
            }
            onMouseLeave={(e) =>
              !isLoading && (e.currentTarget.style.backgroundColor = "#fff")
            }
          >
            {isLoading ? 'Processing...' : 'Upload Image'}
          </button>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: "none" }}
            disabled={isLoading}
          />
        </div>
      );
  };
  
  const imageUploadBlockImplementation: ReactCustomBlockImplementation<
    typeof imageUploadBlockSpec, any, any
  > = {
    render: (props) => <ImageUploadCanvas {...props} />,
  };
  
  export const Image = createReactBlockSpec(
    imageUploadBlockSpec,
    imageUploadBlockImplementation
  );
  