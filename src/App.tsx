import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabaseClient.ts';
import { Session } from '@supabase/supabase-js';
import {
  Sun, Download, Share2, Lock, Shield, Mail,
  Globe, ChevronDown, ChevronRight, Menu, X, Star, Users, Smartphone,
  Settings, Plus, Trash2, Edit3, Save, Eye, EyeOff, BookOpen,
  ArrowUp, Search, Filter, LogOut, KeyRound, AlertTriangle,
  ToggleLeft, ToggleRight, RefreshCw, Loader2, Image as ImageIcon,
  Upload, MessageSquare, CheckCircle, ChevronUp, Inbox,
  Sparkles, Zap, TrendingUp, Heart, Package, FileImage,
  Bell, BarChart3, Layers
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

interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

// ============ HELPERS ============
const formatDownloads = (num: string) => {
  const n = parseInt(num);
  if (isNaN(n) || n === 0) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
};

const getBadgeGradient = (badge: string): string => {
  switch (badge) {
    case 'Viral': return 'linear-gradient(135deg, #f43f5e, #ec4899)';
    case 'PRO': return 'linear-gradient(135deg, #fbbf24, #f97316)';
    case 'New': return 'linear-gradient(135deg, #34d399, #14b8a6)';
    default: return 'linear-gradient(135deg, #6b7280, #4b5563)';
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

const C = {
  orange: '#FF6B35',
  gold: '#FFB800',
  bg: '#050505',
  card: 'rgba(255,255,255,0.03)',
  border: 'rgba(255,255,255,0.08)',
  text: 'rgba(255,255,255,0.4)',
  textMuted: 'rgba(255,255,255,0.2)',
  green: '#34d399',
  amber: '#fbbf24',
  blue: '#60a5fa',
  red: '#f87171',
  purple: '#a855f7',
};

// ============ GLOBAL STYLES ============
const GlobalStyles = () => (
  <style>{`
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: ${C.bg}; color: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    input, textarea, select { font-family: inherit; }
    input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.15); }
    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: ${C.bg}; }
    ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 10px; }
    ::-webkit-scrollbar-thumb:hover { background: ${C.orange}; }
    ::selection { background: rgba(255,107,53,0.3); color: white; }
    @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
    @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
    @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
    @keyframes slideDown { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
    .spin { animation: spin 1s linear infinite; }
    .pulse { animation: pulse 2s ease-in-out infinite; }
    .fade-in { animation: fadeIn 0.3s ease forwards; }
    .slide-down { animation: slideDown 0.3s ease forwards; }
    @media (min-width: 768px) { .desktop-nav { display: flex !important; } .mobile-only { display: none !important; } }
    @media (max-width: 767px) { .desktop-nav { display: none !important; } }
    .nav-btn:hover { background: rgba(255,255,255,0.06) !important; color: white !important; }
    .card-hover:hover { border-color: rgba(255,107,53,0.3) !important; transform: translateY(-2px); box-shadow: 0 12px 40px rgba(255,107,53,0.08); }
    .btn-hover:hover { opacity: 0.88; transform: scale(1.02); }
    .icon-btn:hover { opacity: 0.8; }
    input:focus, textarea:focus, select:focus { border-color: rgba(255,107,53,0.5) !important; outline: none; box-shadow: 0 0 0 3px rgba(255,107,53,0.08); }
  `}</style>
);

// ============ TOAST SYSTEM ============
const Toast = ({ toasts, removeToast }: { toasts: ToastItem[]; removeToast: (id: number) => void }) => (
  <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 360, padding: '0 16px', pointerEvents: 'none' }}>
    {toasts.map(t => (
      <div key={t.id} className="fade-in" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        padding: '12px 16px', borderRadius: 14, fontSize: 13, fontWeight: 500,
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', pointerEvents: 'all',
        background: t.type === 'success' ? 'rgba(6,78,59,0.95)' : t.type === 'error' ? 'rgba(127,29,29,0.95)' : 'rgba(20,20,20,0.97)',
        border: `1px solid ${t.type === 'success' ? 'rgba(52,211,153,0.3)' : t.type === 'error' ? 'rgba(248,113,113,0.3)' : 'rgba(255,107,53,0.3)'}`,
        color: t.type === 'success' ? C.green : t.type === 'error' ? C.red : '#fdba74',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
      }}>
        <span>{t.message}</span>
        <button onClick={() => removeToast(t.id)} style={{ opacity: 0.5, cursor: 'pointer', background: 'none', border: 'none', color: 'inherit', padding: 0, flexShrink: 0, lineHeight: 1 }}><X size={13} /></button>
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
    const fn = () => setShow(window.scrollY > 500);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);
  if (!show) return null;
  return (
    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="icon-btn" style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 50, width: 46, height: 46,
      borderRadius: 14, background: 'linear-gradient(135deg, #FF6B35, #FFB800)',
      color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 4px 20px rgba(255,107,53,0.35)', border: 'none', cursor: 'pointer', transition: 'all 0.2s'
    }}>
      <ArrowUp size={19} />
    </button>
  );
};

