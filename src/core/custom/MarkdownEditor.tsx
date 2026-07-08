import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  markdownShortcutPlugin,
  toolbarPlugin,
  BoldItalicUnderlineToggles,
  UndoRedo,
} from "@mdxeditor/editor"

import "@mdxeditor/editor/style.css"

export interface IMarkdownEditorProps {
  className?: string
  value: string
  onChange: (value: string) => void
}

export function MarkdownEditor({
  className,
  value,
  onChange,
}: IMarkdownEditorProps) {
  return (
    <MDXEditor
      markdown={value ?? ""}
      onChange={onChange}
      plugins={[
        headingsPlugin(),
        listsPlugin(),
        quotePlugin(),
        markdownShortcutPlugin(),
        toolbarPlugin({
          toolbarContents: () => (
            <div className="flex w-full gap-1 overflow-x-auto px-2 py-1">
              <UndoRedo />
              <BoldItalicUnderlineToggles />
            </div>
          ),
        }),
      ]}
      className={className}
    />
  )
}
