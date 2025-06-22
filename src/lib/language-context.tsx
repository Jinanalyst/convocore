"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ko';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation dictionary
const translations = {
  en: {
    // Model descriptions
    'model.omni.description': 'Flagship model, multimodal, high performance, fast',
    'model.alpha.description': 'Most precise reasoning ability, long-form writing, advanced analysis',
    'model.turbo.description': 'High-speed response + quality balance, code/text optimization',
    'model.nova.description': 'Balanced performance, fast response, suitable for practical daily tasks',
    
    // Settings
    'settings.language': 'Language',
    'settings.english': 'English',
    'settings.korean': '한국어',
    'settings.theme': 'Theme',
    'settings.general': 'General',
    'settings.account': 'Account',
    'settings.appearance': 'Appearance',
    'settings.notifications': 'Notifications',
    'settings.privacy': 'Privacy',
    'settings.billing': 'Billing',
    
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.default': 'Default',
    'common.confirm': 'Confirm',
    'common.content': 'Content',
  },
  ko: {
    // Model descriptions  
    'model.omni.description': 'Flagship model, multimodal, high performance, fast',
    'model.alpha.description': 'Most precise reasoning ability, long-form writing, advanced analysis',
    'model.turbo.description': 'High-speed response + quality balance, code/text optimization',
    'model.nova.description': 'Balanced performance, fast response, suitable for practical daily tasks',
    
    // Settings
    'settings.language': 'Language',
    'settings.english': 'English',
    'settings.korean': '한국어',
    'settings.theme': 'Theme',
    'settings.general': 'General',
    'settings.account': 'Account',
    'settings.appearance': 'Appearance',
    'settings.notifications': 'Notifications',
    'settings.privacy': 'Privacy',
    'settings.billing': 'Billing',
    
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.default': 'Default',
    'common.confirm': 'Confirm',
    'common.content': 'Content',
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    // Load language from localStorage
    const savedLanguage = localStorage.getItem('convocore-language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ko')) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('convocore-language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
} 