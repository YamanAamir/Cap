import React, { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Link as LinkIcon, Heading1, Heading2, Code, RotateCcw } from 'lucide-react';

const RichTextEditor = ({ value, onChange, placeholder = 'Write detailed long description here...' }) => {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCmd = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const addLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCmd('createLink', url);
    }
  };

  return (
    <div className="border border-slate-300 rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-[#1e3a8a] focus-within:border-transparent">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 border-b border-slate-200">
        <button
          type="button"
          onClick={() => execCmd('bold')}
          className="p-1.5 text-slate-700 hover:bg-slate-200 rounded transition-colors"
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCmd('italic')}
          className="p-1.5 text-slate-700 hover:bg-slate-200 rounded transition-colors"
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCmd('underline')}
          className="p-1.5 text-slate-700 hover:bg-slate-200 rounded transition-colors"
          title="Underline"
        >
          <Underline className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-slate-300 mx-1" />
        <button
          type="button"
          onClick={() => execCmd('formatBlock', '<h2>')}
          className="p-1.5 text-slate-700 hover:bg-slate-200 rounded transition-colors"
          title="Heading 2"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCmd('formatBlock', '<h3>')}
          className="p-1.5 text-slate-700 hover:bg-slate-200 rounded transition-colors"
          title="Heading 3"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCmd('formatBlock', '<p>')}
          className="px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded transition-colors"
          title="Paragraph"
        >
          Paragraph
        </button>
        <div className="w-px h-5 bg-slate-300 mx-1" />
        <button
          type="button"
          onClick={() => execCmd('insertUnorderedList')}
          className="p-1.5 text-slate-700 hover:bg-slate-200 rounded transition-colors"
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCmd('insertOrderedList')}
          className="p-1.5 text-slate-700 hover:bg-slate-200 rounded transition-colors"
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-slate-300 mx-1" />
        <button
          type="button"
          onClick={addLink}
          className="p-1.5 text-slate-700 hover:bg-slate-200 rounded transition-colors"
          title="Insert Link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCmd('removeFormat')}
          className="p-1.5 text-slate-700 hover:bg-slate-200 rounded transition-colors"
          title="Clear Formatting"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Editor Content Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="p-3 min-h-[160px] max-h-[350px] overflow-y-auto focus:outline-none prose max-w-none text-slate-800 text-sm"
        data-placeholder={placeholder}
      />
    </div>
  );
};

export default RichTextEditor;
