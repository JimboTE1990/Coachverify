import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Bold, Italic, List } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const BRAND_COLORS = [
  { label: 'Black', value: '#0f172a' },
  { label: 'Grey', value: '#64748b' },
  { label: 'Brand', value: '#0e7490' },
  { label: 'Green', value: '#047857' },
  { label: 'Red', value: '#dc2626' },
];

// Injected once — styles the TipTap editor's content elements
const editorStyles = `
  .tiptap-bio h2 { font-size: 1.25rem; font-weight: 700; color: #0f172a; margin: 0.75rem 0 0.25rem; }
  .tiptap-bio h3 { font-size: 1.05rem; font-weight: 600; color: #1e293b; margin: 0.5rem 0 0.25rem; }
  .tiptap-bio p  { margin: 0.25rem 0; }
  .tiptap-bio ul { list-style: disc; padding-left: 1.25rem; margin: 0.25rem 0; }
  .tiptap-bio li { margin: 0.1rem 0; }
  .tiptap-bio strong { font-weight: 700; }
  .tiptap-bio em { font-style: italic; }
`;

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === '<p></p>' ? '' : html);
    },
    editorProps: {
      attributes: {
        class: 'tiptap-bio min-h-[120px] px-4 py-3 text-slate-800 text-sm leading-relaxed focus:outline-none',
      },
    },
  });

  if (!editor) return null;

  const ToolbarButton = ({ onClick, active, title, children }: {
    onClick: () => void;
    active?: boolean;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`px-2 py-1 rounded-lg text-sm transition-colors font-medium ${
        active ? 'bg-brand-100 text-brand-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
      }`}
    >
      {children}
    </button>
  );

  return (
    <>
      <style>{editorStyles}</style>
      <div className="border border-slate-200 bg-white rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500 transition-all">
        {/* Toolbar */}
        <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-100 bg-slate-50 flex-wrap">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive('strike')}
            title="Strikethrough"
          >
            <span className="line-through">S</span>
          </ToolbarButton>

          <div className="w-px h-5 bg-slate-200 mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            title="Heading"
          >
            Heading
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive('heading', { level: 3 })}
            title="Sub-heading"
          >
            Sub-heading
          </ToolbarButton>

          <div className="w-px h-5 bg-slate-200 mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title="Bullet list"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>

          <div className="w-px h-5 bg-slate-200 mx-1" />

          {/* Colour palette */}
          <div className="flex items-center gap-1.5">
            {BRAND_COLORS.map(({ label, value: color }) => (
              <button
                key={color}
                type="button"
                title={`Text colour: ${label}`}
                onClick={() => editor.chain().focus().setColor(color).run()}
                className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${
                  editor.isActive('textStyle', { color }) ? 'border-brand-600 scale-110' : 'border-slate-300'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
            <button
              type="button"
              title="Reset colour"
              onClick={() => editor.chain().focus().unsetColor().run()}
              className="text-xs text-slate-400 hover:text-slate-600 px-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="bg-slate-50 relative">
          {!value && !editor.isFocused && (
            <div className="absolute top-3 left-4 text-slate-400 text-sm pointer-events-none">
              {placeholder || 'Write your bio here...'}
            </div>
          )}
          <EditorContent editor={editor} />
        </div>
      </div>
    </>
  );
};
