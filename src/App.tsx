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
  BarChart3, Layers, DollarSign, FileText, ExternalLink,
  Database, GitBranch, Server, Key, ShieldCheck, Wifi,
  HardDrive, MonitorSmartphone, Copy, Check
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

interface SiteSettings {
  id?: number;
  ads_enabled: boolean;
  ad_client_id: string;
  ad_slot_header: string;
  ad_slot_sidebar: string;
  ad_slot_article: string;
  updated_at?: string;
}

// ============ COLOR SYSTEM ============
const C = {
  bg: '#121212',
  bgCard: '#1E1E1E',
  bgCardHover: '#252525',
  border: 'rgba(255,255,255,0.1)',
  borderHover: 'rgba(255,107,53,0.4)',
  orange: '#FF6B35',
  gold: '#FFB800',
  text: '#E4E4E4',
  textMuted: 'rgba(228,228,228,0.5)',
  textFaint: 'rgba(228,228,228,0.28)',
  green: '#34d399',
  amber: '#fbbf24',
  blue: '#60a5fa',
  red: '#f87171',
  purple: '#a855f7',
};

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

// ============ DIRECT DOWNLOAD HELPER ============
const triggerDownload = (url: string, filename?: string) => {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'app.apk';
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// ============ GLOBAL STYLES ============
const GlobalStyles = () => (
  <style>{`
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { background: ${C.bg}; color: ${C.text}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
    input, textarea, select, button { font-family: inherit; }
    input::placeholder, textarea::placeholder { color: rgba(228,228,228,0.2); }
    a { text-decoration: none; color: inherit; }

    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: ${C.bg}; }
    ::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
    ::-webkit-scrollbar-thumb:hover { background: ${C.orange}; }
    ::selection { background: rgba(255,107,53,0.3); color: white; }

    @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeInScale { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
    @keyframes spin { to { transform:rotate(360deg); } }
    @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
    @keyframes slideDown { from{opacity:0;transform:translateY(-12px);} to{opacity:1;transform:translateY(0);} }
    @keyframes glow { 0%,100%{text-shadow:0 0 20px rgba(255,107,53,0.4);} 50%{text-shadow:0 0 40px rgba(255,184,0,0.6), 0 0 60px rgba(255,107,53,0.3);} }
    @keyframes shimmer { 0%{background-position:-200% 0;} 100%{background-position:200% 0;} }

    .spin { animation: spin 1s linear infinite; }
    .pulse { animation: pulse 2s ease-in-out infinite; }
    .fade-in { animation: fadeIn 0.35s ease forwards; }
    .fade-in-scale { animation: fadeInScale 0.3s ease forwards; }
    .slide-down { animation: slideDown 0.3s ease forwards; }
    .glow-text { animation: glow 3s ease-in-out infinite; }

    .card { background: ${C.bgCard}; border: 1px solid ${C.border}; border-radius: 18px; transition: all 0.3s ease; }
    .card:hover { background: ${C.bgCardHover}; border-color: ${C.borderHover}; transform: translateY(-3px); box-shadow: 0 16px 48px rgba(255,107,53,0.1), 0 4px 16px rgba(0,0,0,0.4); }

    .btn-primary { background: linear-gradient(135deg, #FF6B35, #FFB800); color: black; font-weight: 700; border: none; cursor: pointer; transition: all 0.25s ease; }
    .btn-primary:hover { transform: scale(1.03); box-shadow: 0 6px 24px rgba(255,107,53,0.35); opacity: 0.92; }
    .btn-primary:active { transform: scale(0.98); }

    .btn-ghost { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: ${C.textMuted}; cursor: pointer; transition: all 0.2s ease; }
    .btn-ghost:hover { background: rgba(255,255,255,0.09); color: ${C.text}; border-color: rgba(255,255,255,0.2); }

    .nav-btn { background: transparent; border: none; cursor: pointer; transition: all 0.2s ease; }
    .nav-btn:hover { background: rgba(255,255,255,0.06) !important; color: white !important; }

    .input-base { background: rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.1); color: ${C.text}; border-radius: 12px; padding: 11px 14px; font-size: 13.5px; transition: all 0.2s ease; outline: none; width: 100%; }
    .input-base:focus { border-color: rgba(255,107,53,0.5); background: rgba(0,0,0,0.5); box-shadow: 0 0 0 3px rgba(255,107,53,0.08); }

    .action-btn { width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; transition: all 0.2s ease; }
    .action-btn:hover { transform: scale(1.08); }

    @media (min-width: 768px) { .desktop-nav { display: flex !important; } .mobile-only { display: none !important; } }
    @media (max-width: 767px) { .desktop-nav { display: none !important; } }

    .shimmer-skeleton { background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%); background-size: 200% 100%; animation: shimmer 1.8s linear infinite; border-radius: 10px; }
  `}</style>
);

// ============ TOAST ============
const Toast = ({ toasts, removeToast }: { toasts: ToastItem[]; removeToast: (id: number) => void }) => (
  <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 360, padding: '0 16px', pointerEvents: 'none' }}>
    {toasts.map(t => (
      <div key={t.id} className="fade-in" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        padding: '13px 16px', borderRadius: 14, fontSize: 13.5, fontWeight: 500,
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', pointerEvents: 'all',
        background: t.type === 'success' ? 'rgba(6,78,59,0.97)' : t.type === 'error' ? 'rgba(127,29,29,0.97)' : 'rgba(25,25,25,0.98)',
        border: `1px solid ${t.type === 'success' ? 'rgba(52,211,153,0.35)' : t.type === 'error' ? 'rgba(248,113,113,0.35)' : 'rgba(255,107,53,0.35)'}`,
        color: t.type === 'success' ? C.green : t.type === 'error' ? C.red : '#fdba74',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
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
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
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
    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="btn-primary" style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 50, width: 46, height: 46, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(255,107,53,0.4)' }}>
      <ArrowUp size={19} />
    </button>
  );
};

// ============ AD BANNER (Controlled by Settings) ============
const AdBanner = ({ variant = 'horizontal', settings }: { variant?: 'horizontal' | 'rectangle'; settings: SiteSettings | null }) => {
  if (!settings?.ads_enabled) {
    return (
      <div style={{ border: '1px dashed rgba(255,255,255,0.06)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', height: variant === 'rectangle' ? 180 : 60, background: 'rgba(255,255,255,0.01)' }}>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.12)' }}>Ad space — Enable in Admin → Monetization</p>
      </div>
    );
  }
  return (
    <div style={{ border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', height: variant === 'rectangle' ? 200 : 72, background: 'rgba(255,255,255,0.01)', overflow: 'hidden' }}>
      {settings.ad_client_id && settings.ad_slot_header ? (
        <ins className="adsbygoogle"
          style={{ display: 'block', width: '100%', height: '100%' }}
          data-ad-client={settings.ad_client_id}
          data-ad-slot={variant === 'rectangle' ? settings.ad_slot_sidebar : settings.ad_slot_header}
          data-ad-format="auto"
          data-full-width-responsive="true" />
      ) : (
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>📢 AdSense — Add IDs in Admin → Monetization</p>
      )}
    </div>
  );
};

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
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} className="fade-in-scale" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: '36px 28px', maxWidth: 360, width: '100%', position: 'relative', boxShadow: '0 24px 60px rgba(0,0,0,0.7)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 76, height: 76, margin: '0 auto 20px', borderRadius: 22, background: 'rgba(255,107,53,0.12)', border: '1px solid rgba(255,107,53,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock style={{ color: C.orange }} size={30} />
          </div>
          <h3 style={{ fontSize: 22, fontWeight: 700, color: 'white', marginBottom: 6 }}>Unlock Download</h3>
          <p style={{ color: C.textMuted, fontSize: 13, marginBottom: 28, lineHeight: 1.6 }}>{app.name}</p>
          {!watching ? (
            <button onClick={() => setWatching(true)} className="btn-primary" style={{ width: '100%', padding: 15, borderRadius: 14, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Eye size={18} /> Watch Ad to Unlock
            </button>
          ) : (
            <div style={{ background: 'rgba(255,107,53,0.06)', borderRadius: 14, padding: '20px 16px', border: '1px solid rgba(255,107,53,0.2)' }}>
              <p className="pulse" style={{ color: C.orange, fontSize: 13, fontWeight: 600, marginBottom: 14 }}>⏳ Ad playing...</p>
              <div style={{ width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: 999, height: 8, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'linear-gradient(90deg, #FF6B35, #FFB800)', borderRadius: 999, transition: 'width 1s linear', width: `${((5 - countdown) / 5) * 100}%` }} />
              </div>
              <p style={{ color: C.textFaint, fontSize: 12, marginTop: 10 }}>{countdown}s remaining</p>
            </div>
          )}
          <p style={{ color: 'rgba(255,255,255,0.1)', fontSize: 10, marginTop: 16 }}>Ad placeholder — integrate AdMob/AdSense here</p>
        </div>
      </div>
    </div>
  );
};

// ============ FILE UPLOAD ============
const FileUpload = ({ label, accept, bucket, folder, onUploadComplete, currentUrl, addToast, hint }: {
  label: string; accept: string; bucket: string; folder: string;
  onUploadComplete: (url: string) => void; currentUrl?: string;
  addToast: (msg: string, type: ToastItem['type']) => void; hint?: string;
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
      if (!data?.publicUrl) throw new Error('Could not get public URL');
      setProgress(100);
      onUploadComplete(data.publicUrl);
      addToast(`✅ ${isApk ? 'APK' : 'Image'} uploaded successfully!`, 'success');
    } catch (err: any) { addToast(`❌ Upload failed: ${err.message}`, 'error'); }
    finally { setTimeout(() => { setUploading(false); setProgress(0); }, 700); if (inputRef.current) inputRef.current.value = ''; }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) await doUpload(f); };
  const handleDrop = async (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) await doUpload(f); };
  const short = (url: string) => { const n = url.split('/').pop() || ''; return n.length > 30 ? n.slice(0, 30) + '...' : n; };

  return (
    <div>
      <label style={{ display: 'block', fontSize: 11.5, color: C.textFaint, marginBottom: 5, fontWeight: 600, letterSpacing: 0.3 }}>{label}</label>
      {hint && <p style={{ fontSize: 11, color: 'rgba(228,228,228,0.2)', marginBottom: 7 }}>{hint}</p>}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{ border: `1.5px dashed ${dragOver ? C.orange : currentUrl ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.12)'}`, borderRadius: 13, padding: '13px 12px', display: 'flex', alignItems: 'center', gap: 11, cursor: uploading ? 'wait' : 'pointer', background: dragOver ? 'rgba(255,107,53,0.04)' : currentUrl ? 'rgba(52,211,153,0.03)' : 'rgba(255,255,255,0.02)', transition: 'all 0.2s ease' }}
      >
        <input ref={inputRef} type="file" accept={accept} onChange={handleFile} style={{ display: 'none' }} />
        <div style={{ width: 38, height: 38, borderRadius: 10, background: currentUrl ? 'rgba(52,211,153,0.12)' : 'rgba(255,107,53,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${currentUrl ? 'rgba(52,211,153,0.2)' : 'rgba(255,107,53,0.15)'}` }}>
          {uploading ? <Loader2 size={15} style={{ color: C.orange }} className="spin" /> : currentUrl ? <CheckCircle size={15} style={{ color: C.green }} /> : <Upload size={15} style={{ color: C.orange }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {currentUrl ? <p style={{ fontSize: 12, color: C.green, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>✅ {short(currentUrl)}</p>
            : <p style={{ fontSize: 12, color: C.textMuted }}>{uploading ? `Uploading ${progress}%...` : 'Click or drag & drop file here'}</p>}
          {uploading && <div style={{ marginTop: 6, width: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: 999, height: 4 }}><div style={{ height: '100%', background: 'linear-gradient(90deg, #FF6B35, #FFB800)', borderRadius: 999, transition: 'width 0.4s ease', width: `${progress}%` }} /></div>}
        </div>
        {currentUrl && !uploading && <button onClick={e => { e.stopPropagation(); onUploadComplete(''); }} style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: C.red, borderRadius: 8, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>Clear</button>}
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
    <div className="card" style={{ position: 'relative', padding: '20px 18px', overflow: 'visible' }}>
      <span style={{ position: 'absolute', top: -10, right: 14, padding: '3px 11px', borderRadius: 999, fontSize: 10, fontWeight: 700, color: 'white', letterSpacing: 0.3, background: getBadgeGradient(app.badge), boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
        {app.badge === 'Viral' ? '🔥 ' : app.badge === 'PRO' ? '⭐ ' : '✨ '}{app.badge}
      </span>

      <div style={{ display: 'flex', gap: 14, marginBottom: 14, alignItems: 'flex-start' }}>
        <div style={{ width: 56, height: 56, flexShrink: 0, background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
          <h3 style={{ fontWeight: 700, color: 'white', fontSize: 15.5, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.name}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 5, fontSize: 11.5, color: C.textFaint }}>
            <span style={{ background: 'rgba(255,255,255,0.07)', padding: '2px 8px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.08)' }}>v{app.version}</span>
            <span>·</span><span>{app.size}</span>
          </div>
        </div>
      </div>

      <p style={{ color: C.textMuted, fontSize: 13.5, lineHeight: 1.75, marginBottom: 14, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{app.description}</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 15, fontSize: 11.5, color: C.textFaint }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Download size={11} /> {formatDownloads(app.downloads)}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Star size={11} style={{ color: '#fbbf24' }} /> {app.rating}</span>
        <span style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.15)', padding: '2px 9px', borderRadius: 8, color: 'rgba(168,85,247,0.8)', fontSize: 11 }}>{app.category}</span>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => !isCS && onDownload(app)}
          disabled={isCS}
          className={isCS ? '' : 'btn-primary'}
          style={{ flex: 1, padding: '12px', borderRadius: 13, fontWeight: 600, fontSize: 13.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, border: 'none', cursor: isCS ? 'not-allowed' : 'pointer', background: isCS ? 'rgba(255,255,255,0.06)' : undefined, color: isCS ? 'rgba(255,255,255,0.18)' : undefined }}
        >
          {isCS ? 'Coming Soon' : unlocked ? <><Download size={14} /> Download APK</> : <><Lock size={14} /> Get APK</>}
        </button>
        <button onClick={handleShare} className="btn-ghost" style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Share2 size={14} />
        </button>
      </div>
    </div>
  );
};

// ============ HOME PAGE ============
const HomePage = ({ apps, onDownload, unlockedApps, loading, settings }: {
  apps: AppData[]; onDownload: (a: AppData) => void; unlockedApps: number[]; loading: boolean; settings: SiteSettings | null;
}) => {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All');
  const pub = apps.filter(a => a.published);
  const cats = ['All', ...Array.from(new Set(pub.map(a => a.category).filter(Boolean)))];
  const filtered = pub.filter(a =>
    (a.name.toLowerCase().includes(search.toLowerCase()) || a.description?.toLowerCase().includes(search.toLowerCase())) &&
    (cat === 'All' || a.category === cat)
  );
  const totalDL = pub.reduce((s, a) => s + (parseInt(a.downloads) || 0), 0);

  return (
    <>
      {/* HERO */}
      <section style={{ padding: '110px 16px 90px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,107,53,0.07) 0%, transparent 55%)' }} />
        <div style={{ position: 'absolute', top: '-15%', left: '50%', transform: 'translateX(-50%)', width: 700, height: 500, background: 'radial-gradient(ellipse, rgba(255,107,53,0.1) 0%, transparent 65%)', filter: 'blur(70px)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.2)', borderRadius: 999, padding: '9px 18px', marginBottom: 30, fontSize: 13, color: 'rgba(255,160,80,0.95)' }}>
            <Sparkles size={13} style={{ color: C.orange }} />Your Trusted App Source<Zap size={11} style={{ color: C.gold }} />
          </div>

          <h1 style={{ fontSize: 'clamp(44px, 9vw, 92px)', fontWeight: 900, lineHeight: 1.06, marginBottom: 22, letterSpacing: -2 }}>
            <span className="glow-text" style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #FFB800 50%, #FCD34D 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>SunRise</span>
            <br />
            <span style={{ color: 'white' }}>Apps</span>
          </h1>

          <p style={{ fontSize: 'clamp(15px, 2.8vw, 19px)', color: C.textMuted, maxWidth: 500, margin: '0 auto 44px', lineHeight: 1.8 }}>
            Get the latest <span style={{ color: C.orange, fontWeight: 600 }}>viral Android tools</span> — free, safe & always updated 🚀
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', marginBottom: 64 }}>
            <button onClick={() => document.getElementById('apps')?.scrollIntoView({ behavior: 'smooth' })} className="btn-primary" style={{ padding: '14px 36px', fontSize: 15, borderRadius: 14, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 6px 24px rgba(255,107,53,0.28)' }}>
              <Download size={17} /> Explore Apps
            </button>
            <button onClick={() => document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth' })} className="btn-ghost" style={{ padding: '14px 28px', fontSize: 15, borderRadius: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Heart size={15} /> Learn More
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', maxWidth: 450, margin: '0 auto', gap: 14 }}>
            {[
              { v: formatDownloads(totalDL.toString()) + '+', l: 'Downloads', ic: <Download size={17} />, c: C.orange, bg: 'rgba(255,107,53,0.1)', bc: 'rgba(255,107,53,0.2)' },
              { v: pub.filter(a => a.apk_link && a.apk_link !== '#').length + '+', l: 'Apps Live', ic: <Smartphone size={17} />, c: C.blue, bg: 'rgba(96,165,250,0.1)', bc: 'rgba(96,165,250,0.2)' },
              { v: '4.9★', l: 'Avg Rating', ic: <Star size={17} />, c: C.purple, bg: 'rgba(168,85,247,0.1)', bc: 'rgba(168,85,247,0.2)' },
            ].map((s, i) => (
              <div key={i} style={{ background: s.bg, border: `1px solid ${s.bc}`, borderRadius: 16, padding: '18px 12px', textAlign: 'center' }}>
                <div style={{ color: s.c, marginBottom: 8, display: 'flex', justifyContent: 'center' }}>{s.ic}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'white', lineHeight: 1 }}>{s.v}</div>
                <div style={{ fontSize: 11, color: C.textFaint, marginTop: 5 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 860, margin: '0 auto 28px', padding: '0 16px' }}>
        <AdBanner settings={settings} />
      </div>

      {/* APP GRID */}
      <section id="apps" style={{ padding: '60px 16px 80px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 999, padding: '5px 14px', marginBottom: 14, fontSize: 11, color: 'rgba(168,85,247,0.85)' }}>
              <TrendingUp size={11} /> Trending Now
            </div>
            <h2 style={{ fontSize: 'clamp(26px, 5vw, 44px)', fontWeight: 800, color: 'white', marginBottom: 12 }}>
              App <span style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Collection</span>
            </h2>
            <p style={{ color: C.textMuted, fontSize: 15, lineHeight: 1.7 }}>All apps free — watch a short ad to download</p>
          </div>

          {/* Search */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 36, maxWidth: 560, margin: '0 auto 36px' }}>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.textFaint, pointerEvents: 'none' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search apps..." className="input-base" style={{ paddingLeft: 40 }} />
            </div>
            <div style={{ position: 'relative' }}>
              <Filter size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.textFaint, pointerEvents: 'none' }} />
              <select value={cat} onChange={e => setCat(e.target.value)} className="input-base" style={{ paddingLeft: 32, paddingRight: 36, appearance: 'none', cursor: 'pointer' }}>
                {cats.map(c => <option key={c} value={c} style={{ background: '#1E1E1E' }}>{c}</option>)}
              </select>
              <ChevronDown size={13} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: C.textFaint, pointerEvents: 'none' }} />
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 20 }}>
              {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="shimmer-skeleton" style={{ height: 260 }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '72px 0' }}>
              <div style={{ width: 72, height: 72, margin: '0 auto 18px', borderRadius: 20, background: C.bgCard, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Search size={28} style={{ color: 'rgba(255,255,255,0.12)' }} />
              </div>
              <p style={{ color: C.textMuted, fontSize: 17, fontWeight: 500 }}>No apps found</p>
              <p style={{ color: C.textFaint, fontSize: 13, marginTop: 6 }}>Try a different search term or category</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 20 }}>
              {filtered.map(app => <AppCard key={app.id} app={app} onDownload={onDownload} unlocked={unlockedApps.includes(app.id)} />)}
            </div>
          )}
        </div>
      </section>
      <div style={{ maxWidth: 760, margin: '0 auto 60px', padding: '0 16px' }}>
        <AdBanner variant="rectangle" settings={settings} />
      </div>
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

  return (
    <section style={{ padding: '100px 16px 80px', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <div style={{ maxWidth: 400, margin: '0 auto', width: '100%' }}>
        <div className="fade-in" style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 22, padding: '36px 28px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
          <div style={{ width: 76, height: 76, margin: '0 auto 22px', borderRadius: 22, background: 'rgba(255,107,53,0.12)', border: '1px solid rgba(255,107,53,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <KeyRound style={{ color: C.orange }} size={30} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'white', marginBottom: 6 }}>Admin Access</h2>
          <p style={{ color: C.textMuted, fontSize: 13.5, marginBottom: 28, lineHeight: 1.6 }}>Sign in with your Supabase credentials</p>
          {err && (
            <div style={{ marginBottom: 18, padding: '11px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, color: C.red, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' }}>
              <AlertTriangle size={13} style={{ flexShrink: 0 }} />{err}
            </div>
          )}
          <form onSubmit={handle} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: C.textFaint, marginBottom: 6, fontWeight: 600, letterSpacing: 0.5 }}>EMAIL ADDRESS</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@example.com" required className="input-base" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: C.textFaint, marginBottom: 6, fontWeight: 600, letterSpacing: 0.5 }}>PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••••" required className="input-base" style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: C.textFaint, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '13px', borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.55 : 1, fontSize: 14, marginTop: 4 }}>
              {loading ? <Loader2 size={17} className="spin" /> : <Lock size={17} />}
              {loading ? 'Signing in...' : 'Unlock Admin Panel'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

// ============ MONETIZATION TAB ============
const MonetizationTab = ({ addToast }: { addToast: (msg: string, type: ToastItem['type']) => void }) => {
  const [settings, setSettings] = useState<SiteSettings>({ ads_enabled: false, ad_client_id: '', ad_slot_header: '', ad_slot_sidebar: '', ad_slot_article: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data, error } = await supabase.from('settings').select('*').single();
        if (error && error.code !== 'PGRST116') throw error;
        if (data) setSettings(data);
      } catch (e: any) { addToast(`❌ ${e.message}`, 'error'); }
      finally { setLoading(false); }
    };
    fetch();
  }, [addToast]);

  const save = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase.from('settings').select('id').single();
      if (existing) {
        const { error } = await supabase.from('settings').update({ ...settings, updated_at: new Date().toISOString() }).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('settings').insert([{ ...settings }]);
        if (error) throw error;
      }
      addToast('✅ Monetization settings saved!', 'success');
    } catch (e: any) { addToast(`❌ ${e.message}`, 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><Loader2 size={28} className="spin" style={{ color: C.orange, margin: '0 auto' }} /></div>;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <DollarSign size={18} style={{ color: C.gold }} /> Google AdSense Settings
        </h3>
        <p style={{ color: C.textMuted, fontSize: 13, lineHeight: 1.7 }}>Control all ads from here without touching the code. Toggle ads on/off and update your AdSense IDs anytime.</p>
      </div>

      {/* Master Toggle */}
      <div style={{ background: settings.ads_enabled ? 'rgba(52,211,153,0.06)' : 'rgba(251,191,36,0.06)', border: `1px solid ${settings.ads_enabled ? 'rgba(52,211,153,0.2)' : 'rgba(251,191,36,0.2)'}`, borderRadius: 16, padding: '18px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setSettings(s => ({ ...s, ads_enabled: !s.ads_enabled }))}>
        <div>
          <p style={{ fontWeight: 600, color: 'white', fontSize: 14, marginBottom: 4 }}>
            {settings.ads_enabled ? '🟢 Ads are ENABLED' : '🔴 Ads are DISABLED'}
          </p>
          <p style={{ color: C.textMuted, fontSize: 12 }}>{settings.ads_enabled ? 'Google AdSense is running on the website' : 'No ads are shown anywhere on the website'}</p>
        </div>
        {settings.ads_enabled ? <ToggleRight size={32} style={{ color: C.green, flexShrink: 0 }} /> : <ToggleLeft size={32} style={{ color: C.amber, flexShrink: 0 }} />}
      </div>

      {/* AdSense IDs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
        {[
          { key: 'ad_client_id', label: 'Publisher ID (data-ad-client)', ph: 'ca-pub-1234567890123456', hint: 'Your main AdSense publisher ID' },
          { key: 'ad_slot_header', label: 'Header Banner Slot ID', ph: '1234567890', hint: 'Ad slot for the top horizontal banner' },
          { key: 'ad_slot_sidebar', label: 'Rectangle/Sidebar Slot ID', ph: '0987654321', hint: 'Ad slot for the bottom rectangle banner' },
          { key: 'ad_slot_article', label: 'In-Article Slot ID (optional)', ph: '1122334455', hint: 'Ad slot for in-content placements' },
        ].map(f => (
          <div key={f.key}>
            <label style={{ display: 'block', fontSize: 11.5, color: C.textFaint, marginBottom: 5, fontWeight: 600 }}>{f.label}</label>
            <p style={{ fontSize: 11, color: 'rgba(228,228,228,0.2)', marginBottom: 6 }}>{f.hint}</p>
            <input value={(settings as any)[f.key] || ''} onChange={e => setSettings(s => ({ ...s, [f.key]: e.target.value }))} placeholder={f.ph} className="input-base" />
          </div>
        ))}
      </div>

      <div style={{ background: 'rgba(255,184,0,0.06)', border: '1px solid rgba(255,184,0,0.2)', borderRadius: 14, padding: '14px 16px', marginBottom: 22 }}>
        <p style={{ color: C.gold, fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>💡 How to get your AdSense IDs</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {['1. Go to adsense.google.com', '2. Ads → By ad unit → Create new ad unit', '3. Copy the data-ad-client value (ca-pub-xxxxx)', '4. Copy the data-ad-slot value for each placement', '5. Paste them in the fields above and Save'].map((s, i) => (
            <p key={i} style={{ fontSize: 12, color: C.textMuted }}>{s}</p>
          ))}
        </div>
      </div>

      <button onClick={save} disabled={saving} className="btn-primary" style={{ padding: '12px 28px', borderRadius: 13, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, opacity: saving ? 0.55 : 1 }}>
        {saving ? <Loader2 size={15} className="spin" /> : <Save size={15} />}
        {saving ? 'Saving...' : 'Save Monetization Settings'}
      </button>
    </div>
  );
};

// ============ TECH DOCS TAB ============
const TechDocsTab = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const CopyBtn = ({ text, k }: { text: string; k: string }) => (
    <button onClick={() => copyText(text, k)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied === k ? C.green : C.textFaint, padding: '2px 6px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
      {copied === k ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Copy</>}
    </button>
  );

  const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 18px', marginBottom: 16 }}>
      <h4 style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>{icon}{title}</h4>
      {children}
    </div>
  );

  const Row = ({ label, value, copyKey }: { label: string; value: string; copyKey: string }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 11, color: C.textFaint, marginBottom: 3, fontWeight: 600 }}>{label}</p>
        <p style={{ fontSize: 12.5, color: C.textMuted, fontFamily: 'monospace', wordBreak: 'break-all' }}>{value}</p>
      </div>
      <CopyBtn text={value} k={copyKey} />
    </div>
  );

  const Link = ({ label, url, icon }: { label: string; url: string; icon: React.ReactNode }) => (
    <a href={url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 8, transition: 'all 0.2s' }}>
      <span style={{ color: C.orange }}>{icon}</span>
      <span style={{ flex: 1, color: C.textMuted, fontSize: 13 }}>{label}</span>
      <ExternalLink size={13} style={{ color: C.textFaint, flexShrink: 0 }} />
    </a>
  );

  return (
    <div>
      <div style={{ background: 'rgba(255,107,53,0.06)', border: '1px solid rgba(255,107,53,0.18)', borderRadius: 16, padding: '16px 18px', marginBottom: 24 }}>
        <p style={{ color: C.orange, fontSize: 13, fontWeight: 600 }}>🔒 Admin Only — This section is not visible to the public</p>
        <p style={{ color: C.textMuted, fontSize: 12.5, marginTop: 4, lineHeight: 1.6 }}>All sensitive links, credentials, and technical documentation are stored here for your reference only.</p>
      </div>

      <Section title="Supabase Project" icon={<Database size={16} style={{ color: C.blue }} />}>
        <Row label="Project URL" value="https://onczdkiimtfpvohrpcxa.supabase.co" copyKey="url" />
        <Row label="Project Reference ID" value="onczdkiimtfpvohrpcxa" copyKey="ref" />
        <Row label="Anon Key (Public)" value="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uY3pka2lpbXRmcHZvaHJwY3hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczOTQwMDUsImV4cCI6MjA5Mjk3MDAwNX0.1_tll-fX9DvrDiOEisWmz0VOt2qnFMlqYO0DRvv_Kv8" copyKey="anon" />
        <Link label="Supabase Dashboard" url="https://supabase.com/dashboard/project/onczdkiimtfpvohrpcxa" icon={<Database size={14} />} />
        <Link label="Table Editor" url="https://supabase.com/dashboard/project/onczdkiimtfpvohrpcxa/editor" icon={<Layers size={14} />} />
        <Link label="Storage Buckets" url="https://supabase.com/dashboard/project/onczdkiimtfpvohrpcxa/storage/buckets" icon={<HardDrive size={14} />} />
        <Link label="Authentication" url="https://supabase.com/dashboard/project/onczdkiimtfpvohrpcxa/auth/users" icon={<Key size={14} />} />
      </Section>

      <Section title="Deployment" icon={<Server size={16} style={{ color: C.green }} />}>
        <Link label="Vercel Dashboard" url="https://vercel.com/dashboard" icon={<Server size={14} />} />
        <Link label="GitHub Repository" url="https://github.com" icon={<GitBranch size={14} />} />
        <div style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: 12, padding: '12px 14px', marginTop: 8 }}>
          <p style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.7 }}>
            <strong style={{ color: C.green }}>Deploy command:</strong> git add . → git commit -m "update" → git push<br />
            <strong style={{ color: C.green }}>Build command:</strong> npm run build<br />
            <strong style={{ color: C.green }}>Output dir:</strong> dist
          </p>
        </div>
      </Section>

      <Section title="Admin Credentials" icon={<Key size={16} style={{ color: C.amber }} />}>
        <Row label="Admin Email" value="admin@sunriseapps.com" copyKey="email" />
        <Row label="Admin Password" value="SunRise@2026" copyKey="pass" />
        <div style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: 12, padding: '12px 14px', marginTop: 4 }}>
          <p style={{ fontSize: 12, color: C.textMuted }}>⚠️ Change password regularly in Supabase → Authentication → Users</p>
        </div>
      </Section>

      <Section title="Monetization Links" icon={<DollarSign size={16} style={{ color: C.gold }} />}>
        <Link label="Google AdSense Dashboard" url="https://adsense.google.com" icon={<DollarSign size={14} />} />
        <Link label="Google Analytics" url="https://analytics.google.com" icon={<BarChart3 size={14} />} />
        <Link label="Google AdMob" url="https://admob.google.com" icon={<MonitorSmartphone size={14} />} />
      </Section>

      <Section title="Quick SQL Reference" icon={<Database size={16} style={{ color: C.purple }} />}>
        {[
          { label: 'View all apps', sql: 'SELECT * FROM apps ORDER BY created_at DESC;' },
          { label: 'View all feedbacks', sql: 'SELECT * FROM feedbacks ORDER BY created_at DESC;' },
          { label: 'Count published apps', sql: "SELECT COUNT(*) FROM apps WHERE published = TRUE;" },
          { label: 'View settings', sql: 'SELECT * FROM settings;' },
        ].map((q, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <p style={{ fontSize: 11, color: C.textFaint, fontWeight: 600 }}>{q.label}</p>
              <CopyBtn text={q.sql} k={`sql-${i}`} />
            </div>
            <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 10, padding: '10px 12px', fontFamily: 'monospace', fontSize: 12, color: '#67e8f9' }}>{q.sql}</div>
          </div>
        ))}
      </Section>
    </div>
  );
};

// ============ ADMIN PAGE ============
const AdminPage = ({ apps, onLogout, session, refreshApps, isRefreshing, addToast }: {
  apps: AppData[]; onLogout: () => void; session: Session | null;
  refreshApps: () => Promise<void>; isRefreshing: boolean;
  addToast: (msg: string, type: ToastItem['type']) => void;
}) => {
  const [tab, setTab] = useState<'apps' | 'feedbacks' | 'monetization' | 'docs'>('apps');
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
    if (form.apk_link && form.apk_link !== '#' && !form.apk_link.startsWith('http')) { addToast('❌ APK link must be a valid URL', 'error'); return false; }
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
        addToast('✅ App updated!', 'success');
      } else {
        const { error } = await supabase.from('apps').insert([form]);
        if (error) throw error;
        addToast('✅ App added!', 'success');
      }
      await refreshApps(); closeForm();
    } catch (e: any) { addToast(`❌ ${e.message}`, 'error'); }
    finally { setSaving(false); }
  };

  const del = async (id: number) => {
    if (!confirm('Permanently delete this app?')) return;
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
  const iS: React.CSSProperties = { width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', color: C.text, fontSize: 13.5, outline: 'none', transition: 'all 0.2s' };

  const tabs = [
    { k: 'apps' as const, ic: <Smartphone size={14} />, lb: 'Apps', c: C.orange },
    { k: 'feedbacks' as const, ic: <MessageSquare size={14} />, lb: 'Feedbacks', c: C.blue, badge: unread },
    { k: 'monetization' as const, ic: <DollarSign size={14} />, lb: 'Monetization', c: C.gold },
    { k: 'docs' as const, ic: <FileText size={14} />, lb: 'Tech Docs', c: C.purple },
  ];

  return (
    <section style={{ padding: '100px 16px 80px' }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <div style={{ width: 40, height: 40, borderRadius: 13, background: 'rgba(255,107,53,0.12)', border: '1px solid rgba(255,107,53,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Settings style={{ color: C.orange }} size={19} />
              </div>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: 'white' }}>Admin Panel</h2>
            </div>
            <p style={{ color: C.textMuted, fontSize: 13 }}>Logged in as <span style={{ color: C.orange, fontWeight: 500 }}>{session?.user?.email}</span></p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button onClick={refreshApps} disabled={isRefreshing} className="btn-ghost" style={{ padding: '9px 14px', borderRadius: 13, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, opacity: isRefreshing ? 0.5 : 1 }}>
              {isRefreshing ? <Loader2 size={12} className="spin" /> : <RefreshCw size={12} />} Refresh
            </button>
            <button onClick={openAdd} className="btn-primary" style={{ padding: '9px 16px', borderRadius: 13, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={13} /> Add New App
            </button>
            <button onClick={onLogout} style={{ padding: '9px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 13, color: C.red, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <LogOut size={12} /> Logout
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 24 }}>
          {[
            { l: 'Total Apps', v: apps.length, c: 'white', bg: 'rgba(255,255,255,0.03)', bc: C.border, ic: <Layers size={14} /> },
            { l: 'Published', v: pubC, c: C.green, bg: 'rgba(52,211,153,0.07)', bc: 'rgba(52,211,153,0.18)', ic: <Eye size={14} /> },
            { l: 'Drafts', v: draftC, c: C.amber, bg: 'rgba(251,191,36,0.07)', bc: 'rgba(251,191,36,0.18)', ic: <EyeOff size={14} /> },
            { l: 'Feedbacks', v: feedbacks.length, c: C.blue, bg: 'rgba(96,165,250,0.07)', bc: 'rgba(96,165,250,0.18)', ic: <MessageSquare size={14} />, badge: unread },
          ].map((s, i) => (
            <div key={i} style={{ background: s.bg, border: `1px solid ${s.bc}`, borderRadius: 14, padding: '14px', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: s.c, marginBottom: 8, opacity: 0.7 }}>{s.ic}<span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.3 }}>{s.l.toUpperCase()}</span></div>
              <p style={{ fontSize: 26, fontWeight: 800, color: s.c, lineHeight: 1 }}>{s.v}</p>
              {s.badge != null && s.badge > 0 && <span className="pulse" style={{ position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: '50%', background: C.orange, color: 'black', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.badge}</span>}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
          {tabs.map(t => (
            <button key={t.k} onClick={() => { setTab(t.k); if (t.k === 'feedbacks') fetchFb(); }} style={{
              padding: '9px 16px', borderRadius: 13, fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer',
              background: tab === t.k ? `${t.c}18` : 'transparent',
              color: tab === t.k ? t.c : C.textFaint,
              border: `1px solid ${tab === t.k ? `${t.c}30` : 'transparent'}`,
              transition: 'all 0.2s'
            }}>
              {t.ic}{t.lb}
              {t.badge != null && t.badge > 0 && <span style={{ width: 17, height: 17, borderRadius: '50%', background: C.orange, color: 'black', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.badge}</span>}
            </button>
          ))}
        </div>

        {/* ===== APPS TAB ===== */}
        {tab === 'apps' && (
          <>
            {showForm && (
              <div className="slide-down" style={{ background: C.bgCard, border: '1px solid rgba(255,107,53,0.22)', borderRadius: 20, padding: '24px 20px', marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {editId !== null ? <><Edit3 size={17} style={{ color: C.orange }} />Edit App</> : <><Plus size={17} style={{ color: C.orange }} />Add New App</>}
                  </h3>
                  <button onClick={closeForm} style={{ color: C.textFaint, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={17} /></button>
                </div>

                {/* Basic Info */}
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 11, color: C.orange, fontWeight: 700, letterSpacing: 0.5, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}><BarChart3 size={11} />BASIC INFORMATION</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12 }}>
                    {[
                      { k: 'name', l: 'App Name *', ph: 'My Awesome App' },
                      { k: 'version', l: 'Version', ph: '1.0.0' },
                      { k: 'icon', l: 'Icon Emoji', ph: '📱' },
                      { k: 'category', l: 'Category', ph: 'Tools / Games / Utilities...' },
                      { k: 'rating', l: 'Rating (0–5)', ph: '4.5' },
                      { k: 'downloads', l: 'Downloads Count', ph: '10000' },
                      { k: 'size', l: 'File Size', ph: '4.5 MB' },
                      { k: 'updated', l: 'Last Updated', ph: '', type: 'date' },
                    ].map(f => (
                      <div key={f.k}>
                        <label style={{ display: 'block', fontSize: 11, color: C.textFaint, marginBottom: 5, fontWeight: 600 }}>{f.l}</label>
                        <input type={f.type || 'text'} value={String((form as any)[f.k] ?? '')} onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))} placeholder={f.ph} style={iS} className="input-base" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 11, color: C.textFaint, marginBottom: 5, fontWeight: 600 }}>DESCRIPTION (supports emojis 🎉)</label>
                  <textarea value={form.description ?? ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe what this app does, its features and benefits..." rows={4} style={{ ...iS, resize: 'vertical', minHeight: 90, lineHeight: 1.7 }} className="input-base" />
                </div>

                {/* APK Section */}
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 11, color: C.orange, fontWeight: 700, letterSpacing: 0.5, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}><Package size={11} />APK FILE</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: C.textFaint, marginBottom: 5, fontWeight: 600 }}>MANUAL URL (GitHub, Google Drive, etc.)</label>
                      <input value={form.apk_link ?? ''} onChange={e => setForm(p => ({ ...p, apk_link: e.target.value }))} placeholder="https://github.com/user/repo/releases/download/v1.0/app.apk" style={iS} className="input-base" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                      <span style={{ fontSize: 11, color: C.textFaint }}>OR UPLOAD DIRECTLY TO SUPABASE</span>
                      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                    </div>
                    <FileUpload
                      label="UPLOAD APK FILE (max 100MB)"
                      hint="Stored in Supabase Storage — direct download link auto-fills"
                      accept=".apk,application/vnd.android.package-archive"
                      bucket="apks" folder="uploads"
                      currentUrl={form.apk_link?.includes('supabase') ? form.apk_link : undefined}
                      onUploadComplete={url => setForm(p => ({ ...p, apk_link: url }))}
                      addToast={addToast}
                    />
                  </div>
                </div>

                {/* Icon & Badge */}
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 11, color: C.orange, fontWeight: 700, letterSpacing: 0.5, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}><FileImage size={11} />ICON & BADGE</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12 }}>
                    <div>
                      <FileUpload
                        label="UPLOAD APP ICON (PNG/JPG, max 5MB)"
                        hint="Recommended: 512×512px transparent background"
                        accept="image/png,image/jpeg,image/webp"
                        bucket="icons" folder="app-icons"
                        currentUrl={form.icon_url || undefined}
                        onUploadComplete={url => setForm(p => ({ ...p, icon_url: url }))}
                        addToast={addToast}
                      />
                      {form.icon_url && (
                        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img src={form.icon_url} alt="preview" style={{ width: 48, height: 48, borderRadius: 13, objectFit: 'cover', border: `1px solid ${C.border}` }} />
                          <div>
                            <p style={{ fontSize: 11, color: C.green }}>✅ Icon uploaded</p>
                            <button onClick={() => setForm(p => ({ ...p, icon_url: '' }))} style={{ fontSize: 11, color: C.red, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 3 }}>Remove icon</button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: C.textFaint, marginBottom: 5, fontWeight: 600 }}>APP BADGE</label>
                      <select value={form.badge} onChange={e => setForm(p => ({ ...p, badge: e.target.value }))} style={iS} className="input-base">
                        <option value="New" style={{ background: '#1E1E1E' }}>✨ New</option>
                        <option value="Viral" style={{ background: '#1E1E1E' }}>🔥 Viral</option>
                        <option value="PRO" style={{ background: '#1E1E1E' }}>⭐ PRO</option>
                      </select>
                      <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}` }}>
                        <p style={{ fontSize: 11, color: C.textFaint, marginBottom: 6 }}>Badge Preview:</p>
                        <span style={{ display: 'inline-block', padding: '3px 11px', borderRadius: 999, fontSize: 10, fontWeight: 700, color: 'white', background: getBadgeGradient(form.badge || 'New') }}>
                          {form.badge === 'Viral' ? '🔥 ' : form.badge === 'PRO' ? '⭐ ' : '✨ '}{form.badge || 'New'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Visibility */}
                <div style={{ marginBottom: 22 }}>
                  <p style={{ fontSize: 11, color: C.orange, fontWeight: 700, letterSpacing: 0.5, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Eye size={11} />VISIBILITY</p>
                  <button type="button" onClick={() => setForm(p => ({ ...p, published: !p.published }))} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '14px 16px', borderRadius: 13, cursor: 'pointer', transition: 'all 0.2s',
                    background: form.published ? 'rgba(52,211,153,0.07)' : 'rgba(251,191,36,0.07)',
                    border: `1px solid ${form.published ? 'rgba(52,211,153,0.22)' : 'rgba(251,191,36,0.22)'}`,
                    color: form.published ? C.green : C.amber
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, fontWeight: 500 }}>
                      {form.published ? <Eye size={16} /> : <EyeOff size={16} />}
                      {form.published ? '🟢 Published — Visible to everyone on the website' : '📝 Draft — Hidden from website'}
                    </span>
                    {form.published ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 10, paddingTop: 18, borderTop: `1px solid ${C.border}` }}>
                  <button onClick={save} disabled={saving} className="btn-primary" style={{ padding: '12px 24px', borderRadius: 13, fontSize: 14, display: 'flex', alignItems: 'center', gap: 7, opacity: saving ? 0.55 : 1 }}>
                    {saving ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
                    {saving ? 'Saving...' : editId !== null ? 'Update App' : 'Add App'}
                  </button>
                  <button onClick={closeForm} className="btn-ghost" style={{ padding: '12px 20px', borderRadius: 13, fontSize: 14 }}>Cancel</button>
                </div>
              </div>
            )}

            {/* Filters */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 18 }}>
              {(['all', 'published', 'draft'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: '7px 14px', borderRadius: 13, fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
                  background: filter === f ? 'rgba(255,107,53,0.1)' : 'rgba(255,255,255,0.03)',
                  color: filter === f ? C.orange : C.textFaint,
                  border: `1px solid ${filter === f ? 'rgba(255,107,53,0.25)' : C.border}`
                }}>
                  {f === 'all' ? `All (${apps.length})` : f === 'published' ? `🟢 Published (${pubC})` : `📝 Drafts (${draftC})`}
                </button>
              ))}
            </div>

            {/* App List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {fa.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: C.textFaint }}>
                  <Inbox size={38} style={{ margin: '0 auto 14px', display: 'block', opacity: 0.4 }} />
                  <p style={{ fontSize: 15 }}>No apps here</p>
                  <button onClick={openAdd} style={{ marginTop: 14, padding: '8px 16px', background: 'rgba(255,107,53,0.08)', color: C.orange, borderRadius: 11, fontSize: 13, border: '1px solid rgba(255,107,53,0.18)', cursor: 'pointer' }}>+ Add your first app</button>
                </div>
              ) : fa.map(app => (
                <div key={app.id} style={{ background: C.bgCard, border: `1px solid ${app.published ? 'rgba(52,211,153,0.15)' : C.border}`, borderRadius: 15, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, opacity: app.published ? 1 : 0.65, transition: 'all 0.2s' }}>
                  <div style={{ width: 48, height: 48, flexShrink: 0, background: 'rgba(255,107,53,0.07)', borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, overflow: 'hidden', border: `1px solid ${C.border}` }}>
                    {app.icon_url ? <img src={app.icon_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : app.icon || '📱'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: 'white', fontSize: 14 }}>{app.name}</span>
                      <span style={{ background: getBadgeGradient(app.badge), padding: '2px 8px', borderRadius: 999, fontSize: 9, fontWeight: 700, color: 'white' }}>{app.badge}</span>
                      <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 9, fontWeight: 500, background: app.published ? 'rgba(52,211,153,0.12)' : 'rgba(251,191,36,0.12)', color: app.published ? C.green : C.amber }}>
                        {app.published ? '🟢 Live' : '📝 Draft'}
                      </span>
                    </div>
                    <p style={{ color: C.textFaint, fontSize: 11.5 }}>v{app.version} · {app.size} · {app.category} · ⬇️ {formatDownloads(app.downloads)}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => togglePub(app.id, app.published)} className="action-btn" style={{ background: app.published ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', color: app.published ? C.green : C.amber, border: `1px solid ${app.published ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}` }}>
                      {app.published ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>
                    <button onClick={() => openEdit(app)} className="action-btn" style={{ background: 'rgba(255,107,53,0.1)', color: C.orange, border: '1px solid rgba(255,107,53,0.2)' }}><Edit3 size={13} /></button>
                    <button onClick={() => del(app.id)} className="action-btn" style={{ background: 'rgba(239,68,68,0.08)', color: C.red, border: '1px solid rgba(239,68,68,0.15)' }}><Trash2 size={13} /></button>
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
              <p style={{ color: C.textMuted, fontSize: 13 }}>{feedbacks.length} total · <span style={{ color: C.orange, fontWeight: 500 }}>{unread} unread</span></p>
              <button onClick={fetchFb} disabled={fbLoading} className="btn-ghost" style={{ padding: '7px 12px', borderRadius: 11, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, opacity: fbLoading ? 0.5 : 1 }}>
                {fbLoading ? <Loader2 size={11} className="spin" /> : <RefreshCw size={11} />} Refresh
              </button>
            </div>
            {fbLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1, 2, 3].map(i => <div key={i} className="shimmer-skeleton" style={{ height: 76 }} />)}
              </div>
            ) : feedbacks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '72px 0', color: C.textFaint }}>
                <Inbox size={38} style={{ margin: '0 auto 14px', display: 'block', opacity: 0.4 }} />
                <p>No feedbacks yet</p>
                <p style={{ fontSize: 12, marginTop: 6, opacity: 0.5 }}>Messages from users will appear here</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {feedbacks.map(fb => (
                  <div key={fb.id} style={{ border: `1px solid ${!fb.read ? 'rgba(255,107,53,0.22)' : C.border}`, borderRadius: 14, overflow: 'hidden', background: !fb.read ? 'rgba(255,107,53,0.025)' : C.bgCard }}>
                    <div onClick={() => { setExpandFb(expandFb === fb.id ? null : fb.id); if (!fb.read) markRead(fb.id); }} style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 11, cursor: 'pointer' }}>
                      <div style={{ width: 9, height: 9, borderRadius: '50%', marginTop: 5, flexShrink: 0, background: !fb.read ? C.orange : 'rgba(255,255,255,0.1)' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, color: 'white', fontSize: 13.5 }}>{fb.name}</span>
                          <span style={{ color: C.textFaint, fontSize: 12 }}>{fb.email}</span>
                          <span style={{ padding: '2px 8px', borderRadius: 8, fontSize: 10, background: fb.subject === 'Bug Report' ? 'rgba(239,68,68,0.09)' : fb.subject === 'Feature Request' ? 'rgba(59,130,246,0.09)' : 'rgba(255,255,255,0.05)', color: fb.subject === 'Bug Report' ? C.red : fb.subject === 'Feature Request' ? C.blue : C.textMuted, border: `1px solid ${C.border}` }}>{fb.subject}</span>
                          {!fb.read && <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 9, background: 'rgba(255,107,53,0.12)', color: C.orange, fontWeight: 600 }}>NEW</span>}
                        </div>
                        <p style={{ color: C.textMuted, fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.6 }}>{fb.message}</p>
                        <p style={{ color: C.textFaint, fontSize: 10.5, marginTop: 4 }}>{formatTimeAgo(fb.created_at)}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                        {expandFb === fb.id ? <ChevronUp size={13} style={{ color: C.textFaint }} /> : <ChevronDown size={13} style={{ color: C.textFaint }} />}
                        <button onClick={e => { e.stopPropagation(); deleteFb(fb.id); }} style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textFaint, border: 'none', cursor: 'pointer', padding: 0, marginLeft: 4 }}><Trash2 size={11} /></button>
                      </div>
                    </div>
                    {expandFb === fb.id && (
                      <div style={{ padding: '0 18px 18px' }}>
                        <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 13, padding: '14px 16px', border: `1px solid ${C.border}` }}>
                          <p style={{ color: C.text, fontSize: 13.5, lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>{fb.message}</p>
                        </div>
                        <a href={`mailto:${fb.email}?subject=Re: ${fb.subject} — SunRise Apps`} style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: C.orange, textDecoration: 'none', fontWeight: 500 }}>
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

        {/* ===== MONETIZATION TAB ===== */}
        {tab === 'monetization' && <MonetizationTab addToast={addToast} />}

        {/* ===== TECH DOCS TAB ===== */}
        {tab === 'docs' && <TechDocsTab />}
      </div>
    </section>
  );
};

// ============ ABOUT ============
const AboutSection = () => (
  <section id="about-section" style={{ padding: '80px 16px' }}>
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 22, padding: '36px 28px', position: 'relative', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 220, height: 220, background: 'radial-gradient(circle, rgba(255,107,53,0.1), transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, position: 'relative', zIndex: 1 }}>
          <div style={{ width: 110, height: 110, background: 'linear-gradient(135deg, #FF6B35, #FFB800)', borderRadius: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 46, boxShadow: '0 14px 36px rgba(255,107,53,0.3)', flexShrink: 0 }}>🌅</div>
          <div style={{ textAlign: 'center', maxWidth: 540 }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: 'white', marginBottom: 16 }}>
              About <span style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SunRise Apps</span>
            </h2>
            <p style={{ color: C.textMuted, marginBottom: 12, lineHeight: 1.85, fontSize: 14.5 }}>Independent Android developer from India 🇮🇳, building viral utility apps that solve real everyday problems.</p>
            <p style={{ color: C.textMuted, marginBottom: 24, lineHeight: 1.85, fontSize: 14.5 }}>Every sunrise brings new possibilities — free tools for everyone, powered by non-intrusive ads.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
              <a href="https://instagram.com/SunRise_Apps" target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 16px', background: 'rgba(236,72,153,0.09)', border: '1px solid rgba(236,72,153,0.18)', borderRadius: 13, color: '#f472b6', fontSize: 13 }}>📸 @SunRise_Apps</a>
              <a href="mailto:thesunrisecode@gmail.com" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 16px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 13, color: C.textMuted, fontSize: 13 }}><Mail size={14} /> thesunrisecode@gmail.com</a>
              <a href="https://sunriseapps.in" target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 16px', background: 'rgba(255,107,53,0.09)', border: '1px solid rgba(255,107,53,0.18)', borderRadius: 13, color: C.orange, fontSize: 13 }}><Globe size={14} /> sunriseapps.in</a>
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
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ width: 72, height: 72, margin: '0 auto 16px', borderRadius: 20, background: 'linear-gradient(135deg, rgba(255,107,53,0.15), rgba(255,184,0,0.1))', border: '1px solid rgba(255,107,53,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldCheck style={{ color: C.orange }} size={32} />
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: 'white', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          Privacy <span style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Policy</span>
        </h2>
        <p style={{ color: C.textMuted, fontSize: 14, lineHeight: 1.7 }}>Your privacy is our priority. We collect only what is necessary.</p>
      </div>

      {/* Trust Badges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 28 }}>
        {[
          { icon: <HardDrive size={16} />, title: 'Offline Processing', desc: 'Apps work without sending your data anywhere', bold: true },
          { icon: <Wifi size={16} />, title: 'No Data Upload', desc: 'We never upload your personal files or data', bold: true },
          { icon: <ShieldCheck size={16} />, title: 'HTTPS Encrypted', desc: 'All connections secured with SSL/TLS' },
          { icon: <Eye size={16} />, title: 'Transparent', desc: 'Clear about what we collect and why' },
        ].map((b, i) => (
          <div key={i} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px', display: 'flex', gap: 10 }}>
            <div style={{ color: C.orange, flexShrink: 0, marginTop: 2 }}>{b.icon}</div>
            <div>
              <p style={{ fontSize: 12.5, fontWeight: b.bold ? 700 : 600, color: b.bold ? C.orange : 'white', marginBottom: 3 }}>{b.title}</p>
              <p style={{ fontSize: 11.5, color: C.textMuted, lineHeight: 1.6 }}>{b.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 20, padding: '24px 22px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        {[
          { t: '1. Data We Collect', d: 'We collect only what you voluntarily provide through the contact form (name, email, message). No tracking scripts, no cookies without consent, no hidden data collection.' },
          { t: '2. Advertisements', d: 'Google AdSense and AdMob may use anonymous device identifiers for personalized ads. You may opt out at any time via your device settings or at g.co/privacytools.' },
          { t: '3. Data Security', d: 'All data transmission is secured with HTTPS/TLS encryption. Your contact form data is stored securely in our database and never sold or shared with third parties.' },
          { t: '4. Third-Party Services', d: 'We use Supabase (database), Google Analytics (traffic insights), and Google AdSense. Each operates under their own privacy policy, which we encourage you to review.' },
          { t: '5. Children\'s Privacy', d: 'Our services are not directed at children under 13. We do not knowingly collect personal information from minors. If discovered, such data will be immediately deleted.' },
          { t: '6. Your Rights', d: 'You have the right to request deletion of your data at any time. Contact us at thesunrisecode@gmail.com and we will respond within 48 hours.' },
          { t: '7. Policy Updates', d: 'We may update this policy occasionally. Significant changes will be communicated clearly. Continued use of our services after changes constitutes acceptance.' },
        ].map((p, i, arr) => (
          <div key={i} style={{ marginBottom: i < arr.length - 1 ? 24 : 0, paddingBottom: i < arr.length - 1 ? 24 : 0, borderBottom: i < arr.length - 1 ? `1px solid rgba(255,255,255,0.05)` : 'none' }}>
            <h3 style={{ fontSize: 13.5, fontWeight: 700, color: C.orange, marginBottom: 8 }}>{p.t}</h3>
            <p style={{ color: C.textMuted, fontSize: 13.5, lineHeight: 1.9 }}>{p.d}</p>
          </div>
        ))}
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid rgba(255,255,255,0.06)`, textAlign: 'center' }}>
          <p style={{ color: C.textFaint, fontSize: 12 }}>Last updated: January 2026 · SunRise Apps · thesunrisecode@gmail.com</p>
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

  return (
    <section style={{ padding: '80px 16px' }}>
      <div style={{ maxWidth: 580, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: 'white', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <Mail style={{ color: C.orange }} size={26} />
            Contact <span style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Us</span>
          </h2>
          <p style={{ color: C.textMuted, fontSize: 14, lineHeight: 1.7 }}>Have a question or suggestion? We'd love to hear from you.</p>
        </div>
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 20, padding: '24px 22px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '36px 0' }} className="fade-in">
              <div style={{ width: 76, height: 76, margin: '0 auto 18px', borderRadius: 22, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle style={{ color: C.green }} size={34} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 8 }}>Message Sent!</h3>
              <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 24, lineHeight: 1.7 }}>We've received your message and will reply within 24 hours.</p>
              <button onClick={() => setSent(false)} className="btn-ghost" style={{ padding: '10px 22px', borderRadius: 12, fontSize: 13 }}>Send Another</button>
            </div>
          ) : (
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: C.textFaint, marginBottom: 5, fontWeight: 600 }}>NAME *</label>
                  <input type="text" required value={fd.name} onChange={e => setFd(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" className="input-base" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: C.textFaint, marginBottom: 5, fontWeight: 600 }}>EMAIL *</label>
                  <input type="email" required value={fd.email} onChange={e => setFd(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" className="input-base" />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: C.textFaint, marginBottom: 5, fontWeight: 600 }}>SUBJECT</label>
                <select value={fd.subject} onChange={e => setFd(f => ({ ...f, subject: e.target.value }))} className="input-base">
                  {['General', 'Bug Report', 'Feature Request', 'Business', 'Other'].map(s => <option key={s} style={{ background: '#1E1E1E' }}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: C.textFaint, marginBottom: 5, fontWeight: 600 }}>MESSAGE *</label>
                <textarea required rows={5} value={fd.message} onChange={e => setFd(f => ({ ...f, message: e.target.value }))} placeholder="Tell us what's on your mind..." className="input-base" style={{ resize: 'vertical', minHeight: 120, lineHeight: 1.7 }} />
              </div>
              <button type="submit" disabled={busy} className="btn-primary" style={{ padding: '14px', borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: busy ? 0.55 : 1, fontSize: 14 }}>
                {busy ? <Loader2 size={17} className="spin" /> : <Mail size={17} />}
                {busy ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
          <div style={{ marginTop: 28, paddingTop: 20, borderTop: `1px solid rgba(255,255,255,0.06)`, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, textAlign: 'center' }}>
            {[
              { href: 'mailto:thesunrisecode@gmail.com', icon: <Mail size={18} />, label: 'Email Us' },
              { href: 'https://instagram.com/SunRise_Apps', icon: <span style={{ fontSize: 18 }}>📸</span>, label: '@SunRise_Apps', target: '_blank' },
              { href: 'https://sunriseapps.in', icon: <Globe size={18} />, label: 'Website', target: '_blank' },
            ].map((l, i) => (
              <a key={i} href={l.href} target={(l as any).target} rel="noreferrer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, color: C.textFaint, textDecoration: 'none', fontSize: 11.5, padding: '12px 8px', borderRadius: 12, transition: 'all 0.2s' }}>
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
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
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

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await supabase.from('settings').select('*').single();
      if (data) setSiteSettings(data);
    } catch (_) { }
  }, []);

  useEffect(() => { fetchApps(); fetchSettings(); }, [fetchApps, fetchSettings]);

  // Realtime apps
  useEffect(() => {
    const ch = supabase.channel('apps-live').on('postgres_changes', { event: '*', schema: 'public', table: 'apps' }, fetchApps).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchApps]);

  const logout = async () => { await supabase.auth.signOut(); setPage('home'); addToast('👋 Logged out', 'info'); };

  // FRICTIONLESS DOWNLOAD — triggers direct download
  const download = useCallback((app: AppData) => {
    if (unlocked.includes(app.id)) {
      addToast('⬇️ Starting download...', 'info');
      triggerDownload(app.apk_link, `${app.name.replace(/\s+/g, '-')}-v${app.version}.apk`);
    } else {
      setModal(app);
    }
  }, [unlocked, addToast]);

  const unlock = useCallback(() => {
    if (modal) {
      setUnlocked(p => [...p, modal.id]);
      addToast('⬇️ Starting download...', 'info');
      triggerDownload(modal.apk_link, `${modal.name.replace(/\s+/g, '-')}-v${modal.version}.apk`);
      setModal(null);
    }
  }, [modal, addToast]);

  const go = (p: string) => { setPage(p); setMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const navItems = [
    { id: 'home', label: 'Home', icon: <Sun size={14} /> },
    { id: 'about', label: 'About', icon: <Users size={14} /> },
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
        <p style={{ color: C.textMuted, fontSize: 13 }}>Loading SunRise Apps...</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text }}>
      <GlobalStyles />

      {/* Inject AdSense script if enabled */}
      {siteSettings?.ads_enabled && siteSettings.ad_client_id && (
        <script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${siteSettings.ad_client_id}`} crossOrigin="anonymous" />
      )}

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, background: 'rgba(18,18,18,0.92)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 62 }}>
            <button onClick={() => go('home')} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'white', flexShrink: 0 }}>
              <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg, #FF6B35, #FFB800)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(255,107,53,0.25)', flexShrink: 0 }}><Sun size={17} style={{ color: 'black' }} /></div>
              <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: -0.3 }}>Sun<span style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Rise</span><span style={{ color: C.textFaint, fontWeight: 400, fontSize: 14, marginLeft: 4 }}>Apps</span></span>
            </button>

            <div className="desktop-nav" style={{ display: 'none', alignItems: 'center', gap: 2 }}>
              {navItems.map(item => (
                <button key={item.id} onClick={() => go(item.id)} className="nav-btn" style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 11, fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', border: 'none',
                  background: page === item.id ? 'rgba(255,107,53,0.1)' : item.highlight ? 'rgba(255,184,0,0.07)' : 'transparent',
                  color: page === item.id ? C.orange : item.highlight ? C.gold : C.textFaint
                }}>
                  {item.icon}<span>{item.label}</span>
                </button>
              ))}
            </div>

            <button onClick={() => setMenuOpen(!menuOpen)} className="mobile-only btn-ghost" style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 11, padding: 0 }}>
              {menuOpen ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>

          {menuOpen && (
            <div className="slide-down" style={{ paddingBottom: 14, borderTop: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 3, paddingTop: 10 }}>
              {navItems.map(item => (
                <button key={item.id} onClick={() => go(item.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 11, width: '100%', padding: '11px 14px', borderRadius: 11, fontSize: 14, fontWeight: 500, textAlign: 'left',
                  background: page === item.id ? 'rgba(255,107,53,0.1)' : 'transparent',
                  color: page === item.id ? C.orange : item.highlight ? C.gold : C.textMuted,
                  border: 'none', cursor: 'pointer'
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
          <HomePage apps={apps} onDownload={download} unlockedApps={unlocked} loading={loading || refreshing} settings={siteSettings} />
          <AboutSection />
          <PrivacySection />
          <ContactSection addToast={addToast} />
        </>
      )}
      {page === 'admin' && (session
        ? <AdminPage apps={apps} onLogout={logout} session={session} refreshApps={fetchApps} isRefreshing={refreshing} addToast={addToast} />
        : <AdminLogin onLogin={() => setPage('admin')} />
      )}
      {page === 'about' && <AboutSection />}
      {page === 'privacy' && <PrivacySection />}
      {page === 'contact' && <ContactSection addToast={addToast} />}

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: '44px 16px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, marginBottom: 14 }}>
          <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg, #FF6B35, #FFB800)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sun size={15} style={{ color: 'black' }} /></div>
          <span style={{ fontWeight: 700, color: C.textMuted, fontSize: 14 }}>SunRise Apps</span>
        </div>
        <p style={{ color: C.textFaint, fontSize: 12, marginBottom: 6 }}>Free viral Android apps — always updated 🚀</p>
        <p style={{ color: 'rgba(228,228,228,0.08)', fontSize: 10 }}>© 2026 SunRise Apps · Built with ❤️ in India</p>
      </footer>

      <LockModal app={modal} onClose={() => setModal(null)} onUnlock={unlock} />
      <ScrollToTop />
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}