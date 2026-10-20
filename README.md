# Floral Café – Webseiten-Entwurf

Unverbindlicher Webseiten-Vorschlag für das Floral Café in Frankfurt-Niederrad (Triftstraße 18).
Die Seite ist bewusst auf `noindex` gestellt, solange das Café nicht zugestimmt hat.

## Ansehen

Statische Seite ohne Build-Schritt. Lokal starten:

```sh
python3 -m http.server 8000
```

Dann http://localhost:8000 öffnen.

## Aufbau

- `index.html` – Seite (Hero, Angebot als Torte, Kleine Karte, Über uns, Besuch)
- `css/style.css` – Gestaltung, Animationen, responsive Regeln
- `js/main.js` – aufblühende Hintergrundblüten, Torte, Kaffeeglas als Scroll-Begleiter
- `img/` – Aquarell-Illustrationen (SVG, erzeugt)
- `scripts/aquarell.mjs` – erzeugt `img/*.svg` und die Torte in `index.html`: `node scripts/aquarell.mjs`
- `fonts/` – Fraunces & Jost (SIL Open Font License), lokal eingebunden
- `wissen/floral-cafe.md` – recherchierte Fakten zum Café mit Quellen

## Vor einer Veröffentlichung offen

- Zustimmung der Inhaberin, echte Fotos, Speisekarte mit Preisen
- Impressum und Datenschutzerklärung (Links im Fuß sind Platzhalter)
- `noindex` entfernen und Entwurfsleiste ausbauen
