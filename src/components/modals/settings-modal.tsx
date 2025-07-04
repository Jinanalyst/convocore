"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usageService, type UserUsage } from "@/lib/usage-service";
import { 
  Settings, 
  User, 
  Bot, 
  Palette, 
  Bell, 
  Shield,
  CreditCard,
  Wallet,
  Moon,
  Sun,
  Monitor,
  Save,
  Crown,
  Zap,
  Star,
  Copy,
  MessageCircle,
  Volume2,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BillingModal } from "@/components/modals/billing-modal";
import { useLanguage } from '@/lib/language-context';
import { sessionKeyService } from "@/lib/session-key-service";
import { Badge } from "@/components/ui/badge";
import { getDefaultModelForTier, getAvailableModelsForTier } from "@/lib/ai-service";

interface SettingsModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type SettingsTab = 'general' | 'account' | 'ai-model' | 'appearance' | 'notifications' | 'privacy' | 'billing';

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { language, setLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [settings, setSettings] = useState({
    theme: 'system',
    language: 'en',
    autoSave: true,
    notifications: {
      push: false,
      sound: true,
      chatComplete: true,
      newMessage: true,
      systemUpdates: false,
      marketingEmails: false,
      securityAlerts: true,
      usageAlerts: true
    },
    aiModel: {
      defaultModel: getDefaultModelForTier('free'),
      temperature: 0.7,
      maxTokens: 2048,
      streamResponse: true,
      convoArtApiKey: '9475df54-f35e-4f20-ae0c-95e99c6c54f3',
      convoQApiKey: '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'
    },
    privacy: {
      dataCollection: true,
      analytics: false,
      shareUsage: false
    }
  });
  const [userInfo, setUserInfo] = useState({
    walletAddress: '',
    walletType: '',
    subscriptionTier: 'free',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [subscription, setSubscription] = useState<{ tier: 'free' | 'pro' | 'premium' }>({ tier: 'free' });
  const [memberSince, setMemberSince] = useState<Date | null>(null);
  const [lastLogin, setLastLogin] = useState<Date | null>(null);

  // Load settings from localStorage and Supabase on mount
  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      // Load real usage and subscription data
      const walletAddress = localStorage.getItem('wallet-public-key') || '';
      const walletType = 'solana'; // Only supporting Solana wallet
      const userUsage = usageService.getUserUsage(walletAddress);
      const userSubscription = usageService.getUserSubscription(walletAddress);
      
      setUserInfo({
        walletAddress,
        walletType,
        subscriptionTier: userSubscription.tier,
      });
      
      setSubscription(userSubscription);
      setUsage(userUsage);
      
      // Load saved settings from localStorage
      const savedSettings = localStorage.getItem('convocore-settings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
      }
      
      // Load member since and last login dates
      const memberSince = localStorage.getItem('wallet-member-since');
      const lastLogin = localStorage.getItem('wallet-last-login');
      
      setMemberSince(memberSince ? new Date(memberSince) : null);
      setLastLogin(lastLogin ? new Date(lastLogin) : null);
      
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: typeof settings) => {
    try {
      // Save to localStorage immediately
      localStorage.setItem('convocore-settings', JSON.stringify(newSettings));
      
      // Apply theme changes immediately
      if (newSettings.theme !== settings.theme) {
        applyTheme(newSettings.theme);
      }

      // Apply language changes
      if (newSettings.language !== settings.language) {
        applyLanguage(newSettings.language);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const applyTheme = (theme: string) => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  const applyLanguage = (language: string) => {
    // Update the language context which will trigger UI updates
    setLanguage(language as 'en' | 'ko');
    
    // Set document language attribute
    document.documentElement.lang = language;
    
    console.log(`Language changed to: ${language}`);
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  const handleNotificationToggle = async (type: keyof typeof settings.notifications, value: boolean) => {
    if (type === 'push' && value) {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        alert('Please enable notifications in your browser settings to receive push notifications.');
        return;
      }
    }
    
    setSettings(prev => ({ 
      ...prev, 
      notifications: { ...prev.notifications, [type]: value }
    }));

    // Auto-save notification settings immediately
    const newSettings = { 
      ...settings, 
      notifications: { ...settings.notifications, [type]: value }
    };
    await saveSettings(newSettings);
  };

  const testNotification = async () => {
    const { notificationService } = await import('@/lib/notification-service');
    
    // Check if push notifications are enabled
    if (settings.notifications.push && 'Notification' in window && Notification.permission === 'granted') {
      notificationService.notifySuccess(
        'Test Notification',
        'Great! Your notifications are working perfectly. You\'ll receive alerts when your chats are ready.'
      );
    } else {
      // Show in-app notification instead
      notificationService.notifyInfo(
        'Test Notification',
        'This is how notifications will appear. Enable push notifications to receive alerts when the app is closed.'
      );
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'account', label: 'Account', icon: User },
    { id: 'ai-model', label: 'AI Model', icon: Bot },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ] as const;

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Save settings
      await saveSettings(settings);
      
      // No need to save user info since we're wallet-only
      
      // Show success message
      console.log("Settings saved");
      
      onOpenChange?.(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      console.log("Error saving settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateSettings = (updates: Partial<typeof settings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-4 sm:space-y-6 pb-8">
            <div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">General Settings</h3>
              
              <div className="space-y-4 sm:space-y-6">
                {/* Language Settings */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-900 dark:text-white">
                    {t('settings.language')}
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Choose your preferred language for the interface
                  </p>
                  <select 
                    value={language}
                    onChange={(e) => updateSettings({ language: e.target.value })}
                    className="mt-2 block w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                  >
                    <option value="en">🇺🇸 {t('settings.english')}</option>
                    <option value="ko">🇰🇷 {t('settings.korean')}</option>
                  </select>
                </div>
                
                {/* Auto-save Settings */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white">
                      Auto-save conversations
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Automatically save your conversations for future reference
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg border border-gray-200 dark:border-zinc-700">
                    <label className="flex items-start sm:items-center justify-between gap-3 cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900 dark:text-white block">
                          Enable auto-save
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Save conversations automatically when you send messages
                        </p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.autoSave}
                        onChange={(e) => updateSettings({ autoSave: e.target.checked })}
                        className="h-4 w-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 shrink-0 mt-0.5 sm:mt-0" 
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'account':
        return (
          <div className="space-y-6 pb-8">
            {/* Profile Section */}
            <div className="space-y-4">
              {/* Avatar and Basic Info */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gray-900 dark:bg-white rounded-full flex items-center justify-center">
                  <Wallet className="w-8 h-8 text-white dark:text-gray-900" />
                </div>
                <div className="flex-1">
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Wallet User
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Connected via {userInfo.walletType || 'crypto wallet'}
                      </p>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Wallet Address
                        </label>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={userInfo.walletAddress}
                            readOnly
                            className="w-full px-3 py-2 bg-gray-100 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-lg text-sm font-mono"
                          />
                          <button
                            onClick={() => navigator.clipboard.writeText(userInfo.walletAddress)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-zinc-600 rounded"
                            title="Copy address"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Wallet Type
                        </label>
                        <input 
                          type="text" 
                          value={userInfo.walletType}
                          readOnly
                          className="w-full px-3 py-2 bg-gray-100 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-lg text-sm capitalize"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscription Card */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      subscription.tier === 'premium' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                      subscription.tier === 'pro' ? 'bg-gradient-to-r from-blue-500 to-purple-600' :
                      'bg-gray-500'
                    }`}>
                      {subscription.tier === 'premium' ? (
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ) : subscription.tier === 'pro' ? (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white capitalize">
                        {subscription.tier} Plan
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {subscription.tier === 'pro' ? '$150 USDT one-time' :
                         subscription.tier === 'premium' ? '$200 USDT one-time' : ''}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowBillingModal(true)}
                    className="bg-white dark:bg-zinc-800 border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    style={{ display: subscription.tier === 'pro' || subscription.tier === 'premium' ? 'none' : undefined }}
                  >
                    Upgrade
                  </Button>
                </div>

                {/* Usage Stats */}
                {(subscription.tier === 'pro' || subscription.tier === 'premium') && (
                  <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">API Usage</span>
                      <span className="font-medium text-gray-900 dark:text-white">Unlimited</span>
                    </div>
                  </div>
                )}

                {/* Session Key Management */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Session Key
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      Auto-Sign
                    </Badge>
                  </div>
                  
                  {(() => {
                    const walletAddress = localStorage.getItem('wallet-public-key');
                    const sessionInfo = walletAddress ? sessionKeyService.getSessionKeyInfo(walletAddress) : { hasSession: false };
                    
                    if (sessionInfo.hasSession && sessionInfo.expiresAt) {
                      const daysLeft = Math.ceil((sessionInfo.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      
                      return (
                        <div className="space-y-3">
                          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Shield className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium text-green-800 dark:text-green-400">
                                Session Key Active
                              </span>
                            </div>
                            <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
                              <div>• Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}</div>
                              <div>• Automatic transaction signing enabled</div>
                              <div>• No wallet popups for chat messages</div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (walletAddress) {
                                  sessionKeyService.revokeSessionKey(walletAddress);
                                  // Refresh the component
                                  window.location.reload();
                                }
                              }}
                              className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                            >
                              <Shield className="w-4 h-4 mr-2" />
                              Revoke Session Key
                            </Button>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-4 h-4 text-yellow-600" />
                            <span className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                              Session Key Required
                            </span>
                          </div>
                          <div className="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
                            You need to authorize a session key to enable automatic transaction signing for chat messages.
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Redirect to login page to re-authorize
                              window.location.href = '/auth/login';
                            }}
                          >
                            <Shield className="w-4 h-4 mr-2" />
                            Authorize Session Key
                          </Button>
                        </div>
                      );
                    }
                  })()}
                </div>

                {/* Account Details */}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Account Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Member since</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {memberSince ? memberSince.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Last login</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {lastLogin ? lastLogin.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => setShowBillingModal(true)}
                    className="flex-1 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Manage Billing
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Security
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'ai-model':
        return (
          <div className="space-y-4 sm:space-y-6 pb-8">
            <div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">AI Model Settings</h3>
              
              <div className="space-y-4 sm:space-y-6">
                {/* Default Model Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-900 dark:text-white">
                    Default Model
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Choose your preferred AI model for conversations
                  </p>
                  <select 
                    value={settings.aiModel.defaultModel}
                    onChange={(e) => updateSettings({ 
                      aiModel: { ...settings.aiModel, defaultModel: e.target.value }
                    })}
                    className="mt-2 block w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                  >
                    {getAvailableModelsForTier(userInfo.subscriptionTier as 'free' | 'pro' | 'premium').map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name} {model.id === getDefaultModelForTier(userInfo.subscriptionTier as 'free' | 'pro' | 'premium') ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Temperature Setting */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white">
                      Temperature
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Controls randomness: 0 is focused, 1 is creative
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg border border-gray-200 dark:border-zinc-700">
                    <input 
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={settings.aiModel.temperature}
                      onChange={(e) => updateSettings({ 
                        aiModel: { ...settings.aiModel, temperature: parseFloat(e.target.value) }
                      })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider" 
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                      <span>Focused (0.0)</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        Current: {settings.aiModel.temperature}
                      </span>
                      <span>Creative (1.0)</span>
                    </div>
                  </div>
                </div>
                
                {/* Max Tokens Setting */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white">
                      Max Tokens
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Maximum length of the response
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg border border-gray-200 dark:border-zinc-700">
                    <input 
                      type="range"
                      min="256"
                      max="4096"
                      step="256"
                      value={settings.aiModel.maxTokens}
                      onChange={(e) => updateSettings({ 
                        aiModel: { ...settings.aiModel, maxTokens: parseInt(e.target.value) }
                      })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider" 
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                      <span>Short (256)</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        Current: {settings.aiModel.maxTokens} tokens
                      </span>
                      <span>Long (4096)</span>
                    </div>
                  </div>
                </div>
                
                {/* Stream Response Setting */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white">
                      Response Streaming
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Show responses as they are generated for faster interaction
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg border border-gray-200 dark:border-zinc-700">
                    <label className="flex items-start sm:items-center justify-between gap-3 cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900 dark:text-white block">
                          Enable streaming responses
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          See AI responses appear word by word as they're generated
                        </p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.aiModel.streamResponse}
                        onChange={(e) => updateSettings({ 
                          aiModel: { ...settings.aiModel, streamResponse: e.target.checked }
                        })}
                        className="h-4 w-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 shrink-0 mt-0.5 sm:mt-0" 
                      />
                    </label>
                  </div>
                </div>

                {/* ConvoArt API Key Setting */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white">
                      ConvoArt API Key
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Your DeepAI API key for ConvoArt image generation
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg border border-gray-200 dark:border-zinc-700">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shrink-0">
                        <Palette className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <input
                          type="password"
                          value={settings.aiModel.convoArtApiKey}
                          onChange={(e) => updateSettings({
                            aiModel: { ...settings.aiModel, convoArtApiKey: e.target.value }
                          })}
                          placeholder="Enter your DeepAI API key"
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 transition-colors"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Get your API key from <a href="https://deepai.org/api" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">deepai.org/api</a>
                        </p>
                      </div>
                                         </div>
                   </div>
                 </div>

                 {/* ConvoQ API Key Setting */}
                 <div className="space-y-3">
                   <div>
                     <label className="block text-sm font-medium text-gray-900 dark:text-white">
                       ConvoQ API Key
                     </label>
                     <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                       Your Groq API key for ConvoQ ultra-fast responses
                     </p>
                   </div>
                   
                   <div className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg border border-gray-200 dark:border-zinc-700">
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center shrink-0">
                         <span className="text-white font-bold text-sm">⚡</span>
                       </div>
                       <div className="flex-1">
                         <input
                           type="password"
                           value={settings.aiModel.convoQApiKey}
                           onChange={(e) => updateSettings({
                             aiModel: { ...settings.aiModel, convoQApiKey: e.target.value }
                           })}
                           placeholder="Enter your Groq API key"
                           className="w-full px-3 py-2 bg-white dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400 transition-colors"
                         />
                         <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                           Get your API key from <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-yellow-600 dark:text-yellow-400 hover:underline">console.groq.com</a>
                         </p>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         );

      case 'appearance':
        return (
          <div className="space-y-4 sm:space-y-6 pb-8">
            <div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">Theme</h3>
              <div className="mt-2 space-y-2">
                {[
                  { value: 'light', label: 'Light', icon: Sun },
                  { value: 'dark', label: 'Dark', icon: Moon },
                  { value: 'system', label: 'System', icon: Monitor }
                ].map(({ value, label, icon: Icon }) => (
                  <label key={value} className="flex items-center">
                    <input 
                      type="radio" 
                      name="theme"
                      value={value}
                      checked={settings.theme === value}
                      onChange={(e) => updateSettings({ theme: e.target.value })}
                      className="border-gray-300 dark:border-zinc-600" 
                    />
                    <Icon className="w-4 h-4 ml-2 mr-1" />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-4 sm:space-y-6 pb-6">
            <div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">Notification Preferences</h3>
              
              {/* Notification Permission Status */}
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Browser Notifications
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    typeof window !== 'undefined' && 'Notification' in window 
                      ? Notification.permission === 'granted' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : Notification.permission === 'denied'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {typeof window !== 'undefined' && 'Notification' in window 
                      ? Notification.permission === 'granted' 
                        ? 'Enabled' 
                        : Notification.permission === 'denied' 
                        ? 'Blocked' 
                        : 'Not Requested'
                      : 'Not Supported'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  {typeof window !== 'undefined' && 'Notification' in window 
                    ? Notification.permission === 'granted'
                      ? 'You can receive browser notifications when the app is closed.'
                      : Notification.permission === 'denied'
                      ? 'Notifications are blocked. Please enable them in your browser settings.'
                      : 'Click "Test Notification" to enable browser notifications.'
                    : 'Your browser does not support notifications.'}
                </p>
                
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={testNotification}
                  className="w-full sm:w-auto"
                >
                  <Bell className="w-3 h-3 mr-1" />
                  Test Notification
                </Button>
              </div>

              {/* Notification Categories with Collapsible Sections */}
              <div className="space-y-3">
                {/* Master Toggle for Push Notifications */}
                <div className="p-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white block">Enable All Push Notifications</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Master toggle for all notification types</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={settings.notifications.push}
                      onChange={(e) => handleNotificationToggle('push', e.target.checked)}
                      className="ml-3 h-4 w-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" 
                    />
                  </label>
                </div>

                {/* Chat Notifications */}
                <details className="group bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                  <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors list-none">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Chat Notifications</span>
                    </div>
                    <svg className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-zinc-700 pt-3 bg-gray-50/50 dark:bg-zinc-800/50">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-gray-900 dark:text-white block">Chat Completed</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Notify when AI finishes responding</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.notifications.chatComplete}
                        onChange={(e) => handleNotificationToggle('chatComplete', e.target.checked)}
                        className="ml-3 h-4 w-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" 
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-gray-900 dark:text-white block">New Messages</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Notify about new chat messages</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.notifications.newMessage}
                        onChange={(e) => handleNotificationToggle('newMessage', e.target.checked)}
                        className="ml-3 h-4 w-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" 
                      />
                    </label>
                  </div>
                </details>

                {/* System Notifications */}
                <details className="group bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                  <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors list-none">
                    <div className="flex items-center gap-3">
                      <Settings className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">System Notifications</span>
                    </div>
                    <svg className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-zinc-700 pt-3 bg-gray-50/50 dark:bg-zinc-800/50">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-gray-900 dark:text-white block">Usage Alerts</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Warn when approaching limits</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.notifications.usageAlerts}
                        onChange={(e) => handleNotificationToggle('usageAlerts', e.target.checked)}
                        className="ml-3 h-4 w-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" 
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-gray-900 dark:text-white block">Security Alerts</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Important security notifications</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.notifications.securityAlerts}
                        onChange={(e) => handleNotificationToggle('securityAlerts', e.target.checked)}
                        className="ml-3 h-4 w-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" 
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-gray-900 dark:text-white block">System Updates</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">New features and updates</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.notifications.systemUpdates}
                        onChange={(e) => handleNotificationToggle('systemUpdates', e.target.checked)}
                        className="ml-3 h-4 w-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" 
                      />
                    </label>
                  </div>
                </details>

                {/* Audio & Preferences */}
                <details className="group bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                  <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors list-none">
                    <div className="flex items-center gap-3">
                      <Volume2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Audio & Preferences</span>
                    </div>
                    <svg className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-zinc-700 pt-3 bg-gray-50/50 dark:bg-zinc-800/50">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-gray-900 dark:text-white block">Notification Sounds</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Play sound with notifications</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.notifications.sound}
                        onChange={(e) => handleNotificationToggle('sound', e.target.checked)}
                        className="ml-3 h-4 w-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" 
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-gray-900 dark:text-white block">Marketing Emails</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Promotional offers and updates</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.notifications.marketingEmails}
                        onChange={(e) => handleNotificationToggle('marketingEmails', e.target.checked)}
                        className="ml-3 h-4 w-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" 
                      />
                    </label>
                  </div>
                </details>
              </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-4 sm:space-y-6 pb-8">
            <div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">Privacy Settings</h3>
              <div className="space-y-3 sm:space-y-4">
                <label className="flex items-start sm:items-center justify-between gap-3 sm:gap-0">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-900 dark:text-white block">Data collection</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Allow collection of usage data to improve service</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.privacy.dataCollection}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      privacy: { ...prev.privacy, dataCollection: e.target.checked }
                    }))}
                    className="rounded border-gray-300 dark:border-zinc-600 shrink-0 mt-1 sm:mt-0" 
                  />
                </label>
                
                <label className="flex items-start sm:items-center justify-between gap-3 sm:gap-0">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-900 dark:text-white block">Analytics</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Help us understand how you use Convocore</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.privacy.analytics}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      privacy: { ...prev.privacy, analytics: e.target.checked }
                    }))}
                    className="rounded border-gray-300 dark:border-zinc-600 shrink-0 mt-1 sm:mt-0" 
                  />
                </label>
              </div>
            </div>
          </div>
        );

      case 'billing':
        return (
          <div className="space-y-4 sm:space-y-6 pb-8">
            <div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">Billing & Usage</h3>
              
              <div className="bg-gray-50 dark:bg-zinc-800 p-3 sm:p-4 rounded-lg mb-3 sm:mb-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Current Usage</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>
                      {usage?.requestsLimit === 3 ? 'Requests today' : 'Requests this month'}
                    </span>
                    <span className="font-medium">
                      {usage?.requestsUsed || 0} / {usage?.requestsLimit || 3}
                      {usage?.requestsLimit === 3 ? ' per day' : ' per month'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Subscription Plan</span>
                    <span className="font-medium capitalize flex items-center gap-1">
                      {subscription.tier}
                    </span>
                  </div>
                  {usage && subscription && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Usage Progress</span>
                        <span>{Math.round((usage.requestsUsed / usage.requestsLimit) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            (usage.requestsUsed / usage.requestsLimit) > 0.8 
                              ? 'bg-red-500' 
                              : (usage.requestsUsed / usage.requestsLimit) > 0.6 
                                ? 'bg-yellow-500' 
                                : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min((usage.requestsUsed / usage.requestsLimit) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowBillingModal(true)}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {subscription.tier === 'free' ? 'Upgrade Plan' : 'View Billing History'}
                </Button>
                
                {userInfo.walletAddress && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowBillingModal(true)}
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Manage Wallet
                  </Button>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-4xl p-0 overflow-hidden flex flex-col h-[95vh] max-h-[95vh] sm:h-[90vh] sm:max-h-[90vh] md:h-[85vh] md:max-h-[85vh] m-2 sm:m-4 md:m-6 lg:m-8">
        <div className="flex flex-col sm:flex-row h-full min-h-0">
          {/* Mobile Header with Tab Selector */}
          <div className="sm:hidden border-b border-gray-200 dark:border-zinc-700 p-3 sm:p-4 flex-shrink-0">
            <DialogHeader className="mb-3">
              <DialogTitle className="text-lg font-semibold">Settings</DialogTitle>
            </DialogHeader>
            
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as SettingsTab)}
              className="w-full p-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white text-sm"
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.label}
                </option>
              ))}
            </select>
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden sm:flex w-56 md:w-64 bg-gray-50 dark:bg-zinc-800 border-r border-gray-200 dark:border-zinc-700 p-3 md:p-4 flex-col flex-shrink-0">
            <DialogHeader className="mb-4 md:mb-6">
              <DialogTitle className="text-lg font-semibold">Settings</DialogTitle>
            </DialogHeader>
            
            <nav className="space-y-1 flex-1 overflow-y-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as SettingsTab)}
                    className={cn(
                      "w-full flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 text-left text-xs md:text-sm rounded-lg transition-colors",
                      activeTab === tab.id
                        ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700"
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Scrollable Content Area - Responsive height calculation */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-zinc-600 scrollbar-track-transparent">
              {renderTabContent()}
            </div>
            
            {/* Fixed Footer - Fully responsive spacing */}
            <div className="border-t border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex-shrink-0 p-3 sm:p-4 pb-4 sm:pb-4 md:pb-4 safe-area-inset-bottom">
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => onOpenChange?.(false)}
                  className="w-full sm:w-auto order-2 sm:order-1 h-10 sm:h-10 md:h-11 text-sm px-4"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving} 
                  className={cn(
                    "gap-2 w-full sm:w-auto order-1 sm:order-2 h-10 sm:h-10 md:h-11 text-sm px-4",
                    saveStatus === 'success' && "bg-green-600 hover:bg-green-700",
                    saveStatus === 'error' && "bg-red-600 hover:bg-red-700"
                  )}
                >
                  <Save className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">
                    {isSaving ? 'Saving...' : 
                     saveStatus === 'success' ? 'Saved!' :
                     saveStatus === 'error' ? 'Error!' :
                     'Save Changes'}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
      
      {/* Billing Modal */}
      <BillingModal 
        open={showBillingModal} 
        onOpenChange={setShowBillingModal} 
      />
    </Dialog>
  );
} 