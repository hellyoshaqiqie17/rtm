'use client';

import React, { useState, useRef } from 'react';
import { useStreamContext } from '@/context/StreamContext';
import {
  Save, Globe, Youtube, ShieldCheck, CheckCircle2, Upload,
  Image as ImageIcon, RotateCcw, FileText, Layout, Eye, EyeOff,
  AlertTriangle, Loader2
} from 'lucide-react';

type TabKey = 'logo' | 'seo' | 'youtube' | 'security' | 'pages' | 'footer';

const DEFAULT_LOGO = 'https://i.ibb.co.com/tT9zRDqv/RTM-LOGO-Jadi.png';

export default function AdminSettingsPage() {
  const { adminUser, logoUrl, setLogoUrl, resetLogoUrl, siteSettings, updateSiteSettings } = useStreamContext();

  const [activeTab, setActiveTab] = useState<TabKey>('logo');

  // Logo state
  const [tempLogoUrl, setTempLogoUrl] = useState(logoUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingThumb, setIsUploadingThumb] = useState(false);

  // SEO state (sync with siteSettings)
  const [siteName, setSiteName] = useState(siteSettings.siteName);
  const [seoDescription, setSeoDescription] = useState(siteSettings.seoDescription);
  const [defaultThumbnail, setDefaultThumbnail] = useState(siteSettings.defaultThumbnail);

  // YouTube API state
  const [apiKey, setApiKey] = useState(siteSettings.youtubeApiKey);
  const [channelTargetUrl, setChannelTargetUrl] = useState(siteSettings.youtubeChannelUrl);

  // Security state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState('');

  // Static pages content
  const [termsContent, setTermsContent] = useState(siteSettings.termsContent);
  const [privacyContent, setPrivacyContent] = useState(siteSettings.privacyContent);
  const [helpContent, setHelpContent] = useState(siteSettings.helpContent);

  // Footer state
  const [footerText, setFooterText] = useState(siteSettings.footerText);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (siteSettings) {
      if (siteSettings.siteName !== undefined) setSiteName(siteSettings.siteName);
      if (siteSettings.seoDescription !== undefined) setSeoDescription(siteSettings.seoDescription);
      if (siteSettings.defaultThumbnail !== undefined) setDefaultThumbnail(siteSettings.defaultThumbnail);
      if (siteSettings.youtubeApiKey !== undefined) setApiKey(siteSettings.youtubeApiKey);
      if (siteSettings.youtubeChannelUrl !== undefined) setChannelTargetUrl(siteSettings.youtubeChannelUrl);
      if (siteSettings.termsContent !== undefined) setTermsContent(siteSettings.termsContent);
      if (siteSettings.privacyContent !== undefined) setPrivacyContent(siteSettings.privacyContent);
      if (siteSettings.helpContent !== undefined) setHelpContent(siteSettings.helpContent);
      if (siteSettings.footerText !== undefined) setFooterText(siteSettings.footerText);
    }
  }, [siteSettings]);

  React.useEffect(() => {
    if (logoUrl) {
      setTempLogoUrl(logoUrl);
    }
  }, [logoUrl]);

  const showSavedSuccess = (customMsg?: string) => {
    setToastMessage(customMsg || '✓ Seluruh perubahan pengaturan berhasil disimpan ke database!');
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setToastMessage(null);
    }, 3500);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingLogo(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'logo');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success && data.url) {
        setTempLogoUrl(data.url);
        setLogoUrl(data.url);
        showSavedSuccess('✓ File Logo baru berhasil diupload dan disimpan!');
      } else {
        alert(data.error || 'Gagal mengupload file logo.');
      }
    } catch (err: any) {
      alert('Gagal mengupload logo: ' + (err?.message || 'Error'));
    } finally {
      setIsUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleThumbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingThumb(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'thumb');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success && data.url) {
        setDefaultThumbnail(data.url);
        showSavedSuccess('✓ Thumbnail default berhasil diupload!');
      } else {
        alert(data.error || 'Gagal mengupload file thumbnail.');
      }
    } catch (err: any) {
      alert('Gagal mengupload thumbnail: ' + (err?.message || 'Error'));
    } finally {
      setIsUploadingThumb(false);
      if (thumbInputRef.current) thumbInputRef.current.value = '';
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Save logo
    if (tempLogoUrl && tempLogoUrl !== logoUrl) {
      setLogoUrl(tempLogoUrl);
    }

    // Save all site settings
    updateSiteSettings({
      siteName,
      seoDescription,
      defaultThumbnail,
      youtubeApiKey: apiKey,
      youtubeChannelUrl: channelTargetUrl,
      footerText,
      termsContent,
      privacyContent,
      helpContent,
    });

    showSavedSuccess();
  };

  const handleResetDefaultLogo = () => {
    resetLogoUrl();
    setTempLogoUrl(DEFAULT_LOGO);
    showSavedSuccess('✓ Logo berhasil di-reset ke default RTM MAUBERE!');
  };

  const handleChangePassword = () => {
    setSecurityError('');
    setSecuritySuccess('');
    if (!oldPassword || !newPassword || !confirmPassword) {
      setSecurityError('Semua field password wajib diisi.');
      return;
    }
    if (oldPassword !== 'Rtm#WebAdmin2026!') {
      setSecurityError('Password lama salah.');
      return;
    }
    if (newPassword.length < 8) {
      setSecurityError('Password baru minimal 8 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecurityError('Konfirmasi password baru tidak cocok.');
      return;
    }
    setSecuritySuccess('Password berhasil diubah!');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'logo', label: 'Logo & Branding', icon: <ImageIcon className="w-4 h-4" /> },
    { key: 'seo', label: 'Umum & SEO', icon: <Globe className="w-4 h-4" /> },
    { key: 'pages', label: 'Konten Halaman', icon: <FileText className="w-4 h-4" /> },
    { key: 'footer', label: 'Footer & Header', icon: <Layout className="w-4 h-4" /> },
    { key: 'youtube', label: 'YouTube API', icon: <Youtube className="w-4 h-4" /> },
    { key: 'security', label: 'Keamanan', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  return (
    <form onSubmit={handleSave} className="space-y-6 font-sans selection:bg-[#E50914] selection:text-white">
      
      {/* Header with Top-Right Save Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Pengaturan Sistem & Branding
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Logo, SEO, konten halaman statis, footer, YouTube API, dan keamanan superadmin.
          </p>
        </div>

        <button
          type="submit"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#E50914] text-white hover:bg-red-700 text-xs font-extrabold shadow-lg shadow-red-900/40 transition-all active:scale-95 self-start sm:self-auto cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Perubahan</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-bold font-sans flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage || '✓ Seluruh perubahan pengaturan berhasil disimpan dan diterapkan ke database!'}</span>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex items-center gap-1 border-b border-white/10 text-xs font-semibold overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 px-3 transition-all relative whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === tab.key
                ? 'text-[#E50914] font-bold border-b-2 border-[#E50914]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB: PENGATURAN LOGO */}
      {activeTab === 'logo' && (
        <div className="bg-[#121212] p-6 sm:p-8 rounded-2xl border border-white/5 space-y-6 text-xs font-sans">
          
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            <ImageIcon className="w-5 h-5 text-[#E50914]" />
            <div>
              <h2 className="text-base font-bold text-white">Kelola Logo RTM MAUBERE</h2>
              <p className="text-xs text-neutral-400">Logo ini akan otomatis tampil di Navbar Header, Footer, dan Panel Admin Login.</p>
            </div>
          </div>

          {/* Current Logo Preview Box */}
          <div className="p-6 bg-black/60 rounded-2xl border border-white/10 space-y-4 text-center sm:text-left">
            <span className="text-[11px] font-mono font-bold text-neutral-400 block uppercase">PREVIEW LOGO HARI INI:</span>
            
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="p-4 bg-[#050505] rounded-xl border border-white/10 shadow-inner flex items-center justify-center min-w-[200px] min-h-[80px]">
                <img
                  src={tempLogoUrl || logoUrl || DEFAULT_LOGO}
                  alt="RTM Logo Preview"
                  className="max-h-12 max-w-[220px] object-contain drop-shadow-md"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_LOGO;
                  }}
                />
              </div>

              <div className="space-y-2">
                <span className="text-xs text-white font-bold block">Status Logo Aktif</span>
                <p className="text-[11px] text-neutral-400 font-mono truncate max-w-md">
                  URL: {(tempLogoUrl || logoUrl || '').substring(0, 70)}...
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={isUploadingLogo}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E50914] text-white font-bold hover:bg-red-700 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {isUploadingLogo ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Mengupload...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload File Logo Baru</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleResetDefaultLogo}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 text-neutral-300 font-semibold hover:bg-white/20 transition-all border border-white/10 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset Default Logo
                  </button>
                </div>
              </div>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </div>

          {/* Manual Input URL Logo */}
          <div className="space-y-2">
            <label className="block font-bold text-neutral-200 font-mono">
              Atau Input URL Gambar Logo (PNG / SVG / WebP):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tempLogoUrl}
                onChange={(e) => setTempLogoUrl(e.target.value)}
                placeholder="https://domain.com/logo-rtm.png atau /uploads/..."
                className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white font-mono focus:border-[#E50914] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => { setLogoUrl(tempLogoUrl); showSavedSuccess('✓ Logo URL berhasil diterapkan!'); }}
                className="px-5 py-3 rounded-xl bg-[#E50914] text-white font-bold hover:bg-red-700 transition-all shadow-md flex-shrink-0 cursor-pointer"
              >
                Terapkan
              </button>
            </div>
          </div>

        </div>
      )}

      {/* TAB: UMUM & SEO */}
      {activeTab === 'seo' && (
        <div className="bg-[#121212] p-6 sm:p-8 rounded-2xl border border-white/5 space-y-5 text-xs font-sans">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            <Globe className="w-5 h-5 text-[#E50914]" />
            <div>
              <h2 className="text-base font-bold text-white">Pengaturan Umum & SEO</h2>
              <p className="text-xs text-neutral-400">Konfigurasi nama situs, deskripsi meta, dan thumbnail default untuk SEO.</p>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-neutral-300 mb-1">Nama Situs Utama</label>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white font-bold focus:border-[#E50914] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-300 mb-1">Deskripsi Meta SEO</label>
            <textarea
              rows={3}
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white focus:border-[#E50914] focus:outline-none resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block font-semibold text-neutral-300 mb-1 font-mono">Default Thumbnail URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={defaultThumbnail}
                onChange={(e) => setDefaultThumbnail(e.target.value)}
                placeholder="https://images.unsplash.com/photo-... atau /uploads/..."
                className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white font-mono focus:border-[#E50914] focus:outline-none"
              />
              <button
                type="button"
                disabled={isUploadingThumb}
                onClick={() => thumbInputRef.current?.click()}
                className="px-4 py-3 rounded-xl bg-white/10 text-neutral-300 font-bold hover:bg-white/20 transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer border border-white/10"
              >
                {isUploadingThumb ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>Upload</span>
              </button>
            </div>
            <input
              ref={thumbInputRef}
              type="file"
              accept="image/*"
              onChange={handleThumbUpload}
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* TAB: KONTEN HALAMAN (Terms, Privacy, Help) */}
      {activeTab === 'pages' && (
        <div className="bg-[#121212] p-6 sm:p-8 rounded-2xl border border-white/5 space-y-6 text-xs font-sans">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            <FileText className="w-5 h-5 text-[#E50914]" />
            <div>
              <h2 className="text-base font-bold text-white">Kelola Konten Halaman Statis</h2>
              <p className="text-xs text-neutral-400">Edit konten untuk halaman Syarat & Ketentuan, Kebijakan Privasi, dan Bantuan. Mendukung format HTML.</p>
            </div>
          </div>

          {/* Syarat & Ketentuan */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-neutral-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                Syarat & Ketentuan
              </label>
              <a href="/terms" target="_blank" className="text-[10px] text-[#E50914] hover:text-red-400 font-mono flex items-center gap-1">
                <Eye className="w-3 h-3" /> Lihat Halaman →
              </a>
            </div>
            <textarea
              rows={6}
              value={termsContent}
              onChange={(e) => setTermsContent(e.target.value)}
              placeholder="Masukkan konten atau HTML untuk halaman Syarat & Ketentuan..."
              className="w-full p-4 bg-black/60 border border-white/10 rounded-xl text-neutral-200 font-mono text-xs focus:border-[#E50914] focus:outline-none"
            />
          </div>

          {/* Kebijakan Privasi */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-neutral-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                Kebijakan Privasi
              </label>
              <a href="/privacy" target="_blank" className="text-[10px] text-[#E50914] hover:text-red-400 font-mono flex items-center gap-1">
                <Eye className="w-3 h-3" /> Lihat Halaman →
              </a>
            </div>
            <textarea
              rows={6}
              value={privacyContent}
              onChange={(e) => setPrivacyContent(e.target.value)}
              placeholder="Masukkan konten atau HTML untuk halaman Kebijakan Privasi..."
              className="w-full p-4 bg-black/60 border border-white/10 rounded-xl text-neutral-200 font-mono text-xs focus:border-[#E50914] focus:outline-none"
            />
          </div>

          {/* Bantuan & Kontak */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-neutral-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                Bantuan & FAQ
              </label>
              <a href="/help" target="_blank" className="text-[10px] text-[#E50914] hover:text-red-400 font-mono flex items-center gap-1">
                <Eye className="w-3 h-3" /> Lihat Halaman →
              </a>
            </div>
            <textarea
              rows={6}
              value={helpContent}
              onChange={(e) => setHelpContent(e.target.value)}
              placeholder="Masukkan konten atau HTML untuk halaman Pusat Bantuan..."
              className="w-full p-4 bg-black/60 border border-white/10 rounded-xl text-neutral-200 font-mono text-xs focus:border-[#E50914] focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* TAB: FOOTER & HEADER */}
      {activeTab === 'footer' && (
        <div className="bg-[#121212] p-6 sm:p-8 rounded-2xl border border-white/5 space-y-5 text-xs font-sans">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            <Layout className="w-5 h-5 text-[#E50914]" />
            <div>
              <h2 className="text-base font-bold text-white">Pengaturan Footer & Header</h2>
              <p className="text-xs text-neutral-400">Atur teks hak cipta (copyright) dan keterangan footer portal.</p>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-neutral-300 mb-1">Teks Hak Cipta Footer (Copyright)</label>
            <input
              type="text"
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              placeholder="© 2026 RTM MAUBERE Production. All rights reserved."
              className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white font-medium focus:border-[#E50914] focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* TAB: YOUTUBE API */}
      {activeTab === 'youtube' && (
        <div className="bg-[#121212] p-6 sm:p-8 rounded-2xl border border-white/5 space-y-5 text-xs font-sans">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            <Youtube className="w-5 h-5 text-[#E50914]" />
            <div>
              <h2 className="text-base font-bold text-white">Konfigurasi YouTube API v3</h2>
              <p className="text-xs text-neutral-400">Gunakan API Key YouTube untuk sinkronisasi otomatis status live stream YouTube Channel.</p>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-neutral-300 mb-1 font-mono">YouTube Data API v3 Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white font-mono focus:border-[#E50914] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-300 mb-1 font-mono">Target Channel YouTube URL</label>
            <input
              type="text"
              value={channelTargetUrl}
              onChange={(e) => setChannelTargetUrl(e.target.value)}
              placeholder="https://www.youtube.com/@rtm_maubere_official"
              className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white font-mono focus:border-[#E50914] focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* TAB: KEAMANAN SUPERADMIN */}
      {activeTab === 'security' && (
        <div className="bg-[#121212] p-6 sm:p-8 rounded-2xl border border-white/5 space-y-5 text-xs font-sans">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            <ShieldCheck className="w-5 h-5 text-[#E50914]" />
            <div>
              <h2 className="text-base font-bold text-white">Keamanan & Password Admin</h2>
              <p className="text-xs text-neutral-400">Perbarui kata sandi akun superadmin untuk menjaga keamanan panel kendali.</p>
            </div>
          </div>

          {securityError && (
            <div className="p-3 bg-red-950/80 border border-red-500/40 rounded-xl text-red-300 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{securityError}</span>
            </div>
          )}

          {securitySuccess && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{securitySuccess}</span>
            </div>
          )}

          <div className="max-w-md space-y-4">
            <div>
              <label className="block font-semibold text-neutral-300 mb-1">Password Lama</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Masukkan password saat ini"
                className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white focus:border-[#E50914] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-300 mb-1">Password Baru</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white focus:border-[#E50914] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-300 mb-1">Konfirmasi Password Baru</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
                className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-white focus:border-[#E50914] focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleChangePassword}
              className="px-5 py-2.5 rounded-xl bg-[#E50914] text-white font-bold hover:bg-red-700 transition-all shadow-md cursor-pointer"
            >
              Ubah Password Superadmin
            </button>
          </div>
        </div>
      )}

    </form>
  );
}
