import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabaseClient.ts';
import { Session } from '@supabase/supabase-js';
import {
  Sun, Download, Share2, Lock, Shield, Mail,
  Globe, ChevronDown, ChevronRight, Menu, X, Star, Users, Smartphone,
  Settings, Plus, Trash2, Edit3, Save, Eye, EyeOff, BookOpen,
  ArrowUp, Search, Filter, LogOut, KeyRound, AlertTriangle,
  ToggleLeft, ToggleRight, RefreshCw, Loader2, Image as ImageIcon,
  Upload, MessageSquare, CheckCircle,
  ChevronUp, Inbox, Sparkles, Zap, TrendingUp, Heart
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
    case 'Viral': return 'bg-gradient-to-r from-rose-500 to-pink-600';
    case 'PRO': return 'bg-gradient-to-r from-amber-400 to-orange-500';
    case 'New': return 'bg-gradient-to-r from-emerald-400 to-teal-500';
    default: return 'bg-gradient-to-r from-gray-500 to-gray-600';
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
  <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '380px', padding: '0 16px' }}>
    {toasts.map(t => (
      <div
        key={t.id}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
          padding: '12px 16px', borderRadius: '16px', fontSize: '14px', fontWeight: 500,
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          animation: 'fadeIn 0.3s ease forwards',
          background: t.type === 'success' ? 'rgba(6,78,59,0.9)' : t.type === 'error' ? 'rgba(127,29,29,0.9)' : 'rgba(17,17,17,0.95)',
          border: `1px solid ${t.type === 'success' ? 'rgba(16,185,129,0.4)' : t.type === 'error' ? 'rgba(239,68,68,0.4)' : 'rgba(255,107,53,0.3)'}`,
          color: t.type === 'success' ? '#6ee7b7' : t.type === 'error' ? '#fca5a5' : '#fdba74',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
        }}
      >
        <span>{t.message}</span>
        <button onClick={() => removeToast(t.id)} style={{ opacity: 0.5, cursor: 'pointer', flexShrink: 0, background: 'none', border: 'none', color: 'inherit' }}>
          <X size={14} />
        </button>
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
      style={{
        position: 'fixed', bottom: '24px', right: '24px', zIndex: 50,
        width: '48px', height: '48px', borderRadius: '16px',
        background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
        color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(255,107,53,0.4)', border: 'none', cursor: 'pointer',
        transition: 'transform 0.2s ease'
      }}
      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
    >
      <ArrowUp size={20} />
    </button>
  );
};

// ============ AD BANNER ============
const AdBanner = ({ variant = 'horizontal' }: { variant?: 'horizontal' | 'rectangle' }) => (
  <div style={{
    border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '20px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'rgba(255,255,255,0.2)', height: variant === 'rectangle' ? '240px' : '80px',
    background: 'rgba(255,255,255,0.01)'
  }}>
    <div style={{ textAlign: 'center', fontSize: '12px' }}>
      <p>📢 Google AdSense Ad Space</p>
      <p style={{ fontSize: '10px', marginTop: '4px', color: 'rgba(255,255,255,0.1)' }}>Insert your ad unit code here</p>
    </div>
  </div>
);

// ============ LOCK MODAL ============
const LockModal = ({ app, onClose, onUnlock }: { app: AppData | null; onClose: () => void; onUnlock: () => void }) => {
  const [countdown, setCountdown] = useState(5);
  const [watching, setWatching] = useState(false);

  useEffect(() => {
    if (!watching) return;
    if (countdown <= 0) { onUnlock(); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [watching, countdown, onUnlock]);

  useEffect(() => { if (app) { setCountdown(5); setWatching(false); } }, [app]);

  if (!app) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.9)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, #151515, #0a0a0a)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px',
          padding: '32px', maxWidth: '380px', width: '100%', position: 'relative',
          boxShadow: '0 20px 60px rgba(255,107,53,0.1)'
        }}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}>
          <X size={20} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '80px', height: '80px', margin: '0 auto 20px',
            borderRadius: '24px', background: 'rgba(255,107,53,0.15)',
            border: '1px solid rgba(255,107,53,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Lock style={{ color: '#FF6B35' }} size={32} />
          </div>
          <h3 style={{ fontSize: '24px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>Unlock Download</h3>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '32px' }}>{app.name}</p>
          {!watching ? (
            <button
              onClick={() => setWatching(true)}
              style={{
                width: '100%', padding: '16px', borderRadius: '16px',
                background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                color: 'black', fontWeight: 700, fontSize: '16px', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              <Eye size={20} /> Watch Ad to Unlock
            </button>
          ) : (
            <div style={{
              background: 'rgba(255,255,255,0.05)', borderRadius: '16px',
              padding: '20px', border: '1px solid rgba(255,107,53,0.2)'
            }}>
              <p style={{ color: '#FF6B35', fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>⏳ Ad playing...</p>
              <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', height: '12px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', background: 'linear-gradient(90deg, #FF6B35, #FFB800)',
                  borderRadius: '999px', transition: 'width 1s linear',
                  width: `${((5 - countdown) / 5) * 100}%`
                }} />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginTop: '12px' }}>{countdown}s remaining</p>
            </div>
          )}
          <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: '10px', marginTop: '16px' }}>* Ad placeholder — integrate AdMob here</p>
        </div>
      </div>
    </div>
  );
};

