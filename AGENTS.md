# Copilot instructions for Cat & Kin

## Project overview

This repository is a standalone Angular app for a client-side cat personality quiz. The app matches the user to one of several adoptable cat profiles based on six multiple-choice answers; the matching logic runs entirely in the browser. There is no backend, auth flow, or persisted user data.

Primary app code lives in `src/app/app.ts`, with the template and styles in `src/app/app.html` and `src/app/app.css`. The catalog of adoptable cats comes from `src/app/adoptable-cats.json`, and the scraper script in `scripts/scrape-adoptable-cats.mjs` refreshes that data.

## Build, test, and verification

From the repo root:

- Install dependencies: `npm install`
- Run the dev server: `npm start`
- Create a production build: `npm run build`
- Run the test suite: `npm test`
- Run tests in non-watch mode: `npm test -- --watch=false --browsers=ChromeHeadless`
- Run a single spec file: `npm test -- --watch=false --browsers=ChromeHeadless --include src/app/app.spec.ts`

There is no dedicated lint script in `package.json`.

## High-level architecture

- `src/main.ts` boots the Angular app.
- `src/app/app.ts` is the center of the app and contains the quiz data, trait definitions, matching logic, and the `App` component.
- `QUESTIONS` defines the six prompts and answer options; each answer contributes weighted trait values.
- `ADOPTABLE_CATS` is the scraped catalog used by the gallery and quiz matching. `MATCHABLE_CATS` filters the gallery down to cats eligible for the personality quiz.
- `findMatchingCat()` validates answer inputs and scores each cat by comparing the user’s trait totals to each cat’s profile keywords and trait text. The home-type question also filters out barn-specific matches when the user does not choose a barn/outdoor home.
- `src/app/app.html` renders the welcome, quiz, gallery, result, and restart flows; UI state is tracked with Angular signals.
- `scripts/scrape-adoptable-cats.mjs` is the data-generation script for the cat catalog; if the source shelter/site changes, this script is usually the place to update scraping logic.

## Key conventions in this repo

- Use Angular signals for component state (`signal`, `computed`) rather than introducing additional state management libraries.
- Treat `src/app/app.ts` as the source of truth for quiz content and matching behavior. When changing prompts, answer trait weights, or profile matching, keep `QUESTIONS`, `TRAITS`, `PROFILE_KEYWORDS`, and the match logic in sync.
- `findMatchingCat()` intentionally returns `null` for invalid or incomplete answers; keep that contract when adjusting validation or answer handling.
- Cat data is derived from `adoptable-cats.json` and contains details such as `images`, `sourceUrl`, `matchable`, and `applicationPending`. Preserve those fields when editing or regenerating the catalog.
- The test suite in `src/app/app.spec.ts` asserts a lot of behavior beyond rendering: it verifies question prompts, barn-home suitability, the result match logic, and the gallery content. Keep changes compatible with those expectations.
- The app is intentionally static and browser-only. Prefer client-side logic and data-driven configuration over introducing backend concerns unless a real user requirement demands it.

## Related repo files

- `README.md` documents the user-facing app behavior and local run instructions.
- `src/app/adoptable-cats.json` is the generated content backing the cat gallery and quiz results.
- `scripts/scrape-adoptable-cats.mjs` is the maintenance point for updating or regenerating the adopted-cats dataset.
