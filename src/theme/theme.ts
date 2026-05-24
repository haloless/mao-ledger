export type Theme = 'cute' | 'cool' | 'minimal';

export type ThemeOption = {
  value: Theme;
  zh: string;
  en: string;
};

export const themeOptions: ThemeOption[] = [
  { value: 'cute', zh: '可爱风', en: 'Cute' },
  { value: 'cool', zh: '帅气风', en: 'Cool' },
  { value: 'minimal', zh: '简约风', en: 'Minimal' },
];
