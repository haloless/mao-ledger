# Project Manager Guide

## 1. Delivery goal

Deliver a local-first MVP for children to manage allowance with a simple bilingual UI, no backend dependency, and a clear monthly cycle:

`contract -> monthly plan -> transactions -> summary -> AI helper`

## 2. Risk register

| Risk | Why it matters | Mitigation |
| --- | --- | --- |
| Business rule drift | Different pages may implement different accounting logic | Treat `docs/design.md` as the source of truth and encode frozen rules in shared domain helpers |
| Browser storage edge cases | IndexedDB can behave differently across browsers or privacy modes | Centralize storage access, add graceful error states, and test Chrome + Safari flows |
| Month boundary mistakes | Wrong month grouping or settlement breaks trust in summaries | Use explicit `YYYY-MM` month keys and test month rollover cases |
| Import merge errors | Bad conflict handling can duplicate or overwrite data | Require `updatedAt`, validate import shape, and use deterministic merge logic |
| Historical rule mutation | Changing a contract later could rewrite past months incorrectly | Store `contractSnapshot` and plan snapshots per month |
| AI safety and key exposure | Pure frontend AI keys and unsafe advice are sensitive | Keep keys local-only, allow deletion, support AI-off mode, and constrain prompts to educational guidance |
| UX overload for children | Too much information or too many controls can reduce usability | Prefer large actions, short copy, positive feedback, and progressive disclosure |

## 3. Art and asset plan

### Existing starter assets

- `assets/svg/brand-mark.svg`
- `assets/svg/mascot-cat-bank.svg`
- `assets/svg/icon-contract.svg`
- `assets/svg/icon-plan.svg`
- `assets/svg/icon-cashflow.svg`
- `assets/svg/icon-summary.svg`
- `assets/svg/icon-ai-helper.svg`
- `assets/svg/empty-records.svg`

### Remaining asset backlog

1. Theme decoration packs for cute / cool / minimal modes
2. Category icon set for savings, gifts, learning, toys, snacks, and custom items
3. Reward sticker or badge set for positive reinforcement
4. Empty, error, offline, and no-AI states
5. App icon, favicon, and PWA icons

### Asset production approach

- Prefer SVG-first assets for small bundle size and easy theming
- Keep outlines and shapes reusable across themes
- Start with one neutral illustration system, then recolor with tokens per theme

## 4. Execution method

Operate in short vertical slices:

1. Freeze rules and document them
2. Build a thin runnable shell
3. Add one coherent local-data-backed workflow at a time
4. Test the slice
5. Fix issues immediately
6. Move to the next slice

This project should be managed as a local-first MVP, not as a large up-front architecture effort. The preferred milestone order is:

| Milestone | Outcome |
| --- | --- |
| M0 | Rules frozen, PM and design docs aligned |
| M1 | App scaffold, routing, themes, and shared layout running |
| M2 | Core data layer and monthly rule snapshots working |
| M3 | Dashboard, contract, plan, transactions, summary, settings implemented |
| M4 | AI helper integrated with safe prompts and local key handling |
| M5 | Test coverage, browser checks, UX polish, and release readiness |

## 5. Testing strategy

### Unit tests

- Money calculations
- Monthly settlement and summary logic
- Plan vs actual comparison
- Contract snapshot behavior
- Import validation and merge resolution
- AI prompt builder and safety guards

### Component tests

- Theme switcher
- Reusable bilingual heading components
- Core forms for contract, plan, and transaction entry
- Summary cards and empty states

### End-to-end tests

1. First open and onboarding
2. Create a contract
3. Create a monthly plan
4. Add fixed and special income
5. Add expenses
6. Verify summary calculations
7. Export then re-import data
8. Exercise AI-off, missing-key, and provider-error states

### Manual verification

- Refresh persistence
- Narrow/mobile layout
- Keyboard reachability
- Contrast and readability
- Chrome and Safari behavior
- Offline behavior for non-AI features

## 6. PM operating mode

- Keep `docs/design.md` as the rule baseline
- Keep this file updated when scope, risks, or milestone logic changes
- Track implementation progress with session todos
- Use subagents for focused workstreams such as scaffold setup, UI buildout, and testing
- Merge and validate each slice before expanding scope
