import React, { useRef } from 'react';
import type { PartialBlock } from '@blocknote/core';

interface ImageUploadFallbackProps {
  editor: any;
  currentBlock: any;
}

export const ImageUploadFallback: React.FC<ImageUploadFallbackProps> = ({ editor, currentBlock }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          editor.insertBlocks(
            [{
              type: "imageUpload",
              props: {
                src: reader.result
              }
            } as unknown as PartialBlock],
            currentBlock,
            "after"
          );
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 8px',
        border: '1px dashed #ccc',
        borderRadius: '4px',
        cursor: 'pointer',
      }}
      onClick={() => fileInputRef.current?.click()}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
      <span>Upload Image</span>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}; 