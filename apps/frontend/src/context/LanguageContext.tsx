'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { SUPPORTED_LANGUAGES, Language } from '@dh-araria/shared/types';

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (languageCode: string) => void;
  translate: (text: string, targetLanguage?: string) => Promise<string>;
  isTranslating: boolean;
  supportedLanguages: Language[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(SUPPORTED_LANGUAGES[0]);
  const [isTranslating, setIsTranslating] = useState(false);

  // Load saved language from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage) {
      const lang = SUPPORTED_LANGUAGES.find(l => l.code === savedLanguage);
      if (lang) setCurrentLanguage(lang);
    }
  }, []);

  const setLanguage = useCallback((languageCode: string) => {
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === languageCode);
    if (lang) {
      setCurrentLanguage(lang);
      localStorage.setItem('preferredLanguage', languageCode);
      
      // Update document direction for RTL languages
      document.documentElement.dir = lang.direction;
      document.documentElement.lang = languageCode;
    }
  }, []);

  const translate = useCallback(async (text: string, targetLanguage?: string): Promise<string> => {
    if (!text.trim()) return text;
    
    const target = targetLanguage || currentLanguage.code;
    if (target === 'en') return text; // No translation needed for English

    setIsTranslating(true);
    try {
      // In Phase 3, this will call Bhashini API
      // For now, return original text
      console.log(`Translate "${text}" to ${target}`);
      return text;
    } catch (error) {
      console.error('Translation failed:', error);
      return text;
    } finally {
      setIsTranslating(false);
    }
  }, [currentLanguage.code]);

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    translate,
    isTranslating,
    supportedLanguages: SUPPORTED_LANGUAGES,
  };

  return (
    <LanguageContext.Provider value={value}>
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

// Helper hook for translated text
export function useTranslation() {
  const { translate, currentLanguage } = useLanguage();
  const [translatedText, setTranslatedText] = useState<string>('');

  const t = useCallback(async (text: string): Promise<string> => {
    if (currentLanguage.code === 'en') return text;
    const result = await translate(text);
    return result;
  }, [translate, currentLanguage.code]);

  return { t, currentLanguage };
}