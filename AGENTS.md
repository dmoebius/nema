# AGENTS.md

## Zweck

NeMa (von **Ne**twork**Ma**rketing) ist ein lightweight CRM / Kontaktmanagement-Tool für Network-Marketing, orientiert an der Contacts-App von Android. Kernfunktionen: Kontakte anlegen/bearbeiten/löschen, Volltextsuche, Tag-Filter sowie Sponsor/Downline-Beziehungen (Upline-Hierarchie), Wiedervorlage von Kontakten / Erinnerungsfunktion.

## Tech Stack

| Bereich           | Technologie                                        |
| ----------------- | -------------------------------------------------- |
| Build / Dev       | Vite, TypeScript                                   |
| Framework         | React                                              |
| Routing           | React Router (SPA, BrowserRouter)                  |
| UI                | Material UI (MUI) + Emotion                        |
| PWA / Offline     | Serwist                                            |
| Native App        | Capacitor (Android + iOS)                          |
| Cloud Storage     | Supabase (DB + Storage + Auth + Realtime)          |
| Package Manager   | pnpm                                               |

### PWA / Offline

- Service Worker: `src/sw.ts` (Serwist)
- Precacht alle statischen Assets aus `dist/`
- Runtime-Caching via `defaultCache` (aus `@serwist/vite/worker`)

### Capacitor

- Native Shell für Android + iOS
- Graceful Degradation: `Capacitor.isNativePlatform()` entscheidet ob Telefonbuch-Sync aktiv ist
- Web-Deployment (GitHub Pages) läuft weiterhin parallel

### Supabase (Cloud Sync)

- Supabase = Master-Datenbank
- IndexedDB = lokaler Cache (Offline-Fähigkeit)
- Sync-Strategie: 3-Way-Merge, pro Attribut, last-write-wins anhand `updated_at` Timestamp
- Profilbilder: Supabase Storage (`avatars/<contact-id>.jpg`), client-side resize auf 256×256 vor Upload
- Auth: Supabase Auth (E-Mail/Password)
- Realtime: Supabase Realtime für Live-Updates über mehrere Geräte

### Branches & Deployments

| Branch | Deployment                              |
| ------ | --------------------------------------- |
| `main` | https://dmoebius.github.io/nema/        |
| `dev`  | https://dmoebius.github.io/nema-dev/    |

## Wichtige Konventionen

- Die Anwendungssprache ist Deutsch. I18n wird vorerst nicht implementiert.
- Die Implementationssprache ist Englisch. Alle Kommentare und Variablenbezeichnungen sind in Englisch. Dokumentation wie README.md und dieses Dokument sind aber in Deutsch.
- Tag-Filterung: UND-Verknüpfung (alle gewählten Tags müssen vorhanden sein)
- Suche: Volltext über Name, Firma, Telefon, E-Mail, Tags

## Entwicklungsrichtlinien

- React-Komponenten für Pages sollten klein gehalten werden, nicht groß und monolithisch. Eine Page besteht aus mehreren Komponenten. Komponenten sollen möglichs wiederverwendet werden.
- React-Komponenten sollten immer unter `src/components/` abgelegt werden. Zusammenhängende Komponenten sollten in Unterordnern unter `src/components/` abgelegt werden.
- Jede React-Komponente sollte immer durch einen Test abgesichert werden. Pages erhalten eine Storybook Seite und einen Storybook Test.
