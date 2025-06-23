"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { usageService, type UserUsage, type SubscriptionInfo } from "@/lib/usage-service";
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
  Copy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BillingModal } from "@/components/modals/billing-modal";

interface SettingsModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type SettingsTab = 'general' | 'account' | 'ai-model' | 'appearance' | 'notifications' | 'privacy' | 'billing';

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [settings, setSettings] = useState({
    theme: 'system',
    language: 'en',
    autoSave: true,
    notifications: {
      push: false
    },
    aiModel: {
      defaultModel: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 2048,
      streamResponse: true
    },
    privacy: {
      dataCollection: true,
      analytics: false,
      shareUsage: false
    }
  });
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    walletAddress: '',
    walletType: '',
    subscriptionTier: 'free',
    isWalletUser: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);

  // Load settings from localStorage and Supabase on mount
  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      // Use auth context data and load real usage/subscription data
      if (user) {
        // Load real usage and subscription data
        const userUsage = usageService.getUserUsage(user.id);
        const userSubscription = usageService.getUserSubscription(user.id);
        setUsage(userUsage);
        setSubscription(userSubscription);

        setUserInfo({
          name: user.name,
          email: user.email,
          walletAddress: user.walletAddress || '',
          walletType: user.walletType || '',
          subscriptionTier: userSubscription.tier,
          isWalletUser: user.authType === 'wallet'
        });
      }

      // Load from localStorage first for immediate UI update
      const localSettings = localStorage.getItem('convocore-settings');
      if (localSettings) {
        const parsed = JSON.parse(localSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
        // Apply theme immediately
        applyTheme(parsed.theme || 'system');
      }

      // For Supabase users, load additional settings from database
      if (user?.authType === 'supabase') {
        const { createClientComponentClient } = await import('@/lib/supabase');
        const supabase = createClientComponentClient();
        
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        if (supabaseUser) {
          // Load user settings
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('settings')
            .eq('id', supabaseUser.id)
            .single();

          if (!userError && userData?.settings) {
            setSettings(prev => ({ ...prev, ...userData.settings }));
            applyTheme(userData.settings.theme || 'system');
          }
        }
      }
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

      // For Supabase users, save to database
      if (user?.authType === 'supabase') {
        const { createClientComponentClient } = await import('@/lib/supabase');
        const supabase = createClientComponentClient();
        
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        if (supabaseUser) {
          const { error } = await supabase
            .from('users')
            .upsert({
              id: supabaseUser.id,
              settings: newSettings,
              updated_at: new Date().toISOString()
            });

          if (error) {
            console.error('Error saving settings to Supabase:', error);
          }
        }
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
    // Set document language attribute
    document.documentElement.lang = language;
    
    // Store in localStorage for persistence
    localStorage.setItem('convocore-language', language);
    
    // You could also integrate with i18n libraries here
    console.log(`Language changed to: ${language}`);
    
    // For now, we'll just show a notification that language changed
    // In a real app, you'd reload the interface with new language strings
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  const handleNotificationToggle = async (type: 'push', value: boolean) => {
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
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      await Promise.all([
        saveSettings(settings),
        saveUserInfo()
      ]);
      setSaveStatus('success');
      setTimeout(() => {
        onOpenChange?.(false);
      }, 1000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSettings = (updates: Partial<typeof settings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    // Auto-save certain settings immediately
    if (updates.theme || updates.language) {
      saveSettings(newSettings);
    }
  };

  const saveUserInfo = async () => {
    try {
      const walletConnected = localStorage.getItem('wallet_connected') === 'true';
      if (!walletConnected) {
        const { createClientComponentClient } = await import('@/lib/supabase');
        const supabase = createClientComponentClient();
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error } = await supabase
            .from('users')
            .upsert({
              id: user.id,
              full_name: userInfo.name,
              email: userInfo.email,
              updated_at: new Date().toISOString()
            });

          if (error) {
            console.error('Error saving user info:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error saving user info:', error);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">Language</label>
              <select 
                value={settings.language}
                onChange={(e) => updateSettings({ language: e.target.value })}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                <option value="en">English</option>
                <option value="ko">한국어</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">Auto-save conversations</label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Automatically save your conversations for future reference</p>
              <label className="flex items-center mt-2">
                <input 
                  type="checkbox" 
                  checked={settings.autoSave}
                  onChange={(e) => updateSettings({ autoSave: e.target.checked })}
                  className="rounded border-gray-300 dark:border-zinc-600" 
                />
                <span className="ml-2 text-sm">Enable auto-save</span>
              </label>
            </div>
          </div>
        );

      case 'account':
        return (
          <div className="space-y-6">
            {/* Profile Section */}
            <div className="space-y-4">
              {/* Avatar and Basic Info */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gray-900 dark:bg-white rounded-full flex items-center justify-center">
                  {userInfo.isWalletUser ? (
                    <Wallet className="w-8 h-8 text-white dark:text-gray-900" />
                  ) : (
                    <User className="w-8 h-8 text-white dark:text-gray-900" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="space-y-3">
                    {userInfo.isWalletUser ? (
                      <>
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
                      </>
                    ) : (
                      <>
                        <div>
                          <input
                            type="text"
                            value={userInfo.name}
                            onChange={(e) => setUserInfo(prev => ({ ...prev, name: e.target.value }))}
                            className="text-lg font-semibold bg-transparent border-none outline-none text-gray-900 dark:text-white p-0 w-full focus:ring-0"
                            placeholder="Enter your name"
                          />
                          <input
                            type="email"
                            value={userInfo.email}
                            onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                            className="text-sm bg-transparent border-none outline-none text-gray-600 dark:text-gray-400 p-0 w-full focus:ring-0 mt-1"
                            placeholder="Enter your email"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Subscription Card */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      userInfo.subscriptionTier === 'premium' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                      userInfo.subscriptionTier === 'pro' ? 'bg-gradient-to-r from-blue-500 to-purple-600' :
                      'bg-gray-500'
                    }`}>
                      {userInfo.subscriptionTier === 'premium' ? (
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ) : userInfo.subscriptionTier === 'pro' ? (
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
                        {userInfo.subscriptionTier} Plan
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {userInfo.subscriptionTier === 'free' ? 'Free tier' : 
                         userInfo.subscriptionTier === 'pro' ? '$20 USDT/month' : 
                         '$40 USDT/month'}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowBillingModal(true)}
                    className="bg-white dark:bg-zinc-800 border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    {userInfo.subscriptionTier === 'free' ? 'Upgrade' : 'Manage'}
                  </Button>
                </div>

                {/* Usage Stats */}
                {usage && subscription && (
                  <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">API Usage</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {usage.requestsUsed} / {usage.requestsLimit}
                      </span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${Math.round((usage.requestsUsed / usage.requestsLimit) * 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {Math.round((usage.requestsUsed / usage.requestsLimit) * 100)}% used this {subscription.tier === 'free' ? 'day' : 'month'}
                    </p>
                  </div>
                )}
              </div>

              {/* Account Details */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Account Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Member since</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Last login</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date().toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
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
        );

      case 'ai-model':
        return (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">Default AI Model</label>
              <select 
                value={settings.aiModel.defaultModel}
                onChange={(e) => updateSettings({ 
                  aiModel: { ...settings.aiModel, defaultModel: e.target.value }
                })}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="gpt-4o">Convocore Omni</option>
                <option value="gpt-4-turbo">Convocore Turbo</option>
                <option value="claude-3-opus-20240229">Convocore Alpha</option>
                <option value="claude-3-sonnet-20240229">Convocore Nova</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Temperature: {settings.aiModel.temperature}
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Controls randomness in responses (0 = focused, 1 = creative)</p>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1"
                value={settings.aiModel.temperature}
                onChange={(e) => updateSettings({ 
                  aiModel: { ...settings.aiModel, temperature: parseFloat(e.target.value) }
                })}
                className="mt-2 w-full"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">Max Tokens</label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Maximum length of AI responses</p>
              <input 
                type="number" 
                min="100" 
                max="4000"
                value={settings.aiModel.maxTokens}
                onChange={(e) => updateSettings({ 
                  aiModel: { ...settings.aiModel, maxTokens: parseInt(e.target.value) }
                })}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  checked={settings.aiModel.streamResponse}
                  onChange={(e) => updateSettings({ 
                    aiModel: { ...settings.aiModel, streamResponse: e.target.checked }
                  })}
                  className="rounded border-gray-300 dark:border-zinc-600" 
                />
                <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">Stream responses</span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">Show responses as they're generated</p>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">Theme</label>
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
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Push notifications</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Browser notifications for new messages</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.notifications.push}
                    onChange={(e) => handleNotificationToggle('push', e.target.checked)}
                    className="rounded border-gray-300 dark:border-zinc-600" 
                  />
                </label>
              </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Privacy Settings</h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Data collection</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Allow collection of usage data to improve service</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.privacy.dataCollection}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      privacy: { ...prev.privacy, dataCollection: e.target.checked }
                    }))}
                    className="rounded border-gray-300 dark:border-zinc-600" 
                  />
                </label>
                
                <label className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Analytics</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Help us understand how you use Convocore</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.privacy.analytics}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      privacy: { ...prev.privacy, analytics: e.target.checked }
                    }))}
                    className="rounded border-gray-300 dark:border-zinc-600" 
                  />
                </label>
              </div>
            </div>
          </div>
        );

      case 'billing':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Billing & Usage</h3>
              
              <div className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg mb-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Current Usage</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>AI Requests this month</span>
                    <span className="font-medium">1,247 / Unlimited</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>API Calls</span>
                    <span className="font-medium">523 / Unlimited</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <Wallet className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">TRON Wallet Connected</p>
                    <p className="text-sm text-green-700 dark:text-green-300">TCUMVPmaTXfk4Xk9vHeyHED1DLAkw6DEAQ</p>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowBillingModal(true)}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  View Billing History
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowBillingModal(true)}
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Manage Wallet
                </Button>
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
      <DialogContent className="max-w-4xl h-[80vh] max-h-[800px] p-0">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 dark:bg-zinc-800 border-r border-gray-200 dark:border-zinc-700 p-4 flex flex-col">
            <DialogHeader className="mb-6">
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
                      "w-full flex items-center gap-3 px-3 py-2 text-left text-sm rounded-lg transition-colors",
                      activeTab === tab.id
                        ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 p-6 overflow-y-auto">
              {renderTabContent()}
            </div>
            
            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-zinc-700 p-4 flex justify-end gap-3 bg-white dark:bg-zinc-900">
              <Button variant="outline" onClick={() => onOpenChange?.(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className={cn(
                "gap-2",
                saveStatus === 'success' && "bg-green-600 hover:bg-green-700",
                saveStatus === 'error' && "bg-red-600 hover:bg-red-700"
              )}>
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 
                 saveStatus === 'success' ? 'Saved!' :
                 saveStatus === 'error' ? 'Error!' :
                 'Save Changes'}
              </Button>
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