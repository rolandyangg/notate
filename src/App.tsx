import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";

function App() {
  // Creates a new editor instance.
  const editor = useCreateBlockNote();

  return (
    <>
      <div className="blocknote-container">
        <BlockNoteView 
          editor={editor}
          theme="light"
          className="blocknote-editor"
          // editable={true}
          // onSelectionChange={() => {
          //   const selection = editor.getSelection();
          //   console.log(selection);
          // }}
        />
      </div>
    </>
  )
}

export default App
