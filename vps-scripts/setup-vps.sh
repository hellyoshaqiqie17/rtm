#!/bin/bash
# ==============================================================================
# RTM STREAMING PLATFORM - AUTOMATED UBUNTU VPS INSTALLER & CONFIGURATOR
# ==============================================================================
# Description: Automates setup for MediaMTX (RTMP/HLS), FFmpeg 24/7 Service,
#              AzuraCast/Icecast Radio Server, Nginx Reverse Proxy, and SSL.
# Target OS: Ubuntu 22.04 / 24.04 LTS
# ==============================================================================

set -e

echo "🚀 [RTM] Memulai Automated Server Setup..."

# 1. Update Packages & Dependencies
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y curl wget git ffmpeg nginx certbot python3-certbot-nginx ufw docker.io docker-compose-plugin

# 2. Configure Firewall (UFW)
echo "🔒 [RTM] Mengonfigurasi UFW Firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 1935/tcp  # RTMP for OBS Studio
sudo ufw allow 8000/tcp  # Icecast Radio Stream
sudo ufw allow 8888/tcp  # MediaMTX HLS Port
sudo ufw --force enable

# 3. Install MediaMTX
echo "📺 [RTM] Mengunduh dan mengonfigurasi MediaMTX Server..."
MEDIAMTX_VER="v1.6.0"
wget https://github.com/bluenviron/mediamtx/releases/download/${MEDIAMTX_VER}/mediamtx_${MEDIAMTX_VER}_linux_amd64.tar.gz
sudo tar -xzf mediamtx_${MEDIAMTX_VER}_linux_amd64.tar.gz -C /usr/local/bin/
rm mediamtx_${MEDIAMTX_VER}_linux_amd64.tar.gz

# Copy MediaMTX Config
sudo mkdir -p /etc/mediamtx
sudo cp mediamtx.yml /etc/mediamtx/mediamtx.yml

# Create MediaMTX Systemd Service
cat << 'EOF' | sudo tee /etc/systemd/system/mediamtx.service
[Unit]
Description=MediaMTX RTMP and HLS Streaming Server
After=network.target

[Service]
ExecStart=/usr/local/bin/mediamtx /etc/mediamtx/mediamtx.yml
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable mediamtx
sudo systemctl start mediamtx

# 4. Setup 24/7 Video Loop Service (FFmpeg)
echo "🔁 [RTM] Mengonfigurasi FFmpeg 24/7 TV Looper Service..."
sudo mkdir -p /var/media/tv
# Copy sample playlist
echo "file '/var/media/tv/sample_loop.mp4'" | sudo tee /var/media/tv/playlist.txt

# Install Systemd Service for FFmpeg
cat << 'EOF' | sudo tee /etc/systemd/system/ffmpeg-tv-loop.service
[Unit]
Description=FFmpeg 24/7 Video Playlist Looper to MediaMTX
After=mediamtx.service

[Service]
ExecStart=/usr/bin/ffmpeg -re -f concat -safe 0 -i /var/media/tv/playlist.txt -c:v libx264 -preset fast -maxrate 3000k -bufsize 6000k -pix_fmt yuv420p -g 50 -c:a aac -b:a 128k -ar 44100 -f flv rtmp://localhost:1935/live/tv
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable ffmpeg-tv-loop

# 5. Setup AzuraCast Radio Engine (Docker)
echo "📻 [RTM] Menginstall AzuraCast Radio Server via Docker..."
sudo mkdir -p /var/azuracast
cd /var/azuracast
sudo curl -fsSL https://raw.githubusercontent.com/AzuraCast/AzuraCast/main/docker.sh | bash -s install

# 6. Configure Nginx & SSL Certbot
echo "🌐 [RTM] Mengonfigurasi Nginx Reverse Proxy..."
sudo cp nginx-streaming.conf /etc/nginx/sites-available/streaming.conf
sudo ln -sf /etc/nginx/sites-available/streaming.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

echo "=========================================================================="
echo "✅ [RTM] Setup Server Streaming Selesai!"
echo "TV HLS Stream URL: https://live.rtm.tl/tv/index.m3u8"
echo "OBS RTMP Ingestion: rtmp://live.rtm.tl/live/STREAM_KEY"
echo "Radio Stream URL:   https://radio.rtm.tl/radio.mp3"
echo "=========================================================================="
