'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';



export interface Channel {
  id: string;
  name: string;
  slug: string;
  category?: string;
  hlsUrl: string;
  youtubeUrl: string;
  activeSource: 'hls' | 'youtube' | 'playlist' | 'recording' | 'off';
  thumbnail: string;
  currentProgram: string;
  enabled: boolean;
  autoRecord?: boolean;
  recordedPlaybackUrl?: string;
  selectedRecordingUrl?: string;
}

export interface RadioChannel {
  id: string;
  name: string;
  description: string;
  streamUrl: string;
  thumbnail: string;
  category?: string;
  enabled: boolean;
  activeSource?: 'icecast' | 'playlist' | 'off';
}

export interface ScheduleItem {
  id: string;
  type: 'tv' | 'radio';
  channelId: string;
  title: string;
  host: string;
  timeStart: string;
  timeEnd: string;
  category: string;
  day: 'Hari Ini' | 'Besok';
  description: string;
}

export interface ShortItem {
  id: string;
  title: string;
  slug: string;
  youtubeId: string;
  thumbnail: string;
}

export interface SiteSettings {
  siteName: string;
  seoDescription: string;
  defaultThumbnail: string;
  youtubeApiKey: string;
  youtubeChannelUrl: string;
  footerText: string;
  termsContent: string;
  privacyContent: string;
  helpContent: string;
  pinnedHeroChannelId?: string;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: 'RTM MAUBERE',
  seoDescription: 'Portal Streaming TV Live 24/7 & Radio Online RTM MAUBERE Timor-Leste.',
  defaultThumbnail: '',
  youtubeApiKey: '',
  youtubeChannelUrl: 'https://www.youtube.com/@rtm_maubere_official',
  footerText: '© 2026 RTM MAUBERE Production. All rights reserved.',
  termsContent: '',
  privacyContent: '',
  helpContent: '',
  pinnedHeroChannelId: '',
};

export interface CategoryItem {
  id: string;
  name: string;
  image?: string;
}

export interface AdminUser {
  username: string;
  role: string;
  name: string;
}

interface StreamContextType {
  // TV Channels
  channels: Channel[];
  activeChannelId: string;
  activeChannel?: Channel;
  setActiveChannelId: (id: string) => void;
  updateChannel: (updatedChannel: Channel) => void;
  addChannel: (newChannel: Omit<Channel, 'id'>) => void;
  deleteChannel: (id: string) => void;
  toggleChannelSource: (id: string, source: 'hls' | 'youtube' | 'playlist' | 'recording' | 'off', selectedRecordingUrl?: string) => void;

  // Categories State
  categories: string[];
  categoryObjects: CategoryItem[];
  addCategory: (categoryName: string, image?: string) => void;
  updateCategory: (oldCategoryName: string, newCategoryName: string, image?: string) => void;
  deleteCategory: (categoryName: string) => void;

  // Program Schedules State (100% Admin Dynamic)
  schedules: ScheduleItem[];
  addSchedule: (newSchedule: Omit<ScheduleItem, 'id'>) => void;
  updateSchedule: (updatedSchedule: ScheduleItem) => void;
  deleteSchedule: (id: string) => void;

  // Shorts State
  shorts: ShortItem[];
  addShort: (newShort: Omit<ShortItem, 'id'>) => void;
  deleteShort: (id: string) => void;

  // Global TV URL accessor
  tvUrl: string;
  setTvUrl: (url: string) => void;

  // Radio Channels (Multiple Radio Support)
  radioChannels: RadioChannel[];
  activeRadioChannelId: string;
  activeRadioChannel?: RadioChannel;
  setActiveRadioChannelId: (id: string) => void;
  addRadioChannel: (newRadio: Omit<RadioChannel, 'id'>) => void;
  updateRadioChannel: (updatedRadio: RadioChannel) => void;
  deleteRadioChannel: (id: string) => void;
  toggleRadioChannelSource: (id: string, source: 'icecast' | 'playlist' | 'off') => void;
  resetRadioChannels: () => void;

