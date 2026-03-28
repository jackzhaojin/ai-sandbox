'use client'

import React, { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4]
        }
      })
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4'
      }
    }
  })

  // Update editor content when prop changes externally
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  if (!editor) {
    return <div className="animate-pulse bg-gray-100 rounded-lg h-64" />
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1">
        {/* Bold */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`px-3 py-1.5 rounded text-sm font-medium transition ${
            editor.isActive('bold')
              ? 'bg-blue-600 text-white'
              : 'bg-white hover:bg-gray-100 text-gray-700 disabled:opacity-50'
          }`}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </button>

        {/* Italic */}
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`px-3 py-1.5 rounded text-sm font-medium transition ${
            editor.isActive('italic')
              ? 'bg-blue-600 text-white'
              : 'bg-white hover:bg-gray-100 text-gray-700 disabled:opacity-50'
          }`}
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </button>

        {/* Underline - Note: StarterKit doesn't include underline by default */}
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={`px-3 py-1.5 rounded text-sm font-medium transition ${
            editor.isActive('strike')
              ? 'bg-blue-600 text-white'
              : 'bg-white hover:bg-gray-100 text-gray-700 disabled:opacity-50'
          }`}
          title="Strikethrough"
        >
          <s>S</s>
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Headings */}
        {[1, 2, 3, 4].map((level) => (
          <button
            key={level}
            onClick={() => editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 }).run()}
            className={`px-3 py-1.5 rounded text-sm font-medium transition ${
              editor.isActive('heading', { level })
                ? 'bg-blue-600 text-white'
                : 'bg-white hover:bg-gray-100 text-gray-700'
            }`}
            title={`Heading ${level}`}
          >
            H{level}
          </button>
        ))}

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Bullet List */}
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-1.5 rounded text-sm font-medium transition ${
            editor.isActive('bulletList')
              ? 'bg-blue-600 text-white'
              : 'bg-white hover:bg-gray-100 text-gray-700'
          }`}
          title="Bullet List"
        >
          • List
        </button>

        {/* Ordered List */}
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-3 py-1.5 rounded text-sm font-medium transition ${
            editor.isActive('orderedList')
              ? 'bg-blue-600 text-white'
              : 'bg-white hover:bg-gray-100 text-gray-700'
          }`}
          title="Ordered List"
        >
          1. List
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Blockquote */}
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`px-3 py-1.5 rounded text-sm font-medium transition ${
            editor.isActive('blockquote')
              ? 'bg-blue-600 text-white'
              : 'bg-white hover:bg-gray-100 text-gray-700'
          }`}
          title="Blockquote"
        >
          &ldquo;&rdquo;
        </button>

        {/* Code Block */}
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`px-3 py-1.5 rounded text-sm font-medium transition ${
            editor.isActive('codeBlock')
              ? 'bg-blue-600 text-white'
              : 'bg-white hover:bg-gray-100 text-gray-700'
          }`}
          title="Code Block"
        >
          {'</>'}
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Horizontal Rule */}
        <button
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="px-3 py-1.5 rounded text-sm font-medium bg-white hover:bg-gray-100 text-gray-700"
          title="Horizontal Rule"
        >
          ―
        </button>

        {/* Clear Formatting */}
        <button
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          className="px-3 py-1.5 rounded text-sm font-medium bg-white hover:bg-gray-100 text-gray-700"
          title="Clear Formatting"
        >
          Clear
        </button>
      </div>

      {/* Editor Content */}
      <div className="bg-white">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
