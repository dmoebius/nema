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

### Umgebungsvariablen

Vor dem ersten Start werden zwei Dateien benötigt (beide sind gitignored):

**`.env.local`** – für `pnpm dev` / `pnpm build`:
```
VITE_SUPABASE_URL=https://your-dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**`.env.test.local`** – zusätzlich für E2E-Tests (Vorlage: `.env.test.local.example`):
```
cp .env.test.local.example .env.test.local
# Werte eintragen
```

Fehlen diese Dateien, zeigt die App eine rote Fehlermeldung im Browser statt einer weißen Seite.

### Befehle

| Befehl         | Beschreibung                                       |
|----------------|----------------------------------------------------|
| `pnpm dev`     | Starte Webapp im DEV Modus, http://localhost:5173  |
| `pnpm build`   | Erzeuge Artifakte in `dist/`                       |
| `pnpm preview` | Starte Webapp im PROD Modus, http://localhost:4173 |

