// ============ App.tsx ============
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabaseClient.ts';
import { Session } from '@supabase/supabase-js';
import {
  Sun, Download, Share2, Lock, Shield, Mail,
  Globe, ChevronDown, ChevronRight, Menu, X, Star, Users, Smartphone,
  Settings, Plus, Trash2, Edit3, Save, Eye, EyeOff, BookOpen,
  ArrowUp, Search, Filter, LogOut, KeyRound, AlertTriangle,
  ToggleLeft, ToggleRight, RefreshCw, Loader2, Image as ImageIcon,
  Upload, MessageSquare, CheckCircle, XCircle, Inbox, FileText,
  ChevronUp, Bell
} from 'lucide-react';

// ============ TYPES ============
interface AppData {
  id: number;
  name: string;
  version: string;
  description: string;
  apk_link: string;
  badge: 'New' | 'Viral' | 'PRO' | string;
  icon: string;
  icon_url?: string;
  downloads: string;
  size: string;
  category: string;
  rating: string;
  updated: string;
  published: boolean;
  created_at?: string;
}

interface Feedback {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  read: boolean;
}

// ============ HELPERS ============
const formatDownloads = (num: string) => {
  const n = parseInt(num);
  if (isNaN(n) || n === 0) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
};

const getBadgeColors = (badge: string) => {
  switch (badge) {
    case 'Viral': return 'from-rose-500 to-pink-600';
    case 'PRO': return 'from-amber-400 to-orange-500';
    case 'New': return 'from-emerald-400 to-green-500';
    default: return 'from-gray-500 to-gray-600';
  }
};

const formatTimeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

// ============ TOAST ============
interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

