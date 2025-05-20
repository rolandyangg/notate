import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import "./App.css";
import { useState } from "react";

const CornerButton = ({ onClick, icon, className = ""}) => (
  <button className={`corner-button ${className}`} onClick={onClick}>
    <img src={icon} alt="icon" width="25" height="25" />
  </button>
);

export default function App() {
const [showAnnotationMenu, setShowAnnotationMenu] = useState(false);


  // Creates a new editor instance.
  const editor = useCreateBlockNote();

  const handleAddDrawing = () => {
    console.log("Add drawing clicked!");
  };

  const handleAnnotate = () => {
    console.log("Annotate clicked!");
    setShowAnnotationMenu(prev => !prev);
  }

  const AnnotationMenu = () => (
    <div className="annotation-menu">
      <button><img src="comment.png" alt="Comment" /></button>
      <button><img src="text.png" alt="Text" /></button>
      <button><img src="line.png" alt="Line" /></button>
      <button><img src="scribble.png" alt="Scribble" /></button>
    </div>
  );

  // Renders the editor instance using a React component.
  return (
    <div>
      <div className="corner-button-wrapper">
        <CornerButton onClick={handleAddDrawing} icon="add_drawing.png"/>
        <CornerButton onClick={handleAnnotate} icon="annotate.png" className={showAnnotationMenu ? "active" : ""}/>
        {showAnnotationMenu && <AnnotationMenu />}
      </div>
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
    </div>
  );
}