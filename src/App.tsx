import {
  BlockNoteEditor,
  filterSuggestionItems,
  insertOrUpdateBlock,
  BlockNoteSchema,
  defaultBlockSpecs,
} from "@blocknote/core";
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

// Custom "Drawing Block" menu item
const insertDrawingBlockItem = (editor: BlockNoteEditor) => ({
  title: "Insert Drawing Block",
  onItemClick: () =>
    insertOrUpdateBlock(editor, {
      type: "drawing" as any, // ✅ this is the key change!
      props: {},
    }),
  aliases: ["drawing", "sketch", "paint"],
  group: "Other",
  icon: <HiPencilAlt size={18} />,
  subtext: "Insert a drawable canvas block",
});

const insertImageBlockItem = (editor: BlockNoteEditor) => ({
  title: "Insert Image Block",
  onItemClick: () =>
    insertOrUpdateBlock(editor, {
      type: "imageUpload" as any, // ✅ this is the key change!
      props: {},
    }),
  aliases: ["image"],
  group: "Other",
  icon: <HiPhotograph size={18} />,
  subtext: "Insert an annotatable image block",
});

// List containing all default Slash Menu Items, as well as our custom one.
const getCustomSlashMenuItems = (
  editor: BlockNoteEditor,
): any[] => [
  insertDrawingBlockItem(editor),
  insertImageBlockItem(editor),
  ...getDefaultReactSlashMenuItems(editor).filter(item =>
    !["Image", "Video", "Audio", "File", "Emoji"].includes(item.title)
  )
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
  });

  return (
    <div className="blocknote-container">
      <BlockNoteView
        editor={editor}
        theme="light"
        className="blocknote-editor"
        slashMenu={false}
      >
        <SuggestionMenuController
          triggerCharacter={"/"}
          getItems={async (query) =>
            filterSuggestionItems(getCustomSlashMenuItems(editor as any), query)
          }
        />
      </BlockNoteView>
      <AnnotationOverlay editor={editor} />
    </div>
  );
}

export default App;