// ============ AD BANNER ============
const AdBanner = ({ variant = 'horizontal' }: { variant?: 'horizontal' | 'rectangle' }) => (
  <div style={{
    border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 18,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'rgba(255,255,255,0.15)', height: variant === 'rectangle' ? 220 : 72,
    background: 'rgba(255,255,255,0.01)'
  }}>
    <div style={{ textAlign: 'center', fontSize: 12 }}>
      <p>📢 Google AdSense</p>
      <p style={{ fontSize: 10, marginTop: 3, opacity: 0.5 }}>Place your ad unit here</p>
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
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} className="fade-in" style={{ background: 'linear-gradient(135deg, #161616, #0d0d0d)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: '36px 28px', maxWidth: 360, width: '100%', position: 'relative', boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 76, height: 76, margin: '0 auto 20px', borderRadius: 22, background: 'rgba(255,107,53,0.12)', border: '1px solid rgba(255,107,53,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock style={{ color: C.orange }} size={30} />
          </div>
          <h3 style={{ fontSize: 22, fontWeight: 700, color: 'white', marginBottom: 6 }}>Unlock Download</h3>
          <p style={{ color: C.text, fontSize: 13, marginBottom: 28 }}>{app.name}</p>
          {!watching ? (
            <button onClick={() => setWatching(true)} className="btn-hover" style={{ width: '100%', padding: '15px', borderRadius: 14, background: 'linear-gradient(135deg, #FF6B35, #FFB800)', color: 'black', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
              <Eye size={18} /> Watch Ad to Unlock
            </button>
          ) : (
            <div style={{ background: 'rgba(255,107,53,0.06)', borderRadius: 14, padding: '20px 16px', border: '1px solid rgba(255,107,53,0.2)' }}>
              <p className="pulse" style={{ color: C.orange, fontSize: 13, fontWeight: 600, marginBottom: 14 }}>⏳ Ad playing...</p>
              <div style={{ width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: 999, height: 8, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'linear-gradient(90deg, #FF6B35, #FFB800)', borderRadius: 999, transition: 'width 1s linear', width: `${((5 - countdown) / 5) * 100}%` }} />
              </div>
              <p style={{ color: C.textMuted, fontSize: 12, marginTop: 10 }}>{countdown}s remaining</p>
            </div>
          )}
          <p style={{ color: 'rgba(255,255,255,0.1)', fontSize: 10, marginTop: 16 }}>Ad placeholder — integrate AdMob/AdSense here</p>
        </div>
      </div>
    </div>
  );
};

// ============ FILE UPLOAD ============
const FileUpload = ({
  label, accept, bucket, folder, onUploadComplete, currentUrl, addToast, hint
}: {
  label: string; accept: string; bucket: string; folder: string;
  onUploadComplete: (url: string) => void; currentUrl?: string;
  addToast: (msg: string, type: ToastItem['type']) => void;
  hint?: string;
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const doUpload = async (file: File) => {
    const isApk = accept.includes('apk');
    const maxSize = isApk ? 100 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) { addToast(`❌ Max ${isApk ? '100MB' : '5MB'} allowed`, 'error'); return; }
    setUploading(true); setProgress(10);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      setProgress(35);
      const { error: upErr } = await supabase.storage.from(bucket).upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (upErr) throw upErr;
      setProgress(80);
      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      if (!data?.publicUrl) throw new Error('Could not get URL');
      setProgress(100);
      onUploadComplete(data.publicUrl);
      addToast(`✅ ${isApk ? 'APK' : 'Image'} uploaded!`, 'success');
    } catch (err: any) {
      addToast(`❌ Upload failed: ${err.message}`, 'error');
    } finally {
      setTimeout(() => { setUploading(false); setProgress(0); }, 700);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await doUpload(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await doUpload(file);
  };

  const shortName = (url: string) => {
    const name = url.split('/').pop() || '';
    return name.length > 32 ? name.slice(0, 32) + '...' : name;
  };

  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 6, fontWeight: 500 }}>{label}</label>
      {hint && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginBottom: 8 }}>{hint}</p>}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          border: `1.5px dashed ${dragOver ? C.orange : currentUrl ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.12)'}`,
          borderRadius: 14, padding: '14px 12px', display: 'flex', alignItems: 'center', gap: 12,
          cursor: uploading ? 'wait' : 'pointer', background: dragOver ? 'rgba(255,107,53,0.04)' : currentUrl ? 'rgba(52,211,153,0.03)' : 'rgba(255,255,255,0.02)',
          transition: 'all 0.2s ease'
        }}
      >
        <input ref={inputRef} type="file" accept={accept} onChange={handleFile} style={{ display: 'none' }} />
        <div style={{ width: 38, height: 38, borderRadius: 10, background: currentUrl ? 'rgba(52,211,153,0.12)' : 'rgba(255,107,53,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${currentUrl ? 'rgba(52,211,153,0.2)' : 'rgba(255,107,53,0.15)'}` }}>
          {uploading ? <Loader2 size={15} style={{ color: C.orange }} className="spin" /> : currentUrl ? <CheckCircle size={15} style={{ color: C.green }} /> : <Upload size={15} style={{ color: C.orange }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {currentUrl
            ? <p style={{ fontSize: 12, color: C.green, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>✅ {shortName(currentUrl)}</p>
            : <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{uploading ? `Uploading ${progress}%...` : 'Click or drag & drop file here'}</p>
          }
          {uploading && (
            <div style={{ marginTop: 6, width: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: 999, height: 4 }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg, #FF6B35, #FFB800)', borderRadius: 999, transition: 'width 0.4s ease', width: `${progress}%` }} />
            </div>
          )}
        </div>
        {currentUrl && !uploading && (
          <button
            onClick={e => { e.stopPropagation(); onUploadComplete(''); }}
            style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: C.red, borderRadius: 8, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}
          >Clear</button>
        )}
      </div>
    </div>
  );
};

// ============ APP CARD ============
const AppCard = ({ app, onDownload, unlocked }: { app: AppData; onDownload: (a: AppData) => void; unlocked: boolean }) => {
  const handleShare = () => {
    const text = `🌅 "${app.name}" — Free on SunRise Apps!\n📲 ${window.location.href}`;
    if (navigator.share) navigator.share({ title: app.name, text, url: window.location.href }).catch(() => { });
    else navigator.clipboard.writeText(text).then(() => alert('Link copied!'));
  };
  const isCS = !app.apk_link || app.apk_link === '#';
  const icon = app.icon_url
    ? <img src={app.icon_url} alt={app.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 14 }} />
    : app.icon ? <span style={{ fontSize: 26 }}>{app.icon}</span>
      : <ImageIcon size={22} style={{ color: 'rgba(255,255,255,0.15)' }} />;

  return (
    <div className="card-hover" style={{
      position: 'relative', background: 'linear-gradient(145deg, rgba(255,255,255,0.045), rgba(255,255,255,0.01))',
      border: '1px solid rgba(255,255,255,0.07)', borderRadius: 22, padding: '20px 18px',
      transition: 'all 0.35s ease', overflow: 'visible'
    }}>
      <span style={{ ...{ position: 'absolute', top: -10, right: 14, padding: '3px 11px', borderRadius: 999, fontSize: 10, fontWeight: 700, color: 'white', letterSpacing: 0.3 }, background: getBadgeGradient(app.badge), boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
        {app.badge === 'Viral' ? '🔥 ' : app.badge === 'PRO' ? '⭐ ' : '✨ '}{app.badge}
      </span>
      <div style={{ display: 'flex', gap: 14, marginBottom: 14, alignItems: 'flex-start' }}>
        <div style={{ width: 54, height: 54, flexShrink: 0, background: 'rgba(255,107,53,0.07)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
          <h3 style={{ fontWeight: 700, color: 'white', fontSize: 15, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.name}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 5, fontSize: 11, color: 'rgba(255,255,255,0.28)' }}>
            <span style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 7px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>v{app.version}</span>
            <span>·</span><span>{app.size}</span>
          </div>
        </div>
      </div>
      <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13, lineHeight: 1.65, marginBottom: 14, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{app.description}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 15, fontSize: 11, color: 'rgba(255,255,255,0.22)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Download size={10} /> {formatDownloads(app.downloads)}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Star size={10} style={{ color: '#fbbf24' }} /> {app.rating}</span>
        <span style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.12)', padding: '1px 8px', borderRadius: 7, color: 'rgba(168,85,247,0.7)', fontSize: 10 }}>{app.category}</span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => !isCS && onDownload(app)} disabled={isCS} className={isCS ? '' : 'btn-hover'} style={{
          flex: 1, padding: '11px', borderRadius: 13, fontWeight: 600, fontSize: 13,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          border: 'none', cursor: isCS ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
          background: isCS ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #FF6B35, #FFB800)',
          color: isCS ? 'rgba(255,255,255,0.18)' : 'black',
          boxShadow: isCS ? 'none' : '0 4px 16px rgba(255,107,53,0.2)'
        }}>
          {isCS ? 'Coming Soon' : unlocked ? <><Download size={14} /> Download</> : <><Lock size={14} /> Get APK</>}
        </button>
        <button onClick={handleShare} className="icon-btn" style={{ width: 42, height: 42, flexShrink: 0, borderRadius: 13, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
          <Share2 size={14} />
        </button>
      </div>
    </div>
  );
};

// ============ HOME PAGE ============
const HomePage = ({ apps, onDownload, unlockedApps, loading }: { apps: AppData[]; onDownload: (a: AppData) => void; unlockedApps: number[]; loading: boolean }) => {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All');
  const pub = apps.filter(a => a.published);
  const cats = ['All', ...Array.from(new Set(pub.map(a => a.category).filter(Boolean)))];
  const filtered = pub.filter(a => (a.name.toLowerCase().includes(search.toLowerCase()) || a.description?.toLowerCase().includes(search.toLowerCase())) && (cat === 'All' || a.category === cat));
  const totalDL = pub.reduce((s, a) => s + (parseInt(a.downloads) || 0), 0);

  return (
    <>
      {/* HERO */}
      <section style={{ padding: '110px 16px 90px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,107,53,0.055) 0%, transparent 60%)' }} />
        <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: 700, height: 500, background: 'radial-gradient(ellipse, rgba(255,107,53,0.09) 0%, transparent 65%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 120, right: '5%', width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,184,0,0.5)' }} className="pulse" />
        <div style={{ position: 'absolute', top: 200, left: '8%', width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,107,53,0.5)' }} className="pulse" />
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.18)', borderRadius: 999, padding: '9px 18px', marginBottom: 30, fontSize: 13, color: 'rgba(255,150,80,0.9)' }}>
            <Sparkles size={13} style={{ color: C.orange }} />Your Trusted App Source<Zap size={11} style={{ color: C.gold }} />
          </div>
          <h1 style={{ fontSize: 'clamp(44px, 9vw, 92px)', fontWeight: 900, lineHeight: 1.06, marginBottom: 22, letterSpacing: -2 }}>
            <span style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #FFB800 50%, #FCD34D 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SunRise</span><br />
            <span style={{ color: 'white' }}>Apps</span>
          </h1>
          <p style={{ fontSize: 'clamp(15px, 2.8vw, 19px)', color: 'rgba(255,255,255,0.42)', maxWidth: 480, margin: '0 auto 44px', lineHeight: 1.75 }}>
            Get the latest <span style={{ color: C.orange, fontWeight: 600 }}>viral Android tools</span> — free, safe & always updated 🚀
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', marginBottom: 60 }}>
            <button onClick={() => document.getElementById('apps')?.scrollIntoView({ behavior: 'smooth' })} className="btn-hover" style={{ padding: '14px 36px', background: 'linear-gradient(135deg, #FF6B35, #FFB800)', color: 'black', fontWeight: 700, fontSize: 15, borderRadius: 14, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 6px 24px rgba(255,107,53,0.28)', transition: 'all 0.2s' }}>
              <Download size={17} /> Explore Apps
            </button>
            <button onClick={() => document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth' })} style={{ padding: '14px 28px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)', fontWeight: 500, fontSize: 15, borderRadius: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}>
              <Heart size={15} /> Learn More
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', maxWidth: 440, margin: '0 auto', gap: 14 }}>
            {[
              { v: formatDownloads(totalDL.toString()) + '+', l: 'Downloads', ic: <Download size={17} />, c: C.orange, bg: 'rgba(255,107,53,0.1)', bc: 'rgba(255,107,53,0.18)' },
              { v: pub.filter(a => a.apk_link && a.apk_link !== '#').length + '+', l: 'Apps Live', ic: <Smartphone size={17} />, c: C.blue, bg: 'rgba(96,165,250,0.1)', bc: 'rgba(96,165,250,0.18)' },
              { v: '4.9★', l: 'Avg Rating', ic: <Star size={17} />, c: C.purple, bg: 'rgba(168,85,247,0.1)', bc: 'rgba(168,85,247,0.18)' },
            ].map((s, i) => (
              <div key={i} style={{ background: s.bg, border: `1px solid ${s.bc}`, borderRadius: 15, padding: '18px 12px', textAlign: 'center' }}>
                <div style={{ color: s.c, marginBottom: 7, display: 'flex', justifyContent: 'center' }}>{s.ic}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'white', lineHeight: 1 }}>{s.v}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', marginTop: 5, letterSpacing: 0.2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 860, margin: '0 auto 28px', padding: '0 16px' }}><AdBanner /></div>

      {/* APP GRID */}
      <section id="apps" style={{ padding: '60px 16px 80px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(168,85,247,0.09)', border: '1px solid rgba(168,85,247,0.18)', borderRadius: 999, padding: '5px 14px', marginBottom: 14, fontSize: 11, color: 'rgba(168,85,247,0.8)' }}>
              <TrendingUp size={11} /> Trending Now
            </div>
            <h2 style={{ fontSize: 'clamp(26px, 5vw, 44px)', fontWeight: 800, color: 'white', marginBottom: 12 }}>
              App <span style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Collection</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: 15 }}>All apps free — watch a short ad to download</p>
          </div>

          {/* Search & Filter */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 36, maxWidth: 560, margin: '0 auto 36px' }}>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.18)', pointerEvents: 'none' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search apps..." style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 13, padding: '12px 14px 12px 40px', color: 'white', fontSize: 14, transition: 'all 0.2s' }} />
            </div>
            <div style={{ position: 'relative' }}>
              <Filter size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.18)', pointerEvents: 'none' }} />
              <select value={cat} onChange={e => setCat(e.target.value)} style={{ appearance: 'none', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 13, padding: '12px 36px 12px 32px', color: 'white', fontSize: 14, cursor: 'pointer', transition: 'all 0.2s' }}>
                {cats.map(c => <option key={c} value={c} style={{ background: '#111' }}>{c}</option>)}
              </select>
              <ChevronDown size={13} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.18)', pointerEvents: 'none' }} />
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 20 }}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="pulse" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 22, height: 240 }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '72px 0' }}>
              <div style={{ width: 72, height: 72, margin: '0 auto 18px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Search size={28} style={{ color: 'rgba(255,255,255,0.12)' }} />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 17, fontWeight: 500 }}>No apps found</p>
              <p style={{ color: 'rgba(255,255,255,0.12)', fontSize: 13, marginTop: 6 }}>Try a different search term</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 20 }}>
              {filtered.map(app => <AppCard key={app.id} app={app} onDownload={onDownload} unlocked={unlockedApps.includes(app.id)} />)}
            </div>
          )}
        </div>
      </section>
      <div style={{ maxWidth: 760, margin: '0 auto 60px', padding: '0 16px' }}><AdBanner variant="rectangle" /></div>
    </>
  );
};

