import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAIResponseToParagraphs(text: string): string {
  if (!text || typeof text !== 'string') return text;

  // Remove excessive whitespace and normalize the text
  const normalizedText = text.trim().replace(/\s+/g, ' ');
  
  // Split text into sentences using multiple sentence ending patterns
  const sentences = normalizedText.split(/(?<=[.!?])\s+(?=[A-Z가-힣])/);
  
  if (sentences.length <= 2) {
    // For short responses with 2 or fewer sentences, keep as one paragraph
    return normalizedText;
  }
  
  const paragraphs: string[] = [];
  let currentParagraph: string[] = [];
  
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();
    if (!sentence) continue;
    
    currentParagraph.push(sentence);
    
    // Create paragraph breaks based on logical groupings:
    // 1. Every 2-3 sentences for better readability
    // 2. When encountering transition words or phrases
    // 3. When reaching certain sentence count thresholds
    const shouldBreak = 
      currentParagraph.length >= 3 || // Max 3 sentences per paragraph
      (currentParagraph.length >= 2 && i === sentences.length - 1) || // Last sentences
      (currentParagraph.length >= 2 && sentences[i + 1] && isTransitionSentence(sentences[i + 1]));
    
    if (shouldBreak) {
      paragraphs.push(currentParagraph.join(' '));
      currentParagraph = [];
    }
  }
  
  // Add any remaining sentences
  if (currentParagraph.length > 0) {
    paragraphs.push(currentParagraph.join(' '));
  }
  
  return paragraphs.join('\n\n');
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
