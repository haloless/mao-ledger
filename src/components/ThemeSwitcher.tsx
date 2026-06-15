import { useTheme } from '../theme/ThemeContext';
import { themeOptions } from '../theme/theme';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="theme-switcher" role="group" aria-label="Theme switcher">
      {themeOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          className={option.value === theme ? 'theme-button active' : 'theme-button'}
          aria-pressed={option.value === theme}
          onClick={() => setTheme(option.value)}
        >
          <span>{option.zh}</span>
          <small>{option.en}</small>
        </button>
      ))}
    </div>
  );
}