// ============ ADMIN LOGIN ============
const AdminLogin = ({ onLogin }: { onLogin: () => void }) => {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [showPw, setShowPw] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setErr('');
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    if (error) { setErr(error.message); setLoading(false); } else onLogin();
  };

  const iS: React.CSSProperties = { width: '100%', background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 13, padding: '13px 15px', color: 'white', fontSize: 14, transition: 'all 0.2s' };

  return (
    <section style={{ padding: '100px 16px 80px', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <div style={{ maxWidth: 400, margin: '0 auto', width: '100%' }}>
        <div className="fade-in" style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.045), rgba(255,255,255,0.01))', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 22, padding: '36px 28px', textAlign: 'center' }}>
          <div style={{ width: 76, height: 76, margin: '0 auto 22px', borderRadius: 22, background: 'rgba(255,107,53,0.12)', border: '1px solid rgba(255,107,53,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <KeyRound style={{ color: C.orange }} size={30} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'white', marginBottom: 6 }}>Admin Access</h2>
          <p style={{ color: C.text, fontSize: 13, marginBottom: 28 }}>Sign in with your Supabase credentials</p>
          {err && (
            <div style={{ marginBottom: 18, padding: '11px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, color: C.red, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' }}>
              <AlertTriangle size={13} style={{ flexShrink: 0 }} />{err}
            </div>
          )}
          <form onSubmit={handle} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.32)', marginBottom: 6, fontWeight: 500, letterSpacing: 0.3 }}>EMAIL</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@example.com" required style={iS} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.32)', marginBottom: 6, fontWeight: 500, letterSpacing: 0.3 }}>PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••••" required style={{ ...iS, paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.28)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, lineHeight: 1 }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-hover" style={{ padding: '13px', background: 'linear-gradient(135deg, #FF6B35, #FFB800)', color: 'black', fontWeight: 700, borderRadius: 13, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.55 : 1, fontSize: 14, transition: 'all 0.2s', marginTop: 4 }}>
              {loading ? <Loader2 size={17} className="spin" /> : <Lock size={17} />}
              {loading ? 'Signing in...' : 'Unlock Admin Panel'}
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
  const [tab, setTab] = useState<'apps' | 'feedbacks'>('apps');
  const [editId, setEditId] = useState<number | null>(null);
  const blank: Partial<AppData> = { name: '', version: '1.0.0', description: '', apk_link: '', badge: 'New', icon: '📱', icon_url: '', downloads: '0', size: '0 MB', category: 'Tools', rating: '4.5', updated: new Date().toISOString().slice(0, 10), published: false };
  const [form, setForm] = useState<Partial<AppData>>(blank);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [saving, setSaving] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [fbLoading, setFbLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const [expandFb, setExpandFb] = useState<number | null>(null);

  const fetchFb = useCallback(async () => {
    setFbLoading(true);
    try {
      const { data, error } = await supabase.from('feedbacks').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setFeedbacks(data || []);
      setUnread((data || []).filter((f: Feedback) => !f.read).length);
    } catch (e: any) { addToast(`❌ ${e.message}`, 'error'); }
    finally { setFbLoading(false); }
  }, [addToast]);

  useEffect(() => { fetchFb(); }, [fetchFb]);

  useEffect(() => {
    const ch = supabase.channel('fb-live').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feedbacks' }, p => {
      setFeedbacks(prev => [p.new as Feedback, ...prev]);
      setUnread(c => c + 1);
      addToast('📩 New feedback received!', 'info');
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [addToast]);

  const markRead = async (id: number) => {
    const { error } = await supabase.from('feedbacks').update({ read: true }).eq('id', id);
    if (!error) { setFeedbacks(p => p.map(f => f.id === id ? { ...f, read: true } : f)); setUnread(c => Math.max(0, c - 1)); }
  };

  const deleteFb = async (id: number) => {
    if (!confirm('Delete this feedback?')) return;
    const { error } = await supabase.from('feedbacks').delete().eq('id', id);
    if (error) addToast(`❌ ${error.message}`, 'error');
    else { setFeedbacks(p => p.filter(f => f.id !== id)); addToast('🗑️ Deleted', 'success'); }
  };

  const openAdd = () => { setForm({ ...blank }); setEditId(null); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const openEdit = (a: AppData) => { setForm({ ...a }); setEditId(a.id); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const closeForm = () => { setShowForm(false); setEditId(null); };

  const validate = () => {
    if (!form.name?.trim()) { addToast('❌ App name is required', 'error'); return false; }
    if (form.apk_link && form.apk_link !== '#' && !form.apk_link.startsWith('http')) { addToast('❌ APK link must start with https://', 'error'); return false; }
    const r = parseFloat(form.rating || '0');
    if (isNaN(r) || r < 0 || r > 5) { addToast('❌ Rating must be between 0 and 5', 'error'); return false; }
    return true;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editId !== null) {
        const { error } = await supabase.from('apps').update(form).eq('id', editId);
        if (error) throw error;
        addToast('✅ App updated successfully!', 'success');
      } else {
        const { error } = await supabase.from('apps').insert([form]);
        if (error) throw error;
        addToast('✅ App added successfully!', 'success');
      }
      await refreshApps(); closeForm();
    } catch (e: any) { addToast(`❌ ${e.message}`, 'error'); }
    finally { setSaving(false); }
  };

  const del = async (id: number) => {
    if (!confirm('Permanently delete this app? This cannot be undone.')) return;
    try {
      const { error } = await supabase.from('apps').delete().eq('id', id);
      if (error) throw error;
      addToast('🗑️ App deleted', 'success'); await refreshApps();
    } catch (e: any) { addToast(`❌ ${e.message}`, 'error'); }
  };

  const togglePub = async (id: number, cur: boolean) => {
    try {
      const { error } = await supabase.from('apps').update({ published: !cur }).eq('id', id);
      if (error) throw error;
      addToast(!cur ? '🟢 Published!' : '📝 Moved to Draft', 'success'); await refreshApps();
    } catch (e: any) { addToast(`❌ ${e.message}`, 'error'); }
  };

  const fa = apps.filter(a => filter === 'all' ? true : filter === 'published' ? a.published : !a.published);
  const pubC = apps.filter(a => a.published).length;
  const draftC = apps.filter(a => !a.published).length;

  const iS: React.CSSProperties = { width: '100%', background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', color: 'white', fontSize: 13, transition: 'all 0.2s', outline: 'none' };
  const aBtn = (color: string, active = true): React.CSSProperties => ({ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${color}28`, background: active ? `${color}12` : 'rgba(255,255,255,0.04)', color: active ? color : 'rgba(255,255,255,0.25)', cursor: 'pointer', padding: 0, transition: 'all 0.2s' });

  return (
    <section style={{ padding: '100px 16px 80px' }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <div style={{ width: 40, height: 40, borderRadius: 13, background: 'rgba(255,107,53,0.12)', border: '1px solid rgba(255,107,53,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Settings style={{ color: C.orange }} size={19} />
              </div>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: 'white' }}>Admin Panel</h2>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 13 }}>Logged in as <span style={{ color: C.orange, fontWeight: 500 }}>{session?.user?.email}</span></p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button onClick={refreshApps} disabled={isRefreshing} style={{ padding: '9px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 13, color: 'rgba(255,255,255,0.45)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: isRefreshing ? 0.5 : 1, transition: 'all 0.2s' }}>
              {isRefreshing ? <Loader2 size={12} className="spin" /> : <RefreshCw size={12} />} Refresh
            </button>
            <button onClick={openAdd} className="btn-hover" style={{ padding: '9px 16px', background: 'linear-gradient(135deg, #FF6B35, #FFB800)', color: 'black', fontWeight: 600, borderRadius: 13, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, border: 'none', transition: 'all 0.2s' }}>
              <Plus size={13} /> Add New App
            </button>
            <button onClick={onLogout} style={{ padding: '9px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 13, color: C.red, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}>
              <LogOut size={12} /> Logout
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Total Apps', val: apps.length, color: 'white', bg: 'rgba(255,255,255,0.03)', bc: 'rgba(255,255,255,0.08)', icon: <Layers size={14} /> },
            { label: 'Published', val: pubC, color: C.green, bg: 'rgba(52,211,153,0.07)', bc: 'rgba(52,211,153,0.18)', icon: <Eye size={14} /> },
            { label: 'Drafts', val: draftC, color: C.amber, bg: 'rgba(251,191,36,0.07)', bc: 'rgba(251,191,36,0.18)', icon: <EyeOff size={14} /> },
            { label: 'Feedbacks', val: feedbacks.length, color: C.blue, bg: 'rgba(96,165,250,0.07)', bc: 'rgba(96,165,250,0.18)', icon: <MessageSquare size={14} />, badge: unread },
          ].map((s, i) => (
            <div key={i} style={{ background: s.bg, border: `1px solid ${s.bc}`, borderRadius: 14, padding: '14px 14px', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: s.color, marginBottom: 8, opacity: 0.7 }}>{s.icon}<span style={{ fontSize: 10, fontWeight: 500, letterSpacing: 0.2 }}>{s.label.toUpperCase()}</span></div>
              <p style={{ fontSize: 26, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.val}</p>
              {s.badge != null && s.badge > 0 && (
                <span className="pulse" style={{ position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: '50%', background: C.orange, color: 'black', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.badge}</span>
              )}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {[
            { k: 'apps' as const, ic: <Smartphone size={14} />, lb: 'Apps', ac: C.orange, abg: 'rgba(255,107,53,0.1)', abo: 'rgba(255,107,53,0.25)' },
            { k: 'feedbacks' as const, ic: <MessageSquare size={14} />, lb: 'Feedbacks', ac: C.blue, abg: 'rgba(96,165,250,0.1)', abo: 'rgba(96,165,250,0.25)' },
          ].map(t => (
            <button key={t.k} onClick={() => { setTab(t.k); if (t.k === 'feedbacks') fetchFb(); }} style={{
              padding: '9px 18px', borderRadius: 13, fontSize: 13, fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer',
              background: tab === t.k ? t.abg : 'transparent',
              color: tab === t.k ? t.ac : 'rgba(255,255,255,0.28)',
              border: `1px solid ${tab === t.k ? t.abo : 'transparent'}`,
              transition: 'all 0.2s'
            }}>
              {t.ic}{t.lb}
              {t.k === 'feedbacks' && unread > 0 && <span style={{ width: 17, height: 17, borderRadius: '50%', background: C.orange, color: 'black', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unread}</span>}
            </button>
          ))}
        </div>

        {/* ===== APPS TAB ===== */}
        {tab === 'apps' && (
          <>
            {/* ADD/EDIT FORM */}
            {showForm && (
              <div className="slide-down" style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))', border: '1px solid rgba(255,107,53,0.2)', borderRadius: 20, padding: '24px 20px', marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {editId !== null ? <><Edit3 size={17} style={{ color: C.orange }} />Edit App</> : <><Plus size={17} style={{ color: C.orange }} />Add New App</>}
                  </h3>
                  <button onClick={closeForm} style={{ color: 'rgba(255,255,255,0.25)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={17} /></button>
                </div>

                {/* Section: Basic Info */}
                <div style={{ marginBottom: 18 }}>
                  <p style={{ fontSize: 11, color: C.orange, fontWeight: 600, letterSpacing: 0.4, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><BarChart3 size={11} />BASIC INFO</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12 }}>
                    {[
                      { k: 'name', l: 'App Name *', ph: 'e.g. My Awesome App' },
                      { k: 'version', l: 'Version', ph: '1.0.0' },
                      { k: 'icon', l: 'Icon Emoji', ph: '📱' },
                      { k: 'category', l: 'Category', ph: 'Tools / Utilities / Games...' },
                      { k: 'rating', l: 'Rating (0–5)', ph: '4.5' },
                      { k: 'downloads', l: 'Download Count', ph: '10000' },
                      { k: 'size', l: 'File Size', ph: '4.5 MB' },
                      { k: 'updated', l: 'Last Updated', ph: '', type: 'date' },
                    ].map(f => (
                      <div key={f.k}>
                        <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 5, fontWeight: 500 }}>{f.l}</label>
                        <input type={f.type || 'text'} value={String((form as any)[f.k] ?? '')} onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))} placeholder={f.ph} style={iS} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 5, fontWeight: 500 }}>Description (supports emojis 🎉)</label>
                  <textarea value={form.description ?? ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe what this app does, its features, benefits..." rows={4} style={{ ...iS, resize: 'vertical', minHeight: 90, lineHeight: 1.6 }} />
                </div>

                {/* Section: APK */}
                <div style={{ marginBottom: 18 }}>
                  <p style={{ fontSize: 11, color: C.orange, fontWeight: 600, letterSpacing: 0.4, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Package size={11} />APK FILE</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 5, fontWeight: 500 }}>Manual APK URL (GitHub, Drive, etc.)</label>
                      <input value={form.apk_link ?? ''} onChange={e => setForm(p => ({ ...p, apk_link: e.target.value }))} placeholder="https://github.com/user/repo/releases/download/v1.0/app.apk" style={iS} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>OR UPLOAD DIRECTLY</span>
                      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                    </div>
                    <FileUpload
                      label="Upload APK (max 100MB — stored in Supabase)"
                      hint="Supports .apk files — link auto-fills after upload"
                      accept=".apk,application/vnd.android.package-archive"
                      bucket="apks" folder="uploads"
                      currentUrl={form.apk_link?.includes('supabase') ? form.apk_link : undefined}
                      onUploadComplete={url => setForm(p => ({ ...p, apk_link: url }))}
                      addToast={addToast}
                    />
                  </div>
                </div>

                {/* Section: Icon & Badge */}
                <div style={{ marginBottom: 18 }}>
                  <p style={{ fontSize: 11, color: C.orange, fontWeight: 600, letterSpacing: 0.4, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><FileImage size={11} />ICON & BADGE</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12 }}>
                    <div>
                      <FileUpload
                        label="Upload App Icon (PNG/JPG/WebP, max 5MB)"
                        hint="Recommended: 512×512px square image"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        bucket="icons" folder="app-icons"
                        currentUrl={form.icon_url || undefined}
                        onUploadComplete={url => setForm(p => ({ ...p, icon_url: url }))}
                        addToast={addToast}
                      />
                      {form.icon_url && (
                        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img src={form.icon_url} alt="preview" style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
                          <div>
                            <p style={{ fontSize: 11, color: C.green }}>✅ Icon preview</p>
                            <button onClick={() => setForm(p => ({ ...p, icon_url: '' }))} style={{ fontSize: 11, color: C.red, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 2 }}>Remove icon</button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 5, fontWeight: 500 }}>App Badge</label>
                      <select value={form.badge} onChange={e => setForm(p => ({ ...p, badge: e.target.value }))} style={iS}>
                        <option value="New" style={{ background: '#111' }}>✨ New — For recently added apps</option>
                        <option value="Viral" style={{ background: '#111' }}>🔥 Viral — For trending apps</option>
                        <option value="PRO" style={{ background: '#111' }}>⭐ PRO — For premium apps</option>
                      </select>
                      <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Badge preview:</p>
                        <span style={{ display: 'inline-block', marginTop: 6, padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700, color: 'white', background: getBadgeGradient(form.badge || 'New') }}>
                          {form.badge === 'Viral' ? '🔥 ' : form.badge === 'PRO' ? '⭐ ' : '✨ '}{form.badge || 'New'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Visibility */}
                <div style={{ marginBottom: 22 }}>
                  <p style={{ fontSize: 11, color: C.orange, fontWeight: 600, letterSpacing: 0.4, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Eye size={11} />VISIBILITY</p>
                  <button type="button" onClick={() => setForm(p => ({ ...p, published: !p.published }))} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '13px 16px', borderRadius: 13, fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
                    background: form.published ? 'rgba(52,211,153,0.08)' : 'rgba(251,191,36,0.08)',
                    border: `1px solid ${form.published ? 'rgba(52,211,153,0.25)' : 'rgba(251,191,36,0.25)'}`,
                    color: form.published ? C.green : C.amber
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      {form.published ? <Eye size={15} /> : <EyeOff size={15} />}
                      {form.published ? '🟢 Published — Visible to all users on the website' : '📝 Draft — Hidden from website, only you can see it'}
                    </span>
                    {form.published ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  </button>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <button onClick={save} disabled={saving} className="btn-hover" style={{ padding: '11px 24px', background: 'linear-gradient(135deg, #FF6B35, #FFB800)', color: 'black', fontWeight: 700, borderRadius: 13, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, border: 'none', opacity: saving ? 0.55 : 1, transition: 'all 0.2s' }}>
                    {saving ? <Loader2 size={13} className="spin" /> : <Save size={13} />}
                    {saving ? 'Saving...' : editId !== null ? 'Update App' : 'Add App'}
                  </button>
                  <button onClick={closeForm} style={{ padding: '11px 20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 13, color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}>Cancel</button>
                </div>
              </div>
            )}

            {/* Filter Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 18 }}>
              {(['all', 'published', 'draft'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: '7px 14px', borderRadius: 13, fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
                  background: filter === f ? 'rgba(255,107,53,0.1)' : 'rgba(255,255,255,0.03)',
                  color: filter === f ? C.orange : 'rgba(255,255,255,0.28)',
                  border: `1px solid ${filter === f ? 'rgba(255,107,53,0.25)' : 'rgba(255,255,255,0.06)'}`
                }}>
                  {f === 'all' ? `All Apps (${apps.length})` : f === 'published' ? `🟢 Published (${pubC})` : `📝 Drafts (${draftC})`}
                </button>
              ))}
            </div>

            {/* App List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {fa.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.18)' }}>
                  <Inbox size={38} style={{ margin: '0 auto 14px', display: 'block', opacity: 0.5 }} />
                  <p style={{ fontSize: 15 }}>No apps here</p>
                  <button onClick={openAdd} style={{ marginTop: 14, padding: '8px 16px', background: 'rgba(255,107,53,0.08)', color: C.orange, borderRadius: 11, fontSize: 13, border: '1px solid rgba(255,107,53,0.18)', cursor: 'pointer' }}>+ Add your first app</button>
                </div>
              ) : fa.map(app => (
                <div key={app.id} style={{
                  background: 'rgba(255,255,255,0.02)', border: `1px solid ${app.published ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.05)'}`,
                  borderRadius: 15, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
                  opacity: app.published ? 1 : 0.65, transition: 'all 0.2s'
                }}>
                  <div style={{ width: 46, height: 46, flexShrink: 0, background: 'rgba(255,107,53,0.07)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {app.icon_url ? <img src={app.icon_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : app.icon || '📱'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: 'white', fontSize: 14 }}>{app.name}</span>
                      <span style={{ background: getBadgeGradient(app.badge), padding: '2px 8px', borderRadius: 999, fontSize: 9, fontWeight: 700, color: 'white' }}>{app.badge}</span>
                      <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 9, fontWeight: 500, background: app.published ? 'rgba(52,211,153,0.12)' : 'rgba(251,191,36,0.12)', color: app.published ? C.green : C.amber, border: `1px solid ${app.published ? 'rgba(52,211,153,0.2)' : 'rgba(251,191,36,0.2)'}` }}>
                        {app.published ? '🟢 Live' : '📝 Draft'}
                      </span>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.22)', fontSize: 11 }}>v{app.version} · {app.size} · {app.category} · ⬇️ {formatDownloads(app.downloads)}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => togglePub(app.id, app.published)} style={aBtn(app.published ? '#10b981' : '#f59e0b')} title={app.published ? 'Unpublish' : 'Publish'}>
                      {app.published ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>
                    <button onClick={() => openEdit(app)} style={aBtn(C.orange)} title="Edit"><Edit3 size={13} /></button>
                    <button onClick={() => del(app.id)} style={aBtn('#ef4444')} title="Delete"><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ===== FEEDBACKS TAB ===== */}
        {tab === 'feedbacks' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
                {feedbacks.length} total · <span style={{ color: C.orange, fontWeight: 500 }}>{unread} unread</span>
              </p>
              <button onClick={fetchFb} disabled={fbLoading} style={{ padding: '7px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 11, color: 'rgba(255,255,255,0.35)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: fbLoading ? 0.5 : 1 }}>
                {fbLoading ? <Loader2 size={11} className="spin" /> : <RefreshCw size={11} />} Refresh
              </button>
            </div>

            {fbLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1, 2, 3].map(i => <div key={i} className="pulse" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, height: 76 }} />)}
              </div>
            ) : feedbacks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '72px 0', color: 'rgba(255,255,255,0.18)' }}>
                <Inbox size={38} style={{ margin: '0 auto 14px', display: 'block', opacity: 0.5 }} />
                <p>No feedbacks yet</p>
                <p style={{ fontSize: 12, marginTop: 6, opacity: 0.5 }}>They'll appear here when users send messages</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {feedbacks.map(fb => (
                  <div key={fb.id} style={{ border: `1px solid ${!fb.read ? 'rgba(255,107,53,0.22)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 14, overflow: 'hidden', background: !fb.read ? 'rgba(255,107,53,0.025)' : 'rgba(255,255,255,0.015)' }}>
                    <div onClick={() => { setExpandFb(expandFb === fb.id ? null : fb.id); if (!fb.read) markRead(fb.id); }} style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 11, cursor: 'pointer' }}>
                      <div style={{ width: 9, height: 9, borderRadius: '50%', marginTop: 5, flexShrink: 0, background: !fb.read ? C.orange : 'rgba(255,255,255,0.1)', boxShadow: !fb.read ? '0 0 6px rgba(255,107,53,0.5)' : 'none' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, color: 'white', fontSize: 13 }}>{fb.name}</span>
                          <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: 12 }}>{fb.email}</span>
                          <span style={{
                            padding: '2px 8px', borderRadius: 8, fontSize: 10,
                            background: fb.subject === 'Bug Report' ? 'rgba(239,68,68,0.09)' : fb.subject === 'Feature Request' ? 'rgba(59,130,246,0.09)' : fb.subject === 'Business' ? 'rgba(245,158,11,0.09)' : 'rgba(255,255,255,0.05)',
                            color: fb.subject === 'Bug Report' ? C.red : fb.subject === 'Feature Request' ? C.blue : fb.subject === 'Business' ? C.amber : 'rgba(255,255,255,0.28)',
                            border: '1px solid rgba(255,255,255,0.07)'
                          }}>{fb.subject}</span>
                          {!fb.read && <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 9, background: 'rgba(255,107,53,0.12)', color: C.orange, border: '1px solid rgba(255,107,53,0.2)' }}>NEW</span>}
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fb.message}</p>
                        <p style={{ color: 'rgba(255,255,255,0.14)', fontSize: 10, marginTop: 4 }}>{formatTimeAgo(fb.created_at)}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                        {expandFb === fb.id ? <ChevronUp size={13} style={{ color: 'rgba(255,255,255,0.25)' }} /> : <ChevronDown size={13} style={{ color: 'rgba(255,255,255,0.25)' }} />}
                        <button onClick={e => { e.stopPropagation(); deleteFb(fb.id); }} style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.18)', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 4 }}><Trash2 size={11} /></button>
                      </div>
                    </div>
                    {expandFb === fb.id && (
                      <div style={{ padding: '0 18px 18px' }}>
                        <div style={{ background: 'rgba(0,0,0,0.45)', borderRadius: 13, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{fb.message}</p>
                        </div>
                        <a href={`mailto:${fb.email}?subject=Re: ${fb.subject} — SunRise Apps`} style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.orange, textDecoration: 'none', fontWeight: 500 }}>
                          <Mail size={11} /> Reply to {fb.email}
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
  const [open, setOpen] = useState<number | null>(0);
  const steps = [
    { title: '1. GitHub — Free APK Hosting', icon: '🐙', content: ['→ github.com → New repo "sunrise-apks"', '→ Releases → Create release → Upload APK file', '→ Copy download URL → Paste in Admin Panel', '', '💡 GitHub = unlimited free APK hosting!'] },
    { title: '2. Supabase Storage Buckets', icon: '🗄️', content: ['→ supabase.com → Storage tab', '→ New bucket: "icons" → Public ✅', '→ New bucket: "apks" → Public ✅', '', '💡 1GB free — enough for 200+ APKs!'] },
    { title: '3. Vercel — Deploy Website', icon: '🚀', content: ['→ vercel.com → Import GitHub repo', '→ Framework: Vite → Deploy', '→ Your site: yourapp.vercel.app', '', '💡 Auto-redeploys on every git push'] },
    { title: '4. Google AdSense', icon: '💰', content: ['→ adsense.google.com → Add your site', '→ Verify ownership via index.html', '→ Wait 2-4 weeks for approval', '', '📋 Already included: Privacy ✅ Contact ✅ About ✅', '', '💡 Earn ₹100–₹2000/day with good traffic'] },
    { title: '5. Database SQL Setup', icon: '🗃️', content: ['Run in Supabase SQL Editor:', '', 'CREATE TABLE feedbacks (', '  id BIGSERIAL PRIMARY KEY,', '  name TEXT NOT NULL,', '  email TEXT NOT NULL,', "  subject TEXT DEFAULT 'General',", '  message TEXT NOT NULL,', '  read BOOLEAN DEFAULT FALSE,', '  created_at TIMESTAMPTZ DEFAULT NOW()', ');', '', 'ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;', "CREATE POLICY \"insert\" ON feedbacks FOR INSERT TO anon WITH CHECK (true);", "CREATE POLICY \"manage\" ON feedbacks FOR ALL TO authenticated USING (true);"] },
    { title: '6. Publishing Apps', icon: '📲', content: ['→ Click "🔐 Login" in nav → Sign in', '→ Admin Panel → "+ Add New App"', '→ Fill all fields + upload APK & icon', '→ Toggle visibility to Published 🟢', '', '💡 Goes live instantly — no code needed!'] },
    { title: '7. Analytics Setup', icon: '📊', content: ['→ analytics.google.com → New property', '→ Get tracking code → Add to index.html', '→ See traffic, clicks, countries', '', '💡 Free forever with Google Analytics'] },
    { title: '8. Instagram Growth', icon: '📸', content: ['→ Create: @SunRise_Apps', '→ Bio: "Free Viral Apps 📲 Link in bio 👇"', '', '🎬 Reel ideas (hook in first 2 seconds):', '  • "This app reads WhatsApp messages 😱"', '  • "Hide files your phone... 🔒"', '', '📊 Post 2-3 Reels/day + trending audio', '🎯 10K followers → ₹500–1000/day ad income'] },
  ];

  return (
    <section style={{ padding: '100px 16px 80px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.18)', borderRadius: 999, padding: '8px 16px', marginBottom: 18, fontSize: 12, color: 'rgba(255,150,80,0.85)' }}>
            <BookOpen size={12} /> Step-by-Step Setup Guide
          </div>
          <h2 style={{ fontSize: 30, fontWeight: 800, color: 'white', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <BookOpen style={{ color: C.orange }} size={28} />
            Complete <span style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Guide</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 14 }}>Zero to earning money with your app store</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))', border: `1px solid ${open === i ? 'rgba(255,107,53,0.2)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 16, overflow: 'hidden', transition: 'border-color 0.2s' }}>
              <button onClick={() => setOpen(open === i ? null : i)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '17px 18px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: 'white' }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{s.icon}</span>
                <span style={{ flex: 1, fontWeight: 600, fontSize: 14, color: open === i ? 'white' : 'rgba(255,255,255,0.7)' }}>{s.title}</span>
                <ChevronRight size={16} style={{ color: open === i ? C.orange : 'rgba(255,255,255,0.18)', transition: 'transform 0.25s', transform: open === i ? 'rotate(90deg)' : 'none', flexShrink: 0 }} />
              </button>
              {open === i && (
                <div className="slide-down" style={{ padding: '0 18px 18px' }}>
                  <div style={{ background: 'rgba(0,0,0,0.55)', borderRadius: 13, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {s.content.map((ln, j) => (
                      <p key={j} style={{
                        fontSize: 12.5, lineHeight: 1.7, fontFamily: ln.includes('CREATE') || ln.includes('ALTER') || ln.includes('BOOLEAN') || ln.includes('BIGSERIAL') || ln.includes('TIMESTAMPTZ') || ln.includes('POLICY') || ln.includes('(true)') ? 'monospace' : 'inherit',
                        height: ln === '' ? 10 : 'auto',
                        color: ln.startsWith('💡') || ln.startsWith('🎯') ? C.orange : ln.startsWith('📋') || ln.startsWith('🎬') || ln.startsWith('📊') ? C.gold : ln.startsWith('→') ? 'rgba(255,255,255,0.5)' : ln.startsWith('  ✅') || ln.startsWith('  •') ? C.green : ln.includes('CREATE') || ln.includes('ALTER') || ln.includes(');') ? '#fbbf24' : ln.includes('BIGSERIAL') || ln.includes('TEXT') || ln.includes('BOOLEAN') || ln.includes('TIMESTAMPTZ') ? '#67e8f9' : 'rgba(255,255,255,0.38)',
                        fontWeight: ln.startsWith('💡') || ln.startsWith('🎯') ? 600 : 400,
                        paddingLeft: ln.startsWith('  ') ? 8 : 0
                      }}>{ln}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        {/* Checklist */}
        <div style={{ marginTop: 44, background: 'rgba(255,107,53,0.06)', border: '1px solid rgba(255,107,53,0.18)', borderRadius: 20, padding: '24px 22px', textAlign: 'center' }}>
          <p style={{ color: C.orange, fontSize: 17, fontWeight: 700, marginBottom: 6 }}>🎯 Launch Checklist</p>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, marginBottom: 20 }}>Check off tasks as you complete them</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10, textAlign: 'left', maxWidth: 480, margin: '0 auto' }}>
            {['GitHub account ready', 'APK uploaded to GitHub', 'Supabase project created', 'Database tables created', 'Storage buckets (icons + apks)', 'Website deployed on Vercel', 'Instagram @SunRise_Apps', 'Applied for AdSense', 'First Reel published', 'First app published 🚀'].map((item, i) => (
              <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: 'rgba(255,255,255,0.38)', cursor: 'pointer' }}>
                <input type="checkbox" style={{ accentColor: C.orange, width: 15, height: 15, cursor: 'pointer' }} />
                {item}
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
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 22, padding: '36px 28px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 220, height: 220, background: 'radial-gradient(circle, rgba(255,107,53,0.09), transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, position: 'relative', zIndex: 1 }}>
          <div style={{ width: 110, height: 110, background: 'linear-gradient(135deg, #FF6B35, #FFB800)', borderRadius: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 46, boxShadow: '0 14px 36px rgba(255,107,53,0.28)', flexShrink: 0 }}>🌅</div>
          <div style={{ textAlign: 'center', maxWidth: 520 }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: 'white', marginBottom: 14 }}>
              About <span style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SunRise Apps</span>
            </h2>
            <p style={{ color: C.text, marginBottom: 10, lineHeight: 1.75, fontSize: 14 }}>Independent Android developer from India 🇮🇳, building viral utility apps that solve real everyday problems.</p>
            <p style={{ color: C.text, marginBottom: 24, lineHeight: 1.75, fontSize: 14 }}>Every sunrise brings new possibilities — free tools for everyone, powered by non-intrusive ads.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
              <a href="https://instagram.com/SunRise_Apps" target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 16px', background: 'rgba(236,72,153,0.09)', border: '1px solid rgba(236,72,153,0.18)', borderRadius: 13, color: '#f472b6', fontSize: 13, textDecoration: 'none' }}>📸 @SunRise_Apps</a>
              <a href="mailto:thesunrisecode@gmail.com" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 13, color: 'rgba(255,255,255,0.45)', fontSize: 13, textDecoration: 'none' }}><Mail size={14} /> thesunrisecode@gmail.com</a>
              <a href="https://sunriseapps.in" target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 16px', background: 'rgba(255,107,53,0.09)', border: '1px solid rgba(255,107,53,0.18)', borderRadius: 13, color: C.orange, fontSize: 13, textDecoration: 'none' }}><Globe size={14} /> sunriseapps.in</a>
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
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: 'white', marginBottom: 28, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <Shield style={{ color: C.orange }} size={26} />
        Privacy <span style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Policy</span>
      </h2>
      <div style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '24px 22px' }}>
        {[
          { t: '1. Data We Collect', d: 'Minimal data only. Contact form submissions are stored securely. No tracking without consent.' },
          { t: '2. Advertisements', d: 'Google AdSense/AdMob may collect device identifiers for personalized ads. You may opt out in device settings.' },
          { t: '3. Data Security', d: 'All data is encrypted via HTTPS. We do not sell or share your personal information.' },
          { t: '4. Third-Party Services', d: 'We use Supabase, Google Analytics, and Google AdSense. Their respective privacy policies apply.' },
          { t: '5. Children\'s Privacy', d: 'Our services are not directed at children under 13. We do not knowingly collect data from minors.' },
          { t: '6. Policy Updates', d: 'We may update this policy. Continued use of our services constitutes acceptance of any changes.' },
          { t: '7. Contact Us', d: 'For privacy concerns: thesunrisecode@gmail.com — We respond within 48 hours.' },
        ].map((p, i, arr) => (
          <div key={i} style={{ marginBottom: i < arr.length - 1 ? 22 : 0 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: C.orange, marginBottom: 7 }}>{p.t}</h3>
            <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13, lineHeight: 1.75 }}>{p.d}</p>
          </div>
        ))}
        <div style={{ marginTop: 22, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.14)', fontSize: 11 }}>Last updated: January 2026 · SunRise Apps</p>
        </div>
      </div>
    </div>
  </section>
);

