import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BilingualHeading from '../BilingualHeading';
import { ThemeProvider } from '../../theme/ThemeContext';
import ThemeSwitcher from '../ThemeSwitcher';

// ─── BilingualHeading ──────────────────────────────────────────────────────────

describe('BilingualHeading', () => {
  it('renders Chinese text as heading and English text as subtitle', () => {
    render(<BilingualHeading zh="仪表盘" en="Dashboard" />);
    // Chinese heading should be an h1 by default
    expect(screen.getByRole('heading', { name: '仪表盘' })).toBeInTheDocument();
    // English subtitle should appear as a paragraph
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders with the correct heading level', () => {
    render(<BilingualHeading zh="月度计划" en="Monthly Plan" level={2} />);
    expect(screen.getByRole('heading', { name: '月度计划', level: 2 })).toBeInTheDocument();
  });

  it('applies bilingual-heading wrapper class', () => {
    const { container } = render(<BilingualHeading zh="设置" en="Settings" />);
    expect(container.firstChild).toHaveClass('bilingual-heading');
  });
});

// ─── ThemeSwitcher inside ThemeProvider ───────────────────────────────────────

describe('ThemeSwitcher', () => {
  it('renders all three theme options with bilingual labels', () => {
    render(
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>
    );
    // Verify Chinese labels
    expect(screen.getByText('可爱风')).toBeInTheDocument();
    expect(screen.getByText('帅气风')).toBeInTheDocument();
    expect(screen.getByText('简约风')).toBeInTheDocument();
    // Verify English labels
    expect(screen.getByText('Cute')).toBeInTheDocument();
    expect(screen.getByText('Cool')).toBeInTheDocument();
    expect(screen.getByText('Minimal')).toBeInTheDocument();
  });

  it('switches theme when a button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>
    );
    // Click the "Cool" button
    const coolBtn = screen.getByRole('button', { name: /帅气风/i });
    await user.click(coolBtn);
    // data-theme attribute should reflect the new theme
    expect(document.documentElement).toHaveAttribute('data-theme', 'cool');
  });
});