  // Radio URL backward compatibility
  radioUrl: string;
  setRadioUrl: (url: string) => void;

  // Global Update Settings
  updateSettings: (newTvUrl: string, newRadioUrl: string) => void;

  // Demo & CDN Mode
  isDemoMode: boolean;
  setIsDemoMode: (demo: boolean) => void;
  cdnEnabled: boolean;
  cdnBaseUrl: string;
  setCdnEnabled: (enabled: boolean) => void;
  setCdnBaseUrl: (url: string) => void;

  // Site Logo Branding
  logoUrl: string;
  setLogoUrl: (url: string) => void;
  resetLogoUrl: () => void;

  // Admin Auth
  isAdminAuthenticated: boolean;
  adminUser: AdminUser | null;
  loginAdmin: (username: string, pass: string) => { success: boolean; error?: string };
  logoutAdmin: () => void;

  // Site Settings (SEO, YouTube, Footer, Static Pages)
  siteSettings: SiteSettings;
  updateSiteSettings: (newSettings: Partial<SiteSettings>) => void;

  // Modal Settings Toggle
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;

  // CMS Loaded state
  isCmsLoaded: boolean;
}

// Extract YouTube video ID from any format (watch, embed, short, live, shorts, etc.)
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // Direct 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // youtube.com/watch?v=VIDEO_ID
  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  // youtube.com/embed/VIDEO_ID
  const embedMatch = trimmed.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  // youtube.com/live/VIDEO_ID
  const liveMatch = trimmed.match(/\/live\/([a-zA-Z0-9_-]{11})/);
  if (liveMatch) return liveMatch[1];

  // youtu.be/VIDEO_ID
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  // youtube.com/v/VIDEO_ID or youtube.com/shorts/VIDEO_ID
  const vMatch = trimmed.match(/\/(?:v|shorts)\/([a-zA-Z0-9_-]{11})/);
  if (vMatch) return vMatch[1];

  return null;
}

// Extract YouTube video ID and return high-quality thumbnail URL
export function getYouTubeThumbnail(url: string): string | null {
  const videoId = extractYouTubeVideoId(url);
  if (videoId) {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }
  return null;
}

const DEFAULT_LOGO = 'https://i.ibb.co.com/tT9zRDqv/RTM-LOGO-Jadi.png';

const StreamContext = createContext<StreamContextType | undefined>(undefined);

