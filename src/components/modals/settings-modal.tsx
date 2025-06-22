"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Save
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BillingModal } from "@/components/modals/billing-modal";

interface SettingsModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type SettingsTab = 'general' | 'account' | 'ai-model' | 'appearance' | 'notifications' | 'privacy' | 'billing';

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
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

  // Load settings from localStorage and Supabase on mount
  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      // Check if user is wallet-authenticated
      const walletConnected = localStorage.getItem('wallet_connected') === 'true';
      const walletAddress = localStorage.getItem('wallet_address') || '';
      const walletType = localStorage.getItem('wallet_type') || '';

      if (walletConnected) {
        // Load wallet user info
        setUserInfo({
          name: `Wallet User`,
          email: '',
          walletAddress,
          walletType,
          subscriptionTier: 'free',
          isWalletUser: true
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

      // For Supabase users, load from database
      if (!walletConnected) {
        const { createClientComponentClient } = await import('@/lib/supabase');
        const supabase = createClientComponentClient();
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Load user info
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('full_name, email, subscription_tier, settings')
            .eq('id', user.id)
            .single();

          if (!userError && userData) {
            setUserInfo({
              name: userData.full_name || 'User',
              email: userData.email || user.email || '',
              walletAddress: '',
              walletType: '',
              subscriptionTier: userData.subscription_tier || 'free',
              isWalletUser: false
            });

            if (userData.settings) {
              setSettings(prev => ({ ...prev, ...userData.settings }));
              applyTheme(userData.settings.theme || 'system');
            }
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
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Profile Information</h3>
              <div className="space-y-4">
                {userInfo.isWalletUser ? (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-900 dark:text-white">Wallet Address</label>
                      <input 
                        type="text" 
                        value={userInfo.walletAddress}
                        readOnly
                        className="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-900 dark:text-white">Wallet Type</label>
                      <input 
                        type="text" 
                        value={userInfo.walletType}
                        readOnly
                        className="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded-md text-sm"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-900 dark:text-white">Full Name</label>
                      <input 
                        type="text" 
                        value={userInfo.name}
                        onChange={(e) => setUserInfo(prev => ({ ...prev, name: e.target.value }))}
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-900 dark:text-white">Email</label>
                      <input 
                        type="email" 
                        value={userInfo.email}
                        onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Subscription</h3>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                      {userInfo.subscriptionTier} Plan
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {userInfo.subscriptionTier === 'free' ? 'Free tier' : 
                       userInfo.subscriptionTier === 'pro' ? '$20 USDT/month' : 
                       '$40 USDT/month'}
                    </p>
                  </div>
                  <div className="text-right">
                    {userInfo.subscriptionTier !== 'free' && (
                      <p className="text-sm text-gray-700 dark:text-gray-300">Next billing: Dec 15, 2024</p>
                    )}
                    <Button variant="outline" size="sm" className="mt-1">
                      {userInfo.subscriptionTier === 'free' ? 'Upgrade' : 'Manage'}
                    </Button>
                  </div>
                </div>
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
      <DialogContent className="max-w-4xl h-[600px] p-0">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 dark:bg-zinc-800 border-r border-gray-200 dark:border-zinc-700 p-4">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-lg font-semibold">Settings</DialogTitle>
            </DialogHeader>
            
            <nav className="space-y-1">
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
          <div className="flex-1 flex flex-col">
            <div className="flex-1 p-6 overflow-y-auto">
              {renderTabContent()}
            </div>
            
            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-zinc-700 p-4 flex justify-end gap-3">
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