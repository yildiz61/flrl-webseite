# Floral Café – Webseiten-Entwurf

Unverbindlicher Gestaltungsentwurf von Yildiz Kasimay für das Floral Café in Frankfurt-Niederrad.
Dies ist nicht die offizielle Webseite des Cafés. Die Seiten sind auf `noindex` gestellt.

## Ansehen

Statische Seite ohne Build-Schritt. Lokal starten:

```sh
python3 -m http.server 8000
```

Dann http://localhost:8000 öffnen.

## Veröffentlichen mit GitHub Pages

Settings → Pages → Build and deployment → Source „Deploy from a branch“ → diesen Branch und „/ (root)“ wählen → Save.
Die leere Datei `.nojekyll` sorgt dafür, dass GitHub die Dateien unverändert ausliefert.

## Aufbau

- `index.html` – Seite (Hero, Angebot als Torte, Kleine Karte, Über uns, Besuch)
- `impressum.html`, `datenschutz.html` – Anbieterkennzeichnung und Datenschutzerklärung
- `css/style.css` – Gestaltung, Animationen, responsive Regeln
- `js/main.js` – aufblühende Hintergrundblüten, Torte, Kaffeeglas als Scroll-Begleiter
- `img/` – Aquarell-Illustrationen (SVG, erzeugt)
- `scripts/aquarell.mjs` – erzeugt `img/*.svg` und die Torte in `index.html`: `node scripts/aquarell.mjs`
- `fonts/` – Fraunces & Jost (SIL Open Font License 1.1), lokal eingebunden
