# Communio Sanctorum — Catholic Saint Explorer

Browse 600+ Catholic saints chronologically, filter by era, region and type, search by patronage, and find your patron saint.

## Features
- **Browse** — searchable, filterable grid of all saints
- **Timeline** — saints grouped by era chronologically
- **Find Your Patron** — search by profession, ailment, situation, or browse by category
- **3 Themes** — Ornate (gold/medieval), Modern (clean/light), Dark (candlelit)
- **Saint detail modal** — biography, miracles, martyrdom, symbols, quotes, Wikipedia link
- **Clickable patronages** — click any patronage in a modal to find all saints who share it

## Getting Started
```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

Live demo: [https://dizzie42.github.io/saints/](https://dizzie42.github.io/saints/)

Live demo: [https://dizzie42.github.io/saints/](https://dizzie42.github.io/saints/)

```

## Data Scripts
```bash
# Fetch saints from Wikidata
node src/scripts/fetchSaints.js --limit 50 --offset 0

# Enrich with patronOf and categories
node src/scripts/enrichSaints.js

# Merge into saints.js
node src/scripts/mergeSaints.js

# Check for duplicates
node src/scripts/checkDuplicates.js --fix

# Count available saints on Wikidata
node src/scripts/countSaints.js
```

## Project Structure
```
src/
├── data/
│   ├── saints.js           # All saint data
│   └── patronCategories.js # Patron category definitions
├── components/
│   ├── Header.jsx
│   ├── SearchBar.jsx
│   ├── FilterPanel.jsx
│   ├── SaintCard.jsx
│   ├── SaintModal.jsx
│   ├── Timeline.jsx
│   └── FindYourPatron.jsx
├── scripts/
│   ├── fetchSaints.js
│   ├── enrichSaints.js
│   ├── mergeSaints.js
│   ├── fetchAllSaints.js
│   ├── checkDuplicates.js
│   └── countSaints.js
├── themes.js
├── App.js
├── App.css
└── index.js
```