// ============ FILE UPLOAD ============
const FileUpload = ({ label, accept, bucket, folder, onUploadComplete, currentUrl, addToast }: {
  label: string; accept: string; bucket: string; folder: string;
  onUploadComplete: (url: string) => void; currentUrl?: string;
  addToast: (msg: string, type: ToastItem['type']) => void;
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = accept.includes('apk') ? 100 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) { addToast(`❌ File too large. Max ${accept.includes('apk') ? '100MB' : '5MB'}`, 'error'); return; }
    setUploading(true); setProgress(10);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      setProgress(40);
      const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;
      setProgress(80);
      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      onUploadComplete(data.publicUrl);
      setProgress(100);
      addToast('✅ File uploaded!', 'success');
    } catch (err: any) { addToast(`❌ Upload failed: ${err.message}`, 'error'); }
    finally { setTimeout(() => { setUploading(false); setProgress(0); }, 800); if (inputRef.current) inputRef.current.value = ''; }
  };

  return (
    <div style={{ marginBottom: '4px' }}>
      <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginBottom: '6px' }}>{label}</label>
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          border: '1px dashed rgba(255,255,255,0.15)', borderRadius: '16px',
          padding: '12px', display: 'flex', alignItems: 'center', gap: '12px',
          cursor: 'pointer', background: 'rgba(255,255,255,0.02)',
          transition: 'border-color 0.2s ease'
        }}
      >
        <input ref={inputRef} type="file" accept={accept} onChange={handleUpload} style={{ display: 'none' }} />
        <div style={{
          width: '40px', height: '40px', borderRadius: '12px',
          background: 'rgba(255,107,53,0.1)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          border: '1px solid rgba(255,107,53,0.1)'
        }}>
          {uploading ? <Loader2 size={16} style={{ color: '#FF6B35', animation: 'spin 1s linear infinite' }} /> : <Upload size={16} style={{ color: '#FF6B35' }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {currentUrl ? <p style={{ fontSize: '12px', color: '#34d399', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>✅ {currentUrl.split('/').pop()}</p>
            : <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>{uploading ? 'Uploading...' : 'Click to upload'}</p>}
          {uploading && (
            <div style={{ marginTop: '6px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', height: '6px' }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg, #FF6B35, #FFB800)', borderRadius: '999px', transition: 'width 0.5s ease', width: `${progress}%` }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============ APP CARD ============
const AppCard = ({ app, onDownload, unlocked }: { app: AppData; onDownload: (a: AppData) => void; unlocked: boolean }) => {
  const handleShare = () => {
    const text = `🌅 Check out "${app.name}" on SunRise Apps!\n📲 Download: ${window.location.href}`;
    if (navigator.share) navigator.share({ title: app.name, text, url: window.location.href }).catch(() => { });
    else { navigator.clipboard.writeText(text); alert('Link copied! 📸'); }
  };

  const isComingSoon = app.apk_link === '#' || !app.apk_link;
  const iconDisplay = app.icon_url
    ? <img src={app.icon_url} alt={app.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' }} />
    : app.icon ? <span style={{ fontSize: '28px' }}>{app.icon}</span>
      : <ImageIcon size={24} style={{ color: 'rgba(255,255,255,0.2)' }} />;

  return (
    <div style={{
      position: 'relative', background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
      border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '20px',
      transition: 'all 0.4s ease'
    }}>
      <span style={{
        position: 'absolute', top: '-10px', right: '16px', padding: '4px 12px',
        borderRadius: '999px', fontSize: '10px', fontWeight: 700, color: 'white',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
      }} className={getBadgeColors(app.badge)}>
        {app.badge === 'Viral' ? '🔥 ' : app.badge === 'PRO' ? '⭐ ' : '✨ '}{app.badge}
      </span>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div style={{
          width: '56px', height: '56px', flexShrink: 0,
          background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
        }}>
          {iconDisplay}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3 style={{ fontWeight: 700, color: 'white', fontSize: '15px', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.name}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
            <span style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>v{app.version}</span>
            <span>•</span>
            <span>{app.size}</span>
          </div>
        </div>
      </div>

      <p style={{
        color: 'rgba(255,255,255,0.4)', fontSize: '14px', lineHeight: 1.6, marginBottom: '16px',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
      }}>
        {app.description}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Download size={11} style={{ color: 'rgba(255,107,53,0.6)' }} /> {formatDownloads(app.downloads)}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Star size={11} style={{ color: 'rgba(255,184,0,0.6)' }} /> {app.rating}</span>
        <span style={{ background: 'rgba(168,85,247,0.1)', padding: '2px 8px', borderRadius: '8px', color: 'rgba(168,85,247,0.6)', border: '1px solid rgba(168,85,247,0.1)' }}>{app.category}</span>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => !isComingSoon && onDownload(app)}
          disabled={isComingSoon}
          style={{
            flex: 1, padding: '12px', borderRadius: '16px', fontWeight: 600, fontSize: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            border: 'none', cursor: isComingSoon ? 'not-allowed' : 'pointer',
            background: isComingSoon ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #FF6B35, #FFB800)',
            color: isComingSoon ? 'rgba(255,255,255,0.2)' : 'black',
            transition: 'all 0.3s ease'
          }}
        >
          {isComingSoon ? 'Coming Soon' : unlocked ? <><Download size={15} /> Download</> : <><Lock size={15} /> Get APK</>}
        </button>
        <button
          onClick={handleShare}
          style={{
            width: '44px', height: '44px', flexShrink: 0, borderRadius: '16px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.3s ease'
          }}
        >
          <Share2 size={15} />
        </button>
      </div>
    </div>
  );
};

// ============ HOME PAGE ============
const HomePage = ({ apps, onDownload, unlockedApps, loading }: {
  apps: AppData[]; onDownload: (a: AppData) => void; unlockedApps: number[]; loading: boolean;
}) => {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');

  const publishedApps = apps.filter(a => a.published);
  const categories = ['All', ...Array.from(new Set(publishedApps.map(a => a.category)))];
  const filtered = publishedApps.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (catFilter === 'All' || a.category === catFilter);
  });
  const totalDownloads = publishedApps.reduce((s, a) => s + (parseInt(a.downloads) || 0), 0);

  return (
    <>
      {/* HERO */}
      <section style={{ paddingTop: '112px', paddingBottom: '96px', paddingLeft: '16px', paddingRight: '16px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(255,107,53,0.06), transparent)' }} />
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '800px', height: '600px', background: 'radial-gradient(circle, rgba(255,107,53,0.08), transparent 70%)', borderRadius: '50%', filter: 'blur(120px)' }} />

        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 10 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'linear-gradient(135deg, rgba(255,107,53,0.1), rgba(255,184,0,0.1))',
            border: '1px solid rgba(255,107,53,0.2)', borderRadius: '999px',
            padding: '10px 20px', marginBottom: '32px', fontSize: '14px', color: 'rgba(255,107,53,0.8)'
          }}>
            <Sparkles size={14} style={{ color: '#FF6B35' }} />
            <span>Your Trusted App Source</span>
            <Zap size={12} style={{ color: '#FFB800' }} />
          </div>

          <h1 style={{ fontSize: 'clamp(48px, 10vw, 96px)', fontWeight: 900, lineHeight: 1.05, marginBottom: '24px', letterSpacing: '-2px' }}>
            <span style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800, #FCD34D)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SunRise</span>
            <br />
            <span style={{ color: 'white' }}>Apps</span>
          </h1>

          <p style={{ fontSize: 'clamp(16px, 3vw, 20px)', color: 'rgba(255,255,255,0.45)', maxWidth: '500px', margin: '0 auto 48px', lineHeight: 1.7 }}>
            Get the latest <span style={{ color: '#FF6B35', fontWeight: 600 }}>viral Android tools</span> — free, safe & always updated 🚀
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
            <button
              onClick={() => document.getElementById('apps-section')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                padding: '16px 40px', background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                color: 'black', fontWeight: 700, fontSize: '16px', borderRadius: '16px',
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                boxShadow: '0 8px 30px rgba(255,107,53,0.3)', transition: 'transform 0.2s ease'
              }}
            >
              <Download size={18} /> Explore Apps
            </button>
            <button
              onClick={() => document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                padding: '16px 32px', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)',
                fontWeight: 500, fontSize: '16px', borderRadius: '16px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <Heart size={16} /> Learn More
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', maxWidth: '480px', margin: '80px auto 0', gap: '16px' }}>
            {[
              { value: formatDownloads(totalDownloads.toString()) + '+', label: 'Downloads', icon: <Download size={18} />, color: '#FF6B35', bg: 'rgba(255,107,53,0.12)', borderColor: 'rgba(255,107,53,0.2)' },
              { value: publishedApps.filter(a => a.apk_link && a.apk_link !== '#').length + '+', label: 'Apps', icon: <Smartphone size={18} />, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', borderColor: 'rgba(59,130,246,0.2)' },
              { value: '4.9', label: 'Avg Rating', icon: <Star size={18} />, color: '#a855f7', bg: 'rgba(168,85,247,0.12)', borderColor: 'rgba(168,85,247,0.2)' },
            ].map((s, i) => (
              <div key={i} style={{
                background: s.bg, border: `1px solid ${s.borderColor}`,
                borderRadius: '16px', padding: '20px', textAlign: 'center',
                transition: 'transform 0.2s ease'
              }}>
                <div style={{ color: s.color, marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>{s.icon}</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'white' }}>{s.value}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 16px', marginBottom: '32px' }}><AdBanner variant="horizontal" /></div>

      {/* APPS */}
      <section id="apps-section" style={{ padding: '80px 16px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)',
              borderRadius: '999px', padding: '6px 16px', marginBottom: '16px',
              fontSize: '12px', color: 'rgba(168,85,247,0.8)'
            }}>
              <TrendingUp size={12} /> Trending Now
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 700, color: 'white', marginBottom: '16px' }}>
              App <span style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Collection</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '16px' }}>All apps free — watch a short ad to download</p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>
            <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)' }} />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search apps..."
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '16px', padding: '14px 16px 14px 44px', color: 'white', fontSize: '14px', outline: 'none'
                }}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <Filter size={14} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)' }} />
              <select
                value={catFilter} onChange={e => setCatFilter(e.target.value)}
                style={{
                  appearance: 'none', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '16px', padding: '14px 40px 14px 36px', color: 'white', fontSize: '14px',
                  outline: 'none', cursor: 'pointer'
                }}
              >
                {categories.map(c => <option key={c} value={c} style={{ background: '#111' }}>{c}</option>)}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)', pointerEvents: 'none' }} />
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '20px', height: '240px' }}>
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ width: '56px', height: '56px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', width: '75%', marginBottom: '8px' }} />
                      <div style={{ height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', width: '50%' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ width: '80px', height: '80px', margin: '0 auto 20px', borderRadius: '24px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Search size={32} style={{ color: 'rgba(255,255,255,0.15)' }} />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '18px', fontWeight: 500 }}>No apps found</p>
              <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: '14px', marginTop: '8px' }}>Try a different search</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
              {filtered.map(app => <AppCard key={app.id} app={app} onDownload={onDownload} unlocked={unlockedApps.includes(app.id)} />)}
            </div>
          )}
        </div>
      </section>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 16px', marginBottom: '48px' }}><AdBanner variant="rectangle" /></div>
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
    e.preventDefault(); setLoading(true); setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); } else onLogin();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px', padding: '14px 16px', color: 'white', fontSize: '14px', outline: 'none'
  };

  return (
    <section style={{ paddingTop: '112px', paddingBottom: '80px', paddingLeft: '16px', paddingRight: '16px' }}>
      <div style={{ maxWidth: '420px', margin: '0 auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '32px', textAlign: 'center'
        }}>
          <div style={{
            width: '80px', height: '80px', margin: '0 auto 24px', borderRadius: '24px',
            background: 'rgba(255,107,53,0.15)', border: '1px solid rgba(255,107,53,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <KeyRound style={{ color: '#FF6B35' }} size={32} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>Admin Access</h2>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', marginBottom: '32px' }}>Sign in with your credentials</p>

          {error && (
            <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '16px', color: '#f87171', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginBottom: '6px' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@sunrise.com" required style={inputStyle} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginBottom: '6px' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={{ ...inputStyle, paddingRight: '44px' }} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '14px', background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
              color: 'black', fontWeight: 700, borderRadius: '16px', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              opacity: loading ? 0.5 : 1, fontSize: '14px'
            }}>
              {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Lock size={18} />}
              {loading ? 'Signing In...' : 'Unlock Admin Panel'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

// ============ ADMIN PAGE ============
const AdminPage = ({ apps, onLogout, session, refreshApps, isRefreshing, addToast }: {
  apps: AppData[]; onLogout: () => void; session: Session | null;
  refreshApps: () => Promise<void>; isRefreshing: boolean;
  addToast: (msg: string, type: ToastItem['type']) => void;
}) => {
  const [activeTab, setActiveTab] = useState<'apps' | 'feedbacks'>('apps');
  const [editingId, setEditingId] = useState<number | null>(null);
  const emptyForm: Partial<AppData> = {
    name: '', version: '1.0.0', description: '', apk_link: '', badge: 'New',
    icon: '📱', icon_url: '', downloads: '0', size: '0 MB', category: 'Tools',
    rating: '4.5', updated: new Date().toISOString().slice(0, 10), published: false
  };
  const [form, setForm] = useState<Partial<AppData>>(emptyForm);
  const [showAddForm, setShowAddForm] = useState(false);
  const [adminFilter, setAdminFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [submitting, setSubmitting] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expandedFeedback, setExpandedFeedback] = useState<number | null>(null);

  const fetchFeedbacks = useCallback(async () => {
    setFeedbackLoading(true);
    try {
      const { data, error } = await supabase.from('feedbacks').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setFeedbacks(data || []);
      setUnreadCount((data || []).filter((f: Feedback) => !f.read).length);
    } catch (err: any) { addToast(`❌ ${err.message}`, 'error'); }
    finally { setFeedbackLoading(false); }
  }, [addToast]);

  useEffect(() => { fetchFeedbacks(); }, [fetchFeedbacks]);

  useEffect(() => {
    const ch = supabase.channel('fb-rt').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feedbacks' }, p => {
      setFeedbacks(prev => [p.new as Feedback, ...prev]);
      setUnreadCount(c => c + 1);
      addToast('📩 New feedback!', 'info');
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [addToast]);

  const markAsRead = async (id: number) => {
    const { error } = await supabase.from('feedbacks').update({ read: true }).eq('id', id);
    if (!error) { setFeedbacks(p => p.map(f => f.id === id ? { ...f, read: true } : f)); setUnreadCount(c => Math.max(0, c - 1)); }
  };

  const deleteFeedback = async (id: number) => {
    if (!confirm('Delete this feedback?')) return;
    const { error } = await supabase.from('feedbacks').delete().eq('id', id);
    if (error) addToast(`❌ ${error.message}`, 'error');
    else { setFeedbacks(p => p.filter(f => f.id !== id)); addToast('🗑️ Deleted', 'success'); }
  };

  const startEdit = (app: AppData) => { setForm({ ...app }); setEditingId(app.id); setShowAddForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const startAdd = () => { setForm({ ...emptyForm }); setEditingId(null); setShowAddForm(true); };

  const validateForm = (): boolean => {
    if (!form.name?.trim()) { addToast('❌ App name required', 'error'); return false; }
    if (form.apk_link && form.apk_link !== '#' && !form.apk_link.startsWith('http')) { addToast('❌ Invalid APK URL', 'error'); return false; }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      if (editingId !== null) {
        const { error } = await supabase.from('apps').update(form).eq('id', editingId);
        if (error) throw error;
        addToast('✅ App updated!', 'success');
      } else {
        const { error } = await supabase.from('apps').insert([form]);
        if (error) throw error;
        addToast('✅ App added!', 'success');
      }
      await refreshApps(); setShowAddForm(false); setEditingId(null);
    } catch (err: any) { addToast(`❌ ${err.message}`, 'error'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete permanently?')) return;
    try {
      const { error } = await supabase.from('apps').delete().eq('id', id);
      if (error) throw error;
      addToast('🗑️ Deleted', 'success'); await refreshApps();
    } catch (err: any) { addToast(`❌ ${err.message}`, 'error'); }
  };

  const togglePublish = async (id: number, current: boolean) => {
    try {
      const { error } = await supabase.from('apps').update({ published: !current }).eq('id', id);
      if (error) throw error;
      addToast(!current ? '🟢 Published!' : '📝 Unpublished', 'success'); await refreshApps();
    } catch (err: any) { addToast(`❌ ${err.message}`, 'error'); }
  };

  const filteredApps = apps.filter(a => adminFilter === 'all' ? true : adminFilter === 'published' ? a.published : !a.published);
  const publishedCount = apps.filter(a => a.published).length;
  const draftCount = apps.filter(a => !a.published).length;

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px', padding: '10px 16px', color: 'white', fontSize: '14px', outline: 'none'
  };

  const smallBtnStyle = (active: boolean, color: string): React.CSSProperties => ({
    width: '36px', height: '36px', borderRadius: '12px', display: 'flex',
    alignItems: 'center', justifyContent: 'center', border: `1px solid ${color}20`,
    background: `${color}10`, color: active ? color : 'rgba(255,255,255,0.3)',
    cursor: 'pointer', transition: 'all 0.2s ease'
  });

  return (
    <section style={{ paddingTop: '112px', paddingBottom: '80px', paddingLeft: '16px', paddingRight: '16px' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '16px', background: 'rgba(255,107,53,0.15)', border: '1px solid rgba(255,107,53,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Settings style={{ color: '#FF6B35' }} size={20} />
              </div>
              Admin Panel
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', marginTop: '8px' }}>
              Logged in as <span style={{ color: '#FF6B35' }}>{session?.user?.email}</span>
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button onClick={refreshApps} disabled={isRefreshing} style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: 'rgba(255,255,255,0.5)', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: isRefreshing ? 0.5 : 1 }}>
              {isRefreshing ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={13} />} Refresh
            </button>
            <button onClick={startAdd} style={{ padding: '10px 16px', background: 'linear-gradient(135deg, #FF6B35, #FFB800)', color: 'black', fontWeight: 600, borderRadius: '16px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', border: 'none' }}>
              <Plus size={13} /> Add App
            </button>
            <button onClick={onLogout} style={{ padding: '10px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '16px', color: '#f87171', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <LogOut size={13} /> Logout
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '32px' }}>
          {[
            { label: 'Total Apps', value: apps.length, color: 'white', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)' },
            { label: 'Published', value: publishedCount, color: '#34d399', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
            { label: 'Drafts', value: draftCount, color: '#fbbf24', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
            { label: 'Feedbacks', value: feedbacks.length, color: '#60a5fa', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', badge: unreadCount },
          ].map((s, i) => (
            <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: '16px', padding: '16px', position: 'relative' }}>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', marginBottom: '4px' }}>{s.label}</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: s.color }}>{s.value}</p>
              {s.badge != null && s.badge > 0 && (
                <span style={{ position: 'absolute', top: '12px', right: '12px', width: '20px', height: '20px', borderRadius: '50%', background: '#FF6B35', color: 'black', fontSize: '9px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.badge}</span>
              )}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => setActiveTab('apps')}
            style={{
              padding: '10px 20px', borderRadius: '16px', fontSize: '14px', fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
              background: activeTab === 'apps' ? 'rgba(255,107,53,0.12)' : 'transparent',
              color: activeTab === 'apps' ? '#FF6B35' : 'rgba(255,255,255,0.3)',
              border: activeTab === 'apps' ? '1px solid rgba(255,107,53,0.3)' : '1px solid transparent',
              transition: 'all 0.2s ease'
            }}
          >
            <Smartphone size={15} /> Apps
          </button>
          <button
            onClick={() => { setActiveTab('feedbacks'); fetchFeedbacks(); }}
            style={{
              padding: '10px 20px', borderRadius: '16px', fontSize: '14px', fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', position: 'relative',
              background: activeTab === 'feedbacks' ? 'rgba(59,130,246,0.12)' : 'transparent',
              color: activeTab === 'feedbacks' ? '#60a5fa' : 'rgba(255,255,255,0.3)',
              border: activeTab === 'feedbacks' ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
              transition: 'all 0.2s ease'
            }}
          >
            <MessageSquare size={15} /> Feedbacks
            {unreadCount > 0 && (
              <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#FF6B35', color: 'black', fontSize: '9px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCount}</span>
            )}
          </button>
        </div>

        {/* APPS TAB */}
        {activeTab === 'apps' && (
          <>
            {showAddForm && (
              <div style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))', border: '1px solid rgba(255,107,53,0.2)', borderRadius: '24px', padding: '24px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {editingId !== null ? <><Edit3 size={18} style={{ color: '#FF6B35' }} /> Edit App</> : <><Plus size={18} style={{ color: '#FF6B35' }} /> Add New App</>}
                  </h3>
                  <button onClick={() => { setShowAddForm(false); setEditingId(null); }} style={{ color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                  {[
                    { key: 'name', label: 'App Name *', ph: 'My Awesome App' },
                    { key: 'version', label: 'Version', ph: '1.0.0' },
                    { key: 'icon', label: 'Icon Emoji', ph: '📱' },
                    { key: 'size', label: 'Size', ph: '4.5 MB' },
                    { key: 'category', label: 'Category', ph: 'Tools' },
                    { key: 'rating', label: 'Rating (0-5)', ph: '4.5' },
                    { key: 'downloads', label: 'Downloads', ph: '15200' },
                    { key: 'updated', label: 'Updated', ph: '', type: 'date' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginBottom: '6px' }}>{f.label}</label>
                      <input type={f.type || 'text'} value={String((form as any)[f.key] || '')} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.ph} style={inputStyle} />
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginBottom: '6px' }}>Description</label>
                  <textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe your app... 🎉" rows={3} style={{ ...inputStyle, resize: 'none' }} />
                </div>

                <div style={{ marginTop: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginBottom: '6px' }}>APK Link</label>
                  <input value={form.apk_link || ''} onChange={e => setForm({ ...form, apk_link: e.target.value })} placeholder="https://... or #" style={inputStyle} />
                </div>

                <div style={{ marginTop: '16px' }}>
                  <FileUpload label="Upload APK (max 100MB)" accept=".apk" bucket="apks" folder="uploads" currentUrl={form.apk_link?.includes('supabase') ? form.apk_link : undefined} onUploadComplete={url => setForm(f => ({ ...f, apk_link: url }))} addToast={addToast} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginTop: '16px' }}>
                  <FileUpload label="Upload Icon (PNG/JPG)" accept="image/png,image/jpeg,image/webp" bucket="icons" folder="app-icons" currentUrl={form.icon_url} onUploadComplete={url => setForm(f => ({ ...f, icon_url: url }))} addToast={addToast} />
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginBottom: '6px' }}>Badge</label>
                    <select value={form.badge} onChange={e => setForm({ ...form, badge: e.target.value })} style={inputStyle}>
                      <option value="New" style={{ background: '#111' }}>✨ New</option>
                      <option value="Viral" style={{ background: '#111' }}>🔥 Viral</option>
                      <option value="PRO" style={{ background: '#111' }}>⭐ PRO</option>
                    </select>
                  </div>
                </div>

                {form.icon_url && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img src={form.icon_url} alt="icon" style={{ width: '40px', height: '40px', borderRadius: '12px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <button onClick={() => setForm(f => ({ ...f, icon_url: '' }))} style={{ fontSize: '12px', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                  </div>
                )}

                <div style={{ marginTop: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginBottom: '6px' }}>Visibility</label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, published: !form.published })}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      width: '100%', padding: '12px 16px', borderRadius: '16px', fontSize: '14px', fontWeight: 500,
                      cursor: 'pointer', transition: 'all 0.2s ease',
                      background: form.published ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                      border: `1px solid ${form.published ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
                      color: form.published ? '#34d399' : '#fbbf24'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {form.published ? <Eye size={16} /> : <EyeOff size={16} />}
                      {form.published ? '🟢 Published' : '📝 Draft'}
                    </span>
                    {form.published ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <button onClick={handleSave} disabled={submitting} style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #FF6B35, #FFB800)', color: 'black', fontWeight: 600, borderRadius: '16px', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', opacity: submitting ? 0.5 : 1 }}>
                    {submitting ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
                    {editingId !== null ? 'Update App' : 'Add App'}
                  </button>
                  <button onClick={() => { setShowAddForm(false); setEditingId(null); }} style={{ padding: '10px 24px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: 'rgba(255,255,255,0.5)', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            )}

            {/* Filter */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
              {(['all', 'published', 'draft'] as const).map(f => (
                <button key={f} onClick={() => setAdminFilter(f)} style={{
                  padding: '8px 16px', borderRadius: '16px', fontSize: '12px', fontWeight: 500,
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  background: adminFilter === f ? 'rgba(255,107,53,0.12)' : 'rgba(255,255,255,0.03)',
                  color: adminFilter === f ? '#FF6B35' : 'rgba(255,255,255,0.3)',
                  border: `1px solid ${adminFilter === f ? 'rgba(255,107,53,0.3)' : 'rgba(255,255,255,0.06)'}`
                }}>
                  {f === 'all' ? `All (${apps.length})` : f === 'published' ? `🟢 Live (${publishedCount})` : `📝 Draft (${draftCount})`}
                </button>
              ))}
            </div>

            {/* App List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredApps.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '64px 0', color: 'rgba(255,255,255,0.2)' }}>
                  <Inbox size={40} style={{ margin: '0 auto 16px' }} />
                  <p>No apps here.</p>
                  <button onClick={startAdd} style={{ marginTop: '16px', padding: '8px 16px', background: 'rgba(255,107,53,0.1)', color: '#FF6B35', borderRadius: '12px', fontSize: '14px', border: '1px solid rgba(255,107,53,0.2)', cursor: 'pointer' }}>+ Add your first app</button>
                </div>
              ) : filteredApps.map(app => (
                <div key={app.id} style={{
                  background: 'rgba(255,255,255,0.02)', border: `1px solid ${app.published ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px',
                  opacity: app.published ? 1 : 0.7, transition: 'all 0.2s ease'
                }}>
                  <div style={{ width: '48px', height: '48px', flexShrink: 0, background: 'rgba(255,107,53,0.08)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {app.icon_url ? <img src={app.icon_url} alt={app.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : app.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h4 style={{ fontWeight: 600, color: 'white', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.name}</h4>
                      <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '9px', fontWeight: 700, color: 'white' }} className={getBadgeColors(app.badge)}>{app.badge}</span>
                      {app.published
                        ? <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '9px', fontWeight: 500, background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>🟢 Live</span>
                        : <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '9px', fontWeight: 500, background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}>📝 Draft</span>
                      }
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', marginTop: '4px' }}>v{app.version} • {app.size} • {app.category}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button onClick={() => togglePublish(app.id, app.published)} style={smallBtnStyle(true, app.published ? '#10b981' : '#f59e0b')}>
                      {app.published ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button onClick={() => startEdit(app)} style={smallBtnStyle(false, '#FF6B35')}><Edit3 size={14} /></button>
                    <button onClick={() => handleDelete(app.id)} style={smallBtnStyle(false, '#ef4444')}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* FEEDBACKS TAB */}
        {activeTab === 'feedbacks' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>{feedbacks.length} total · <span style={{ color: '#FF6B35' }}>{unreadCount} unread</span></p>
              <button onClick={fetchFeedbacks} disabled={feedbackLoading} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'rgba(255,255,255,0.4)', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: feedbackLoading ? 0.5 : 1 }}>
                {feedbackLoading ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={12} />} Refresh
              </button>
            </div>

            {feedbackLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[1, 2, 3].map(i => <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '16px', height: '80px' }} />)}
              </div>
            ) : feedbacks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.2)' }}>
                <Inbox size={40} style={{ margin: '0 auto 16px' }} />
                <p>No feedbacks yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {feedbacks.map(fb => (
                  <div key={fb.id} style={{
                    border: `1px solid ${!fb.read ? 'rgba(255,107,53,0.25)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: '16px', overflow: 'hidden',
                    background: !fb.read ? 'rgba(255,107,53,0.03)' : 'rgba(255,255,255,0.02)'
                  }}>
                    <div
                      onClick={() => { setExpandedFeedback(expandedFeedback === fb.id ? null : fb.id); if (!fb.read) markAsRead(fb.id); }}
                      style={{ padding: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}
                    >
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', marginTop: '6px', flexShrink: 0, background: !fb.read ? '#FF6B35' : 'rgba(255,255,255,0.1)', boxShadow: !fb.read ? '0 0 8px rgba(255,107,53,0.5)' : 'none' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, color: 'white', fontSize: '14px' }}>{fb.name}</span>
                          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px' }}>{fb.email}</span>
                          <span style={{
                            padding: '2px 8px', borderRadius: '8px', fontSize: '9px',
                            background: fb.subject === 'Bug Report' ? 'rgba(239,68,68,0.1)' : fb.subject === 'Feature Request' ? 'rgba(59,130,246,0.1)' : fb.subject === 'Business' ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.05)',
                            color: fb.subject === 'Bug Report' ? '#f87171' : fb.subject === 'Feature Request' ? '#60a5fa' : fb.subject === 'Business' ? '#fbbf24' : 'rgba(255,255,255,0.3)',
                            border: `1px solid ${fb.subject === 'Bug Report' ? 'rgba(239,68,68,0.2)' : fb.subject === 'Feature Request' ? 'rgba(59,130,246,0.2)' : fb.subject === 'Business' ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.1)'}`
                          }}>{fb.subject}</span>
                          {!fb.read && <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '9px', background: 'rgba(255,107,53,0.15)', color: '#FF6B35', border: '1px solid rgba(255,107,53,0.2)' }}>New</span>}
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fb.message}</p>
                        <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: '10px', marginTop: '4px' }}>{formatTimeAgo(fb.created_at)}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                        {expandedFeedback === fb.id ? <ChevronUp size={14} style={{ color: 'rgba(255,255,255,0.3)' }} /> : <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />}
                        <button onClick={e => { e.stopPropagation(); deleteFeedback(fb.id); }} style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', marginLeft: '4px' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    {expandedFeedback === fb.id && (
                      <div style={{ padding: '0 20px 20px' }}>
                        <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '16px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{fb.message}</p>
                        </div>
                        <a href={`mailto:${fb.email}?subject=Re: ${fb.subject}`} style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#FF6B35', textDecoration: 'none' }}>
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

