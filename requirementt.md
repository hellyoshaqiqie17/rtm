Setup Server Streaming 24 Jam (TV HLS + Radio Online) + Pembuatan Web Player Custom

SCOOP NYA:

A. Sisi Server Streaming Video (VPS Sudah Ready-Ubuntu):

1. Install & konfigurasi RTMP/HLS server (Nginx-RTMP / SRS / MediaMTX).

2. Setup SSL/HTTPS untuk subdomain streaming (misal: live.rtm.tl).

3. Sistem auto-looping playlist video MP4 → siaran 24/7 → menghasilkan link M3U8 (HLS).

4. Menyediakan RTMP URL + Stream Key untuk live manual dari OBS Studio.

5. M3U8 teruji bisa diputar di web player & VLC.

B. Radio Online (VPS yang sama):

1. Install server radio streaming (Icecast2 / AzuraCast / Shoutcast).

2. Setup AutoDJ 24/7: playlist MP3 looping otomatis + jadwal acara bila memungkinkan.

3. Menyediakan URL stream radio (MP3/AAC) yang bisa diputar di web player maupun aplikasi radio (TuneIn / Radio Garden / aplikasi mobile).

4. Fitur Live DJ: penyiar bisa mengambil alih siaran live dari PC/HP (Mixxx / BUTT).

5. Setup SSL/HTTPS untuk subdomain radio (misal: radio.rtm.tl).

C. Sisi Web Player Custom

Membuat halaman tontonan live video (HLS player: hls.js / Video.js) DAN halaman dengarkan radio online (audio player). untuk Desain halaman mengikuti tampilan (akan di info referensi web nya).

Terimkasih