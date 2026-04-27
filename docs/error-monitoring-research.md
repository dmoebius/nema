# Error Monitoring für nema — Recherche

## Ziel

JavaScript-Fehler aus der PWA an einen Server senden, sodass:

- **Dirk** die Logs einsehen kann (Dashboard)
- **Alfred (Agent)** die Logs per API abfragen und auf Muster reagieren kann

---

## Browser-APIs

Grundlage für jede Lösung:

```js
window.onerror = (msg, src, line, col, error) => {
  /* senden */
};
window.addEventListener("unhandledrejection", (e) => {
  /* senden */
});
```

`navigator.sendBeacon()` eignet sich für das Senden beim Seitenschluss (zuverlässiger als `fetch`).

**Wichtig:** Niemals PII (E-Mail, Namen, Kontaktdaten) in die Fehler-Payload aufnehmen. Nur: Error-Typ, Stack Trace, App-Version, Timestamp.

---

## Option 1: Sentry (Empfehlung)

**Free Tier:** 5.000 Fehler/Monat — für nema mehr als ausreichend.

**Vorteile:**

- Einfachste Integration: `@sentry/react` Package, 5 Zeilen Config
- Source Maps Support → lesbare Stack Traces trotz minifiziertem Build
- Dashboard mit Fehler-Gruppierung, Häufigkeit, Release-Tracking
- **API:** Sentry hat eine REST API → Alfred kann Issues abfragen, auf neue Fehler reagieren
- Vite-Plugin für automatisches Source Map Upload

**Nachteile:**

- Externe SaaS (US-Server) — kein Self-Hosting im Free Tier
- Nach 5.000 Fehlern/Monat werden Events gedroppt (nicht fakturiert)

**Integration:**

```bash
pnpm add @sentry/react
pnpm add -D @sentry/vite-plugin
```

```ts
// main.tsx
Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN, release: "nema@0.1.0" });
```

DSN kommt als GitHub Secret `VITE_SENTRY_DSN` → kein Hardcoding.

---

## Option 2: Highlight.io

**Free Tier:** 500 Sessions/Monat + unbegrenzte Fehler (Stand 2024).

**Vorteile:**

- Open Source (selbst hostbar auf eigenem VPS)
- Session Replay: Dirk sieht genau was der User vor dem Fehler gemacht hat
- Ebenfalls REST API vorhanden

**Nachteile:**

- Kleinere Community als Sentry
- Self-Hosting erfordert eigenen Server (den wir nicht haben)

---

## Option 3: Supabase als Error Log Store (DIY)

Fehler direkt in eine Supabase-Tabelle schreiben:

```sql
create table error_logs (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  message text,
  stack text,
  url text,
  app_version text,
  user_agent text
);
-- Kein user_id — Fehler sind anonym
-- RLS: insert für alle authentifizierten User, select nur für Service Role
```

**Vorteile:**

- Keine externe Abhängigkeit
- Alfred kann direkt per Supabase API die Logs lesen und reagieren
- Volle Kontrolle über Datenformat

**Nachteile:**

- Kein Dashboard (müsste selbst gebaut werden)
- Kein Source Map Support
- Rate Limiting muss selbst implementiert werden (Angreifer könnte DB fluten)
- Kein Gruppiering/Deduplication

---

## Option 4: Cloudflare Workers + D1

Fehler-Endpoint als Cloudflare Worker, Logs in D1 (SQLite).

**Free Tier:** 100.000 Worker-Requests/Tag, 5 GB D1.

**Vorteile:**

- Edge-nah, sehr schnell
- Komplett kostenlos für nema-Größe

**Nachteile:**

- Mehr Infrastruktur zu pflegen
- Kein fertiges Dashboard

---

## Wie kann Alfred reagieren?

### Sentry (bevorzugt)

Sentry API erlaubt:

```
GET /api/0/projects/{org}/{project}/issues/
```

Alfred kann periodisch (per OpenClaw Cron) neue Issues abfragen und Dirk per Telegram benachrichtigen wenn:

- Ein neuer Fehler-Typ auftaucht
- Ein Fehler >10x in 1h auftritt
- Ein kritischer Fehler gemeldet wird

### Supabase DIY

Alfred liest direkt:

```ts
supabase
  .from("error_logs")
  .select("*")
  .order("created_at", { ascending: false })
  .limit(50);
```

---

## Sicherheitsüberlegungen

1. **Kein PII in Logs:** Niemals E-Mail, Name, Kontaktdaten loggen. Nur technische Daten.
2. **Rate Limiting:** Max. 10 Fehler/Session senden (client-seitig zählen), danach droppen.
3. **DSN/Key als Secret:** `VITE_SENTRY_DSN` oder Supabase Service Role Key niemals im Client-Code.
   - Achtung: Sentry DSN ist bewusst öffentlich (nur für Ingest) — das ist ok.
   - Supabase Service Role Key niemals im Browser!
4. **Stack Traces:** Können Code-Struktur verraten — akzeptables Risiko für eine private App.

---

## Empfehlung für nema

**Sentry** ist die beste Wahl:

- Minimaler Aufwand (1 Package, 5 Zeilen)
- Free Tier reicht locker
- Alfred kann per Sentry API reagieren
- Source Maps → lesbare Fehler
- DSN ist public by design → kein Secret-Management-Problem

Als ergänzende Lösung: kritische App-Fehler zusätzlich in Supabase `error_logs` schreiben, damit Alfred ohne externe API-Abhängigkeit reagieren kann.
