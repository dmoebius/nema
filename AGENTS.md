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
- Auth: Supabase Auth (Magic Link per E-Mail)
- Realtime: Supabase Realtime für Live-Updates über mehrere Geräte

### Branches & Deployments

| Branch | Deployment                            |
| ------ | ------------------------------------- |
| `main` | https://nema-app.pages.dev/           |
| `dev`  | https://dev.nema-app.pages.dev/       |

Build läuft in GitHub Actions, Deploy via Wrangler nach Cloudflare Pages.
Supabase URL/Key kommen aus GitHub Secrets (nie im Code hardcoden).

## Wichtige Konventionen

- Die Anwendungssprache ist Deutsch. I18n wird vorerst nicht implementiert.
- Die Implementationssprache ist Englisch. Alle Kommentare und Variablenbezeichnungen sind in Englisch. Dokumentation wie README.md und dieses Dokument sind aber in Deutsch.
- Tag-Filterung: UND-Verknüpfung (alle gewählten Tags müssen vorhanden sein)
- Suche: Volltext über Name, Firma, Telefon, E-Mail, Tags

## Repo-eigene Skills

Skills unter `.agents/skills/` sind **immer aktiv** beim Arbeiten an nema:
- `.agents/skills/vercel-react-best-practices/` — React-Best-Practices (Rendering, Rerender, Async, Bundle, JS). Vor jedem React-Code die relevanten Rules lesen.
- `.agents/skills/frontend-design/` — Design-Konventionen für die UI.

## Git / GitHub Workflow

- **Branch nach Merge löschen** — beim Mergen via API immer direkt danach `DELETE /repos/{owner}/{repo}/git/refs/heads/{branch}` aufrufen.
- **Pipeline nach Merge beobachten** — nach jedem Merge auf `dev` oder `main` die Pipeline des Zielbranches prüfen und bei Fehlern sofort analysieren.
- **Squash-Merge** für Feature-Branches auf `dev`.

## E2E Tests (Playwright)

- **Page Objects** — immer! Alle UI-Elemente und Interaktionen in Page Object Classes kapseln (`e2e/pages/`). Nie direkt Locatoren im Test-Code verwenden.
- **Keine individuellen Timeouts** bei `expect()`/`waitFor()` — immer den konfigurierten Default-Timeout von Playwright verwenden. Ausnahmen nur wenn fachlich begründet und kommentiert.
- Test-Beschreibungen (`describe`, `test`) immer auf Englisch.
- UI-Text in Locatoren (Labels, Button-Namen etc.) bleibt Deutsch — das ist die App-Sprache.
- **Formulartests — minimal + maximal:** Jeder E2E-Test für ein Formular muss zwei Varianten abdecken: einmal mit Mindestbefüllung (nur Pflichtfelder) und einmal mit vollständiger Befüllung aller Felder. Beide Einträge werden im selben Test angelegt und anschließend gemeinsam geprüft (Liste, Sortierung, Detailansicht).

## Entwicklungsrichtlinien

- React-Komponenten für Pages sollten klein gehalten werden, nicht groß und monolithisch. Eine Page besteht aus mehreren Komponenten. Komponenten sollen möglichs wiederverwendet werden.
- React-Komponenten sollten immer unter `src/components/` abgelegt werden. Zusammenhängende Komponenten sollten in Unterordnern unter `src/components/` abgelegt werden.
- Jede React-Komponente sollte immer durch einen Test abgesichert werden. Pages erhalten eine Storybook Seite und einen Storybook Test.
