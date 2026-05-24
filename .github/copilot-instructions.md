# Copilot Instructions for mao-ledger

## Product Context

This project is a **frontend-only** web app for primary school children to manage allowance.

Core modules:
- allowance agreement contract
- monthly spending plan
- monthly actual cashflow (income/expense)
- summary dashboard
- AI conversation helper

## Technical Constraints

- No backend service in MVP.
- Persist data with browser storage (IndexedDB preferred).
- Must support local import/export (JSON).
- API keys for AI are stored locally only and can be removed by user.

## UX Requirements

- Keep UI simple and kid-friendly.
- Provide multiple visual styles/themes (cute / cool / minimal).
- Use short, encouraging language.

## Engineering Guidance

- Use TypeScript for all new app code.
- Keep modules small and easy to understand.
- Prioritize deterministic local-first behavior.
- Avoid adding heavy dependencies unless necessary.

## AI Safety & Prompting

- AI output should be educational and age-appropriate.
- Avoid giving legal/medical/financial professional advice.
- Prefer guidance style: explain, compare options, suggest reflection questions.

## Data Safety

- Never commit secrets or real API keys.
- Validate imported JSON shape and version before writing to storage.
- Keep export format versioned for future migrations.
