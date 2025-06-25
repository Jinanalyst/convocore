'use client';

import { useState, useEffect } from 'react';
import { X, Copy, ExternalLink } from 'lucide-react';

interface MagicLink {
  email: string;
  url: string;
  timestamp: string;
}

export function DevMagicLinks() {
  const [magicLinks, setMagicLinks] = useState<MagicLink[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return;

    const checkForMagicLinks = () => {
      const links = JSON.parse(localStorage.getItem('dev_magic_links') || '[]');
      setMagicLinks(links);
      if (links.length > 0) {
        setIsVisible(true);
      }
    };

    // Check initially
    checkForMagicLinks();

    // Check periodically for new links
    const interval = setInterval(checkForMagicLinks, 2000);

    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const openLink = (url: string) => {
    window.open(url, '_blank');
  };

  const clearLinks = () => {
    localStorage.removeItem('dev_magic_links');
    setMagicLinks([]);
    setIsVisible(false);
  };

  // Don't render in production
  if (process.env.NODE_ENV !== 'development' || !isVisible || magicLinks.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gray-900 border border-gray-700 rounded-lg p-4 max-w-md shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-medium text-sm">Development Magic Links</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {magicLinks.map((link, index) => (
          <div key={index} className="bg-gray-800 rounded p-3 text-sm">
            <div className="text-gray-300 mb-1">
              <strong>Email:</strong> {link.email}
            </div>
            <div className="text-gray-400 text-xs mb-2">
              {new Date(link.timestamp).toLocaleString()}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(link.url)}
                className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
              >
                <Copy className="w-3 h-3" />
                Copy
              </button>
              <button
                onClick={() => openLink(link.url)}
                className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
              >
                <ExternalLink className="w-3 h-3" />
                Open
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-700">
        <button
          onClick={clearLinks}
          className="text-xs text-gray-400 hover:text-white"
        >
          Clear all links
        </button>
      </div>
    </div>
  );
} 