const Toast = ({ toasts, removeToast }: { toasts: ToastItem[]; removeToast: (id: number) => void }) => (
  <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4">
    {toasts.map(t => (
      <div
        key={t.id}
        className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm font-medium backdrop-blur-md transition-all animate-fade-in
          ${t.type === 'success' ? 'bg-green-900/80 border-green-500/30 text-green-300' :
            t.type === 'error' ? 'bg-red-900/80 border-red-500/30 text-red-300' :
              'bg-[#111]/90 border-white/10 text-white/70'}`}
      >
        <span>{t.message}</span>
        <button onClick={() => removeToast(t.id)} className="opacity-50 hover:opacity-100 transition-opacity shrink-0"><X size={14} /></button>
      </div>
    ))}
  </div>
);

const useToast = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);
  const addToast = useCallback((message: string, type: ToastItem['type'] = 'info') => {
    const id = ++counter.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  const removeToast = useCallback((id: number) => setToasts(prev => prev.filter(t => t.id !== id)), []);
  return { toasts, addToast, removeToast };
};

// ============ SKELETON ============
const SkeletonCard = () => (
  <div className="bg-[#0d0d0d] border border-white/[0.06] rounded-3xl p-5 animate-pulse">
    <div className="flex gap-4 mb-4">
      <div className="w-14 h-14 bg-white/5 rounded-2xl" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-4 bg-white/5 rounded w-3/4" />
        <div className="h-3 bg-white/5 rounded w-1/2" />
      </div>
    </div>
    <div className="h-3 bg-white/5 rounded w-full mb-2" />
    <div className="h-3 bg-white/5 rounded w-2/3 mb-4" />
    <div className="h-10 bg-white/5 rounded-xl w-full" />
  </div>
);

// ============ SCROLL TO TOP ============
const ScrollToTop = () => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  if (!show) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#FFB347] text-black flex items-center justify-center shadow-lg shadow-orange-500/30 hover:scale-110 transition-transform"
    >
      <ArrowUp size={20} />
    </button>
  );
};

// ============ AD BANNER ============
const AdBanner = ({ variant = 'horizontal' }: { variant?: 'horizontal' | 'rectangle' }) => (
  <div className={`border border-dashed border-white/10 rounded-2xl flex items-center justify-center text-white/20 ${variant === 'rectangle' ? 'h-60' : 'h-20'}`}>
    <div className="text-center text-xs">
      <p>📢 Google AdSense Ad Space</p>
      <p className="text-[10px] mt-1 text-white/10">Insert your ad unit code here</p>
    </div>
  </div>
);

// ============ LOCK MODAL ============
const LockModal = ({
  app,
  onClose,
  onUnlock
}: {
  app: AppData | null;
  onClose: () => void;
  onUnlock: () => void;
}) => {
  const [countdown, setCountdown] = useState(5);
  const [watching, setWatching] = useState(false);

  useEffect(() => {
    if (!watching) return;
    if (countdown <= 0) { onUnlock(); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [watching, countdown, onUnlock]);

  useEffect(() => {
    if (app) { setCountdown(5); setWatching(false); }
  }, [app]);

  if (!app) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/10 rounded-3xl p-6 max-w-sm w-full relative"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors">
          <X size={20} />
        </button>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 flex items-center justify-center">
            <Lock className="text-orange-400" size={28} />
          </div>
          <h3 className="text-xl font-bold text-white mb-1">Unlock Download</h3>
          <p className="text-white/40 text-sm mb-6">{app.name}</p>
          {!watching ? (
            <button
              onClick={() => setWatching(true)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FF6B00] to-[#FFB347] text-black font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              <Eye size={18} /> Watch Ad to Unlock
            </button>
          ) : (
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <p className="text-orange-400 text-sm font-medium animate-pulse mb-2">⏳ Ad playing...</p>
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#FF6B00] to-[#FFB347] rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                />
              </div>
              <p className="text-white/30 text-xs mt-2">{countdown}s remaining</p>
            </div>
          )}
          <p className="text-white/15 text-[10px] mt-4">* Ad placeholder – integrate Google AdMob here</p>
        </div>
      </div>
    </div>
  );
};

// ============ APP CARD ============
const AppCard = ({
  app,
  onDownload,
  unlocked
}: {
  app: AppData;
  onDownload: (a: AppData) => void;
  unlocked: boolean;
}) => {
  const handleShare = () => {
    const text = `🌅 Check out "${app.name}" on SunRise Apps!\n📲 Download free: ${window.location.href}`;
    if (navigator.share) {
      navigator.share({ title: app.name, text, url: window.location.href }).catch(() => { });
    } else {
      navigator.clipboard.writeText(text);
      alert('Link copied! Share it 📸');
    }
  };

  const isComingSoon = app.apk_link === '#' || !app.apk_link;
  const iconDisplay = app.icon_url
    ? <img src={app.icon_url} alt={app.name} className="w-full h-full object-cover rounded-2xl" />
    : app.icon
      ? <span className="text-2xl">{app.icon}</span>
      : <ImageIcon size={24} className="text-white/20" />;

  return (
    <div className="group relative bg-[#0d0d0d] border border-white/[0.06] rounded-3xl p-5 hover:border-orange-500/30 transition-all duration-500 hover:shadow-xl hover:shadow-orange-500/5">
      <span className={`absolute -top-2.5 right-4 px-3 py-1 rounded-full text-[10px] font-bold text-white bg-gradient-to-r ${getBadgeColors(app.badge)} shadow-lg ${app.badge === 'Viral' ? 'animate-pulse' : ''}`}>
        {app.badge === 'Viral' ? '🔥 ' : app.badge === 'PRO' ? '⭐ ' : '✨ '}{app.badge}
      </span>

      <div className="flex gap-4 mb-4">
        <div className="w-14 h-14 shrink-0 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl flex items-center justify-center overflow-hidden group-hover:border-orange-500/20 transition-colors">
          {iconDisplay}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-white text-[15px] leading-tight truncate">{app.name}</h3>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-white/30">
            <span className="bg-white/5 px-2 py-0.5 rounded-md">v{app.version}</span>
            <span>•</span>
            <span>{app.size}</span>
          </div>
        </div>
      </div>

      <p
        className="text-white/40 text-sm leading-relaxed mb-4"
        style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
      >
        {app.description}
      </p>

      <div className="flex items-center gap-4 mb-4 text-[11px] text-white/25">
        <span className="flex items-center gap-1"><Download size={11} /> {formatDownloads(app.downloads)}</span>
        <span className="flex items-center gap-1"><Star size={11} /> {app.rating}</span>
        <span className="bg-white/5 px-2 py-0.5 rounded-md">{app.category}</span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => !isComingSoon && onDownload(app)}
          disabled={isComingSoon}
          className={`flex-1 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${isComingSoon
            ? 'bg-white/5 text-white/20 cursor-not-allowed'
            : 'bg-gradient-to-r from-[#FF6B00] to-[#FFB347] text-black hover:opacity-90 shadow-md shadow-orange-500/20'
            }`}
        >
          {isComingSoon
            ? 'Coming Soon'
            : unlocked
              ? <><Download size={14} /> Download</>
              : <><Lock size={14} /> Get APK</>
          }
        </button>
        <button
          onClick={handleShare}
          className="w-10 h-10 shrink-0 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-orange-400 hover:border-orange-500/30 flex items-center justify-center transition-all"
        >
          <Share2 size={15} />
        </button>
      </div>
    </div>
  );
};

// ============ FILE UPLOAD COMPONENT ============
const FileUpload = ({
  label,
  accept,
  bucket,
  folder,
  onUploadComplete,
  currentUrl,
  addToast
}: {
  label: string;
  accept: string;
  bucket: string;
  folder: string;
  onUploadComplete: (url: string) => void;
  currentUrl?: string;
  addToast: (msg: string, type: ToastItem['type']) => void;
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = accept.includes('apk') ? 100 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      addToast(`❌ File too large. Max ${accept.includes('apk') ? '100MB' : '5MB'}`, 'error');
      return;
    }

    setUploading(true);
    setProgress(10);

    try {
      const ext = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      setProgress(40);

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      setProgress(80);

      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      onUploadComplete(data.publicUrl);
      setProgress(100);
      addToast('✅ File uploaded successfully!', 'success');
    } catch (err: any) {
      addToast(`❌ Upload failed: ${err.message}`, 'error');
    } finally {
      setTimeout(() => { setUploading(false); setProgress(0); }, 800);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <label className="block text-xs text-white/30 mb-1.5">{label}</label>
      <div
        className="relative border border-dashed border-white/10 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:border-orange-500/30 transition-colors group"
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept={accept} onChange={handleUpload} className="hidden" />
        <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0 group-hover:bg-orange-500/20 transition-colors">
          {uploading ? <Loader2 size={16} className="animate-spin text-orange-400" /> : <Upload size={16} className="text-orange-400" />}
        </div>
        <div className="flex-1 min-w-0">
          {currentUrl ? (
            <p className="text-xs text-green-400 truncate">✅ {currentUrl.split('/').pop()}</p>
          ) : (
            <p className="text-xs text-white/30">{uploading ? 'Uploading...' : 'Click to upload'}</p>
          )}
          {uploading && (
            <div className="mt-1.5 w-full bg-white/5 rounded-full h-1">
              <div className="h-full bg-gradient-to-r from-[#FF6B00] to-[#FFB347] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============ HOME PAGE ============
const HomePage = ({
  apps,
  onDownload,
  unlockedApps,
  loading
}: {
  apps: AppData[];
  onDownload: (a: AppData) => void;
  unlockedApps: number[];
  loading: boolean;
}) => {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');

  const publishedApps = apps.filter(a => a.published);
  const categories = ['All', ...Array.from(new Set(publishedApps.map(a => a.category)))];

  const filtered = publishedApps.filter(a => {
    const matchSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'All' || a.category === catFilter;
    return matchSearch && matchCat;
  });

  const totalDownloads = publishedApps.reduce((s, a) => s + (parseInt(a.downloads) || 0), 0);

  return (
    <>
      <section className="pt-28 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/[0.04] via-transparent to-transparent" />
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-orange-500/[0.06] rounded-full blur-[120px]" />
        <div className="absolute top-40 right-0 w-64 h-64 bg-amber-500/[0.04] rounded-full blur-[80px]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-8 text-sm text-white/50">
            <Sun size={14} className="text-orange-400" />
            <span>Your Trusted App Source</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black leading-[1.1] mb-6">
            <span className="bg-gradient-to-r from-[#FF6B00] via-[#FFB347] to-amber-300 bg-clip-text text-transparent">SunRise</span>
            <br />
            <span className="text-white">Apps</span>
          </h1>
          <p className="text-lg md:text-xl text-white/40 max-w-lg mx-auto mb-10">
            Get the latest <span className="text-orange-400 font-medium">viral Android tools</span> — free, safe & always updated 🚀
          </p>
          <button
            onClick={() => document.getElementById('apps-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-4 bg-gradient-to-r from-[#FF6B00] to-[#FFB347] text-black font-bold text-base rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-orange-500/20 inline-flex items-center gap-2"
          >
            <Download size={18} /> Explore Apps
          </button>
          <div className="grid grid-cols-3 max-w-md mx-auto mt-16 gap-4">
            {[
              { value: formatDownloads(totalDownloads.toString()) + '+', label: 'Downloads', icon: <Download size={16} /> },
              { value: publishedApps.filter(a => a.apk_link && a.apk_link !== '#').length + '+', label: 'Apps', icon: <Smartphone size={16} /> },
              { value: '4.9', label: 'Avg Rating', icon: <Star size={16} /> },
            ].map((s, i) => (
              <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                <div className="text-orange-400 mb-1">{s.icon}</div>
                <div className="text-xl font-bold text-white">{s.value}</div>
                <div className="text-[11px] text-white/25">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 mb-8"><AdBanner variant="horizontal" /></div>

      <section id="apps-section" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              App <span className="bg-gradient-to-r from-[#FF6B00] to-[#FFB347] bg-clip-text text-transparent">Collection</span>
            </h2>
            <p className="text-white/30 text-sm">All apps free — watch a short ad to download</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-8 max-w-2xl mx-auto">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search apps..."
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white text-sm focus:border-orange-500/50 focus:outline-none transition-colors placeholder:text-white/20"
              />
            </div>
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
              <select
                value={catFilter}
                onChange={e => setCatFilter(e.target.value)}
                className="appearance-none bg-white/[0.03] border border-white/10 rounded-xl pl-9 pr-8 py-3 text-white text-sm focus:border-orange-500/50 focus:outline-none cursor-pointer"
              >
                {categories.map(c => <option key={c} value={c} className="bg-black">{c}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-white/20">
              <Search size={40} className="mx-auto mb-4" />
              <p>No apps found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(app => (
                <AppCard
                  key={app.id}
                  app={app}
                  onDownload={onDownload}
                  unlocked={unlockedApps.includes(app.id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 mb-8"><AdBanner variant="rectangle" /></div>
    </>
  );
};

// ============ ADMIN LOGIN ============
const AdminLogin = ({ onLogin }: { onLogin: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      onLogin();
    }
  };

  return (
    <section className="pt-28 pb-20 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-orange-500/20 to-amber-500/10 rounded-full flex items-center justify-center border border-orange-500/20">
            <KeyRound className="text-orange-400" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Admin Access</h2>
          <p className="text-white/30 text-sm mb-8">Sign in with your Supabase credentials.</p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
              <AlertTriangle size={14} />{error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs text-white/30 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@sunrise.com"
                required
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm focus:border-orange-500/50 focus:outline-none placeholder:text-white/15 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-white/30 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 pr-11 text-white text-sm focus:border-orange-500/50 focus:outline-none placeholder:text-white/15 transition-colors"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-[#FF6B00] to-[#FFB347] text-black font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Lock size={18} />}
              {loading ? 'Signing In...' : 'Unlock Admin Panel'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

// ============ ADMIN PAGE ============
const AdminPage = ({
  apps,
  setApps,
  onLogout,
  session,
  refreshApps,
  isRefreshing,
  addToast
}: {
  apps: AppData[];
  setApps: (a: AppData[]) => void;
  onLogout: () => void;
  session: Session | null;
  refreshApps: () => Promise<void>;
  isRefreshing: boolean;
  addToast: (msg: string, type: ToastItem['type']) => void;
}) => {
  const [activeTab, setActiveTab] = useState<'apps' | 'feedbacks'>('apps');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<AppData>>({
    name: '', version: '1.0.0', description: '', apk_link: '', badge: 'New',
    icon: '📱', icon_url: '', downloads: '0', size: '0 MB', category: 'Tools',
    rating: '4.5', updated: new Date().toISOString().slice(0, 10), published: false
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [adminFilter, setAdminFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [submitting, setSubmitting] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expandedFeedback, setExpandedFeedback] = useState<number | null>(null);

  // Fetch Feedbacks
  const fetchFeedbacks = useCallback(async () => {
    setFeedbackLoading(true);
    try {
      const { data, error } = await supabase
        .from('feedbacks')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setFeedbacks(data || []);
      setUnreadCount((data || []).filter((f: Feedback) => !f.read).length);
    } catch (err: any) {
      addToast(`❌ Could not load feedbacks: ${err.message}`, 'error');
    } finally {
      setFeedbackLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  // Real-time feedbacks
  useEffect(() => {
    const channel = supabase
      .channel('feedbacks-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feedbacks' }, payload => {
        setFeedbacks(prev => [payload.new as Feedback, ...prev]);
        setUnreadCount(c => c + 1);
        addToast('📩 New feedback received!', 'info');
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [addToast]);

  const markAsRead = async (id: number) => {
    const { error } = await supabase.from('feedbacks').update({ read: true }).eq('id', id);
    if (!error) {
      setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, read: true } : f));
      setUnreadCount(c => Math.max(0, c - 1));
    }
  };

  const deleteFeedback = async (id: number) => {
    if (!confirm('Delete this feedback?')) return;
    const { error } = await supabase.from('feedbacks').delete().eq('id', id);
    if (error) addToast(`❌ Delete failed: ${error.message}`, 'error');
    else {
      setFeedbacks(prev => prev.filter(f => f.id !== id));
      addToast('🗑️ Feedback deleted', 'success');
    }
  };

  const startEdit = (app: AppData) => {
    setForm({ ...app });
    setEditingId(app.id);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startAdd = () => {
    setForm({
      name: '', version: '1.0.0', description: '', apk_link: '', badge: 'New',
      icon: '📱', icon_url: '', downloads: '0', size: '0 MB', category: 'Tools',
      rating: '4.5', updated: new Date().toISOString().slice(0, 10), published: false
    });
    setEditingId(null);
    setShowAddForm(true);
  };

  const validateForm = (): boolean => {
    if (!form.name?.trim()) { addToast('❌ App name is required', 'error'); return false; }
    if (form.apk_link && form.apk_link !== '#' && !form.apk_link.startsWith('http')) {
      addToast('❌ APK link must be a valid URL or #', 'error'); return false;
    }
    const r = parseFloat(form.rating || '0');
    if (isNaN(r) || r < 0 || r > 5) { addToast('❌ Rating must be 0-5', 'error'); return false; }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (editingId !== null) {
        const { error } = await supabase.from('apps').update(payload).eq('id', editingId);
        if (error) throw error;
        addToast('✅ App updated successfully!', 'success');
      } else {
        const { error } = await supabase.from('apps').insert([payload]);
        if (error) throw error;
        addToast('✅ App added successfully!', 'success');
      }
      await refreshApps();
      setShowAddForm(false);
      setEditingId(null);
    } catch (err: any) {
      addToast(`❌ Error: ${err.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this app permanently? This cannot be undone.')) return;
    try {
      const { error } = await supabase.from('apps').delete().eq('id', id);
      if (error) throw error;
      addToast('🗑️ App deleted', 'success');
      await refreshApps();
    } catch (err: any) {
      addToast(`❌ Delete failed: ${err.message}`, 'error');
    }
  };

  const togglePublish = async (id: number, current: boolean) => {
    try {
      const { error } = await supabase.from('apps').update({ published: !current }).eq('id', id);
      if (error) throw error;
      addToast(!current ? '🟢 App published!' : '📝 App unpublished', 'success');
      await refreshApps();
    } catch (err: any) {
      addToast(`❌ Toggle failed: ${err.message}`, 'error');
    }
  };

  const filteredApps = apps.filter(a => {
    if (adminFilter === 'published') return a.published;
    if (adminFilter === 'draft') return !a.published;
    return true;
  });

  const publishedCount = apps.filter(a => a.published).length;
  const draftCount = apps.filter(a => !a.published).length;

  const inputCls = "w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-orange-500/50 focus:outline-none placeholder:text-white/15 transition-colors";

  return (
    <section className="pt-28 pb-20 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <Settings className="text-orange-400" size={28} /> Admin Panel
            </h2>
            <p className="text-white/30 text-sm mt-1">
              Logged in as <span className="text-orange-400">{session?.user?.email}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={refreshApps}
              disabled={isRefreshing}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white/50 text-xs hover:text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isRefreshing ? <Loader2 className="animate-spin" size={13} /> : <RefreshCw size={13} />} Refresh
            </button>
            <button
              onClick={startAdd}
              className="px-3 py-2 bg-gradient-to-r from-[#FF6B00] to-[#FFB347] text-black font-semibold rounded-xl text-xs flex items-center gap-1.5 hover:opacity-90"
            >
              <Plus size={13} /> Add App
            </button>
            <button
              onClick={onLogout}
              className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-1.5 hover:bg-red-500/20 transition-colors"
            >
              <LogOut size={13} /> Logout
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Total Apps', value: apps.length, color: 'text-white' },
            { label: 'Published', value: publishedCount, color: 'text-green-400' },
            { label: 'Drafts', value: draftCount, color: 'text-amber-400' },
            { label: 'Feedbacks', value: feedbacks.length, color: 'text-blue-400', badge: unreadCount },
          ].map((s, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 relative">
              <p className="text-white/25 text-[10px] mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              {s.badge != null && s.badge > 0 && (
                <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-orange-500 text-black text-[9px] font-bold flex items-center justify-center">{s.badge}</span>
              )}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/[0.06] pb-4">
          <button
            onClick={() => setActiveTab('apps')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'apps' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' : 'text-white/30 hover:text-white/60'}`}
          >
            <Smartphone size={15} /> Apps
          </button>
          <button
            onClick={() => { setActiveTab('feedbacks'); fetchFeedbacks(); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 relative ${activeTab === 'feedbacks' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' : 'text-white/30 hover:text-white/60'}`}
          >
            <MessageSquare size={15} /> Feedbacks
            {unreadCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-orange-500 text-black text-[9px] font-bold flex items-center justify-center">{unreadCount}</span>
            )}
          </button>
        </div>

        {/* ===== APPS TAB ===== */}
        {activeTab === 'apps' && (
          <>
            {/* Add/Edit Form */}
            {showAddForm && (
              <div className="bg-white/[0.03] border border-orange-500/20 rounded-3xl p-6 mb-8">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {editingId !== null
                      ? <><Edit3 size={18} className="text-orange-400" /> Edit App</>
                      : <><Plus size={18} className="text-orange-400" /> Add New App</>
                    }
                  </h3>
                  <button onClick={() => { setShowAddForm(false); setEditingId(null); }} className="text-white/30 hover:text-white transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Text Fields */}
                  {[
                    { key: 'name', label: 'App Name *', placeholder: 'My Awesome App' },
                    { key: 'version', label: 'Version', placeholder: '1.0.0' },
                    { key: 'icon', label: 'Icon Emoji', placeholder: '📱' },
                    { key: 'size', label: 'File Size', placeholder: '4.5 MB' },
                    { key: 'category', label: 'Category', placeholder: 'Tools' },
                    { key: 'rating', label: 'Rating (0-5)', placeholder: '4.5' },
                    { key: 'downloads', label: 'Download Count', placeholder: '15200' },
                    { key: 'updated', label: 'Updated Date', placeholder: '2025-01-01', type: 'date' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs text-white/30 mb-1.5">{f.label}</label>
                      <input
                        type={f.type || 'text'}
                        value={String((form as any)[f.key] || '')}
                        onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                        placeholder={f.placeholder}
                        className={inputCls}
                      />
                    </div>
                  ))}

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-xs text-white/30 mb-1.5">Description</label>
                    <textarea
                      value={form.description || ''}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      placeholder="Short app description... (supports emojis 🎉)"
                      rows={3}
                      className={`${inputCls} resize-none`}
                    />
                  </div>

                  {/* APK Link manual */}
                  <div className="md:col-span-2">
                    <label className="block text-xs text-white/30 mb-1.5">APK Download Link (manual URL or use upload below)</label>
                    <input
                      value={form.apk_link || ''}
                      onChange={e => setForm({ ...form, apk_link: e.target.value })}
                      placeholder="https://github.com/.../app.apk  or  #"
                      className={inputCls}
                    />
                  </div>

                  {/* APK Upload */}
                  <div className="md:col-span-2">
                    <FileUpload
                      label="Or Upload APK File (max 100MB — uses Supabase Storage)"
                      accept=".apk"
                      bucket="apks"
                      folder="uploads"
                      currentUrl={form.apk_link?.startsWith('http') && form.apk_link.includes('supabase') ? form.apk_link : undefined}
                      onUploadComplete={url => setForm(f => ({ ...f, apk_link: url }))}
                      addToast={addToast}
                    />
                  </div>

                  {/* Icon Upload */}
                  <div>
                    <FileUpload
                      label="Upload App Icon (PNG/JPG, max 5MB)"
                      accept="image/png,image/jpeg,image/webp"
                      bucket="icons"
                      folder="app-icons"
                      currentUrl={form.icon_url}
                      onUploadComplete={url => setForm(f => ({ ...f, icon_url: url }))}
                      addToast={addToast}
                    />
                    {form.icon_url && (
                      <div className="mt-2 flex items-center gap-2">
                        <img src={form.icon_url} alt="icon preview" className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                        <button onClick={() => setForm(f => ({ ...f, icon_url: '' }))} className="text-xs text-red-400 hover:underline">Remove</button>
                      </div>
                    )}
                  </div>

                  {/* Badge */}
                  <div>
                    <label className="block text-xs text-white/30 mb-1.5">Badge</label>
                    <select
                      value={form.badge}
                      onChange={e => setForm({ ...form, badge: e.target.value })}
                      className={inputCls}
                    >
                      <option value="New" className="bg-black">✨ New</option>
                      <option value="Viral" className="bg-black">🔥 Viral</option>
                      <option value="PRO" className="bg-black">⭐ PRO</option>
                    </select>
                  </div>

                  {/* Published Toggle */}
                  <div className="md:col-span-2">
                    <label className="block text-xs text-white/30 mb-1.5">Visibility</label>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, published: !form.published })}
                      className={`flex items-center justify-between w-full px-4 py-3 rounded-xl border text-sm font-medium transition-all ${form.published
                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        }`}
                    >
                      <span className="flex items-center gap-2">
                        {form.published ? <Eye size={16} /> : <EyeOff size={16} />}
                        {form.published ? '🟢 Published — Visible on website' : '📝 Draft — Hidden from website'}
                      </span>
                      {form.published ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-5 border-t border-white/[0.06]">
                  <button
                    onClick={handleSave}
                    disabled={submitting}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#FF6B00] to-[#FFB347] text-black font-semibold rounded-xl text-sm flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    {submitting ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                    {editingId !== null ? 'Update App' : 'Publish App'}
                  </button>
                  <button
                    onClick={() => { setShowAddForm(false); setEditingId(null); }}
                    className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white/50 text-sm hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {(['all', 'published', 'draft'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setAdminFilter(f)}
                  className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${adminFilter === f
                    ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                    : 'bg-white/[0.03] text-white/30 border border-white/[0.06] hover:text-white/50'
                    }`}
                >
                  {f === 'all' ? `All (${apps.length})` : f === 'published' ? `🟢 Published (${publishedCount})` : `📝 Drafts (${draftCount})`}
                </button>
              ))}
            </div>

            {/* App List */}
            <div className="space-y-3">
              {filteredApps.length === 0 ? (
                <div className="text-center py-16 text-white/20">
                  <Inbox size={40} className="mx-auto mb-4" />
                  <p>No apps in this view.</p>
                  <button onClick={startAdd} className="mt-4 px-4 py-2 bg-orange-500/10 text-orange-400 rounded-xl text-sm border border-orange-500/20 hover:bg-orange-500/20">
                    + Add your first app
                  </button>
                </div>
              ) : filteredApps.map(app => (
                <div
                  key={app.id}
                  className={`bg-white/[0.03] border rounded-2xl p-4 flex items-center gap-3 transition-all ${app.published ? 'border-green-500/15 hover:border-green-500/25' : 'border-white/[0.06] opacity-70 hover:opacity-100'}`}
                >
                  {/* Icon */}
                  <div className="w-12 h-12 shrink-0 bg-white/5 rounded-xl flex items-center justify-center text-lg overflow-hidden border border-white/10">
                    {app.icon_url
                      ? <img src={app.icon_url} alt={app.name} className="w-full h-full object-cover" />
                      : app.icon
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-white text-sm truncate">{app.name}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold text-white bg-gradient-to-r ${getBadgeColors(app.badge)}`}>{app.badge}</span>
                      {app.published
                        ? <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-green-500/15 text-green-400">🟢 Live</span>
                        : <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-amber-500/15 text-amber-400">📝 Draft</span>
                      }
                    </div>
                    <p className="text-white/25 text-xs mt-0.5">v{app.version} • {app.size} • {app.category}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => togglePublish(app.id, app.published)}
                      title={app.published ? 'Unpublish' : 'Publish'}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border ${app.published
                        ? 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20'
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20'
                        }`}
                    >
                      {app.published ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button
                      onClick={() => startEdit(app)}
                      title="Edit"
                      className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-orange-400 hover:border-orange-500/30 transition-all"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(app.id)}
                      title="Delete"
                      className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-rose-400 hover:border-rose-500/30 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ===== FEEDBACKS TAB ===== */}
        {activeTab === 'feedbacks' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-white/40 text-sm">
                {feedbacks.length} total · <span className="text-orange-400">{unreadCount} unread</span>
              </p>
              <button
                onClick={fetchFeedbacks}
                disabled={feedbackLoading}
                className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-white/40 text-xs flex items-center gap-1.5 hover:text-white transition-colors disabled:opacity-50"
              >
                {feedbackLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Refresh
              </button>
            </div>

            {feedbackLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 animate-pulse h-20" />
                ))}
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="text-center py-20 text-white/20">
                <Inbox size={40} className="mx-auto mb-4" />
                <p>No feedbacks yet.</p>
                <p className="text-xs mt-2 text-white/10">They'll appear here when users submit the contact form.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {feedbacks.map(fb => (
                  <div
                    key={fb.id}
                    className={`border rounded-2xl overflow-hidden transition-all ${!fb.read ? 'border-orange-500/20 bg-orange-500/[0.03]' : 'border-white/[0.06] bg-white/[0.02]'}`}
                  >
                    <div
                      className="p-4 flex items-start gap-3 cursor-pointer"
                      onClick={() => {
                        setExpandedFeedback(expandedFeedback === fb.id ? null : fb.id);
                        if (!fb.read) markAsRead(fb.id);
                      }}
                    >
                      <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!fb.read ? 'bg-orange-400' : 'bg-white/10'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-white text-sm">{fb.name}</span>
                          <span className="text-white/30 text-xs">·</span>
                          <span className="text-white/30 text-xs">{fb.email}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] border ${fb.subject === 'Bug Report' ? 'bg-red-500/10 text-red-400 border-red-500/20' : fb.subject === 'Feature Request' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : fb.subject === 'Business' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-white/5 text-white/30 border-white/10'}`}>
                            {fb.subject}
                          </span>
                          {!fb.read && <span className="px-2 py-0.5 rounded-full text-[9px] bg-orange-500/15 text-orange-400 border border-orange-500/20">New</span>}
                        </div>
                        <p className="text-white/30 text-xs mt-0.5 truncate">{fb.message}</p>
                        <p className="text-white/15 text-[10px] mt-1">{formatTimeAgo(fb.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {expandedFeedback === fb.id ? <ChevronUp size={14} className="text-white/30" /> : <ChevronDown size={14} className="text-white/30" />}
                        <button
                          onClick={e => { e.stopPropagation(); deleteFeedback(fb.id); }}
                          className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/20 hover:text-rose-400 transition-colors ml-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {expandedFeedback === fb.id && (
                      <div className="px-5 pb-5 pt-0">
                        <div className="bg-black/40 rounded-xl p-4 border border-white/[0.05]">
                          <p className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap">{fb.message}</p>
                        </div>
                        <a
                          href={`mailto:${fb.email}?subject=Re: ${fb.subject}`}
                          className="mt-3 inline-flex items-center gap-1.5 text-xs text-orange-400 hover:underline"
                        >
                          <Mail size={12} /> Reply to {fb.email}
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

// ============ GUIDE PAGE ============
const GuidePage = () => {
  const [openStep, setOpenStep] = useState<number | null>(0);
  const steps = [
    {
      title: '1. GitHub — APK Hosting (Free)', icon: '🐙', content: [
        '→ github.com → Create account → New repo "my-apps"',
        '→ Releases → Create release → Drag APK file',
        '→ Publish → Copy download URL → Paste in Admin Panel',
        '', '💡 GitHub = unlimited free APK hosting!'
      ]
    },
    {
      title: '2. Supabase Storage Setup', icon: '🗄️', content: [
        '→ supabase.com → Go to Storage tab',
        '→ Create bucket "icons" → Set to public',
        '→ Create bucket "apks" → Set to public',
        '', '💡 Free tier: 1GB storage, enough to start!'
      ]
    },
    {
      title: '3. Vercel — Deploy Website (Free)', icon: '🚀', content: [
        '→ vercel.com → Sign in with GitHub',
        '→ Import your website repo → Framework: Vite → Deploy',
        '→ Add env vars: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY',
        '', '⚙️ Custom domain: Settings → Domains → sunriseapps.in'
      ]
    },
    {
      title: '4. Google AdSense (Earn Money 💰)', icon: '💰', content: [
        '→ adsense.google.com → Add website URL',
        '→ Paste verification code in index.html <head>',
        '', '💡 Earnings: ₹100-₹2000/day based on traffic'
      ]
    },
    {
      title: '5. Feedbacks Table Setup', icon: '📩', content: [
        '→ Supabase → SQL Editor → Run this:',
        '', 'CREATE TABLE feedbacks (',
        '  id BIGSERIAL PRIMARY KEY,',
        '  name TEXT NOT NULL,',
        '  email TEXT NOT NULL,',
        '  subject TEXT DEFAULT \'General\',',
        '  message TEXT NOT NULL,',
        '  read BOOLEAN DEFAULT FALSE,',
        '  created_at TIMESTAMPTZ DEFAULT NOW()',
        ');',
        '', '→ Enable RLS → Add insert policy for anon'
      ]
    },
    {
      title: '6. Instagram Strategy 📸', icon: '📸', content: [
        '→ Account: @SunRise_Apps',
        '→ 2-3 Reels/day + trending audio',
        '🎯 10K followers = ₹500-1000/day from ads'
      ]
    },
  ];

  return (
    <section className="pt-28 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3 flex items-center justify-center gap-3">
            <BookOpen className="text-orange-400" size={32} />
            <span>Complete <span className="bg-gradient-to-r from-[#FF6B00] to-[#FFB347] bg-clip-text text-transparent">Guide</span></span>
          </h2>
          <p className="text-white/30 text-sm">From zero to earning money with apps</p>
        </div>
        <div className="space-y-3">
          {steps.map((step, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-orange-500/20 transition-colors">
              <button
                onClick={() => setOpenStep(openStep === i ? null : i)}
                className="w-full flex items-center gap-4 p-5 text-left"
              >
                <span className="text-2xl">{step.icon}</span>
                <span className="flex-1 font-semibold text-white text-sm md:text-base">{step.title}</span>
                <ChevronRight size={18} className={`text-white/20 transition-transform duration-300 ${openStep === i ? 'rotate-90' : ''}`} />
              </button>
              {openStep === i && (
                <div className="px-5 pb-5">
                  <div className="bg-black/40 rounded-xl p-4 border border-white/[0.05] font-mono">
                    {step.content.map((line, j) => (
                      <p key={j} className={`text-sm leading-relaxed ${line === '' ? 'h-3' : line.startsWith('💡') || line.startsWith('🎯') ? 'text-orange-400 font-medium mt-2 font-sans' : line.startsWith('→') ? 'text-white/50 font-sans' : line.startsWith('  ') || line.includes('(') ? 'text-emerald-400/80 text-xs' : 'text-white/40 font-sans'}`}>
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============ ABOUT ============
const AboutSection = () => (
  <section className="py-20 px-4">
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-8 md:p-12">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="w-28 h-28 bg-gradient-to-br from-[#FF6B00] to-[#FFB347] rounded-full flex items-center justify-center text-5xl shrink-0 shadow-xl shadow-orange-500/20">🌅</div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl font-bold text-white mb-4">About <span className="bg-gradient-to-r from-[#FF6B00] to-[#FFB347] bg-clip-text text-transparent">SunRise Apps</span></h2>
            <p className="text-white/40 mb-3">Independent Android developer from India 🇮🇳. Building viral utility apps that solve real problems.</p>
            <p className="text-white/40 mb-6">Every sunrise brings new possibilities — free tools for everyone, supported by non-intrusive ads.</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <a href="https://instagram.com/SunRise_Apps" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-xl text-pink-400 text-sm hover:bg-pink-500/20 transition-colors">📸 @SunRise_Apps</a>
              <a href="mailto:thesunrisecode@gmail.com" className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white/50 text-sm hover:text-white transition-colors"><Mail size={16} /> thesunrisecode@gmail.com</a>
              <a href="https://sunriseapps.in" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-400 text-sm hover:bg-orange-500/20 transition-colors"><Globe size={16} /> sunriseapps.in</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ============ PRIVACY ============
const PrivacySection = () => (
  <section className="py-20 px-4">
    <div className="max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold text-white mb-8 text-center flex items-center justify-center gap-3">
        <Shield className="text-orange-400" size={28} />
        <span>Privacy <span className="bg-gradient-to-r from-[#FF6B00] to-[#FFB347] bg-clip-text text-transparent">Policy</span></span>
      </h2>
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-6 md:p-8 space-y-6">
        {[
          { t: '1. Information We Collect', d: 'Minimal data for app functionality. No personal info tracked on this website beyond what you voluntarily provide in the contact form.' },
          { t: '2. Advertisements', d: 'We use Google AdSense/AdMob. These services may collect device info for personalized ads. Opt out in your device settings.' },
          { t: '3. Data Security', d: 'Contact form data is stored securely in our database. All connections use HTTPS encryption.' },
          { t: '4. Third-Party Services', d: 'Google Play Services, AdMob, Firebase Analytics, and Supabase may be used. Their respective policies apply.' },
          { t: '5. Permissions', d: 'Only necessary permissions requested — storage and internet access required for core functionality.' },
          { t: '6. Children', d: 'Not directed at children under 13. No data knowingly collected from minors.' },
          { t: '7. Updates', d: 'Policy may be updated. Changes reflected on this page with updated date.' },
          { t: '8. Contact', d: 'Privacy concerns: thesunrisecode@gmail.com' },
        ].map((item, i) => (
          <div key={i}>
            <h3 className="text-sm font-semibold text-orange-400 mb-2">{item.t}</h3>
            <p className="text-white/35 text-sm leading-relaxed">{item.d}</p>
          </div>
        ))}
        <div className="pt-4 border-t border-white/[0.06]">
          <p className="text-white/15 text-xs text-center">Last updated: January 2025 • SunRise Apps</p>
        </div>
      </div>
    </div>
  </section>
);

// ============ CONTACT ============
const ContactSection = ({ addToast }: { addToast: (msg: string, type: ToastItem['type']) => void }) => {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: 'General', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.message.trim()) {
      addToast('❌ Please fill all required fields', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('feedbacks').insert([{
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject,
        message: formData.message.trim(),
        read: false,
      }]);
      if (error) throw error;
      setSent(true);
      setFormData({ name: '', email: '', subject: 'General', message: '' });
    } catch (err: any) {
      addToast(`❌ Failed to send: ${err.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-orange-500/50 focus:outline-none placeholder:text-white/15 transition-colors";

  return (
    <section className="py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-8 text-center flex items-center justify-center gap-3">
          <Mail className="text-orange-400" size={28} />
          <span>Contact <span className="bg-gradient-to-r from-[#FF6B00] to-[#FFB347] bg-clip-text text-transparent">Us</span></span>
        </h2>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-6 md:p-8">
          {sent ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <CheckCircle className="text-green-400" size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Message Sent!</h3>
              <p className="text-white/40 text-sm mb-6">Your feedback has been received. We'll get back to you soon.</p>
              <button
                onClick={() => setSent(false)}
                className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white/50 text-sm hover:text-white transition-colors"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/30 mb-1.5">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                    placeholder="Your name"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/30 mb-1.5">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                    placeholder="your@email.com"
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/30 mb-1.5">Subject</label>
                <select
                  value={formData.subject}
                  onChange={e => setFormData(f => ({ ...f, subject: e.target.value }))}
                  className={inputCls}
                >
                  <option className="bg-black">General</option>
                  <option className="bg-black">Bug Report</option>
                  <option className="bg-black">Feature Request</option>
                  <option className="bg-black">Business</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/30 mb-1.5">Message *</label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={e => setFormData(f => ({ ...f, message: e.target.value }))}
                  placeholder="Your message..."
                  className={`${inputCls} resize-none`}
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-gradient-to-r from-[#FF6B00] to-[#FFB347] text-black font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="animate-spin" size={18} /> : <Mail size={18} />}
                {submitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <a href="mailto:thesunrisecode@gmail.com" className="flex flex-col items-center gap-2 text-white/30 hover:text-orange-400 transition-colors">
              <Mail size={20} /><span className="text-xs">thesunrisecode@gmail.com</span>
            </a>
            <a href="https://instagram.com/SunRise_Apps" target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 text-white/30 hover:text-pink-400 transition-colors">
              <span className="text-xl">📸</span><span className="text-xs">@SunRise_Apps</span>
            </a>
            <a href="https://sunriseapps.in" target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 text-white/30 hover:text-orange-400 transition-colors">
              <Globe size={20} /><span className="text-xs">sunriseapps.in</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

// ============ MAIN APP ============
export default function App() {
  const [apps, setApps] = useState<AppData[]>([]);
  const [page, setPage] = useState('home');
  const [modalApp, setModalApp] = useState<AppData | null>(null);
  const [unlockedApps, setUnlockedApps] = useState<number[]>([]);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch Apps
  const fetchApps = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('apps')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setApps(data || []);
    } catch (err: any) {
      addToast(`❌ Could not load apps: ${err.message}`, 'error');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('apps-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'apps' }, () => { fetchApps(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchApps]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setPage('home');
    addToast('👋 Logged out successfully', 'info');
  };

  const handleDownload = useCallback((app: AppData) => {
    if (unlockedApps.includes(app.id)) window.open(app.apk_link, '_blank');
    else setModalApp(app);
  }, [unlockedApps]);

  const handleUnlock = useCallback(() => {
    if (modalApp) {
      setUnlockedApps(prev => [...prev, modalApp.id]);
      window.open(modalApp.apk_link, '_blank');
      setModalApp(null);
    }
  }, [modalApp]);

  const navigate = (p: string) => {
    setPage(p);
    setMobileMenu(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: <Sun size={15} /> },
    { id: 'about', label: 'About', icon: <Users size={15} /> },
    { id: 'guide', label: 'Guide', icon: <BookOpen size={15} /> },
    { id: 'privacy', label: 'Privacy', icon: <Shield size={15} /> },
    { id: 'contact', label: 'Contact', icon: <Mail size={15} /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-[#FF6B00] to-[#FFB347] rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/30">
            <Sun size={28} className="text-black" />
          </div>
          <Loader2 className="text-orange-400 animate-spin" size={28} />
          <p className="text-white/40 text-sm">Loading SunRise Apps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-[#050505]/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button onClick={() => navigate('home')} className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-gradient-to-br from-[#FF6B00] to-[#FFB347] rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Sun size={18} className="text-black" />
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-white">Sun<span className="bg-gradient-to-r from-[#FF6B00] to-[#FFB347] bg-clip-text text-transparent">Rise</span></span>
                <span className="text-white/30 text-sm ml-1">Apps</span>
              </div>
            </button>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${page === item.id ? 'text-orange-400 bg-orange-500/10' : 'text-white/35 hover:text-white/70 hover:bg-white/5'}`}
                >
                  {item.icon}{item.label}
                </button>
              ))}
              {session && (
                <button
                  onClick={() => navigate('admin')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium ml-2 transition-all ${page === 'admin' ? 'text-orange-400 bg-orange-500/10' : 'text-white/35 hover:text-white/70 hover:bg-white/5'}`}
                >
                  <Settings size={15} /> Admin
                </button>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-white/50 hover:text-white transition-colors"
            >
              {mobileMenu ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenu && (
            <div className="md:hidden py-3 pb-4 border-t border-white/[0.06] space-y-1">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors ${page === item.id ? 'text-orange-400 bg-orange-500/10' : 'text-white/40 hover:bg-white/5'}`}
                >
                  {item.icon}{item.label}
                </button>
              ))}
              {session && (
                <button
                  onClick={() => navigate('admin')}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-orange-400 hover:bg-orange-500/10 transition-colors"
                >
                  <Settings size={15} /> Admin Panel
                </button>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* PAGES */}
      {page === 'home' && (
        <>
          <HomePage apps={apps} onDownload={handleDownload} unlockedApps={unlockedApps} loading={loading || refreshing} />
          <AboutSection />
          <PrivacySection />
          <ContactSection addToast={addToast} />
        </>
      )}

      {page === 'admin' && (
        session ? (
          <AdminPage
            apps={apps}
            setApps={setApps}
            onLogout={handleLogout}
            session={session}
            refreshApps={fetchApps}
            isRefreshing={refreshing}
            addToast={addToast}
          />
        ) : (
          <AdminLogin onLogin={() => setPage('admin')} />
        )
      )}

      {page === 'guide' && <GuidePage />}
      {page === 'about' && <AboutSection />}
      {page === 'privacy' && <PrivacySection />}
      {page === 'contact' && <ContactSection addToast={addToast} />}

      {/* FOOTER */}
      <footer className="border-t border-white/[0.06] py-10 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-7 h-7 bg-gradient-to-br from-[#FF6B00] to-[#FFB347] rounded-lg flex items-center justify-center">
              <Sun size={14} className="text-black" />
            </div>
            <span className="font-bold text-white/60 text-sm">SunRise Apps</span>
          </div>
          <p className="text-white/15 text-xs">© 2025 SunRise Apps. Powered by Supabase 🚀</p>
        </div>
      </footer>

      {/* MODALS & OVERLAYS */}
      <LockModal app={modalApp} onClose={() => setModalApp(null)} onUnlock={handleUnlock} />
      <ScrollToTop />
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}