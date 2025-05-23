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

// Custom "Drawing Block" menu item
const insertDrawingBlockItem = (editor: BlockNoteEditor) => ({
  title: "Insert Drawing Block",
  onItemClick: () =>
    insertOrUpdateBlock(editor, {
      type: "drawing", // ✅ this is the key change!
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
      type: "image", // ✅ this is the key change!
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
  }
});

function App() {
  const editor = useCreateBlockNote({
    schema,
    // initialContent: [
    //   {
    //     type: "drawing"
    //   },
    //   {
    //     type: "paragraph",
    //     content: "Start typing below: "
    //   }
    // ]
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
            filterSuggestionItems(getCustomSlashMenuItems(editor), query)
          }
        />
      </BlockNoteView>
    </div>
  );
}

export default App;
