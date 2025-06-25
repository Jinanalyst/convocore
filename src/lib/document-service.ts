'use client';

import { nanoid } from 'nanoid';

export interface AIDocument {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'code' | 'markdown' | 'html' | 'chart';
  language?: string;
  isEditable: boolean;
  isShared: boolean;
  shareId?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    wordCount?: number;
    lineCount?: number;
    tags?: string[];
    agent?: string;
  };
}

export interface ShareableDocument {
  shareId: string;
  document: AIDocument;
  viewCount: number;
  expiresAt?: Date;
  allowEdit: boolean;
}

class DocumentService {
  private documents: Map<string, AIDocument> = new Map();
  private sharedDocuments: Map<string, ShareableDocument> = new Map();

  /**
   * Create a new AI document from response content
   */
  createDocument(
    title: string,
    content: string,
    type: AIDocument['type'] = 'text',
    options?: {
      language?: string;
      isEditable?: boolean;
      agent?: string;
      tags?: string[];
    }
  ): AIDocument {
    const doc: AIDocument = {
      id: nanoid(),
      title: this.generateTitle(title, content, type),
      content,
      type,
      language: options?.language,
      isEditable: options?.isEditable ?? true,
      isShared: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        wordCount: this.countWords(content),
        lineCount: content.split('\n').length,
        tags: options?.tags || [],
        agent: options?.agent
      }
    };