// ============ GUIDE ============
const GuidePage = () => {
  const [openStep, setOpenStep] = useState<number | null>(0);
  const steps = [
    { title: '1. GitHub — APK Hosting (Free)', icon: '🐙', content: ['→ github.com → Create account → New repo "my-apps"', '→ Releases → Create release → Drag APK file', '→ Publish → Copy download URL → Paste in Admin Panel', '', '💡 GitHub = unlimited free APK hosting!'] },
    { title: '2. Supabase Storage Setup', icon: '🗄️', content: ['→ supabase.com → Go to Storage tab', '→ Create bucket "icons" → Set to public', '→ Create bucket "apks" → Set to public', '', '💡 Free tier: 1GB storage, enough to start!'] },
    { title: '3. Vercel — Deploy Website (Free)', icon: '🚀', content: ['→ vercel.com → Sign in with GitHub', '→ Import your website repo → Framework: Vite → Deploy', '→ Live at: sunrise-apps.vercel.app', '', '⚙️ Custom domain: Settings → Domains → Add sunriseapps.in', '  • Buy from GoDaddy (~₹500/yr)', '  • DNS: CNAME → cname.vercel-dns.com'] },
    { title: '4. Google AdSense (Earn Money 💰)', icon: '💰', content: ['→ adsense.google.com → Add website URL', '→ Paste verification code in index.html head', '', '📋 Requirements:', '  ✅ Privacy Policy  ✅ About  ✅ Contact', '  ✅ 15+ days old domain  ✅ Original content', '', '💡 Earnings: ₹100-₹2000/day based on traffic'] },
    { title: '5. Feedbacks Table Setup', icon: '📩', content: ['→ Supabase → SQL Editor → Run this SQL:', '', 'CREATE TABLE feedbacks (', '  id BIGSERIAL PRIMARY KEY,', '  name TEXT NOT NULL,', '  email TEXT NOT NULL,', "  subject TEXT DEFAULT 'General',", '  message TEXT NOT NULL,', '  read BOOLEAN DEFAULT FALSE,', '  created_at TIMESTAMPTZ DEFAULT NOW()', ');', '', '→ Enable RLS → Add insert policy for anon'] },
    { title: '6. Publish Your App', icon: '📲', content: ['→ Open Admin Panel → Login', '→ Click "+ Add App" → Fill all details', '→ App saved as Draft (hidden from website)', '→ Click eye icon → Publish (goes live!)', '→ Click again → Unpublish (hidden again)', '', '💡 Publish/unpublish anytime — no code changes!'] },
    { title: '7. Track Analytics 📊', icon: '📊', content: ['→ Google Analytics → Create property', '→ Add tracking code to index.html', '→ GitHub Releases → See download counts', '→ Admin Panel → Update download numbers manually'] },
    { title: '8. Instagram Strategy 📸', icon: '📸', content: ['→ Account: @SunRise_Apps', '→ Bio: "Free Viral Apps 📲 Link below 👇"', '', '🎬 Reel Ideas:', '  • "This app EXPOSES your partner 😱"', '  • "Your WiFi password is... 🔓"', '', '📊 Strategy: 2-3 Reels/day + trending audio', '🎯 10K followers = ₹500-1000/day from ads'] },
  ];

  return (
    <section style={{ paddingTop: '112px', paddingBottom: '80px', paddingLeft: '16px', paddingRight: '16px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <BookOpen style={{ color: '#FF6B35' }} size={32} />
            Complete <span style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Guide</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', marginTop: '8px' }}>From zero to earning money with apps</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {steps.map((step, i) => (
            <div key={i} style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden', transition: 'border-color 0.2s ease' }}>
              <button onClick={() => setOpenStep(openStep === i ? null : i)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: 'white' }}>
                <span style={{ fontSize: '24px' }}>{step.icon}</span>
                <span style={{ flex: 1, fontWeight: 600, fontSize: '14px' }}>{step.title}</span>
                <ChevronRight size={18} style={{ color: openStep === i ? '#FF6B35' : 'rgba(255,255,255,0.2)', transition: 'transform 0.3s ease', transform: openStep === i ? 'rotate(90deg)' : 'none' }} />
              </button>
              {openStep === i && (
                <div style={{ padding: '0 20px 20px' }}>
                  <div style={{ background: 'rgba(0,0,0,0.5)', borderRadius: '16px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)', fontFamily: 'monospace' }}>
                    {step.content.map((line, j) => (
                      <p key={j} style={{
                        fontSize: '13px', lineHeight: 1.7,
                        height: line === '' ? '12px' : 'auto',
                        color: line.startsWith('💡') || line.startsWith('🎯') ? '#FF6B35' : line.startsWith('📋') || line.startsWith('🎬') || line.startsWith('📊') ? '#FFB800' : line.startsWith('⚙️') ? '#60a5fa' : line.startsWith('→') ? 'rgba(255,255,255,0.55)' : line.startsWith('  ✅') || line.startsWith('  •') ? '#34d399' : line.includes('CREATE') || line.includes(');') ? '#fbbf24' : line.includes('PRIMARY') || line.includes('NOT NULL') || line.includes('DEFAULT') ? '#67e8f9' : 'rgba(255,255,255,0.4)',
                        fontWeight: line.startsWith('💡') || line.startsWith('🎯') || line.startsWith('📋') || line.startsWith('🎬') ? 600 : 400,
                        fontFamily: line.includes('CREATE') || line.includes('PRIMARY') || line.includes('NOT NULL') || line.includes('DEFAULT') || line.includes(');') || line.includes('BIGSERIAL') || line.includes('TEXT') || line.includes('BOOLEAN') || line.includes('TIMESTAMPTZ') ? 'monospace' : 'inherit',
                        paddingLeft: line.startsWith('  ') ? '8px' : '0'
                      }}>{line}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Checklist */}
        <div style={{ marginTop: '48px', background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.2)', borderRadius: '24px', padding: '24px', textAlign: 'center' }}>
          <p style={{ color: '#FF6B35', fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>🎯 Launch Checklist</p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginBottom: '24px' }}>Track your progress</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', textAlign: 'left', maxWidth: '500px', margin: '0 auto' }}>
            {['GitHub account created', 'APK uploaded', 'Supabase project setup', 'Tables created', 'Storage buckets created', 'Deploy on Vercel', 'Instagram @SunRise_Apps', 'Apply for AdSense', 'First Reel posted', 'First app published'].map((item, i) => (
              <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                <input type="checkbox" style={{ accentColor: '#FF6B35', width: '16px', height: '16px' }} />{item}
              </label>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ============ ABOUT ============
const AboutSection = () => (
  <section id="about-section" style={{ padding: '80px 16px' }}>
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '32px', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(255,107,53,0.1), transparent 70%)', filter: 'blur(80px)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', position: 'relative', zIndex: 10 }}>
          <div style={{
            width: '120px', height: '120px', background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
            borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '48px', boxShadow: '0 16px 40px rgba(255,107,53,0.3)', flexShrink: 0
          }}>🌅</div>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 700, color: 'white', marginBottom: '16px' }}>
              About <span style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SunRise Apps</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', marginBottom: '12px', lineHeight: 1.7 }}>Independent Android developer from India 🇮🇳. Building viral utility apps that solve real problems.</p>
            <p style={{ color: 'rgba(255,255,255,0.45)', marginBottom: '24px', lineHeight: 1.7 }}>Every sunrise brings new possibilities — free tools for everyone.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px' }}>
              <a href="https://instagram.com/SunRise_Apps" target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.2)', borderRadius: '16px', color: '#f472b6', fontSize: '14px', textDecoration: 'none' }}>📸 @SunRise_Apps</a>
              <a href="mailto:thesunrisecode@gmail.com" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: 'rgba(255,255,255,0.5)', fontSize: '14px', textDecoration: 'none' }}><Mail size={16} /> Email</a>
              <a href="https://sunriseapps.in" target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.2)', borderRadius: '16px', color: '#FF6B35', fontSize: '14px', textDecoration: 'none' }}><Globe size={16} /> Website</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ============ PRIVACY ============
const PrivacySection = () => (
  <section style={{ padding: '80px 16px' }}>
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '28px', fontWeight: 700, color: 'white', marginBottom: '32px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
        <Shield style={{ color: '#FF6B35' }} size={28} />
        Privacy <span style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Policy</span>
      </h2>
      <div style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '24px' }}>
        {[
          { t: '1. Information We Collect', d: 'Minimal data for functionality. Contact form data stored securely.' },
          { t: '2. Advertisements', d: 'Google AdSense/AdMob may collect device info. Opt out in settings.' },
          { t: '3. Data Security', d: 'HTTPS encryption. No unnecessary data collection.' },
          { t: '4. Third-Party Services', d: 'Google, Supabase. Their policies apply.' },
          { t: '5. Children', d: 'Not directed at children under 13.' },
          { t: '6. Contact', d: 'thesunrisecode@gmail.com' },
        ].map((item, i) => (
          <div key={i} style={{ marginBottom: i < 5 ? '24px' : 0 }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#FF6B35', marginBottom: '8px' }}>{item.t}</h3>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', lineHeight: 1.7 }}>{item.d}</p>
          </div>
        ))}
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: '12px', textAlign: 'center' }}>Last updated: January 2025</p>
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
    if (!formData.name.trim() || !formData.message.trim()) { addToast('❌ Fill all fields', 'error'); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('feedbacks').insert([{ name: formData.name.trim(), email: formData.email.trim(), subject: formData.subject, message: formData.message.trim(), read: false }]);
      if (error) throw error;
      setSent(true);
      setFormData({ name: '', email: '', subject: 'General', message: '' });
    } catch (err: any) { addToast(`❌ ${err.message}`, 'error'); }
    finally { setSubmitting(false); }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px', padding: '12px 16px', color: 'white', fontSize: '14px', outline: 'none'
  };

  return (
    <section style={{ padding: '80px 16px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 700, color: 'white', marginBottom: '32px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <Mail style={{ color: '#FF6B35' }} size={28} />
          Contact <span style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Us</span>
        </h2>
        <div style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '24px' }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ width: '80px', height: '80px', margin: '0 auto 20px', borderRadius: '24px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle style={{ color: '#34d399' }} size={36} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>Message Sent!</h3>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '24px' }}>We'll get back to you soon.</p>
              <button onClick={() => setSent(false)} style={{ padding: '10px 24px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: 'rgba(255,255,255,0.5)', fontSize: '14px', cursor: 'pointer' }}>Send Another</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginBottom: '6px' }}>Name *</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} placeholder="Your name" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginBottom: '6px' }}>Email *</label>
                  <input type="email" required value={formData.email} onChange={e => setFormData(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" style={inputStyle} />
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginBottom: '6px' }}>Subject</label>
                <select value={formData.subject} onChange={e => setFormData(f => ({ ...f, subject: e.target.value }))} style={inputStyle}>
                  <option style={{ background: '#111' }}>General</option>
                  <option style={{ background: '#111' }}>Bug Report</option>
                  <option style={{ background: '#111' }}>Feature Request</option>
                  <option style={{ background: '#111' }}>Business</option>
                </select>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginBottom: '6px' }}>Message *</label>
                <textarea required rows={4} value={formData.message} onChange={e => setFormData(f => ({ ...f, message: e.target.value }))} placeholder="Your message..." style={{ ...inputStyle, resize: 'none' }} />
              </div>
              <button type="submit" disabled={submitting} style={{
                width: '100%', padding: '16px', background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
                color: 'black', fontWeight: 700, borderRadius: '16px', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                opacity: submitting ? 0.5 : 1, fontSize: '14px'
              }}>
                {submitting ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Mail size={18} />}
                {submitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}

          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', textAlign: 'center' }}>
            <a href="mailto:thesunrisecode@gmail.com" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none', fontSize: '12px', padding: '12px', borderRadius: '16px', transition: 'background 0.2s ease' }}>
              <Mail size={20} /><span>Email</span>
            </a>
            <a href="https://instagram.com/SunRise_Apps" target="_blank" rel="noreferrer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none', fontSize: '12px', padding: '12px', borderRadius: '16px' }}>
              <span style={{ fontSize: '20px' }}>📸</span><span>Instagram</span>
            </a>
            <a href="https://sunriseapps.in" target="_blank" rel="noreferrer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none', fontSize: '12px', padding: '12px', borderRadius: '16px' }}>
              <Globe size={20} /><span>Website</span>
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => { setSession(session); });
    return () => subscription.unsubscribe();
  }, []);

  const fetchApps = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.from('apps').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setApps(data || []);
    } catch (err: any) { addToast(`❌ ${err.message}`, 'error'); }
    finally { setRefreshing(false); setLoading(false); }
  }, [addToast]);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  useEffect(() => {
    const ch = supabase.channel('apps-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'apps' }, () => { fetchApps(); }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchApps]);

  const handleLogout = async () => { await supabase.auth.signOut(); setPage('home'); addToast('👋 Logged out', 'info'); };
  const handleDownload = useCallback((app: AppData) => { if (unlockedApps.includes(app.id)) window.open(app.apk_link, '_blank'); else setModalApp(app); }, [unlockedApps]);
  const handleUnlock = useCallback(() => { if (modalApp) { setUnlockedApps(p => [...p, modalApp.id]); window.open(modalApp.apk_link, '_blank'); setModalApp(null); } }, [modalApp]);
  const navigate = (p: string) => { setPage(p); setMobileMenu(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const navItems = [
    { id: 'home', label: 'Home', icon: <Sun size={15} /> },
    { id: 'about', label: 'About', icon: <Users size={15} /> },
    { id: 'guide', label: 'Guide', icon: <BookOpen size={15} /> },
    { id: 'privacy', label: 'Privacy', icon: <Shield size={15} /> },
    { id: 'contact', label: 'Contact', icon: <Mail size={15} /> },
  ];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #FF6B35, #FFB800)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 30px rgba(255,107,53,0.3)' }}>
            <Sun size={28} style={{ color: 'black' }} />
          </div>
          <Loader2 style={{ color: '#FF6B35', animation: 'spin 1s linear infinite' }} size={28} />
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Loading SunRise Apps...</p>
        </div>
      </div>
    );
  }

  const navBtnStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '8px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: 500,
    cursor: 'pointer', border: 'none', transition: 'all 0.2s ease',
    background: active ? 'rgba(255,107,53,0.1)' : 'transparent',
    color: active ? '#FF6B35' : 'rgba(255,255,255,0.35)'
  });

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: 'white' }}>

      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
        background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
            <button onClick={() => navigate('home')} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', cursor: 'pointer', color: 'white' }}>
              <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #FF6B35, #FFB800)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(255,107,53,0.2)' }}>
                <Sun size={18} style={{ color: 'black' }} />
              </div>
              <div>
                <span style={{ fontWeight: 700 }}>Sun<span style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Rise</span></span>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', marginLeft: '4px' }}>Apps</span>
              </div>
            </button>

            {/* Desktop Nav */}
            <div style={{ display: 'none' }} className="md-flex">
              {navItems.map(item => (
                <button key={item.id} onClick={() => navigate(item.id)} style={navBtnStyle(page === item.id)}>
                  {item.icon}{item.label}
                </button>
              ))}
              {session && <button onClick={() => navigate('admin')} style={navBtnStyle(page === 'admin')}><Settings size={15} /> Admin</button>}
            </div>

            {/* Mobile Menu Button */}
            <button onClick={() => setMobileMenu(!mobileMenu)} style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer' }}>
              {mobileMenu ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenu && (
            <div style={{ paddingBottom: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '12px' }}>
              {navItems.map(item => (
                <button key={item.id} onClick={() => navigate(item.id)} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  width: '100%', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: 500,
                  textAlign: 'left', background: page === item.id ? 'rgba(255,107,53,0.1)' : 'transparent',
                  color: page === item.id ? '#FF6B35' : 'rgba(255,255,255,0.4)',
                  border: 'none', cursor: 'pointer'
                }}>
                  {item.icon}{item.label}
                </button>
              ))}
              {session && (
                <button onClick={() => navigate('admin')} style={{
                  display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
                  padding: '12px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: 500,
                  textAlign: 'left', color: '#FF6B35', border: 'none', cursor: 'pointer', background: 'none'
                }}>
                  <Settings size={15} /> Admin Panel
                </button>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* PAGES */}
      {page === 'home' && (<><HomePage apps={apps} onDownload={handleDownload} unlockedApps={unlockedApps} loading={loading || refreshing} /><AboutSection /><PrivacySection /><ContactSection addToast={addToast} /></>)}
      {page === 'admin' && (session ? <AdminPage apps={apps} onLogout={handleLogout} session={session} refreshApps={fetchApps} isRefreshing={refreshing} addToast={addToast} /> : <AdminLogin onLogin={() => setPage('admin')} />)}
      {page === 'guide' && <GuidePage />}
      {page === 'about' && <AboutSection />}
      {page === 'privacy' && <PrivacySection />}
      {page === 'contact' && <ContactSection addToast={addToast} />}

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '48px 16px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
          <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #FF6B35, #FFB800)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sun size={16} style={{ color: 'black' }} />
          </div>
          <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>SunRise Apps</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px', marginBottom: '8px' }}>Free viral Android apps — always updated 🚀</p>
        <p style={{ color: 'rgba(255,255,255,0.1)', fontSize: '10px' }}>© 2025 SunRise Apps</p>
      </footer>

      {/* OVERLAYS */}
      <LockModal app={modalApp} onClose={() => setModalApp(null)} onUnlock={handleUnlock} />
      <ScrollToTop />
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}