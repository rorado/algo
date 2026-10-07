# TF-IDF Studio

An interactive web app for learning how TF-IDF turns text into numbers. Edit documents, change the settings, and watch every value update.

## Features

- **Playground:** write your own documents (or load an example dataset) and see TF, DF, IDF and TF-IDF recalculate instantly.
- **TF-IDF Lab:** change four numbers with +/− buttons or sliders and see the score, the sum, and a plain-English verdict update.
- **Step-by-step sections:** term frequency, inverse document frequency, stop words, and the combined score, each with its formula and live values.
- **TF-IDF matrix:** heatmap or table view, term search, L1/L2 normalization, CSV export and fullscreen.
- **Vocabulary ranking** and **document similarity** (cosine similarity).
- **Guided walkthrough**, glossary, and light/dark theme.

## Formulas

| Name | Formula |
| --- | --- |
| TF (relative) | count of t in d / number of processed terms in d |
| IDF (standard) | log(N / DF) |
| IDF (smoothed) | log(1 + N / (1 + DF)) |
| TF-IDF | TF × IDF |

`log` is the base-10 logarithm. N is the number of documents and DF is the number of documents containing the term.

Other settings: TF can be relative, raw count, log normalized (`1 + log(count)`) or binary. Preprocessing can lowercase, strip punctuation, remove stop words and numbers, and set a minimum word length.

## Getting started

Requires Node.js 18.18 or newer.

```bash
npm install
npm run dev      # http://localhost:3000
```

Other scripts:

```bash
npm run build    # production build
npm start        # serve the production build
```

## Project structure

```
app/
  page.tsx        main page and all sections
  Lab.tsx         the TF-IDF Lab simulation
  layout.tsx      page metadata
  globals.css     base styles
  readable.css    larger type, contrast and Lab styles (loaded after globals.css)
lib/
  tfidf.ts        tokenizer, TF/IDF/TF-IDF engine, cosine similarity
```

## Built with

Next.js 15, React 19, TypeScript, [motion](https://motion.dev) for animation and [lucide-react](https://lucide.dev) for icons.
