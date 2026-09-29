# TokenFlow — Development Notes

> Catatan sesi pengembangan. Dokumen ini adalah handoff untuk sesi berikutnya:
> apa yang sudah dilakukan, bagaimana arsitekturnya, dan apa yang tinggal dikerjakan.

## Apa ini

**TokenFlow** adalah fork dari [QuantumNous/new-api](https://github.com/QuantumNous/new-api)
(AGPL-3.0) yang di-rebrand dan dikustomisasi menjadi marketplace API model AI
dinamis sendiri. Semua perubahan ada di commit-comit setelah `789c970`
(commit upstream terakhir yang mengikat).

## Cara menjalankan (lokal, Windows)

```bash
# Frontend
cd web && bun install && bun run build     # butuh bun (npm install gagal di npm klasik)

# Backend (meng-embed web/dist — build frontend DULU, baru go build)
go build -o new-api.exe .
PORT=3001 ./new-api.exe --log-dir ./logs   # SQLite otomatis di one-api.db
```

- Admin lokal: `root` / `minimal123` (hanya dev lokal, DB di-gitignore).
- Frontend dev mode: `cd web && VITE_REACT_APP_SERVER_URL=http://localhost:3001 bun x rsbuild dev --port 3002`
- Jangan commit: `legal/` (dokumen privat), `*.db`, `new-api.exe`, `logs/` — sudah di-gitignore.

## Riwayat perubahan (urut commit)

1. **Minimal design system** — token default `theme.css` diganti monokrom
   (primary near-black, radius 0.5rem, border hairline). Tampilan asli upstream
   dipertahankan sebagai preset **"classic"** di theme picker.
2. **Rebrand ke TokenFlow** — `common.SystemName` backend, fallback frontend,
   `index.html`, string i18n layanan (7 bahasa). Logo: `web/public/logo.svg`
   (spark monokrom).
3. **Legal** — Syarat & Ketentuan + Kebijakan Privasi (Bahasa Indonesia) di
   folder `legal/` (privat). Kontennya di-push ke **database** (option keys
   `legal.user_agreement`, `legal.privacy_policy`) via admin API — tidak pernah
   masuk git. Ada placeholder `[NAMA BADAN USAHA]` dll. yang harus diisi.
4. **Landing page Bento premium** (Apple/OpenAI style) — hero center + kartu
   terminal, model strip, bento features, CTA card. Copywriting manusiawi
   (7 bahasa). Header publik: pil floating asli (lebar scrolled `max-w-4xl`).
5. **De-iklankan open source** — klaim "Open Source" diganti "Self-hosted";
   footer tanpa link repo upstream dan hanya satu copyright.
6. **Channel Antigravity (type 64)** — lihat di bawah.

## Fitur Antigravity channel (cara kerja)

Channel type `64` (`constant.ChannelTypeAntigravity`, `APITypeAntigravity`)
mengubah langganan Antigravity (IDE Google) menjadi upstream API:

- **Key format** (JSON di kolom key channel):
  `{access_token, refresh_token, project_id, tier?, email?, expired?, last_refresh?}`
- **Alur request**: OpenAI-compatible → adaptor Gemini (konversi) → dibungkus
  envelope Cloud Code Assist `{model: "models/<model>", project: <project_id>,
  request: <gemini payload>}` → POST `https://daily-cloudcode-pa.googleapis.com
  /v1internal:generateContent` (atau `:streamGenerateContent?alt=sse`) dengan
  `Authorization: Bearer <access_token>` + UA `antigravity/ide/1.0.7 darwin/arm64`.
- **Token refresh**: `service/antigravity_credential_refresh_task.go` — tick 10
  menit, refresh bila expiry < 30 menit, via `oauth2.googleapis.com/token`
  (client credentials Antigravity, embedded di IDE — ada di
  `relay/channel/antigravity/oauth.go`).
- **Model list**: `relay/channel/antigravity/constants.go` (gemini-3-pro,
  gemini-3.5-flash + varian low, gemini-pro-agent, claude-sonnet-4-6,
  claude-opus-4-6-thinking, gpt-oss-120b-medium).
- **Sudah terverifikasi end-to-end sampai Google** (401 dengan token dummy —
  wiring benar; butuh kredensial asli untuk lolos).
- Referensi implementasi: 9router (`../9router`) —
  `open-sse/providers/registry/antigravity.js`, `src/lib/oauth/providers/antigravity.js`,
  `open-sse/executors/antigravity.js`.

### ⚠️ Slice berikutnya (BELUM dikerjakan): OAuth login langsung di panel admin

Tujuan: tombol "Login with Google" di form channel type 64. Riset sudah lengkap:

- **Auth URL**: `https://accounts.google.com/o/oauth2/v2/auth` dengan
  `response_type=code`, `access_type=offline`, `prompt=consent`, scopes:
  `cloud-platform, userinfo.email, userinfo.profile, cclog, experimentsandconfigs`.
  Client: `1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com`
  / secret `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`. Google menerima redirect URI
  localhost port berapa pun (loopback client) — gunakan
  `http://<host>:<port>/api/antigravity/oauth/callback`.
- **Callback**: exchange code → tokens; lalu `POST
  https://cloudcode-pa.googleapis.com/v1internal:loadCodeAssist` (header UA +
  body `{metadata: {ideType: 9, platform: <enum OS>, pluginType: 2}}`) → dapat
  `cloudaicompanionProject` (project id) + tier dari `allowedTiers`. Bila kosong,
  onboarding: `POST .../v1internal:onboardUser` `{tierId, metadata}` sampai
  `done: true` (retry 5 detik, maks 10×).
- **Buat channel otomatis** dari callback (nama "Antigravity — <email>"), lalu
  admin tinggal isi model.
- Implementasi: `controller/antigravity_oauth.go` (login → 302 ke Google;
  callback → exchange → buat channel → HTML sukses), route di `router/api-router.go`
  (group admin), tombol di form channel (`web/src/features/channels/...`) yang
  tampil saat type 64 dipilih.

## Hal yang perlu diingat

- `bun install` wajib (npm klasik crash dengan graph dependency proyek ini).
- `go build` meng-embed `web/dist` (`//go:embed`) — **selalu rebuild frontend
  sebelum backend** bila ingin perubahan UI terbawa.
- Docker: `docker-compose.yml` tersedia; image resmi upstream bukan milik fork ini.
- Repo di-push ke `qwetls/<repo>` **private**. Jangan dibuat publik tanpa
  meninjau ulang kewajiban AGPL (tawarkan source ke pengguna layanan).
- Peringatan ToS: menjual akses langganan IDE (Antigravity/Claude Code) sebagai
  API melanggar ToS provider hulu — risiko ban akun ditanggung sendiri.
7. **De-upstream total → TokenFlow sebagai proyek open source baru** (2026-09-29) —
   versi `v1.0.0` (file `VERSION` + default `common.Version`, dikirim via
   `VITE_REACT_APP_VERSION` saat build frontend), modul Go di-rename
   `github.com/QuantumNous/new-api` → `github.com/qwetls/tokenflow`
   (termasuk submodule `relaykit`), SQLite `tokenflow.db`, cache dir
   `tokenflow-body-cache`, header copyright 1342 file web/plugins/electron →
   "TokenFlow contributors" (template `web/scripts/add-copyright.mjs` ikut
   diubah), link/link UI diarahkan ke `github.com/qwetls/tokenflow` (footer
   docs → repo README, About, halaman System Update → releases repo ini,
   feedback error page → issues, plugin marketplace →
   `qwetls/tokenflow-plugins` — repo ini **belum dibuat**, buat dengan format
   `index.json` yang sama bila mau fitur task plugin), README ditulis ulang,
   README bahasa upstream dihapus, workflow rilis/push image upstream
   dihapus (sisa: `ci.yml`), `docker-compose.yml` build lokal
   `qwetls/tokenflow:latest`, `tokenflow.service` (eks `new-api.service`),
   electron `productName` TokenFlow. **Dipertahankan sengaja:** satu baris
   atribusi "Based on new-api (AGPL-3.0)" di halaman About + blok upstream di
   `NOTICE` — syarat AGPLv3 §7(b) NOTICE upstream (atribusi + link proyek
   asal di lokasi prominent). Jangan dihapus tanpa sadar risikonya.
   Channel type "New API" (type 8) tetap ada — itu nama protokol, bukan branding.
