'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AIDocumentViewer } from '@/components/ui/ai-document-viewer';
import { Button } from '@/components/ui/button';
import { ConvocoreLogo } from '@/components/ui/convocore-logo';
import { 
  Copy, 
  Download, 
  ExternalLink, 
  Eye, 
  Lock, 
  Unlock,
  AlertCircle
} from 'lucide-react';
import { documentService, AIDocument } from '@/lib/document-service';
import { motion } from 'framer-motion';

interface SharedDocumentData {
  document: AIDocument;
  metadata: {
    viewCount: number;
    allowEdit: boolean;
    expiresAt?: string;
  };
}

export default function SharedDocumentPage() {
  const params = useParams();
  const shareId = params?.shareId as string;
  const [documentData, setDocumentData] = useState<SharedDocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shareId) return;

    const fetchSharedDocument = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/documents?shareId=${shareId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load document');
        }

        setDocumentData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedDocument();
  }, [shareId]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleEdit = async (newContent: string) => {
    if (!documentData?.metadata.allowEdit) return;

    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update',
          documentId: documentData.document.id,
          updates: { content: newContent }
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setDocumentData(prev => prev ? {
          ...prev,
          document: data.document
        } : null);
      }
    } catch (error) {
      console.error('Failed to update document:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-600 dark:text-gray-400">Loading shared document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 max-w-md mx-auto px-4"
        >
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Document Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {error}
            </p>
          </div>

          <Button
            onClick={() => window.location.href = '/'}
            className="w-full"
          >
            Go to ConvoCore
          </Button>
        </motion.div>
      </div>
    );
  }

  if (!documentData) return null;

  const { document, metadata } = documentData;
  const isExpired = metadata.expiresAt && new Date(metadata.expiresAt) < new Date();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <ConvocoreLogo className="h-8 w-8" />
              <div>
                <h1 className="font-semibold text-gray-900 dark:text-white">
                  Shared Document
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  ConvoCore AI Platform
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                <Eye className="w-4 h-4" />
                <span>{metadata.viewCount} views</span>
              </div>

              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                {metadata.allowEdit ? (
                  <Unlock className="w-4 h-4 text-green-500" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                <span>{metadata.allowEdit ? 'Editable' : 'Read-only'}</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="text-xs"
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy Link
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('/', '_blank')}
                className="text-xs"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Open ConvoCore
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isExpired && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                This document has expired and is now read-only.
              </span>
            </div>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <AIDocumentViewer
            document={document}
            onEdit={metadata.allowEdit && !isExpired ? handleEdit : undefined}
            className="shadow-xl"
          />
        </motion.div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Created with{' '}
            <a 
              href="/" 
              className="text-blue-600 dark:text-blue-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              ConvoCore AI Platform
            </a>
          </p>
          {metadata.expiresAt && !isExpired && (
            <p className="mt-1">
              Expires on {new Date(metadata.expiresAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </main>
    </div>
  );
} 