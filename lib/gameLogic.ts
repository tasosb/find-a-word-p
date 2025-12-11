import { Token } from '../types';

/**
 * Tokenizes text into words and punctuation.
 * Updated to support international characters using Unicode property escapes.
 */
export const tokenizeText = (text: string): Token[] => {
  // Regex Breakdown:
  // Group 1: Words (Unicode letters \p{L}, Numbers \p{N}, or underscores)
  // Group 2: Non-Words (Anything that isn't a word char or whitespace)
  // Group 3: Whitespace
  const regex = /([\p{L}\p{N}_]+)|([^\p{L}\p{N}_\s]+)|(\s+)/gu;
  
  const tokens: Token[] = [];
  let match;
  let index = 0;

  while ((match = regex.exec(text)) !== null) {
    const value = match[0];
    // Check if it's a word (first group match)
    const isWord = !!match[1];
    
    tokens.push({
      id: `tok-${index}`,
      text: value,
      isWord,
      originalIndex: index
    });
    index++;
  }
  return tokens;
};

/**
 * Selects indices to hide based on the spaced repetition logic.
 * Ensures NO consecutive words are hidden.
 */
export const selectBlankIndices = (
  tokens: Token[],
  correctGuesses: Set<number>,
  n: number,
  minWordLen: number = 2
): number[] => {
  
  // 1. Build Adjacency Map for Words
  // We need to know which words are physically next to each other in the text
  // to prevent consecutive blanks (e.g., "Word1 [gap] [gap] Word4")
  const allWordIndices = tokens
    .filter(t => t.isWord)
    .map(t => t.originalIndex);

  const adjacencyMap = new Map<number, number[]>();
  for (let i = 0; i < allWordIndices.length; i++) {
    const current = allWordIndices[i];
    const neighbors = [];
    if (i > 0) neighbors.push(allWordIndices[i - 1]);
    if (i < allWordIndices.length - 1) neighbors.push(allWordIndices[i + 1]);
    adjacencyMap.set(current, neighbors);
  }

  // 2. Filter Candidates for hiding (must meet length requirements)
  const validCandidates = tokens
    .filter(t => t.isWord && t.text.length >= minWordLen)
    .map(t => t.originalIndex);

  const unguessedIndices = validCandidates.filter(
    i => !correctGuesses.has(i)
  );
  
  const guessedIndices = validCandidates.filter(
    i => correctGuesses.has(i)
  );

  const nTotal = Math.min(n, validCandidates.length);
  let nOld = Math.min(Math.ceil(0.2 * nTotal), guessedIndices.length); // 20% review
  let nNew = nTotal - nOld;
  
  // Adjust if we don't have enough new words
  nNew = Math.min(nNew, unguessedIndices.length);
  // Re-adjust old words to fill remaining slots
  nOld = Math.min(nTotal - nNew, guessedIndices.length);

  const selectedIndices: number[] = [];

  // Helper to shuffle array
  const shuffle = <T,>(array: T[]): T[] => {
    return array.sort(() => Math.random() - 0.5);
  };

  const newPool = shuffle([...unguessedIndices]);
  const oldPool = shuffle([...guessedIndices]);

  // Helper to check adjacency using the map we built
  const isSafe = (idx: number, currentSelected: number[]) => {
    const neighbors = adjacencyMap.get(idx);
    if (!neighbors) return true;
    // It is safe ONLY if NO neighbors are currently selected
    return !neighbors.some(nIdx => currentSelected.includes(nIdx));
  };

  // Select New
  while (selectedIndices.length < nNew && newPool.length > 0) {
    const idx = newPool.pop()!;
    if (isSafe(idx, selectedIndices)) {
      selectedIndices.push(idx);
    }
  }

  // Select Old (Review)
  while (selectedIndices.length < (nNew + nOld) && oldPool.length > 0) {
    const idx = oldPool.pop()!;
    if (isSafe(idx, selectedIndices)) {
      selectedIndices.push(idx);
    }
  }
  
  return selectedIndices.sort((a, b) => a - b);
};