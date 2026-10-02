# Cat & Kin

A colorful, client-side cat personality quiz built with standalone Angular. Answer six questions to get matched with one of ten cat breeds, or browse the breed gallery. Answers are scored locally in the browser; there is no account, backend, or answer storage. Cat photos are served by Wikimedia Commons and need an internet connection. Photo credits and license links appear with each photo.

## Run locally

```bash
npm install
npm start
```

Open [http://localhost:4200](http://localhost:4200). The app reloads as you edit its source.

## Build and test

```bash
npm run build
npm test
```

The production build is written to `dist/cat-friends/browser` and can be hosted as a static site.

## Customize the quiz

Edit the questions, answer trait weights, breed profiles, and cat-photo details in `src/app/app.ts`. The matcher compares answer trait weights with each breed's personality profile; quiz navigation and answers use Angular signals.
