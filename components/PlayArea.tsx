import React, { useState, useEffect } from 'react';
import { TextItem, GameToken, Token } from '../types';
import { tokenizeText, selectBlankIndices } from '../lib/gameLogic';
import { ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';

interface PlayAreaProps {
  textItem: TextItem;
  correctGuesses: Set<number>; // Changed to number set (indices)
  onUpdateProgress: (newWordIndex: number) => void; // Changed to accept index
  onBack: () => void;
}

const PlayArea: React.FC<PlayAreaProps> = ({ textItem, correctGuesses, onUpdateProgress, onBack }) => {
  const [tokens, setTokens] = useState<GameToken[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isRoundActive, setIsRoundActive] = useState(false);
  
  // Stats for the current round
  const [solvedCount, setSolvedCount] = useState(0);
  const [totalBlanks, setTotalBlanks] = useState(0);

  // Initialize Round
  useEffect(() => {
    startNewRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textItem]);

  const startNewRound = () => {
    const rawTokens: Token[] = tokenizeText(textItem.content);
    // Determine roughly 15% to 20% blanks, capped at 30 words max per round for readability on mobile
    const numBlanks = Math.min(30, Math.ceil(rawTokens.filter(t => t.isWord).length * 0.2));
    
    const blankIndices = selectBlankIndices(rawTokens, correctGuesses, numBlanks);

    const gameTokens: GameToken[] = rawTokens.map(t => ({
      ...t,
      isBlank: blankIndices.includes(t.originalIndex),
      userValue: '',
      state: blankIndices.includes(t.originalIndex) ? 'empty' : 'correct'
    }));

    setTokens(gameTokens);
    setTotalBlanks(blankIndices.length);
    setSolvedCount(0);
    setIsRoundActive(true);
  };

  const handleInputChange = (id: string, value: string) => {
    setTokens(prev => prev.map(t => {
      if (t.id !== id) return t;
      // If user clears the input, reset error state to empty
      const newState = (t.state === 'error' && value === '') ? 'empty' : t.state;
      return { ...t, userValue: value, state: newState };
    }));
  };

  const checkAnswer = (id: string, forceHint = false) => {
    setTokens(prev => {
      const newTokens = [...prev];
      const index = newTokens.findIndex(t => t.id === id);
      if (index === -1) return prev;

      const token = newTokens[index];
      const cleanTarget = token.text.toLowerCase();
      const cleanInput = token.userValue.trim().toLowerCase();

      if (forceHint) {
        // HINT LOGIC
        onUpdateProgress(token.originalIndex); // Mark specific instance as known
        return newTokens.map((t, i) => i === index ? { 
          ...t, 
          userValue: t.text, 
          state: 'hint',
          isBlank: false // Lock it
        } : t);
      }

      if (cleanInput === cleanTarget) {
        // CORRECT LOGIC
        onUpdateProgress(token.originalIndex); // Mark specific instance as known
        setSolvedCount(c => c + 1);
        return newTokens.map((t, i) => i === index ? { ...t, state: 'correct', isBlank: false } : t);
      } else {
        // WRONG LOGIC
        return newTokens.map((t, i) => i === index ? { ...t, state: 'error' } : t);
      }
    });
  };

  const checkAll = () => {
    tokens.forEach(t => {
      if (t.isBlank && t.state !== 'correct' && t.state !== 'hint') {
        checkAnswer(t.id);
      }
    });
  };

  // UI Components for the text stream
  const renderToken = (token: GameToken) => {
    if (!token.isBlank && token.state !== 'hint') {
       // Render normal text
       if (token.isWord) {
         // Highlight words previously mastered in green (check by index)
         const isMastered = correctGuesses.has(token.originalIndex);
         return (
           <span key={token.id} className={`${isMastered ? 'text-green-600 font-medium' : 'text-gray-800'}`}>
             {token.text}
           </span>
         );
       }
       // Punctuation/Spaces
       if (token.text === '\n') return <br key={token.id} />;
       return <span key={token.id} className="whitespace-pre-wrap">{token.text}</span>;
    }

    // Render Input Field (Blank)
    // Dynamic width based on word length, min 3ch
    const width = Math.max(3, token.text.length) + 'ch';
    
    // Determine styles based on state
    let borderClass = "border-b-2 border-gray-300 focus:border-primary";
    let textClass = "text-gray-800";
    let bgClass = "bg-transparent";

    if (token.state === 'correct') {
      borderClass = "border-none border-b-2 border-success";
      textClass = "text-success font-bold";
    } else if (token.state === 'error') {
      borderClass = "border-b-2 border-error";
      textClass = "text-error";
    } else if (token.state === 'hint') {
      borderClass = "border-none border-b-2 border-hint";
      textClass = "text-hint font-bold";
    }

    const isDisabled = token.state === 'correct' || token.state === 'hint';

    return (
      <span key={token.id} className="inline-flex flex-col align-bottom mx-1 relative group">
        <div className="relative inline-block">
            <input
            type="text"
            value={token.userValue}
            onChange={(e) => handleInputChange(token.id, e.target.value)}
            onBlur={() => checkAnswer(token.id)}
            disabled={isDisabled}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            spellCheck="false"
            style={{ width }}
            className={`
                text-center outline-none rounded-t px-1 py-0
                transition-colors duration-200 text-base
                ${borderClass} ${textClass} ${bgClass}
            `}
            />
            {/* Hint Button (Mini Question Mark) - Only show if active */}
            {!isDisabled && (
                <button
                    onClick={() => checkAnswer(token.id, true)}
                    className="absolute -top-3 -right-2 bg-hint text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-sm opacity-0 group-focus-within:opacity-100 transition-opacity"
                    tabIndex={-1}
                >
                    ?
                </button>
            )}
        </div>
      </span>
    );
  };

  const progressPct = totalBlanks > 0 ? Math.round((solvedCount / totalBlanks) * 100) : 100;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between bg-white shadow-sm z-10">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="font-bold text-gray-800 text-center truncate max-w-[60%]">
          {textItem.title}
        </h2>
        <div className="w-8" /> {/* Spacer for centering */}
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-gray-100 w-full">
        <div 
            className="h-full bg-success transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Main Text Area */}
      <div className="flex-1 overflow-y-auto p-5 leading-loose text-lg font-serif">
         {tokens.map(renderToken)}
         
         {/* Spacer for bottom sticky bar */}
         <div className="h-24" />
      </div>

      {/* Sticky Action Bar */}
      <div className="p-4 bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] sticky bottom-0 z-20">
         <div className="flex gap-3">
             <button
                onClick={checkAll}
                className="flex-1 bg-primary text-white font-bold py-3 px-4 rounded-xl shadow active:scale-95 transition-transform flex items-center justify-center gap-2"
             >
                <CheckCircle2 className="w-5 h-5" />
                Check
             </button>
             
             <button
                onClick={startNewRound}
                className="flex-1 bg-gray-100 text-gray-800 font-bold py-3 px-4 rounded-xl shadow-sm border border-gray-200 active:scale-95 transition-transform flex items-center justify-center gap-2"
             >
                <RefreshCw className="w-5 h-5" />
                New Words
             </button>
         </div>
      </div>
    </div>
  );
};

export default PlayArea;