import {
    createReactBlockSpec,
    type ReactCustomBlockImplementation,
  } from "@blocknote/react";
  import React, { useRef, useState } from "react";
  import { DrawingCanvas } from "./Drawing.tsx"; // Make sure this path is correct
  
  const imageUploadBlockSpec = {
    type: "imageUpload",
    propSchema: {
      src: { default: "" },
    },
    content: "none" as const,
  };
  
  const ImageUploadCanvas = ({ block, editor }: any) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isHovered, setIsHovered] = useState(false);
  
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
  
      if (!file.type.startsWith("image/")) {
        alert("Please upload a valid image file.");
        return;
      }
  
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          // ✅ Store image in the block props
          editor.updateBlock(block, {
            props: {
              ...block.props,
              src: reader.result,
            },
          });
        }
      };
      reader.readAsDataURL(file);
    };
  
    const handleUploadClick = () => {
      inputRef.current?.click();
    };
  
    const uploaded = Boolean(block.props.src);
  
    return uploaded ? (
        <DrawingCanvas backgroundImage={block.props.src} />
      ) : (
<div
  contentEditable={false}
  onMouseEnter={() => setIsHovered(true)}
  onMouseLeave={() => setIsHovered(false)}
  style={{
    fontFamily: "'Inter', sans-serif",
    position: "relative",
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center", // ✅ left-align content
    flexDirection: "column",
    gap: 10,
    width: "100%",
    maxWidth: 400,
    margin: "20px", // ✅ no auto-centering
    padding: 20,
    borderRadius: 12,
    border: "1px solid #e0e0e0",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    backgroundColor: "#ffffff",
    textAlign: "left", // ✅ left text alignment
    transition: "box-shadow 0.2s ease-in-out",
  }}
>
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
  