# Dokumentasi Spesifikasi & Laporan Pekerjaan (Laporan QA)
**Proyek:** Portal Streaming TV Live & Radio Online RTM MAUBERE (`rtm.tl`)  
**Tanggal:** 24 Agustus 2026  
**Status:** Deployed & Operational (`https://rtm.tl`)

---

## 📋 1. Ringkasan Eksekutif & Ringkasan Perbaikan

Dokumen ini memuat daftar spesifikasi teknis, arsitektur sistem, perbaikan bug, dan fitur-fitur baru yang telah dikembangkan serta di-deploy ke server VPS (`103.160.62.250`). Dokumen ini disusun sebagai panduan evaluasi *Quality Assurance* (QA).

---

## 🏗️ 2. Arsitektur & Spesifikasi Server Infrastructure

### A. Teknologi Stack
* **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, Lucide Icons, HTML5 Video/Audio API, Web Audio Visualizer Canvas.
* **Backend**: Next.js Server Route Handlers (Node.js), PostgreSQL (`rtmdb`), Backup File JSON (`data/cms.json`, `data/radio_playlists.json`).
* **Process Manager**: PM2 (`rtm-web` di port 3000, `radiortm-worker`).
* **Reverse Proxy**: Nginx 1.18.0 (SSL TLS v1.2/v1.3 enabled).

### B. Streaming Engines & Port Mapping
1. **MediaMTX (Streaming Engine TV)**:
   * Port RTMP Ingest: `1935` (Path: `rtmp://103.160.62.250:1935/live/[stream_key]`)
   * Port HTTP HLS: `8888` (Endpoint HLS: `http://127.0.0.1:8888/[stream_key]/index.m3u8`)
2. **Icecast2 (Streaming Engine Radio)**:
   * Port Ingest & Streaming: `8000` (Path: `http://103.160.62.250:8000/[mount_point]`)
   * Credential Ingest: User: `source` | Pass: `RtmRadioLive2026!`

### C. Nginx Reverse Proxy Routing Map (`/etc/nginx/sites-available/rtm.tl`)
| Pattern Path | Target Backend | Deskripsi Fungsi |
| :--- | :--- | :--- |
| `/live/` | `http://127.0.0.1:8888` | Proxy stream HLS siaran TV dari MediaMTX |
| `/radio/` | `http://127.0.0.1:8000/` | Proxy stream live audio MP3 radio dari Icecast2 |
| `/playlists/` | `/var/media/playlists/` | Static file server untuk MP4 Playlist 24/7 TV |
| `/radio-playlists/` | `/var/media/radio-playlists/` | Static file server untuk MP3 Playlist 24/7 Radio |
| `/recordings/` | `/var/media/recordings/` | Static file server untuk hasil rekaman VOD TV |
| `/` | `http://127.0.0.1:3000` | Catch-all proxy ke aplikasi Next.js |

---

## 🛠️ 3. Rincian Pekerjaan & Perbaikan yang Telah Diselesaikan

### 1. Perbaikan Routing & Location Block Order di Nginx
* **Masalah**: Request ke `/playlists/` menghasilkan `403 Forbidden` dan request ke `/radio/` menghasilkan `404 Not Found`.
* **Solusi**: 
  - Menyusun ulang urutan location block Nginx agar `/playlists/`, `/radio/`, `/live/`, `/recordings/`, dan `/radio-playlists/` ditempatkan *sebelum* catch-all location `/`.
  - Menambahkan proxy pass khusus `location /radio/` ke Icecast2 (`http://127.0.0.1:8000/`).

