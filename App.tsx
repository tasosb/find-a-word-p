import React, { useState, useEffect } from 'react';
import TextManager from './components/TextManager';
import PlayArea from './components/PlayArea';
import { TextItem, StoredProgress } from './types';

// Default text from the Python script
const DEFAULT_TEXT: TextItem = {
  id: 'default-1',
  title: 'Les 10 We noemen haar Roos',
  content: `L`};

const App: React.FC = () => {
  const [view, setView] = useState<'list' | 'game'>('list');
  const [selectedText, setSelectedText] = useState<TextItem | null>(null);
  
  // Persisted State
  const [texts, setTexts] = useState<TextItem[]>([]);
  const [progress, setProgress] = useState<StoredProgress>({});

  // Load from LocalStorage on mount
  useEffect(() => {
    try {
      const savedTexts = localStorage.getItem('faw_texts');
      const savedProgress = localStorage.getItem('faw_progress');
      
      if (savedTexts) {
        setTexts(JSON.parse(savedTexts));
      } else {
        // Initialize with default if empty
        setTexts([DEFAULT_TEXT]);
        localStorage.setItem('faw_texts', JSON.stringify([DEFAULT_TEXT]));
      }

      if (savedProgress) {
        const parsed = JSON.parse(savedProgress);
        // Data Migration Check:
        // If the stored data contains strings (old format), we reset it to avoid crashes.
        const keys = Object.keys(parsed);
        if (keys.length > 0 && Array.isArray(parsed[keys[0]]) && typeof parsed[keys[0]][0] === 'string') {
          console.warn("Detected old progress format. Resetting progress to support independent word tracking.");
          setProgress({});
        } else {
          setProgress(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to load local storage", e);
    }
  }, []);

  // Save to LocalStorage whenever state changes
  useEffect(() => {
    if (texts.length > 0) {
      localStorage.setItem('faw_texts', JSON.stringify(texts));
    }
  }, [texts]);

  useEffect(() => {
     localStorage.setItem('faw_progress', JSON.stringify(progress));
  }, [progress]);

  // Handlers
  const handleSelectText = (text: TextItem) => {
    setSelectedText(text);
    setView('game');
  };

  const handleAddText = (title: string, content: string) => {
    const newText: TextItem = {
      id: Date.now().toString(),
      title,
      content
    };
    setTexts(prev => [newText, ...prev]);
  };

  const handleDeleteText = (id: string) => {
    setTexts(prev => prev.filter(t => t.id !== id));
    // Also clean up progress
    setProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[id];
      return newProgress;
    });
  };

  const handleUpdateProgress = (tokenIndex: number) => {
    if (!selectedText) return;
    
    setProgress(prev => {
      const currentList = prev[selectedText.id] || [];
      if (currentList.includes(tokenIndex)) return prev;
      return {
        ...prev,
        [selectedText.id]: [...currentList, tokenIndex]
      };
    });
  };

  return (
    <div className="h-full w-full max-w-md mx-auto bg-white shadow-2xl overflow-hidden relative">
      {view === 'list' && (
        <TextManager 
          texts={texts} 
          onSelect={handleSelectText} 
          onAdd={handleAddText}
          onDelete={handleDeleteText}
        />
      )}
      
      {view === 'game' && selectedText && (
        <PlayArea 
          textItem={selectedText}
          correctGuesses={new Set(progress[selectedText.id] || [])}
          onUpdateProgress={handleUpdateProgress}
          onBack={() => setView('list')}
        />
      )}
    </div>
  );
};

export default App;