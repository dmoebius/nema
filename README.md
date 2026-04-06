# NeMa

NeMa (von **Ne**twork**Ma**rketing) ist ein lightweight CRM / Kontaktmanagement-Tool für Network-Marketing, orientiert
an der Contacts-App von Android.

Kernfunktionen:

* Kontakte anlegen/bearbeiten/löschen
* Volltextsuche
* Tag-Filter
* Sponsor/Downline-Beziehungen (Upline-Hierarchie)
* Wiedervorlage von Kontakten / Erinnerungsfunktion

## Entwicklung

| Befehl             | Beschreibung                                                                   |
|--------------------|--------------------------------------------------------------------------------|
| `pnpm dev`         | Starte Webapp im DEV Modus, http://localhost:5173                              |
| `pnpm build`       | Erzeuge Artifakte in `dist/`                                                   |
| `pnpm preview`     | Starte Webapp im PROD Modus, http://localhost:4173 ; setzt `pnpm:build` voraus |
| `pnpm test:e2e`    | E2E-Tests headless; setzt `pnpm build && pnpm preview` voraus                  |
| `pnpm test:e2e:ui` | E2E-Tests mit UI; setzt `pnpm build && pnpm preview` voraus                    |


### Setup

Vor dem ersten Start von `pnpm dev` / `pnpm build` und den E2E-Tests wird eine Datei `.env.local` benötigt (gitignored). Als Vorlage dient `.env.local.example`:
```
cp .env.local.example .env.local
# Werte eintragen
```

Vor dem ersten Start der E2E-Tests mit `pnpm test:e2e` oder `pnpm:test:e2e:ui` muss einmalig `pnpm playwright:install` aufgerufen werden, um die Playwright Browser zu installieren.
