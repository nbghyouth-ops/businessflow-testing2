# BUG REGISTER — Business Flow

| ID | Temuan | Status | Catatan |
|---|---|---|---|
| A1 | `src/db/index.ts` melempar error saat import tanpa `DATABASE_URL` | `FIXED` | Diubah menjadi lazy `Proxy` + `checkDatabaseHealth()`. |
| A2 | Unit test gagal tanpa DB | `FIXED` | Lazy DB init mencegah throw saat import modul server. |
| A3 | Next.js 16.2.6 advisory critical | `FIXED` | Dipin ke `next@16.4.6` & `eslint-config-next@16.4.6` (verifikasi `npm audit` menunggu mesin online). |
| A4 | 8 error lint `react-hooks/set-state-in-effect` | `FIXED` | Direfaktor memakai `useSyncExternalStore`, `useReducer`, dan key-remount. |
| A5 | Tidak ada `.gitignore`, `README.md`, `public/*`, skrip migrasi | `FIXED` | Seluruh berkas dibuat (kecuali `package-lock.json` yang butuh `npm install` online). |
| A7 | Receipt & Activity Export Center belum ada | `FIXED` | Dibangun penuh (snapshot server + PDF/JPG/PNG/XLSX/CSV + template editor + riwayat + verifikasi kode). |
| A8 | 7 pemanggilan `confirm()` native + `window.blur` agresif | `FIXED` | Diganti `ConfirmDialog` aksesibel + debounce `blur` 300ms + `beginExternalPicker()`. |
| A9 | Keranjang POS hilang saat terkunci | `FIXED` | Disimpan di store memori modul `src/lib/draft-store.ts`. |
| A10 | Tidak ada RLS & composite tenant FK | `FIXED` | Ditambahkan `002_rls_and_tenant_fk.sql` + `withTenant(ctx, tx)` di seluruh route. |
| A11 | `job-dispatcher` tanpa producer & validasi trigger | `FIXED` | Ditambahkan `enqueueProducerJobs`, `validateTriggerHeaders`, dan unit test. |
| A12 | Tidak ada penyimpanan lampiran | `FIXED` | Ditambahkan `StorageAdapter` `pg-bytea` (maks 3 MB + magic bytes). |
| A13 | `vercel.json` tanpa `regions`; `pg` tanpa timeout; 3 query auth | `FIXED` | `regions: ["sin1"]`, `connectionTimeoutMillis: 12000`, single-query auth join. |
| A14 | Rate limit hanya in-memory | `FIXED` | Ditambahkan `rateLimitDb` berbasis SQL atomik pada `api_rate_limits`. |
| BUG-NEW-1 | `Tabs` di `export/page.tsx` sempat memakai prop `items` alih-alih `tabs` | `FIXED` | Diperbaiki ke `tabs={...}`. |
