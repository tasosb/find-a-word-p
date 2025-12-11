import React, { useState } from 'react';
import { TextItem } from '../types';
import { Plus, Trash2, Play, BookOpen, ChevronRight } from 'lucide-react';

interface TextManagerProps {
  texts: TextItem[];
  onSelect: (text: TextItem) => void;
  onAdd: (title: string, content: string) => void;
  onDelete: (id: string) => void;
}

const TextManager: React.FC<TextManagerProps> = ({ texts, onSelect, onAdd, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const handleAdd = () => {
    if (newTitle.trim() && newContent.trim()) {
      onAdd(newTitle, newContent);
      setNewTitle('');
      setNewContent('');
      setIsAdding(false);
    }
  };

  if (isAdding) {
    return (
      <div className="flex flex-col h-full bg-white animate-in slide-in-from-bottom-10 fade-in duration-300">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">New Text</h2>
          <button 
            onClick={() => setIsAdding(false)}
            className="text-gray-500 hover:text-gray-700 font-medium"
          >
            Cancel
          </button>
        </div>
        <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input 
              type="text" 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              placeholder="e.g., Lesson 10"
            />
          </div>
          <div className="flex-1 flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea 
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="flex-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none font-mono text-sm"
              placeholder="Paste your text here..."
            />
          </div>
          <button 
            onClick={handleAdd}
            disabled={!newTitle.trim() || !newContent.trim()}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold text-lg shadow-lg disabled:opacity-50 active:scale-95 transition-all"
          >
            Save Text
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="p-6 bg-white shadow-sm pb-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <BookOpen className="w-8 h-8 text-primary" />
          My Library
        </h1>
        <p className="text-gray-500 mt-1 text-sm">Select a text to practice.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {texts.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p>No texts found.</p>
            <p className="text-sm">Tap + to add one.</p>
          </div>
        ) : (
          texts.map((text) => (
            <div 
              key={text.id} 
              className="group bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-primary/30 hover:shadow-md transition-all flex justify-between items-center"
            >
              <div 
                className="flex-1 cursor-pointer" 
                onClick={() => onSelect(text)}
              >
                <h3 className="font-bold text-gray-800 text-lg mb-1">{text.title}</h3>
                <p className="text-gray-500 text-xs line-clamp-1">{text.content.substring(0, 50)}...</p>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => onSelect(text)}
                  className="p-3 bg-primary/10 text-primary rounded-full hover:bg-primary hover:text-white transition-colors"
                  aria-label="Play"
                >
                  <Play className="w-5 h-5 fill-current" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if(window.confirm('Are you sure you want to delete this text?')) onDelete(text.id);
                  }}
                  className="p-3 text-gray-300 hover:text-error hover:bg-error/10 rounded-full transition-colors"
                  aria-label="Delete"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-gradient-to-t from-gray-50 to-transparent sticky bottom-0 flex justify-center">
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-xl hover:scale-105 active:scale-95 transition-transform"
        >
          <Plus className="w-5 h-5" />
          <span className="font-bold">Add New Text</span>
        </button>
      </div>
    </div>
  );
};

export default TextManager;