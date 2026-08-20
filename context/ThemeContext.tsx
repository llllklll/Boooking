import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppTheme, ThemeConfig } from '../types';

export const THEMES: Record<AppTheme, ThemeConfig> = {
  royal: {
    id: 'royal',
    name: 'الأزرق الملكي الأكاديمي (Royal Blue)',
    subtitle: 'كحلي جامعي فاخر مع أزرق ياقوتي ولمسات سماوية مشرقة',
    primaryColor: '#1d4ed8',
    badgeBg: 'bg-blue-100 text-blue-900 border-blue-300',
    cardBg: 'bg-white',
    heroGradient: 'from-[#0a192f] via-[#0f2d59] to-[#1e3a8a]',
  },
  modern: {
    id: 'modern',
    name: 'الأزرق العصري (Modern Sapphire)',
    subtitle: 'تصميم أبيض نقي مع تباين أزرق كوبالت ناصع وأنيق',
    primaryColor: '#2563eb',
    badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
    cardBg: 'bg-white',
    heroGradient: 'from-slate-950 via-[#0b1b36] to-[#1d4ed8]',
  },
  vibrant: {
    id: 'vibrant',
    name: 'الشبابي الحيوي (Vibrant Indigo & Sky)',
    subtitle: 'أزرق نيلي وتركوازي متوهج بطابع شبابي محفز ومرح',
    primaryColor: '#0284c7',
    badgeBg: 'bg-sky-100 text-sky-900 border-sky-200',
    cardBg: 'bg-white',
    heroGradient: 'from-[#031b4e] via-[#075985] to-[#0284c7]',
  },
  dark: {
    id: 'dark',
    name: 'الوضع الليلي الكحلي (Midnight Blue)',
    subtitle: 'كحلي داكن عميق مع إضاءات زرقاء وسماوية متوهجة',
    primaryColor: '#38bdf8',
    badgeBg: 'bg-blue-950/80 text-sky-300 border-blue-800',
    cardBg: 'bg-[#0b1528]',
    heroGradient: 'from-black via-[#060e1d] to-[#0b1933]',
  },
};

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  config: ThemeConfig;
  styles: {
    appBg: string;
    textPrimary: string;
    textSecondary: string;
    cardBg: string;
    cardBorder: string;
    navBg: string;
    accentBtn: string;
    accentBtnSecondary: string;
    pillBg: string;
    heroGradient: string;
    sectionBgAlt: string;
    bannerGlow: string;
    badgeAccent: string;
    iconAccent: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    const saved = localStorage.getItem('orientation_theme') as AppTheme;
    return saved && THEMES[saved] ? saved : 'royal';
  });

  const setTheme = (t: AppTheme) => {
    setThemeState(t);
    localStorage.setItem('orientation_theme', t);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const config = THEMES[theme];

  // Dynamic Theme Styles Definition
  const styles = {
    royal: {
      appBg: 'bg-[#f8fafc]',
      textPrimary: 'text-slate-900',
      textSecondary: 'text-slate-600',
      cardBg: 'bg-white',
      cardBorder: 'border-slate-200 hover:border-blue-500/80',
      navBg: 'bg-[#07152b]/95 text-white',
      accentBtn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/25 font-bold',
      accentBtnSecondary: 'bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200',
      pillBg: 'bg-blue-50 text-blue-900 border-blue-200',
      heroGradient: 'from-[#071326] via-[#0c244d] to-[#1e40af]',
      sectionBgAlt: 'bg-slate-100/80',
      bannerGlow: 'border-blue-400/30 bg-blue-500/10 text-blue-300',
      badgeAccent: 'bg-blue-100 text-blue-900 border-blue-300',
      iconAccent: 'text-blue-600',
    },
    modern: {
      appBg: 'bg-slate-50',
      textPrimary: 'text-slate-900',
      textSecondary: 'text-slate-600',
      cardBg: 'bg-white',
      cardBorder: 'border-slate-200 hover:border-blue-400',
      navBg: 'bg-slate-900/95 text-white',
      accentBtn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 font-bold',
      accentBtnSecondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200',
      pillBg: 'bg-blue-50 text-blue-800 border-blue-200',
      heroGradient: 'from-slate-950 via-[#0a1b38] to-[#1e40af]',
      sectionBgAlt: 'bg-slate-100/70',
      bannerGlow: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
      badgeAccent: 'bg-blue-50 text-blue-800 border-blue-200',
      iconAccent: 'text-blue-600',
    },
    vibrant: {
      appBg: 'bg-sky-50/40',
      textPrimary: 'text-slate-900',
      textSecondary: 'text-slate-600',
      cardBg: 'bg-white',
      cardBorder: 'border-sky-100 hover:border-sky-400',
      navBg: 'bg-gradient-to-r from-[#031b4e] via-[#075985] to-[#0284c7] text-white',
      accentBtn: 'bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white shadow-md shadow-sky-500/25 font-bold',
      accentBtnSecondary: 'bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200',
      pillBg: 'bg-sky-50 text-sky-800 border-sky-200',
      heroGradient: 'from-[#031b4e] via-[#0a316b] to-[#0284c7]',
      sectionBgAlt: 'bg-white',
      bannerGlow: 'border-sky-400/30 bg-sky-500/20 text-sky-200',
      badgeAccent: 'bg-sky-100 text-sky-900 border-sky-300',
      iconAccent: 'text-sky-600',
    },
    dark: {
      appBg: 'bg-[#060d19]',
      textPrimary: 'text-slate-100',
      textSecondary: 'text-slate-400',
      cardBg: 'bg-[#0c1626]',
      cardBorder: 'border-slate-800 hover:border-sky-500/60',
      navBg: 'bg-[#040812]/95 text-slate-100 border-b border-slate-800',
      accentBtn: 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-md shadow-sky-500/20 font-extrabold',
      accentBtnSecondary: 'bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700',
      pillBg: 'bg-sky-950/70 text-sky-300 border-sky-800',
      heroGradient: 'from-black via-[#040a17] to-[#0d1e38]',
      sectionBgAlt: 'bg-[#091120]',
      bannerGlow: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
      badgeAccent: 'bg-sky-950/80 text-sky-300 border-sky-800',
      iconAccent: 'text-sky-400',
    },
  }[theme];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, config, styles }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
