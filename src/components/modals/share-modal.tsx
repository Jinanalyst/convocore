"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Share2, 
  Link, 
  Copy, 
  Download, 
  Mail, 
  Twitter, 
  MessageSquare,
  FileText,
  Code,
  Check,
  Globe,
  Lock,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatId?: string;
  chatTitle?: string;
}

interface ShareSettings {
  isPublic: boolean;
  allowComments: boolean;
  expiresAt?: string;
  password?: string;
}

export function ShareModal({ open, onOpenChange, chatId, chatTitle }: ShareModalProps) {
  const [shareSettings, setShareSettings] = useState<ShareSettings>({
    isPublic: false,
    allowComments: false
  });
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'link' | 'export' | 'social'>('link');

  useEffect(() => {
    if (open && chatId) {
      generateShareUrl();
    }
  }, [open, chatId, shareSettings]);

  const generateShareUrl = async () => {
    if (!chatId) return;
    
    setIsGenerating(true);
    try {
      // Use the custom domain for share URLs
      const baseUrl = 'https://convocore.site';
      const shareId = `${chatId}-${Date.now()}`;
      const url = `${baseUrl}/shared/${shareId}`;
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShareUrl(url);
    } catch (error) {
      console.error('Error generating share URL:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleExport = async (format: 'pdf' | 'txt' | 'md' | 'json') => {
    if (!chatId) return;

    try {
      // In a real app, this would call your API to export the conversation
      const response = await fetch(`/api/chat/${chatId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ format }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${chatTitle || 'conversation'}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      // Fallback: create a simple text export
      createFallbackExport(format);
    }
  };

  const createFallbackExport = (format: string) => {
    const content = `# ${chatTitle || 'Conversation'}\n\nExported from Convocore\nDate: ${new Date().toLocaleDateString()}\n\n[Conversation content would be here in a real implementation]`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chatTitle || 'conversation'}.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleSocialShare = (platform: 'twitter' | 'email') => {
    const text = `Check out this AI conversation: ${chatTitle || 'Untitled Chat'}`;
    const url = shareUrl;

    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`, '_blank');
        break;
    }
  };

  const exportFormats = [
    {
      format: 'pdf' as const,
      icon: FileText,
      name: 'PDF Document',
      description: 'Formatted document with styling'
    },
    {
      format: 'txt' as const,
      icon: FileText,
      name: 'Plain Text',
      description: 'Simple text file'
    },
    {
      format: 'md' as const,
      icon: Code,
      name: 'Markdown',
      description: 'Formatted for documentation'
    },
    {
      format: 'json' as const,
      icon: Code,
      name: 'JSON',
      description: 'Structured data format'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-zinc-900">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Conversation
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Chat Info */}
          {chatTitle && (
            <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-3">
              <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                {chatTitle}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Ready to share this conversation
              </p>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 dark:border-zinc-700">
            {[
              { id: 'link' as const, label: 'Share Link', icon: Link },
              { id: 'export' as const, label: 'Export', icon: Download },
              { id: 'social' as const, label: 'Social', icon: Share2 }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                  activeTab === tab.id
                    ? "border-gray-900 dark:border-white text-gray-900 dark:text-white"
                    : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="space-y-4">
            {activeTab === 'link' && (
              <div className="space-y-4">
                {/* Share Settings */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">Sharing Settings</h4>
                  
                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={shareSettings.isPublic}
                        onChange={(e) => setShareSettings(prev => ({ ...prev, isPublic: e.target.checked }))}
                        className="w-4 h-4 text-gray-900 bg-gray-100 border-gray-300 rounded focus:ring-gray-500 dark:focus:ring-gray-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <div className="flex items-center gap-2">
                        {shareSettings.isPublic ? (
                          <Globe className="w-4 h-4 text-green-600" />
                        ) : (
                          <Lock className="w-4 h-4 text-gray-500" />
                        )}
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {shareSettings.isPublic ? 'Public' : 'Private'}
                        </span>
                      </div>
                    </label>
                    
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={shareSettings.allowComments}
                        onChange={(e) => setShareSettings(prev => ({ ...prev, allowComments: e.target.checked }))}
                        className="w-4 h-4 text-gray-900 bg-gray-100 border-gray-300 rounded focus:ring-gray-500 dark:focus:ring-gray-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Allow comments
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Share URL */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-white">
                    Share URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={isGenerating ? 'Generating link...' : shareUrl}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none"
                    />
                    <Button
                      onClick={handleCopyLink}
                      disabled={isGenerating || !shareUrl}
                      className="bg-gray-900 hover:bg-gray-800 text-white px-3"
                    >
                      {copied ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {copied && (
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Link copied to clipboard!
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'export' && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">Export Formats</h4>
                <div className="grid grid-cols-2 gap-3">
                  {exportFormats.map(({ format, icon: Icon, name, description }) => (
                    <button
                      key={format}
                      onClick={() => handleExport(format)}
                      className="p-4 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {name}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        {description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'social' && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">Share on Social Media</h4>
                <div className="space-y-3">
                  <Button
                    onClick={() => handleSocialShare('twitter')}
                    className="w-full justify-start gap-3 bg-blue-500 hover:bg-blue-600 text-white"
                    disabled={!shareUrl}
                  >
                    <Twitter className="w-4 h-4" />
                    Share on Twitter
                  </Button>
                  
                  <Button
                    onClick={() => handleSocialShare('email')}
                    variant="outline"
                    className="w-full justify-start gap-3"
                    disabled={!shareUrl}
                  >
                    <Mail className="w-4 h-4" />
                    Share via Email
                  </Button>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    💡 Tip: Generate a share link first to enable social sharing
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