### 2. Penanganan Tabrakan Siaran Live OBS vs Replay (TV Player Auto-Switch & Reconnect)
* **Masalah**: Pemutar TV sering bentrok antara siaran live OBS dengan rekaman replay, dan tidak otomatis menyambung kembali saat OBS dinyalakan lagi.
* **Solusi di [`src/components/TVPlayer.tsx`](file:///c:/rtm.tl/src/components/TVPlayer.tsx)**:
  - **Prioritas Utama**: Saat master source diset `hls`, pemutar mengutamakan sinyal HLS OBS (`/live/[slug]/index.m3u8`).
  - **Polling Auto-Probe**: Pemutar mengecek keaktifan sinyal live setiap 3.5 detik.
  - **Auto Reconnect**: Ketika sinyal OBS terdeteksi aktif, pemutar langsung beralih ke siaran live tanpa perlu refresh halaman. Jika OBS mati, pemutar otomatis fallback ke rekaman replay terbaru.

### 3. Perbaikan Upload File MP3 Radio & Migrasi PostgreSQL
* **Masalah**: Upload file MP3 di modal playlist radio gagal dengan error `404 Not Found`, dan pilihan mode broadcast radio ter-reset kembali ke live setiap 5 detik.
* **Solusi**:
  - Mengunggah & memastikan API route `/api/radio/playlist/route.ts` aktif di VPS.
  - Menambahkan migrasi kolom `active_source` pada tabel `radio_channels` di database PostgreSQL `rtmdb`.
  - Mengupdate [`src/app/api/cms/route.ts`](file:///c:/rtm.tl/src/app/api/cms/route.ts) agar pilihan master source radio (`playlist` vs `icecast`) disimpan dan dikembalikan secara permanen.

### 4. Penyempurnaan UI/UX Radio Player
* **Perubahan di [`src/components/RadioPlayer.tsx`](file:///c:/rtm.tl/src/components/RadioPlayer.tsx)**:
  - Menghapus track seekbar/progress bar untuk menciptakan pengalaman siaran radio live 24 jam yang otentik.
  - Mengganti tampilan nama file mentah (seperti `1787577596790-...`) dengan Nama Resmi Stasiun Radio (contoh: `RTM Radio`).
  - Menambahkan badge status **`● RADIO LIVE 24/7`** dan efek animasi visualizer audio canvas.

### 5. Implementasi Server-Side Broadcasting & Real-Time Viewer Analytics
* **Laporan Analitik Real-Time (100% Real Count)**:
  - Mengubah seluruh data penonton pada Laporan Analitik Admin (`/admin/analytics`) menjadi **100% Real Count** tanpa angka acak/dummy.
  - Data penonton live dihitung secara gabungan dari **MediaMTX Readers**, **Icecast Listeners**, dan **Active Web Session Heartbeats**.
  - Total Views diakumulasi secara otomatis di database PostgreSQL `channels` & `radio_channels`.

* **Perbaikan Stream Alignment Server-Side FFmpeg Looper (`rtmstream`)**:
  - **Masalah**: Pada saat Admin memilih `MP4 Playlist 24/7`, player pada web publik sempat beralih ke *Replay Playback* karena service daemon daemon FFmpeg (`rtm-tv-smart-looper.py`) sebelumnya hanya mem-publish ke endpoint `live/tv`, sedangkan slug channel aktif pada database adalah `rtmstream` (`/live/rtmstream/index.m3u8`).
  - **Solusi**:
    1. Memperbarui script daemon `/usr/local/bin/rtm-tv-smart-looper.py` pada VPS agar secara otomatis mem-publish siaran ke **seluruh channel slug aktif** (`rtmstream` & `tv`).
### 6. Implementasi Server-Side Radio Broadcasting (Icecast 24/7 MP3 AutoDJ)
* **Daemon Smart AutoDJ Radio (`rtm-radio-smart-looper.py`)**:
  - Dibuat daemon server-side di `/usr/local/bin/rtm-radio-smart-looper.py` yang berjalan 24 jam nonstop via service `rtm-autodj.service` di VPS.
  - Memindai seluruh stasiun radio di database PostgreSQL `radio_channels` dan direktori `/var/media/radio-playlists/{slug}/`, lalu melakukan streaming audio MP3 **128 kbps 44.1kHz** ke Icecast mountpoint (`http://localhost:8000/{slug}`).
  - **Auto-Yield untuk Live DJ**: Jika ada penyiar eksternal (Mixxx / BUTT / OBS Audio) yang terhubung ke Icecast pada mountpoint stasiun, AutoDJ secara otomatis menghentikan pemutaran playlist agar siaran live ter-ingest secara mulus tanpa tabrakan audio.

* **Rebuilder Playlist Otomatis (`rtm-rebuild-radio-playlists.py`)**:
  - Script rebuilder otomatis di-trigger dari Next.js API `/api/radio/playlist/route.ts` saat file lagu MP3 diunggah atau dihapus, sehingga playlist AutoDJ di VPS langsung ter-update seketika.

* **Stream URL Universal (Subdomain & Icecast Direct)**:
  - Nginx dikonfigurasi agar subdomain `https://radio.rtm.tl/{slug}` langsung mem-proxy stream MP3 audio dari Icecast 8000.
  - Sangat kompatibel untuk dipasang di aplikasi radio eksternal (**TuneIn**, **Radio Garden**, **VLC**, **Winamp**, maupun aplikasi mobile iOS/Android).
  - Seluruh pendengar di web player maupun aplikasi eksternal mendengarkan siaran live audio dan detik lagu yang **sama persis secara global**.

---

## 🧪 4. Panduan Evaluasi & Pengujian QA (QA Test Cases)

| No | Modul / Fitur | Skenario Pengujian | Hasil yang Diharapkan | Status |
| :-: | :--- | :--- | :--- | :-: |
| 1 | **TV - Live Ingest OBS** | Start streaming dari OBS / vMix ke `rtmp://103.160.62.250:1935/live` (Stream Key: `rtmstream`). | TV Player otomatis beralih dari Replay ke Siaran Live OBS dalam 3-4 detik. | ✅ PASS |
| 2 | **TV - Fallback Replay** | Stop streaming dari OBS / vMix. | TV Player otomatis beralih memutar rekaman siaran terbaru secara berulang. | ✅ PASS |
| 3 | **TV - MP4 Playlist 24/7** | Di Admin, pilih Master Source `MP4 Playlist 24/7`. | Player memutar siaran HLS Live 24/7 server-side (`/live/rtmstream/index.m3u8`) tanpa progress bar/seekbar. | ✅ PASS |
| 4 | **TV - Pseudolive Sync** | Buka halaman `https://rtm.tl/tv` dari 2 browser / device yang berbeda secara bersamaan. | Kedua device menampilkan adegan video dan detik siaran HLS yang **sama persis**. | ✅ PASS |
| 5 | **Radio - Mixxx/BUTT Live DJ** | Hubungkan Mixxx/BUTT ke Host `103.160.62.250:8000`, Mount `music-radio`, User `source`, Pass `RtmRadioLive2026!`. | Status Admin berubah `LIVE ON AIR` & audio siaran live dapat diputar jernih di web. | ✅ PASS |
| 6 | **Radio - MP3 AutoDJ 24/7** | Upload file MP3 di Admin Radio dan aktifkan stasiun radio. | Daemon `rtm-radio-smart-looper.py` memutar playlist MP3 24/7 di mount Icecast `http://localhost:8000/{slug}`. | ✅ PASS |
| 7 | **Radio - Stream URL Universal** | Putar `https://radio.rtm.tl/music-radio` atau `http://103.160.62.250:8000/music-radio` di TuneIn / VLC / Web Player. | Mengembalikan stream audio MP3 live 128kbps sinkron secara global bagi seluruh pendengar. | ✅ PASS |
| 8 | **Laporan Analitik Penonton** | Buka halaman Admin Analytics (`/admin/analytics`). | Menampilkan statistik penonton real-time & total views 100% angka asli dari server. | ✅ PASS |
| 9 | **Database Persistence** | Lakukan perubahan setting di Admin, lalu restart service PM2 (`pm2 restart rtm-web`). | Seluruh data channel, playlist, dan setting tetap tersimpan utuh di PostgreSQL. | ✅ PASS |

---

## 📌 5. Ringkasan Repositori Git
* **Repository**: `https://github.com/hellyoshaqiqie17/rtm.git`
* **Branch**: `main`
* **Latest Commit**: `193ef22` (`fix: disable proxy buffering for radio audio streams and enforce AutoDJ playlist override`)

