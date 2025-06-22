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
  },
  ko: {
    // Model descriptions  
    'model.omni.description': '플래그십 모델, 멀티모달, 고성능, 빠름',
    'model.alpha.description': '가장 정밀한 추론 능력, 장문 작문, 고급 분석',
    'model.turbo.description': '고속 응답 + 고품질 균형, 코드/텍스트 최적화',
    'model.nova.description': '균형 잡힌 성능, 빠른 응답, 실용적인 일상 업무에 적합',
    
    // Settings
    'settings.language': '언어',
    'settings.english': 'English',
    'settings.korean': '한국어',
    'settings.theme': '테마',
    'settings.general': '일반',
    'settings.account': '계정',
    'settings.appearance': '외관',
    'settings.notifications': '알림',
    'settings.privacy': '개인정보',
    'settings.billing': '결제',
    
    // Common
    'common.save': '저장',
    'common.cancel': '취소',
    'common.default': '기본값',
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