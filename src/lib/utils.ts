import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAIResponseToParagraphs(text: string): string {
  if (!text || typeof text !== 'string') return text;

  // Normalize line endings and trim
  let normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  
  // Handle different types of content
  const lines = normalizedText.split('\n');
  const formattedLines: string[] = [];
  let currentParagraph: string[] = [];
  let inCodeBlock = false;
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Handle code blocks
    if (trimmedLine.startsWith('```')) {
      // Finish current paragraph before code block
      if (currentParagraph.length > 0) {
        formattedLines.push(currentParagraph.join(' '));
        currentParagraph = [];
      }
      inCodeBlock = !inCodeBlock;
      formattedLines.push(line);
      continue;
    }
    
    // If we're in a code block, preserve formatting
    if (inCodeBlock) {
      formattedLines.push(line);
      continue;
    }
    
    // Handle empty lines - they indicate paragraph breaks
    if (trimmedLine === '') {
      if (currentParagraph.length > 0) {
        formattedLines.push(currentParagraph.join(' '));
        currentParagraph = [];
      }
      // Add empty line for spacing only if not already added
      if (formattedLines.length > 0 && formattedLines[formattedLines.length - 1] !== '') {
        formattedLines.push('');
      }
      inList = false;
      continue;
    }
    
    // Handle lists (bullet points, numbered lists, etc.)
    const isListItem = /^(\s*[-*+•]\s+|\s*\d+\.\s+|\s*[a-zA-Z]\.\s+|\*\*[^*]+\*\*:?\s*)/.test(trimmedLine);
    
    if (isListItem) {
      // Finish current paragraph before starting list
      if (currentParagraph.length > 0 && !inList) {
        formattedLines.push(currentParagraph.join(' '));
        currentParagraph = [];
      }
      formattedLines.push(trimmedLine);
      inList = true;
      continue;
    }
    
    // Handle headers (lines starting with # or **text**)
    const isHeader = /^#+\s+/.test(trimmedLine) || /^\*\*[^*]+\*\*:?\s*$/.test(trimmedLine);
    
    if (isHeader) {
      // Finish current paragraph before header
      if (currentParagraph.length > 0) {
        formattedLines.push(currentParagraph.join(' '));
        currentParagraph = [];
      }
      formattedLines.push(trimmedLine);
      inList = false;
      continue;
    }
    
    // Regular text - check if it should start a new paragraph
    const shouldStartNewParagraph = 
      inList || // Always start new paragraph after lists
      (currentParagraph.length === 0) || // First line of paragraph
      isTransitionSentence(trimmedLine) || // Transition words
      (currentParagraph.length >= 3); // Max sentences per paragraph
    
    if (shouldStartNewParagraph && currentParagraph.length > 0) {
      formattedLines.push(currentParagraph.join(' '));
      currentParagraph = [];
    }
    
    currentParagraph.push(trimmedLine);
    inList = false;
  }
  
  // Add any remaining paragraph
  if (currentParagraph.length > 0) {
    formattedLines.push(currentParagraph.join(' '));
  }
  
  // Clean up extra empty lines
  return formattedLines
    .reduce((acc: string[], line, index) => {
      // Remove multiple consecutive empty lines
      if (line === '' && acc[acc.length - 1] === '') {
        return acc;
      }
      acc.push(line);
      return acc;
    }, [])
    .join('\n')
    .trim();
}

function isTransitionSentence(sentence: string): boolean {
  const transitionWords = [
    // English transition words
    'however', 'therefore', 'furthermore', 'additionally', 'moreover', 
    'consequently', 'nevertheless', 'meanwhile', 'on the other hand',
    'in contrast', 'similarly', 'for example', 'for instance', 'in conclusion',
    'first', 'second', 'third', 'finally', 'next', 'then', 'also',
    
    // Korean transition words
    '그러나', '따라서', '또한', '또', '그리고', '하지만', '그런데', '그렇다면',
    '예를 들어', '다시 말해', '즉', '결론적으로', '마지막으로', '첫째', '둘째', '셋째',
    '그런 다음', '이것은', '이렇게', '이때', '이러한', '반면에', '한편'
  ];
  
  const lowerSentence = sentence.toLowerCase();
  return transitionWords.some(word => 
    lowerSentence.startsWith(word.toLowerCase()) || 
    lowerSentence.includes(' ' + word.toLowerCase() + ' ')
  );
}
