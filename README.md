# Dun

Get things done. A focused to-do app with 4-hour nudges and shared Circles.

Dun is a **phone app you install from the browser** (a PWA). It is not a separate App Store / Play Store binary — it lives on your Home Screen and opens full-screen.

## On iPhone

1. Open Dun in **Safari** (not inside another app).
2. Tap **Share**, then **Add to Home Screen**.
3. Dun appears with its green icon. Open it from there — no Safari chrome.

iOS 16.4+ can also send the 4-hour reminder notifications after you allow them.

## On Android

1. Open Dun in **Chrome**.
2. Tap the menu, then **Install app** / **Add to Home Screen**.
3. Or use the **Install** banner in Dun.

## Run on your computer

You need [Node.js 22](https://nodejs.org/) or newer.

```bash
npm install
npm run dev
```

Then open the address it prints.

- Guest mode works immediately — tasks stay in this browser.
- Create an account (email + password) to sync and share Circles.

## Logo

`public/dun-logo.png` is the official Dun mark. Home-screen icons are `public/icon-180.png`, `icon-192.png`, and `icon-512.png`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the app |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript check |
