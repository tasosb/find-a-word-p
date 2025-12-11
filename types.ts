export interface TextItem {
  id: string;
  title: string;
  content: string;
  lastPlayed?: number;
}

export interface StoredProgress {
  [textId: string]: number[]; // Array of original indices correctly guessed
}

export interface Token {
  id: string; // Unique ID for React keys
  text: string; // The actual text content
  isWord: boolean; // Is it a valid word or punctuation?
  originalIndex: number; // Index in the original token list
}

export interface GameToken extends Token {
  isBlank: boolean; // Is this currently hidden?
  userValue: string; // What the user typed
  state: 'empty' | 'correct' | 'error' | 'hint'; // Current state
}