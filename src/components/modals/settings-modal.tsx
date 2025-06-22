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
      email: true,
      push: false,
      marketing: false
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
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings from localStorage and Supabase on mount
  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      // Load from localStorage first for immediate UI update
      const localSettings = localStorage.getItem('convocore-settings');
      if (localSettings) {
        const parsed = JSON.parse(localSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      }

      // Then try to load from Supabase
      const { createClientComponentClient } = await import('@/lib/supabase');
      const supabase = createClientComponentClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userSettings, error } = await supabase
          .from('users')
          .select('settings')
          .eq('id', user.id)
          .single();

        if (!error && userSettings?.settings) {
          setSettings(prev => ({ ...prev, ...userSettings.settings }));
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

      // Save to Supabase
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
    try {
      await saveSettings(settings);
      onOpenChange?.(false);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSettings = (updates: Partial<typeof settings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    // Auto-save certain settings immediately
    if (updates.theme) {
      saveSettings(newSettings);
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
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="zh">中文</option>
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
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white">Full Name</label>
                  <input 
                    type="text" 
                    defaultValue="John Doe"
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white">Email</label>
                  <input 
                    type="email" 
                    defaultValue="john@example.com"
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Subscription</h3>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Pro Plan</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">$20 USDT/month</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-700 dark:text-gray-300">Next billing: Dec 15, 2024</p>
                    <Button variant="outline" size="sm" className="mt-1">Manage</Button>
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
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  aiModel: { ...prev.aiModel, defaultModel: e.target.value }
                }))}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
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
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  aiModel: { ...prev.aiModel, temperature: parseFloat(e.target.value) }
                }))}
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
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  aiModel: { ...prev.aiModel, maxTokens: parseInt(e.target.value) }
                }))}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  checked={settings.aiModel.streamResponse}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    aiModel: { ...prev.aiModel, streamResponse: e.target.checked }
                  }))}
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
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Email notifications</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Receive updates via email</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.notifications.email}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      notifications: { ...prev.notifications, email: e.target.checked }
                    }))}
                    className="rounded border-gray-300 dark:border-zinc-600" 
                  />
                </label>
                
                <label className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Push notifications</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Browser notifications for new messages</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.notifications.push}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      notifications: { ...prev.notifications, push: e.target.checked }
                    }))}
                    className="rounded border-gray-300 dark:border-zinc-600" 
                  />
                </label>
                
                <label className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Marketing emails</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Updates about new features and offers</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.notifications.marketing}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      notifications: { ...prev.notifications, marketing: e.target.checked }
                    }))}
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
                
                <Button variant="outline" className="w-full">
                  <CreditCard className="w-4 h-4 mr-2" />
                  View Billing History
                </Button>
                
                <Button variant="outline" className="w-full">
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
              <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 