    this.documents.set(doc.id, doc);
    return doc;
  }

  /**
   * Update an existing document
   */
  updateDocument(id: string, updates: Partial<Pick<AIDocument, 'content' | 'title' | 'metadata'>>): AIDocument | null {
    const doc = this.documents.get(id);
    if (!doc) return null;

    const updatedDoc: AIDocument = {
      ...doc,
      ...updates,
      updatedAt: new Date(),
      metadata: {
        ...doc.metadata,
        ...updates.metadata,
        wordCount: updates.content ? this.countWords(updates.content) : doc.metadata?.wordCount,
        lineCount: updates.content ? updates.content.split('\n').length : doc.metadata?.lineCount
      }
    };

    this.documents.set(id, updatedDoc);
    return updatedDoc;
  }

  /**
   * Share a document and get shareable link
   */
  shareDocument(
    id: string,
    options?: {
      allowEdit?: boolean;
      expiresIn?: number; // hours
    }
  ): string | null {
    const doc = this.documents.get(id);
    if (!doc) return null;

    const shareId = nanoid(12);
    const expiresAt = options?.expiresIn 
      ? new Date(Date.now() + options.expiresIn * 60 * 60 * 1000)
      : undefined;

    const sharedDoc: ShareableDocument = {
      shareId,
      document: { ...doc, shareId },
      viewCount: 0,
      expiresAt,
      allowEdit: options?.allowEdit ?? false
    };

    // Update original document
    const updatedDoc = { ...doc, isShared: true, shareId };
    this.documents.set(id, updatedDoc);
    
    // Store shared document
    this.sharedDocuments.set(shareId, sharedDoc);

    return shareId;
  }

  /**
   * Get shared document by share ID
   */
  getSharedDocument(shareId: string): ShareableDocument | null {
    const shared = this.sharedDocuments.get(shareId);
    if (!shared) return null;

    // Check if expired
    if (shared.expiresAt && shared.expiresAt < new Date()) {
      this.sharedDocuments.delete(shareId);
      return null;
    }

    // Increment view count
    shared.viewCount++;
    return shared;
  }

  /**
   * Get document by ID
   */
  getDocument(id: string): AIDocument | null {
    return this.documents.get(id) || null;
  }

  /**
   * Get all documents (for user library)
   */
  getAllDocuments(): AIDocument[] {
    return Array.from(this.documents.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  /**
   * Delete document
   */
  deleteDocument(id: string): boolean {
    const doc = this.documents.get(id);
    if (!doc) return false;

    // Remove from shared documents if shared
    if (doc.shareId) {
      this.sharedDocuments.delete(doc.shareId);
    }

    return this.documents.delete(id);
  }

  /**
   * Auto-detect document type from content
   */
  detectDocumentType(content: string): AIDocument['type'] {
    // Code detection patterns
    const codePatterns = [
      /```[\w]*\n[\s\S]*?```/,
      /function\s+\w+\s*\(/,
      /const\s+\w+\s*=/,
      /import\s+.*from/,
      /class\s+\w+/,
      /<script>/,
      /<\?php/
    ];

    // HTML detection
    const htmlPatterns = [
      /<html/i,
      /<body/i,
      /<div/i,
      /<component/i
    ];

    // Markdown detection
    const markdownPatterns = [
      /^#{1,6}\s/m,
      /\*\*.*\*\*/,
      /\[.*\]\(.*\)/,
      /^-\s/m,
      /^>\s/m
    ];

    if (codePatterns.some(pattern => pattern.test(content))) {
      return 'code';
    }
    if (htmlPatterns.some(pattern => pattern.test(content))) {
      return 'html';
    }
    if (markdownPatterns.some(pattern => pattern.test(content))) {
      return 'markdown';
    }

    return 'text';
  }

  /**
   * Generate smart title from content
   */
  private generateTitle(title: string, content: string, type: string): string {
    if (title && title.trim()) return title;

    // Extract title from content based on type
    switch (type) {
      case 'code':
        const funcMatch = content.match(/(?:function|const|class)\s+(\w+)/);
        if (funcMatch) return `${funcMatch[1]} Function`;
        return 'Code Snippet';
        
      case 'markdown':
        const headerMatch = content.match(/^#\s+(.+)$/m);
        if (headerMatch) return headerMatch[1];
        return 'Markdown Document';
        
      case 'html':
        const titleMatch = content.match(/<title>(.*?)<\/title>/i);
        if (titleMatch) return titleMatch[1];
        return 'HTML Document';
        
      default:
        const firstLine = content.split('\n')[0];
        if (firstLine.length > 0 && firstLine.length < 100) {
          return firstLine.slice(0, 50) + (firstLine.length > 50 ? '...' : '');
        }
        return 'AI Generated Document';
    }
  }

  /**
   * Count words in content
   */
  private countWords(content: string): number {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Generate share URL
   */
  getShareUrl(shareId: string): string {
    return `${window.location.origin}/shared/${shareId}`;
  }

  /**
   * Export document in various formats
   */
  exportDocument(doc: AIDocument, format: 'txt' | 'md' | 'html' | 'json'): string {
    switch (format) {
      case 'txt':
        return doc.content;
      case 'md':
        return `# ${doc.title}\n\n${doc.content}`;
      case 'html':
        return `
<!DOCTYPE html>
<html>
<head>
    <title>${doc.title}</title>
    <meta charset="UTF-8">
</head>
<body>
    <h1>${doc.title}</h1>
    <pre>${doc.content}</pre>
</body>
</html>`;
      case 'json':
        return JSON.stringify(doc, null, 2);
      default:
        return doc.content;
    }
  }
}

// Export singleton instance
export const documentService = new DocumentService();

// Helper function to create document from AI response
export function createDocumentFromResponse(
  content: string,
  title?: string,
  agent?: string
): AIDocument {
  const type = documentService.detectDocumentType(content);
  const language = type === 'code' ? detectLanguage(content) : undefined;
  
  return documentService.createDocument(
    title || 'AI Response',
    content,
    type,
    {
      language,
      isEditable: true,
      agent,
      tags: [type, agent].filter(Boolean) as string[]
    }
  );
}

// Helper function to detect programming language
function detectLanguage(code: string): string {
  const languagePatterns: Record<string, RegExp[]> = {
    javascript: [/\bfunction\b/, /\bconst\b/, /\blet\b/, /\bvar\b/, /=>/],
    typescript: [/interface\s+\w+/, /type\s+\w+\s*=/, /:\s*string/, /:\s*number/],
    python: [/def\s+\w+/, /import\s+\w+/, /from\s+\w+\s+import/, /if\s+__name__/],
    react: [/import.*React/, /<\w+.*>/, /useState/, /useEffect/],
    html: [/<html>/, /<body>/, /<div>/, /<component>/],
    css: [/\{[^}]*\}/, /\.[a-zA-Z-]+\s*\{/, /#[a-zA-Z-]+\s*\{/]
  };

  for (const [language, patterns] of Object.entries(languagePatterns)) {
    if (patterns.some(pattern => pattern.test(code))) {
      return language;
    }
  }

  return 'text';
} 