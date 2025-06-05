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

    const validateAndUpdateImage = (dataUrl: string) => {
      return new Promise<void>((resolve, reject) => {
        const img = document.createElement('img');
        img.onload = () => {
          editor.updateBlock(block, {
            props: {
              ...block.props,
              src: dataUrl,
              canvasData: "",
              width: img.naturalWidth,
              height: img.naturalHeight
            }
          });
          setImageError(null);
          resolve();
        };
        img.onerror = () => {
          reject(new Error("Failed to load image"));
        };
        img.src = dataUrl;
      });
    };

    // Handle clipboard paste events
    useEffect(() => {
      const handlePaste = async (e: ClipboardEvent) => {
        // Check if the paste event target is within our component
        if (!containerRef.current?.contains(e.target as Node)) return;

        const items = Array.from(e.clipboardData?.items || []);
        const imageItem = items.find(item => item.type.startsWith('image'));
        
        if (imageItem) {
          e.preventDefault();
          const blob = imageItem.getAsFile();
          if (!blob) return;

          try {
            const dataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                if (typeof reader.result === 'string') {
                  resolve(reader.result);
                } else {
                  reject(new Error("Invalid file data"));
                }
              };
              reader.onerror = () => reject(reader.error);
              reader.readAsDataURL(blob);
            });

            await validateAndUpdateImage(dataUrl);
          } catch (error) {
            console.error("Error processing pasted image:", error);
            setImageError("Failed to process pasted image");
          }
        }
      };

      document.addEventListener('paste', handlePaste);
      return () => document.removeEventListener('paste', handlePaste);
    }, [block, editor]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
  
      if (!file.type.startsWith("image/")) {
        setImageError("Please upload a valid image file.");
        return;
      }
  
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              resolve(reader.result);
            } else {
              reject(new Error("Invalid file data"));
            }
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });

        await validateAndUpdateImage(dataUrl);
      } catch (error) {
        console.error("Error processing uploaded image:", error);
        setImageError("Failed to process uploaded image");
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
            border: "1px solid #e0e0e0",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
            backgroundColor: "#ffffff",
            textAlign: "left",
            transition: "box-shadow 0.2s ease-in-out",
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '10px', color: '#666' }}>
            Click to upload or paste an image from clipboard
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
              transition: "background-color 0.2s ease-in-out",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f2f2f2")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#fff")
            }
          >
            Upload Image
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
  