// ============ CONTACT ============
const ContactSection = ({ addToast }: { addToast: (msg: string, type: ToastItem['type']) => void }) => {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fd, setFd] = useState({ name: '', email: '', subject: 'General', message: '' });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fd.name.trim() || !fd.message.trim()) { addToast('❌ Name and message are required', 'error'); return; }
    setBusy(true);
    try {
      const { error } = await supabase.from('feedbacks').insert([{ name: fd.name.trim(), email: fd.email.trim(), subject: fd.subject, message: fd.message.trim(), read: false }]);
      if (error) throw error;
      setSent(true); setFd({ name: '', email: '', subject: 'General', message: '' });
    } catch (e: any) { addToast(`❌ ${e.message}`, 'error'); }
    finally { setBusy(false); }
  };

  const iS: React.CSSProperties = { width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, padding: '12px 14px', color: 'white', fontSize: 13, transition: 'all 0.2s', outline: 'none' };

  return (
    <section style={{ padding: '80px 16px' }}>
      <div style={{ maxWidth: 580, margin: '0 auto' }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: 'white', marginBottom: 28, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <Mail style={{ color: C.orange }} size={26} />
          Contact <span style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Us</span>
        </h2>
        <div style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '24px 22px' }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '36px 0' }} className="fade-in">
              <div style={{ width: 76, height: 76, margin: '0 auto 18px', borderRadius: 22, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle style={{ color: C.green }} size={34} />
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 700, color: 'white', marginBottom: 7 }}>Message Sent!</h3>
              <p style={{ color: C.text, fontSize: 13, marginBottom: 22 }}>We've received your message and will reply within 24 hours.</p>
              <button onClick={() => setSent(false)} style={{ padding: '10px 22px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, color: 'rgba(255,255,255,0.45)', fontSize: 13, cursor: 'pointer' }}>Send Another</button>
            </div>
          ) : (
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 5, fontWeight: 500 }}>NAME *</label>
                  <input type="text" required value={fd.name} onChange={e => setFd(f => ({ ...f, name: e.target.value }))} placeholder="Your name" style={iS} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 5, fontWeight: 500 }}>EMAIL *</label>
                  <input type="email" required value={fd.email} onChange={e => setFd(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" style={iS} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 5, fontWeight: 500 }}>SUBJECT</label>
                <select value={fd.subject} onChange={e => setFd(f => ({ ...f, subject: e.target.value }))} style={iS}>
                  {['General', 'Bug Report', 'Feature Request', 'Business', 'Other'].map(s => <option key={s} style={{ background: '#111' }}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 5, fontWeight: 500 }}>MESSAGE *</label>
                <textarea required rows={5} value={fd.message} onChange={e => setFd(f => ({ ...f, message: e.target.value }))} placeholder="Tell us what's on your mind..." style={{ ...iS, resize: 'vertical', minHeight: 110, lineHeight: 1.6 }} />
              </div>
              <button type="submit" disabled={busy} className="btn-hover" style={{ padding: '14px', background: 'linear-gradient(135deg, #FF6B35, #FFB800)', color: 'black', fontWeight: 700, borderRadius: 13, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: busy ? 0.55 : 1, fontSize: 14, transition: 'all 0.2s' }}>
                {busy ? <Loader2 size={17} className="spin" /> : <Mail size={17} />}
                {busy ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
          <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, textAlign: 'center' }}>
            {[
              { href: 'mailto:thesunrisecode@gmail.com', icon: <Mail size={18} />, label: 'Email Us' },
              { href: 'https://instagram.com/SunRise_Apps', icon: <span style={{ fontSize: 18 }}>📸</span>, label: '@SunRise_Apps', target: '_blank' },
              { href: 'https://sunriseapps.in', icon: <Globe size={18} />, label: 'Website', target: '_blank' },
            ].map((l, i) => (
              <a key={i} href={l.href} target={(l as any).target} rel="noreferrer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, color: 'rgba(255,255,255,0.25)', textDecoration: 'none', fontSize: 11, padding: '12px 8px', borderRadius: 12, transition: 'all 0.2s' }}>
                {l.icon}<span>{l.label}</span>
              </a>
            ))}
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
  const [modal, setModal] = useState<AppData | null>(null);
  const [unlocked, setUnlocked] = useState<number[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  // Fetch apps
  const fetchApps = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.from('apps').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setApps(data || []);
    } catch (e: any) { addToast(`❌ ${e.message}`, 'error'); }
    finally { setRefreshing(false); setLoading(false); }
  }, [addToast]);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  // Realtime
  useEffect(() => {
    const ch = supabase.channel('apps-live').on('postgres_changes', { event: '*', schema: 'public', table: 'apps' }, fetchApps).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchApps]);

  const logout = async () => { await supabase.auth.signOut(); setPage('home'); addToast('👋 Logged out', 'info'); };
  const download = useCallback((app: AppData) => { if (unlocked.includes(app.id)) window.open(app.apk_link, '_blank'); else setModal(app); }, [unlocked]);
  const unlock = useCallback(() => { if (modal) { setUnlocked(p => [...p, modal.id]); window.open(modal.apk_link, '_blank'); setModal(null); } }, [modal]);
  const go = (p: string) => { setPage(p); setMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const navItems = [
    { id: 'home', label: 'Home', icon: <Sun size={14} /> },
    { id: 'about', label: 'About', icon: <Users size={14} /> },
    { id: 'guide', label: 'Guide', icon: <BookOpen size={14} /> },
    { id: 'privacy', label: 'Privacy', icon: <Shield size={14} /> },
    { id: 'contact', label: 'Contact', icon: <Mail size={14} /> },
    { id: 'admin', label: session ? '⚙️ Admin' : '🔐 Login', icon: <Settings size={14} />, highlight: !session },
  ];

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <GlobalStyles />
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg, #FF6B35, #FFB800)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 28px rgba(255,107,53,0.3)' }}><Sun size={28} style={{ color: 'black' }} /></div>
        <Loader2 style={{ color: C.orange, margin: '0 auto 14px', display: 'block' }} size={26} className="spin" />
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>Loading SunRise Apps...</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: 'white' }}>
      <GlobalStyles />

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, background: 'rgba(5,5,5,0.88)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 62 }}>
            {/* Logo */}
            <button onClick={() => go('home')} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'white', flexShrink: 0 }}>
              <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg, #FF6B35, #FFB800)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(255,107,53,0.2)', flexShrink: 0 }}><Sun size={17} style={{ color: 'black' }} /></div>
              <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: -0.3 }}>Sun<span style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Rise</span><span style={{ color: 'rgba(255,255,255,0.28)', fontWeight: 400, fontSize: 14, marginLeft: 4 }}>Apps</span></span>
            </button>

            {/* Desktop Nav */}
            <div className="desktop-nav" style={{ display: 'none', alignItems: 'center', gap: 2 }}>
              {navItems.map(item => (
                <button key={item.id} onClick={() => go(item.id)} className="nav-btn" style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 11, fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                  background: page === item.id ? 'rgba(255,107,53,0.1)' : item.highlight ? 'rgba(255,184,0,0.08)' : 'transparent',
                  color: page === item.id ? C.orange : item.highlight ? C.gold : 'rgba(255,255,255,0.32)'
                }}>
                  {item.icon}<span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Mobile burger */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="mobile-only" style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 11, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.45)', border: 'none', cursor: 'pointer' }}>
              {menuOpen ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {menuOpen && (
            <div className="slide-down" style={{ paddingBottom: 14, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 3, paddingTop: 10 }}>
              {navItems.map(item => (
                <button key={item.id} onClick={() => go(item.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 11, width: '100%', padding: '11px 14px',
                  borderRadius: 11, fontSize: 14, fontWeight: 500, textAlign: 'left',
                  background: page === item.id ? 'rgba(255,107,53,0.1)' : 'transparent',
                  color: page === item.id ? C.orange : item.highlight ? C.gold : 'rgba(255,255,255,0.38)',
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                }}>
                  {item.icon}{item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* PAGES */}
      {page === 'home' && (
        <>
          <HomePage apps={apps} onDownload={download} unlockedApps={unlocked} loading={loading || refreshing} />
          <AboutSection />
          <PrivacySection />
          <ContactSection addToast={addToast} />
        </>
      )}
      {page === 'admin' && (session
        ? <AdminPage apps={apps} onLogout={logout} session={session} refreshApps={fetchApps} isRefreshing={refreshing} addToast={addToast} />
        : <AdminLogin onLogin={() => setPage('admin')} />
      )}
      {page === 'guide' && <GuidePage />}
      {page === 'about' && <AboutSection />}
      {page === 'privacy' && <PrivacySection />}
      {page === 'contact' && <ContactSection addToast={addToast} />}

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '44px 16px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, marginBottom: 14 }}>
          <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg, #FF6B35, #FFB800)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sun size={15} style={{ color: 'black' }} /></div>
          <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>SunRise Apps</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.18)', fontSize: 12, marginBottom: 6 }}>Free viral Android apps — always updated 🚀</p>
        <p style={{ color: 'rgba(255,255,255,0.08)', fontSize: 10 }}>© 2026 SunRise Apps · Built with ❤️ in India</p>
      </footer>

      <LockModal app={modal} onClose={() => setModal(null)} onUnlock={unlock} />
      <ScrollToTop />
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}