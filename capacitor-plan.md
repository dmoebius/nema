# Capacitor Plan

## Ziel

nema als native Android-App ausliefern, mit bidirektionalem Telefonbuch-Sync.

## Architektur: Sync-Konzept

```
Android Telefonbuch
    ↕  (last-write-wins, auto beim App-Start)
nema IndexedDB
    ↕  (Supabase Realtime, bereits vorhanden)
Supabase
    ↕  (Supabase Realtime, bereits vorhanden)
nema Web (PC)
```

**Sync-Regeln:**
- last-write-wins überall, basierend auf `updated_at` Timestamp
- Telefonbuch-Sync nur auf Android (`Capacitor.isNativePlatform()`)
- TB gelöscht → nema löscht → Supabase löscht → PC sieht's weg
- nema/PC gelöscht → Supabase löscht → Handy synct → TB löscht
- Mapping via `androidContactId` im nema-Kontakt
- Android 10+ wird vorausgesetzt (`CONTACT_LAST_UPDATED_TIMESTAMP` verfügbar)
- iOS kommt später (dann vermutlich `iosContactId` als weiteres Feld)

---

## Phase 0 — Baseline ✅ (Voraussetzung)

- [ ] PR #5 reviewen und mergen (Dirk)
- [ ] dev → main mergen
- [ ] Sauberer Stand auf main als Ausgangspunkt

## Phase 1 — Android Setup + Permissions

Ziel: APK bauen, auf echtem Gerät testen — noch **ohne** Telefonbuch-Zugriff.

- [ ] `npx cap add android` → `android/`-Ordner erzeugen
- [ ] `capacitor.config.ts` prüfen / anpassen (appId, appName, webDir)
- [ ] AndroidManifest: `READ_CONTACTS` + `WRITE_CONTACTS` eintragen
- [ ] Runtime Permission Request implementieren (Android 6+)
- [ ] Build-Skript in `package.json`: `build:android` = `pnpm build && npx cap sync android`
- [ ] GitHub Actions Workflow: Debug-APK bauen + als Artifact ablegen
- [ ] Merge auf `dev`, Dirk testet APK auf echtem Gerät

## Phase 2 — Datenmodell erweitern

- [ ] `androidContactId: string | null` zum Kontakt-Typ hinzufügen
- [ ] Supabase-Migration: Spalte `android_contact_id` in contacts-Tabelle
- [ ] IndexedDB-Schema aktualisieren

## Phase 3 — Telefonbuch-Sync Service

- [ ] `src/services/phonebook-sync.ts` implementieren
  - Automatischer Sync beim App-Start (wenn native Platform + Permission)
  - Import: TB → nema (neue/geänderte Kontakte)
  - Export: nema → TB (neue/geänderte Kontakte)
  - Delete: bidirektional, Löschen = Änderung (last-write-wins)
  - Mapping über `androidContactId`

## Phase 4 — CI/CD (Signed Release)

- [ ] Keystore einrichten
- [ ] Signed Release APK in GitHub Actions
- [ ] Play Store (später)

---

*Erstellt: 2026-04-03 — Planung im #nema Discord-Channel*
