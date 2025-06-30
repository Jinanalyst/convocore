"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { isBrowserEnvironment, isLocalStorageAvailable } from './context-test';

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
    'settings.aiModel': 'AI Model',
    
    // Header
    'header.newChat': 'New Chat',
    'header.upgradeToPro': 'Upgrade to Pro',
    'header.profile': 'Profile',
    'header.settings': 'Settings',
    'header.logout': 'Logout',
    
    // Chat
    'chat.placeholder': 'Type your message here...',
    'chat.send': 'Send',
    'chat.thinking': 'Thinking...',
    'chat.webSearch': 'Web Search',
    'chat.thinkMode': 'Think Mode',
    'chat.voiceInput': 'Voice Input',
    'chat.attach': 'Attach File',
    'chat.newConversation': 'New Conversation',
    'chat.recentChats': 'Recent Chats',
    'chat_area.loading_chat': 'Loading chat...',
    
    // Convocore Page
    'convocore.welcome': 'Hello! How can I help you today?',
    'convocore.start_conversation': 'Start a new conversation or select one from the sidebar.',
    'convocore.placeholder1': 'Generate a landing page for a new SaaS product',
    
    // Subscription
    'subscription.free': 'Free',
    'subscription.pro': 'Pro',
    'subscription.premium': 'Premium',
    'subscription.upgrade': 'Upgrade',
    'subscription.manage': 'Manage',
    'subscription.usage': 'Usage',
    'subscription.requestsUsed': 'requests used',
    'subscription.requestsLimit': 'request limit',
    
    // Auth
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Sign Up',
    'auth.signOut': 'Sign Out',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.rememberMe': 'Remember me',
    'auth.createAccount': 'Create account',
    'auth.alreadyHaveAccount': 'Already have an account?',
    'auth.dontHaveAccount': "Don't have an account?",
    
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.default': 'Default',
    'common.confirm': 'Confirm',
    'common.content': 'Content',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.warning': 'Warning',
    'common.info': 'Information',
    'common.close': 'Close',
    'common.copy': 'Copy',
    'common.copied': 'Copied!',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.share': 'Share',
    'common.export': 'Export',
    'common.import': 'Import',
    'model_info_modal.input_title': 'Input',
    'model_info_modal.output_title': 'Output',
    'model_info_modal.latency_title': 'Latency',
  },
  ko: {
    // Model descriptions  
    'model.omni.description': '플래그십 모델, 멀티모달, 고성능, 빠른 응답',
    'model.alpha.description': '가장 정확한 추론 능력, 장문 작성, 고급 분석',
    'model.turbo.description': '고속 응답 + 품질 균형, 코드/텍스트 최적화',
    'model.nova.description': '균형잡힌 성능, 빠른 응답, 일상적인 작업에 적합',
    
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
    'settings.aiModel': 'AI 모델',
    
    // Header
    'header.newChat': '새 채팅',
    'header.upgradeToPro': 'Pro로 업그레이드',
    'header.profile': '프로필',
    'header.settings': '설정',
    'header.logout': '로그아웃',
    
    // Chat
    'chat.placeholder': '메시지를 입력하세요...',
    'chat.send': '전송',
    'chat.thinking': '생각 중...',
    'chat.webSearch': '웹 검색',
    'chat.thinkMode': '사고 모드',
    'chat.voiceInput': '음성 입력',
    'chat.attach': '파일 첨부',
    'chat.newConversation': '새 대화',
    'chat.recentChats': '최근 채팅',
    'chat_area.loading_chat': '대화 불러오는 중...',
    
    // Convocore Page
    'convocore.welcome': '안녕하세요! 무엇을 도와드릴까요?',
    'convocore.start_conversation': '새 대화를 시작하거나 사이드바에서 대화를 선택하세요.',
    'convocore.placeholder1': '새로운 SaaS 제품을 위한 랜딩 페이지 생성',
    
    // Subscription
    'subscription.free': '무료',
    'subscription.pro': '프로',
    'subscription.premium': '프리미엄',
    'subscription.upgrade': '업그레이드',
    'subscription.manage': '관리',
    'subscription.usage': '사용량',
    'subscription.requestsUsed': '사용된 요청',
    'subscription.requestsLimit': '요청 한도',
    
    // Auth
    'auth.signIn': '로그인',
    'auth.signUp': '회원가입',
    'auth.signOut': '로그아웃',
    'auth.email': '이메일',
    'auth.password': '비밀번호',
    'auth.confirmPassword': '비밀번호 확인',
    'auth.forgotPassword': '비밀번호를 잊으셨나요?',
    'auth.rememberMe': '로그인 상태 유지',
    'auth.createAccount': '계정 생성',
    'auth.alreadyHaveAccount': '이미 계정이 있으신가요?',
    'auth.dontHaveAccount': '계정이 없으신가요?',
    
    // Common
    'common.save': '저장',
    'common.cancel': '취소',
    'common.default': '기본값',
    'common.confirm': '확인',
    'common.content': '내용',
    'common.loading': '로딩 중...',
    'common.error': '오류',
    'common.success': '성공',
    'common.warning': '경고',
    'common.info': '정보',
    'common.close': '닫기',
    'common.copy': '복사',
    'common.copied': '복사됨!',
    'common.edit': '편집',
    'common.delete': '삭제',
    'common.share': '공유',
    'common.export': '내보내기',
    'common.import': '가져오기',
    'model_info_modal.input_title': '입력',
    'model_info_modal.output_title': '결과',
    'model_info_modal.latency_title': '지연 시간',
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Only run in browser environment
    if (!isBrowserEnvironment()) {
      setIsInitialized(true);
      return;
    }

    // Load language from localStorage safely
    if (isLocalStorageAvailable()) {
      try {
        const savedLanguage = localStorage.getItem('convocore-language') as Language;
        if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ko')) {
          setLanguage(savedLanguage);
        }
      } catch (error) {
        console.warn('Failed to load language from localStorage:', error);
      }
    }
    
    setIsInitialized(true);
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    if (isBrowserEnvironment() && isLocalStorageAvailable()) {
      try {
        localStorage.setItem('convocore-language', lang);
      } catch (error) {
        console.warn('Failed to save language to localStorage:', error);
      }
    }
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  // Don't render children until context is initialized
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Initializing language context...</p>
        </div>
      </div>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    // Return a default context instead of throwing an error
    // This prevents the React error #321 during SSR or when context is not ready
    return {
      language: 'en' as Language,
      setLanguage: () => {},
      t: (key: string) => key // Return the key as fallback
    };
  }
  return context;
}

// Context check wrapper component
export function LanguageContextCheck({ children }: { children: React.ReactNode }) {
  const context = useContext(LanguageContext);
  
  if (context === undefined) {
    // Return a loading state instead of throwing an error
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
} 