export function StreamProvider({ children }: { children: React.ReactNode }) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryObjects, setCategoryObjects] = useState<CategoryItem[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  
  // Radio State
  const [radioChannels, setRadioChannels] = useState<RadioChannel[]>([]);
  const [activeRadioChannelId, setActiveRadioChannelId] = useState<string>('');

  // Shorts State
  const [shorts, setShorts] = useState<ShortItem[]>([]);

  // Site Settings State
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [cdnEnabled, setCdnEnabled] = useState<boolean>(false);
  const [cdnBaseUrl, setCdnBaseUrl] = useState<string>('https://cdn-edge.rtm.tl/live');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [logoUrl, setLogoUrlState] = useState<string>(DEFAULT_LOGO);
  const [isCmsLoaded, setIsCmsLoaded] = useState<boolean>(false);

  // Admin Auth State - Initialize synchronously from localStorage to prevent flash of unauthenticated state
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedAuth = localStorage.getItem('rtm_admin_auth');
        if (savedAuth) {
          const parsed = JSON.parse(savedAuth);
          return !!parsed?.authenticated;
        }
      } catch (e) {}
    }
    return false;
  });

  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedAuth = localStorage.getItem('rtm_admin_auth');
        if (savedAuth) {
          const parsed = JSON.parse(savedAuth);
          return parsed?.user || null;
        }
      } catch (e) {}
    }
    return null;
  });

  // Sync to VPS Server API (/api/cms) for global persistence across all browsers & devices
  const syncToServerCms = async (dataPayload: {
    channels?: Channel[];
    radioChannels?: RadioChannel[];
    categories?: string[];
    categoryObjects?: CategoryItem[];
    schedules?: ScheduleItem[];
    shorts?: ShortItem[];
    siteLogo?: string;
    siteSettings?: Partial<SiteSettings>;
  }) => {
    try {
      await fetch('/api/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataPayload),
      });
    } catch (err) {
      console.error('Error syncing CMS state to server:', err);
    }
  };

  // Fetch live CMS data from VPS API on mount & set up polling for global sync
  useEffect(() => {
    const fetchServerCms = async () => {
      try {
        const savedAuth = localStorage.getItem('rtm_admin_auth');
        if (savedAuth) {
          const parsed = JSON.parse(savedAuth);
          if (parsed?.authenticated) {
            setIsAdminAuthenticated(true);
            setAdminUser(parsed.user);
          }
        }

        // Clean up legacy stale localStorage keys that cause out-of-sync browser states
        localStorage.removeItem('rtm_channels');
        localStorage.removeItem('rtm_radio_channels');
        localStorage.removeItem('rtm_categories');
        localStorage.removeItem('rtm_schedules');
        localStorage.removeItem('rtm_cms_cache');

        const res = await fetch('/api/cms', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data?.channels && Array.isArray(data.channels)) {
            // Sort channels: pinned hero channel first, then by original creation order (already sorted by API)
            const pinnedId = data?.siteSettings?.pinnedHeroChannelId || '';
            const sorted = [...data.channels].sort((a: any, b: any) => {
              if (a.id === pinnedId) return -1;
              if (b.id === pinnedId) return 1;
              return 0; // preserve API order (created_at ASC) for non-pinned
            });
            
            // Auto-fill YouTube thumbnails for channels that still have default/unsplash images
            const enriched = sorted.map((chan: any) => {
              const isDefaultThumb = !chan.thumbnail || chan.thumbnail.includes('unsplash.com') || chan.thumbnail.includes('placeholder');
              if (isDefaultThumb && chan.youtubeUrl) {
                const ytThumb = getYouTubeThumbnail(chan.youtubeUrl);
                if (ytThumb) return { ...chan, thumbnail: ytThumb };
              }
              return chan;
            });
            setChannels(enriched);
            
            // Auto-initialize activeChannelId on first load only (when it's still empty)
            setActiveChannelId(prev => {
              if (prev && enriched.some((c: any) => c.id === prev)) return prev; // keep current selection
              if (pinnedId && enriched.some((c: any) => c.id === pinnedId)) return pinnedId;
              return enriched.length > 0 ? enriched[0].id : '';
            });
          }
          if (data?.radioChannels && Array.isArray(data.radioChannels)) {
            setRadioChannels(data.radioChannels);
          }
          if (data?.categoryObjects && Array.isArray(data.categoryObjects)) {
            setCategoryObjects(data.categoryObjects);
            setCategories(data.categoryObjects.map((c: any) => typeof c === 'string' ? c : c.name));
          } else if (data?.categories && Array.isArray(data.categories)) {
            const objs: CategoryItem[] = data.categories.map((c: any) => {
              if (typeof c === 'string') return { id: c, name: c, image: '' };
              return { id: c.id || c.name, name: c.name || '', image: c.image || '' };
            });
            setCategoryObjects(objs);
            setCategories(objs.map(o => o.name));
          }
          if (data?.schedules && Array.isArray(data.schedules)) {
            setSchedules(data.schedules);
          }
          if (data?.shorts && Array.isArray(data.shorts)) {
            setShorts(data.shorts);
          }
          if (data?.siteLogo) {
            setLogoUrlState(data.siteLogo);
          }
          if (data?.siteSettings && typeof data.siteSettings === 'object') {
            setSiteSettings(prev => ({ ...prev, ...data.siteSettings }));
          }
        }
      } catch (err) {
        console.error('Error loading global CMS data from server:', err);
      } finally {
        setIsCmsLoaded(true);
      }
    };

    fetchServerCms();
    // Dynamic polling: 10s for admin dashboard (to stay responsive), 30s for public pages to optimize CPU/RAM and eliminate client-side UI lagging
    const isAdminRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
    const interval = setInterval(fetchServerCms, isAdminRoute ? 10000 : 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSetLogoUrl = (url: string) => {
    setLogoUrlState(url);
    syncToServerCms({ siteLogo: url });
  };

  const handleResetLogoUrl = () => {
    setLogoUrlState(DEFAULT_LOGO);
    syncToServerCms({ siteLogo: DEFAULT_LOGO });
  };

  const updateSiteSettings = (newSettings: Partial<SiteSettings>) => {
    const merged = { ...siteSettings, ...newSettings };
    setSiteSettings(merged);
    syncToServerCms({ siteSettings: merged } as any);
  };

  const saveChannelsState = (newChannels: Channel[]) => {
    setChannels(newChannels);
    syncToServerCms({ channels: newChannels });
  };

  const saveCategoriesState = (newObjs: CategoryItem[]) => {
    setCategoryObjects(newObjs);
    const names = newObjs.map(o => o.name);
    setCategories(names);
    syncToServerCms({ categories: names, categoryObjects: newObjs });
  };

  const saveSchedulesState = (newSchedules: ScheduleItem[]) => {
    setSchedules(newSchedules);
    syncToServerCms({ schedules: newSchedules });
  };

  const saveRadioChannelsState = (newRadio: RadioChannel[]) => {
    setRadioChannels(newRadio);
    syncToServerCms({ radioChannels: newRadio });
  };

  const activeChannel = (channels || []).find((c) => c && c.id && c.id === activeChannelId) || (channels || []).find((c) => c && c.id) || undefined;
  const activeRadioChannel = (radioChannels || []).find((r) => r && r.id && r.id === activeRadioChannelId) || (radioChannels || []).find((r) => r && r.id) || undefined;

  const updateChannel = (updatedChannel: Channel) => {
    const next = (channels || []).map((c) => (c && c.id === updatedChannel.id ? updatedChannel : c));
    saveChannelsState(next);
  };

  const addChannel = (newChanData: Omit<Channel, 'id'>) => {
    const id = `rtm-ch-${Date.now()}`;
    const newChan: Channel = { category: categories[0] || 'TV On Demand', ...newChanData, id };
    const next = [...channels, newChan];
    setActiveChannelId(id);
    saveChannelsState(next);
  };

  const deleteChannel = (id: string) => {
    const next = channels.filter((c) => c.id !== id);
    saveChannelsState(next);
    if (activeChannelId === id && next.length > 0) {
      setActiveChannelId(next[0].id);
    }
  };

  const toggleChannelSource = (id: string, source: 'hls' | 'youtube' | 'playlist' | 'recording' | 'off', selectedRecordingUrl?: string) => {
    const next = channels.map((c) => {
      if (c.id === id) {
        return {
          ...c,
          activeSource: source,
          ...(selectedRecordingUrl !== undefined ? { selectedRecordingUrl } : {}),
        };
      }
      return c;
    });
    saveChannelsState(next);
  };

  const addCategory = (categoryName: string, image?: string) => {
    if (!categoryName || categoryObjects.some(c => c.name.toLowerCase() === categoryName.toLowerCase())) return;
    const id = `cat-${Date.now()}`;
    const newObj: CategoryItem = { id, name: categoryName.trim(), image: image || '' };
    saveCategoriesState([...categoryObjects, newObj]);
  };

  const updateCategory = (oldCategoryName: string, newCategoryName: string, image?: string) => {
    const trimmedNew = newCategoryName.trim();
    if (!trimmedNew) return;

    // 1. Update categoryObjects
    const nextCategories = categoryObjects.map(c => {
      if (c.name.toLowerCase() === oldCategoryName.toLowerCase()) {
        return {
          ...c,
          name: trimmedNew,
          image: image !== undefined ? image : c.image || '',
        };
      }
      return c;
    });

    // 2. Cascade update to all TV channels using oldCategoryName
    const nextChannels = channels.map(chan => {
      if (chan.category && chan.category.toLowerCase() === oldCategoryName.toLowerCase()) {
        return { ...chan, category: trimmedNew };
      }
      return chan;
    });

    // 3. Cascade update to all Radio channels
    const nextRadio = radioChannels.map(rad => {
      if (rad.category && rad.category.toLowerCase() === oldCategoryName.toLowerCase()) {
        return { ...rad, category: trimmedNew };
      }
      return rad;
    });

    // 4. Cascade update to all Schedules
    const nextSchedules = schedules.map(sch => {
      if (sch.category && sch.category.toLowerCase() === oldCategoryName.toLowerCase()) {
        return { ...sch, category: trimmedNew };
      }
      return sch;
    });

    setCategoryObjects(nextCategories);
    const names = nextCategories.map(o => o.name);
    setCategories(names);
    setChannels(nextChannels);
    setRadioChannels(nextRadio);
    setSchedules(nextSchedules);

    // Sync all affected states to server CMS in one single atomic call
    syncToServerCms({
      categories: names,
      categoryObjects: nextCategories,
      channels: nextChannels,
      radioChannels: nextRadio,
      schedules: nextSchedules,
    });
  };

  const deleteCategory = (categoryName: string) => {
    const nextCategories = categoryObjects.filter((c) => c.name.toLowerCase() !== categoryName.toLowerCase());
    const names = nextCategories.map(o => o.name);
    const fallbackCategory = names[0] || 'TV On Demand';

    const nextChannels = channels.map(chan => {
      if (chan.category && chan.category.toLowerCase() === categoryName.toLowerCase()) {
        return { ...chan, category: fallbackCategory };
      }
      return chan;
    });

    const nextRadio = radioChannels.map(rad => {
      if (rad.category && rad.category.toLowerCase() === categoryName.toLowerCase()) {
        return { ...rad, category: fallbackCategory };
      }
      return rad;
    });

    const nextSchedules = schedules.map(sch => {
      if (sch.category && sch.category.toLowerCase() === categoryName.toLowerCase()) {
        return { ...sch, category: fallbackCategory };
      }
      return sch;
    });

    setCategoryObjects(nextCategories);
    setCategories(names);
    setChannels(nextChannels);
    setRadioChannels(nextRadio);
    setSchedules(nextSchedules);

    syncToServerCms({
      categories: names,
      categoryObjects: nextCategories,
      channels: nextChannels,
      radioChannels: nextRadio,
      schedules: nextSchedules,
    });
  };

  const addSchedule = (newSchData: Omit<ScheduleItem, 'id'>) => {
    const id = `sch-${Date.now()}`;
    const newSch: ScheduleItem = { ...newSchData, id };
    const next = [...schedules, newSch];
    saveSchedulesState(next);
  };

  const updateSchedule = (updatedSch: ScheduleItem) => {
    const next = schedules.map((s) => (s.id === updatedSch.id ? updatedSch : s));
    saveSchedulesState(next);
  };

  const deleteSchedule = (id: string) => {
    const next = schedules.filter((s) => s.id !== id);
    saveSchedulesState(next);
  };

  const addRadioChannel = (newRadioData: Omit<RadioChannel, 'id'>) => {
    const id = `radio-ch-${Date.now()}`;
    const newRadio: RadioChannel = { category: categories[0] || 'RTM Maubere', ...newRadioData, id };
    const next = [...radioChannels, newRadio];
    setActiveRadioChannelId(id);
    saveRadioChannelsState(next);
  };

  const updateRadioChannel = (updatedRadio: RadioChannel) => {
    const next = radioChannels.map((r) => (r.id === updatedRadio.id ? updatedRadio : r));
    saveRadioChannelsState(next);
  };

  const deleteRadioChannel = (id: string) => {
    const next = radioChannels.filter((r) => r.id !== id);
    saveRadioChannelsState(next);
    if (activeRadioChannelId === id && next.length > 0) {
      setActiveRadioChannelId(next[0].id);
    }
  };

  const toggleRadioChannelSource = (id: string, source: 'icecast' | 'playlist' | 'off') => {
    const next = radioChannels.map((r) => (r.id === id ? { ...r, activeSource: source } : r));
    saveRadioChannelsState(next);
  };

  const saveShortsState = (newShorts: ShortItem[]) => {
    setShorts(newShorts);
    syncToServerCms({ shorts: newShorts });
  };

  const addShort = (newShortData: Omit<ShortItem, 'id'>) => {
    const id = `short-${Date.now()}`;
    const newShort: ShortItem = { ...newShortData, id };
    const next = [...shorts, newShort];
    saveShortsState(next);
  };

  const deleteShort = (id: string) => {
    const next = shorts.filter((s) => s.id !== id);
    saveShortsState(next);
  };

  const resetRadioChannels = () => {
    saveRadioChannelsState([]);
    setActiveRadioChannelId('');
  };

  const setTvUrl = (url: string) => {
    const next = channels.map((c) => (c.id === activeChannelId ? { ...c, hlsUrl: url } : c));
    saveChannelsState(next);
  };

  const setRadioUrl = (url: string) => {
    const next = radioChannels.map((r) => (r.id === activeRadioChannelId ? { ...r, streamUrl: url } : r));
    saveRadioChannelsState(next);
  };

  const updateSettings = (newTvUrl: string, newRadioUrl: string) => {
    setTvUrl(newTvUrl);
    setRadioUrl(newRadioUrl);
    if (newTvUrl.includes('live.rtm.tl') || newRadioUrl.includes('radio.rtm.tl')) {
      setIsDemoMode(false);
    } else {
      setIsDemoMode(true);
    }
  };

  const loginAdmin = (username: string, pass: string) => {
    if (username.trim() === 'superadmin' && pass === 'Rtm#WebAdmin2026!') {
      const userObj: AdminUser = {
        username: 'superadmin',
        role: 'Super Administrator',
        name: 'RTM Administrator',
      };
      setIsAdminAuthenticated(true);
      setAdminUser(userObj);
      localStorage.setItem(
        'rtm_admin_auth',
        JSON.stringify({ authenticated: true, user: userObj, loginTime: Date.now() })
      );
      return { success: true };
    }
    return { success: false, error: 'Username atau password superadmin salah.' };
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    setAdminUser(null);
    localStorage.removeItem('rtm_admin_auth');
  };

  return (
    <StreamContext.Provider
      value={{
        channels,
        activeChannelId,
        activeChannel,
        setActiveChannelId,
        updateChannel,
        addChannel,
        deleteChannel,
        toggleChannelSource,
        categories,
        categoryObjects,
        addCategory,
        updateCategory,
        deleteCategory,
        schedules,
        addSchedule,
        updateSchedule,
        deleteSchedule,
        shorts,
        addShort,
        deleteShort,
        tvUrl: activeChannel?.hlsUrl || '',
        setTvUrl,
        radioChannels,
        activeRadioChannelId,
        activeRadioChannel,
        setActiveRadioChannelId,
        addRadioChannel,
        updateRadioChannel,
        deleteRadioChannel,
        toggleRadioChannelSource,
        resetRadioChannels,
        radioUrl: activeRadioChannel?.streamUrl || '',
        setRadioUrl,
        updateSettings,
        isDemoMode,
        setIsDemoMode,
        cdnEnabled,
        cdnBaseUrl,
        setCdnEnabled,
        setCdnBaseUrl,
        logoUrl,
        setLogoUrl: handleSetLogoUrl,
        resetLogoUrl: handleResetLogoUrl,
        isAdminAuthenticated,
        adminUser,
        loginAdmin,
        logoutAdmin,
        siteSettings,
        updateSiteSettings,
        isSettingsOpen,
        setIsSettingsOpen,
        isCmsLoaded,
      }}
    >
      {children}
    </StreamContext.Provider>
  );
}

export function useStreamContext() {
  const context = useContext(StreamContext);
  if (!context) {
    throw new Error('useStreamContext must be used within a StreamProvider');
  }
  return context;
}
