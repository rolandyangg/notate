import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import "./App.css";

export default function App() {
  // Creates a new editor instance.
  const editor = useCreateBlockNote();

  // Renders the editor instance using a React component.
  return (
    <div className="blocknote-container">
      <BlockNoteView 
        editor={editor}
        theme="light"
        className="blocknote-editor"
      />
    </div>
  );
}