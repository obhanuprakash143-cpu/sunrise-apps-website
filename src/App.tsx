import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabaseClient.ts';
import { Session } from '@supabase/supabase-js';
import {
  Sun, Download, Share2, Lock, Shield, Mail,
  Globe, ChevronDown, Menu, X, Star, Users, Smartphone,
  Settings, Plus, Trash2, Edit3, Save, Eye, EyeOff,
  ArrowUp, Search, Filter, LogOut, KeyRound, AlertTriangle,
  ToggleLeft, ToggleRight, RefreshCw, Loader2, Image as ImageIcon,
  Upload, MessageSquare, CheckCircle, ChevronUp, Inbox,
  Sparkles, Zap, TrendingUp, Heart, Package, FileImage,
  BarChart3, Layers, DollarSign, FileText, ExternalLink,
  Database, GitBranch, Server, Key, ShieldCheck, Wifi,
  HardDrive, MonitorSmartphone, Copy, Check, Images,
  Info, AlertCircle
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
  screenshots?: string[];
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
  type: 'success' | 'error' | 'info' | 'install';
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

// ============ ELITE COLORFUL SYSTEM ============
const C = {
  bg: '#000000',
  bgCard: '#0f172a',
  bgCardHover: '#1e293b',
  border: '#334155',
  borderHover: '#FF6B35',
  orange: '#FF6B35',
  gold: '#FACC15',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  textFaint: '#475569',
  accentGlow: 'rgba(255,107,53,0.15)',
  green: '#22c55e',           // SAFETY GREEN
  greenGlow: 'rgba(34,197,94,0.15)',
  amber: '#fbbf24',
  blue: '#60a5fa',
  red: '#f87171',
  purple: '#a855f7',
  pink: '#ec4899',
  cyan: '#06b6d4',
  emerald: '#10b981',
};

// ============ CATEGORIES ============
const CATEGORIES = [
  '📱 Tools', '🎮 Games', '🎵 Music', '📸 Photography',
  '💬 Social', '📚 Education', '💪 Health & Fitness',
  '🛒 Shopping', '💰 Finance', '🗺️ Maps & Navigation',
  '🎬 Entertainment', '⚙️ Utilities', '🔒 Security',
  '🌐 Browsers', '📧 Communication', '🎨 Creativity',
  '🏠 Lifestyle', '📰 News', '🍔 Food & Drink', '✈️ Travel',
];

const BADGES = [
  { value: 'New', label: '✨ New', desc: 'Recently added' },
  { value: 'Viral', label: '🔥 Viral', desc: 'Trending now' },
  { value: 'PRO', label: '⭐ PRO', desc: 'Premium quality' },
  { value: 'Hot', label: '💥 Hot', desc: 'Very popular' },
  { value: 'Updated', label: '🔄 Updated', desc: 'Recently updated' },
  { value: 'Free', label: '🆓 Free', desc: 'Always free' },
  { value: 'Beta', label: '🧪 Beta', desc: 'Beta version' },
  { value: 'Trending', label: '📈 Trending', desc: 'Rising fast' },
];

// ============ HELPERS ============
const formatDownloads = (num: string) => {
  const n = parseInt(num);
  if (isNaN(n) || n === 0) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M+';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K+';
  return n.toString();
};

const getBadgeGradient = (badge: string): string => {
  switch (badge) {
    case 'Viral': return 'linear-gradient(135deg, #f43f5e, #ec4899)';
    case 'PRO': return 'linear-gradient(135deg, #fbbf24, #f97316)';
    case 'New': return 'linear-gradient(135deg, #34d399, #14b8a6)';
    case 'Hot': return 'linear-gradient(135deg, #ff4500, #ff6b35)';
    case 'Updated': return 'linear-gradient(135deg, #60a5fa, #818cf8)';
    case 'Free': return 'linear-gradient(135deg, #34d399, #06b6d4)';
    case 'Beta': return 'linear-gradient(135deg, #a855f7, #6366f1)';
    case 'Trending': return 'linear-gradient(135deg, #f59e0b, #ef4444)';
    default: return 'linear-gradient(135deg, #6b7280, #4b5563)';
  }
};

const getBadgeEmoji = (badge: string): string => {
  const found = BADGES.find(b => b.value === badge);
  return found ? found.label.split(' ')[0] : '✨';
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

// ============ DYNAMIC FILE NAMING + BLOB DOWNLOAD ============
const cleanFileName = (name: string): string => {
  return name
    .replace(/[^\x00-\x7F]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '');
};

// 🛡️ SAFETY TRUST LAYER — Blob-Fetch Method for Reliable Naming
const triggerSafeDownload = async (
  url: string,
  appName: string,
  onProgress?: (status: 'fetching' | 'success' | 'fallback') => void
) => {
  const safeName = cleanFileName(appName) || 'app';
  const fileName = `${safeName}_SunRise_Official.apk`;

  try {
    onProgress?.('fetching');
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    }, 100);

    onProgress?.('success');
  } catch (error) {
    console.error('Blob download failed, using fallback:', error);
    onProgress?.('fallback');
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};

// ============ GLOBAL STYLES — COLORFUL ELITE ============
const GlobalStyles = () => (
  <style>{`
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      background: ${C.bg};
      color: ${C.text};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden;
      background-image:
        radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255,107,53,0.08), transparent),
        radial-gradient(ellipse 60% 40% at 80% 80%, rgba(168,85,247,0.06), transparent),
        radial-gradient(ellipse 60% 40% at 20% 60%, rgba(34,197,94,0.04), transparent);
    }
    input, textarea, select, button { font-family: inherit; }
    input::placeholder, textarea::placeholder { color: ${C.textFaint}; }
    a { text-decoration: none; color: inherit; }

    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: ${C.bg}; }
    ::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #FF6B35, #a855f7); border-radius: 10px; }
    ::-webkit-scrollbar-thumb:hover { background: ${C.orange}; }
    ::selection { background: rgba(255,107,53,0.3); color: white; }

    @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeInScale { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
    @keyframes spin { to { transform:rotate(360deg); } }
    @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
    @keyframes slideDown { from{opacity:0;transform:translateY(-12px);} to{opacity:1;transform:translateY(0);} }
    @keyframes slideUp { from{opacity:0;transform:translateY(20px);} to{opacity:1;transform:translateY(0);} }
    @keyframes glow { 0%,100%{text-shadow:0 0 20px rgba(255,107,53,0.5);} 50%{text-shadow:0 0 60px rgba(255,184,0,0.8), 0 0 100px rgba(255,107,53,0.5);} }
    @keyframes shimmer { 0%{background-position:-200% 0;} 100%{background-position:200% 0;} }
    @keyframes glowPulse { 0%,100%{box-shadow: 0 0 20px rgba(255,107,53,0.3);} 50%{box-shadow: 0 0 40px rgba(255,107,53,0.6), 0 0 60px rgba(255,184,0,0.3);} }
    @keyframes safetyPulse { 0%,100%{box-shadow: 0 0 12px rgba(34,197,94,0.3);} 50%{box-shadow: 0 0 24px rgba(34,197,94,0.6);} }
    @keyframes rainbowBorder {
      0%   { border-color: #FF6B35; }
      25%  { border-color: #FACC15; }
      50%  { border-color: #22c55e; }
      75%  { border-color: #06b6d4; }
      100% { border-color: #FF6B35; }
    }
    @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }

    .spin { animation: spin 1s linear infinite; }
    .pulse { animation: pulse 2s ease-in-out infinite; }
    .fade-in { animation: fadeIn 0.35s ease forwards; }
    .fade-in-scale { animation: fadeInScale 0.3s ease forwards; }
    .slide-down { animation: slideDown 0.3s ease forwards; }
    .slide-up { animation: slideUp 0.4s ease forwards; }
    .glow-text { animation: glow 3s ease-in-out infinite; }
    .glow-btn { animation: glowPulse 2.5s ease-in-out infinite; }
    .safety-pulse { animation: safetyPulse 2.5s ease-in-out infinite; }
    .float-anim { animation: float 3s ease-in-out infinite; }

    .card {
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 18px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }
    .card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, ${C.orange}, ${C.gold}, ${C.purple}, transparent);
      opacity: 0;
      transition: opacity 0.3s;
    }
    .card:hover {
      transform: translateY(-8px) scale(1.02);
      border-color: #FF6B35;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5), 0 0 30px rgba(255,107,53,0.25), 0 0 60px rgba(168,85,247,0.1);
      background: rgba(30, 41, 59, 0.8);
    }
    .card:hover::before { opacity: 1; }

    .btn-primary {
      background: linear-gradient(135deg, #FF6B35 0%, #FFB800 50%, #FACC15 100%);
      background-size: 200% 200%;
      color: white;
      font-weight: 700;
      border: none;
      cursor: pointer;
      transition: all 0.25s ease;
      position: relative;
      overflow: hidden;
    }
    .btn-primary::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.2), transparent);
      opacity: 0;
      transition: opacity 0.2s;
    }
    .btn-primary:hover::before { opacity: 1; }
    .btn-primary:hover {
      transform: scale(1.04);
      background-position: 100% 100%;
      box-shadow: 0 8px 32px rgba(255,107,53,0.5), 0 0 20px rgba(255,184,0,0.3);
    }
    .btn-primary:active { transform: scale(0.97); }

    .btn-safety {
      background: linear-gradient(135deg, #22c55e, #10b981);
      color: white;
      font-weight: 700;
      border: none;
      cursor: pointer;
      transition: all 0.25s ease;
    }
    .btn-safety:hover {
      transform: scale(1.04);
      box-shadow: 0 8px 32px rgba(34,197,94,0.5);
    }

    .btn-ghost {
      background: rgba(255,255,255,0.05);
      border: 1px solid ${C.border};
      color: ${C.textMuted};
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-ghost:hover {
      background: rgba(255,255,255,0.1);
      color: ${C.text};
      border-color: rgba(255,255,255,0.3);
    }

    .nav-btn { background: transparent; border: none; cursor: pointer; transition: all 0.2s ease; }
    .nav-btn:hover { background: rgba(255,255,255,0.07) !important; color: white !important; }

    .input-base {
      background: rgba(15,23,42,0.8);
      border: 1px solid ${C.border};
      color: ${C.text};
      border-radius: 12px;
      padding: 11px 14px;
      font-size: 13.5px;
      transition: all 0.2s ease;
      outline: none;
      width: 100%;
    }
    .input-base:focus {
      border-color: ${C.orange};
      background: rgba(15,23,42,0.95);
      box-shadow: 0 0 0 3px rgba(255,107,53,0.12), 0 0 20px rgba(255,107,53,0.08);
    }

    select.input-base option { background: #0f172a; color: #F8FAFC; }

    .action-btn {
      width: 34px; height: 34px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      border: none; cursor: pointer; transition: all 0.2s ease;
    }
    .action-btn:hover { transform: scale(1.1); }

    @media (min-width: 768px) { .desktop-nav { display: flex !important; } .mobile-only { display: none !important; } }
    @media (max-width: 767px) { .desktop-nav { display: none !important; } }

    .shimmer-skeleton {
      background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.8s linear infinite;
      border-radius: 18px;
    }

    .glass-panel {
      background: rgba(15,23,42,0.7);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.08);
    }

    .screenshot-scroll::-webkit-scrollbar { height: 4px; }
    .screenshot-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); }
    .screenshot-scroll::-webkit-scrollbar-thumb { background: ${C.orange}; border-radius: 999px; }

    .safety-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 9px 14px;
      background: linear-gradient(135deg, rgba(34,197,94,0.12), rgba(16,185,129,0.08));
      border: 1px solid rgba(34,197,94,0.35);
      border-radius: 11px;
      color: #22c55e;
      font-size: 12px;
      font-weight: 600;
      line-height: 1.4;
    }
    .safety-badge .icon-pulse {
      animation: safetyPulse 2.5s ease-in-out infinite;
      width: 24px; height: 24px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      background: rgba(34,197,94,0.18);
      flex-shrink: 0;
    }
  `}</style>
);

// ============ 🛡️ SAFETY BADGE — TRUST LAYER COMPONENT ============
const SafetyBadge = ({ compact = false }: { compact?: boolean }) => {
  if (compact) {
    return (
      <div className="safety-badge" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
        <span className="icon-pulse">🛡️</span>
        <span>Verified Safe · Scanned by SunRise Security</span>
      </div>
    );
  }
  return (
    <div className="safety-badge safety-pulse" style={{ width: '100%', justifyContent: 'center', marginTop: 10, padding: '12px 16px' }}>
      <span className="icon-pulse" style={{ width: 28, height: 28 }}>🛡️</span>
      <div style={{ textAlign: 'left' }}>
        <div style={{ fontWeight: 700, fontSize: 13 }}>Verified Safe</div>
        <div style={{ fontSize: 11, opacity: 0.85, fontWeight: 500 }}>Scanned by SunRise Security · No malware detected</div>
      </div>
    </div>
  );
};

// ============ TOAST ============
const Toast = ({ toasts, removeToast }: { toasts: ToastItem[]; removeToast: (id: number) => void }) => (
  <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 420, padding: '0 16px', pointerEvents: 'none' }}>
    {toasts.map(t => {
      const isInstall = t.type === 'install';
      return (
        <div key={t.id} className="fade-in glass-panel" style={{
          display: 'flex', alignItems: isInstall ? 'flex-start' : 'center', justifyContent: 'space-between', gap: 12,
          padding: isInstall ? '14px 16px' : '13px 16px', borderRadius: 14, fontSize: 13, fontWeight: 500, pointerEvents: 'all',
          background: t.type === 'success' ? 'rgba(6,78,59,0.95)' : t.type === 'error' ? 'rgba(127,29,29,0.95)' : isInstall ? 'rgba(15,23,42,0.98)' : 'rgba(15,23,42,0.98)',
          border: `1px solid ${t.type === 'success' ? 'rgba(34,197,94,0.45)' : t.type === 'error' ? 'rgba(248,113,113,0.4)' : isInstall ? 'rgba(34,197,94,0.45)' : 'rgba(255,107,53,0.4)'}`,
          color: t.type === 'success' || isInstall ? C.green : t.type === 'error' ? C.red : '#fdba74',
          boxShadow: '0 8px 32px rgba(0,0,0,0.8)'
        }}>
          {isInstall && <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1 }}>📲</span>}
          <span style={{ flex: 1, lineHeight: 1.6 }}>{t.message}</span>
          <button onClick={() => removeToast(t.id)} style={{ opacity: 0.5, cursor: 'pointer', background: 'none', border: 'none', color: 'inherit', padding: 0, flexShrink: 0, lineHeight: 1, marginTop: isInstall ? 3 : 0 }}><X size={13} /></button>
        </div>
      );
    })}
  </div>
);

const useToast = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);
  const addToast = useCallback((message: string, type: ToastItem['type'] = 'info', duration = 4500) => {
    const id = ++counter.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
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
    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="btn-primary glow-btn" style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 50, width: 46, height: 46, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <ArrowUp size={19} />
    </button>
  );
};

// ============ AD BANNER ============
const AdBanner = ({ variant = 'horizontal', settings }: { variant?: 'horizontal' | 'rectangle'; settings: SiteSettings | null }) => {
  if (!settings?.ads_enabled) {
    return (
      <div style={{ border: `1px dashed ${C.border}`, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', height: variant === 'rectangle' ? 180 : 60, background: 'rgba(255,255,255,0.01)' }}>
        <p style={{ fontSize: 11, color: C.textFaint }}>Ad space — Enable in Admin → Monetization</p>
      </div>
    );
  }
  return (
    <div style={{ border: `1px dashed ${C.border}`, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', height: variant === 'rectangle' ? 200 : 72, background: 'rgba(255,255,255,0.01)', overflow: 'hidden' }}>
      {settings.ad_client_id && settings.ad_slot_header ? (
        <ins className="adsbygoogle"
          style={{ display: 'block', width: '100%', height: '100%' }}
          data-ad-client={settings.ad_client_id}
          data-ad-slot={variant === 'rectangle' ? settings.ad_slot_sidebar : settings.ad_slot_header}
          data-ad-format="auto"
          data-full-width-responsive="true" />
      ) : (
        <p style={{ fontSize: 11, color: C.textFaint }}>📢 AdSense — Add IDs in Admin → Monetization</p>
      )}
    </div>
  );
};

// ============ SCREENSHOT GALLERY ============
const ScreenshotGallery = ({ screenshots }: { screenshots: string[] }) => {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  if (!screenshots || screenshots.length === 0) return null;

  return (
    <div>
      {lightbox && (
        <div onClick={() => setLightbox(false)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.97)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <button onClick={() => setLightbox(false)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', borderRadius: 10, padding: 8 }}><X size={20} /></button>
          <button onClick={e => { e.stopPropagation(); setActive(p => (p - 1 + screenshots.length) % screenshots.length); }} style={{ position: 'absolute', left: 20, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', borderRadius: 10, padding: '10px 14px', fontSize: 20 }}>‹</button>
          <img src={screenshots[active]} alt="" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', maxWidth: '90vw', borderRadius: 16, objectFit: 'contain', boxShadow: '0 0 80px rgba(255,107,53,0.2)' }} />
          <button onClick={e => { e.stopPropagation(); setActive(p => (p + 1) % screenshots.length); }} style={{ position: 'absolute', right: 20, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', borderRadius: 10, padding: '10px 14px', fontSize: 20 }}>›</button>
          <div style={{ position: 'absolute', bottom: 20, display: 'flex', gap: 6 }}>
            {screenshots.map((_, i) => <div key={i} onClick={e => { e.stopPropagation(); setActive(i); }} style={{ width: i === active ? 24 : 8, height: 8, borderRadius: 999, background: i === active ? C.orange : 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'all 0.3s' }} />)}
          </div>
        </div>
      )}

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Images size={16} style={{ color: C.orange }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: C.textMuted }}>Screenshots ({screenshots.length})</span>
        </div>
        <div className="screenshot-scroll" style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
          {screenshots.map((s, i) => (
            <div key={i} onClick={() => { setActive(i); setLightbox(true); }} style={{ flexShrink: 0, width: 130, height: 230, borderRadius: 14, overflow: 'hidden', cursor: 'pointer', border: `2px solid ${i === active ? C.orange : 'rgba(255,255,255,0.08)'}`, transition: 'all 0.2s', boxShadow: i === active ? `0 0 16px rgba(255,107,53,0.3)` : 'none' }}>
              <img src={s} alt={`Screenshot ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============ APP DETAIL MODAL ============
const AppDetailModal = ({ app, onClose, onDownload, unlocked }: { app: AppData | null; onClose: () => void; onDownload: (a: AppData) => void; unlocked: boolean }) => {
  if (!app) return null;
  const isCS = !app.apk_link || app.apk_link === '#';
  const icon = app.icon_url
    ? <img src={app.icon_url} alt={app.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 22 }} />
    : app.icon ? <span style={{ fontSize: 42 }}>{app.icon}</span>
      : <ImageIcon size={36} style={{ color: C.textFaint }} />;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(0,0,0,0.94)', backdropFilter: 'blur(24px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0' }}>
      <div onClick={e => e.stopPropagation()} className="fade-in" style={{ background: 'linear-gradient(180deg, #0f172a 0%, #000000 100%)', border: '1px solid rgba(255,107,53,0.2)', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 700, maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 -20px 80px rgba(255,107,53,0.15)' }}>
        <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ width: 4, height: 36, background: 'linear-gradient(180deg, #FF6B35, #FFB800)', borderRadius: 999 }} />
          <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.12)', borderRadius: 999, margin: '0 auto' }} />
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.07)', border: `1px solid ${C.border}`, color: C.textMuted, cursor: 'pointer', borderRadius: 10, padding: 8, display: 'flex', alignItems: 'center' }}><X size={16} /></button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '20px 24px 32px' }}>
          <div style={{ display: 'flex', gap: 18, marginBottom: 24, alignItems: 'flex-start' }}>
            <div style={{ width: 90, height: 90, flexShrink: 0, background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.2)', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>{icon}</div>
            <div style={{ flex: 1, paddingTop: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: -0.5 }}>{app.name}</h2>
                <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700, color: 'white', background: getBadgeGradient(app.badge) }}>{getBadgeEmoji(app.badge)} {app.badge}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 12 }}>
                <span style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', padding: '3px 10px', borderRadius: 8, color: C.blue }}>v{app.version}</span>
                <span style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', padding: '3px 10px', borderRadius: 8, color: C.green }}>{app.size}</span>
                <span style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)', padding: '3px 10px', borderRadius: 8, color: C.purple }}>{app.category}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 24 }}>
            {[
              { icon: <Download size={16} />, val: formatDownloads(app.downloads), lab: 'Downloads', c: C.orange, bg: 'rgba(255,107,53,0.08)', bc: 'rgba(255,107,53,0.2)' },
              { icon: <Star size={16} />, val: app.rating + '★', lab: 'Rating', c: C.gold, bg: 'rgba(250,204,21,0.08)', bc: 'rgba(250,204,21,0.2)' },
              { icon: <RefreshCw size={16} />, val: app.updated, lab: 'Updated', c: C.cyan, bg: 'rgba(6,182,212,0.08)', bc: 'rgba(6,182,212,0.2)' },
            ].map((s, i) => (
              <div key={i} style={{ background: s.bg, border: `1px solid ${s.bc}`, borderRadius: 14, padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ color: s.c, display: 'flex', justifyContent: 'center', marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{s.val}</div>
                <div style={{ fontSize: 10, color: C.textFaint, marginTop: 3 }}>{s.lab}</div>
              </div>
            ))}
          </div>

          {app.screenshots && app.screenshots.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <ScreenshotGallery screenshots={app.screenshots} />
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }}>
              <FileText size={15} style={{ color: C.orange }} /> About this app
            </h3>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px' }}>
              <p style={{ color: C.textMuted, fontSize: 14, lineHeight: 2, whiteSpace: 'pre-wrap' }}>{app.description}</p>
            </div>
          </div>

          {!isCS && (
            <>
              <button
                onClick={() => { onDownload(app); onClose(); }}
                className="btn-primary glow-btn"
                style={{ width: '100%', padding: '17px', borderRadius: 16, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
              >
                {unlocked ? <><Download size={20} /> Download APK — Free</> : <><Lock size={20} /> Get APK — Watch Ad</>}
              </button>
              <SafetyBadge />
            </>
          )}
          {isCS && (
            <div style={{ width: '100%', padding: '17px', borderRadius: 16, fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, color: C.textFaint }}>
              🔜 Coming Soon
            </div>
          )}
        </div>
      </div>
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
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 700, background: 'rgba(0,0,0,0.96)', backdropFilter: 'blur(24px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} className="fade-in-scale glass-panel" style={{ borderRadius: 24, padding: '40px 32px', maxWidth: 380, width: '100%', position: 'relative', boxShadow: '0 0 80px rgba(255,107,53,0.2)', border: '1px solid rgba(255,107,53,0.2)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, color: C.textFaint, background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 10 }}><X size={16} /></button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, margin: '0 auto 24px', borderRadius: 24, background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(255,107,53,0.2)' }}>
            <Lock style={{ color: C.orange }} size={34} />
          </div>
          <h3 style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 8 }}>Unlock Download</h3>
          <p style={{ color: C.textMuted, fontSize: 13.5, marginBottom: 24, lineHeight: 1.7 }}>{app.name}</p>

          <SafetyBadge compact />

          {!watching ? (
            <button onClick={() => setWatching(true)} className="btn-primary" style={{ width: '100%', padding: 16, borderRadius: 15, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 20 }}>
              <Eye size={20} /> Watch Ad to Unlock
            </button>
          ) : (
            <div style={{ background: 'rgba(255,107,53,0.06)', borderRadius: 16, padding: '24px 20px', border: '1px solid rgba(255,107,53,0.2)', marginTop: 20 }}>
              <p className="pulse" style={{ color: C.orange, fontSize: 14, fontWeight: 700, marginBottom: 16 }}>⏳ Ad playing...</p>
              <div style={{ width: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: 999, height: 10, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'linear-gradient(90deg, #FF6B35, #FFB800)', borderRadius: 999, transition: 'width 1s linear', width: `${((5 - countdown) / 5) * 100}%` }} />
              </div>
              <p style={{ color: C.textFaint, fontSize: 12, marginTop: 12 }}>{countdown}s remaining</p>
            </div>
          )}
          <p style={{ color: C.textFaint, fontSize: 10, marginTop: 20 }}>Ad placeholder — integrate AdMob/AdSense here</p>
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
      addToast(`✅ ${isApk ? 'APK' : 'Image'} uploaded!`, 'success');
    } catch (err: any) { addToast(`❌ Upload failed: ${err.message}`, 'error'); }
    finally { setTimeout(() => { setUploading(false); setProgress(0); }, 700); if (inputRef.current) inputRef.current.value = ''; }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) await doUpload(f); };
  const handleDrop = async (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) await doUpload(f); };
  const short = (url: string) => { const n = url.split('/').pop() || ''; return n.length > 32 ? n.slice(0, 32) + '...' : n; };

  return (
    <div>
      <label style={{ display: 'block', fontSize: 11.5, color: C.textFaint, marginBottom: 5, fontWeight: 600, letterSpacing: 0.4 }}>{label}</label>
      {hint && <p style={{ fontSize: 11, color: C.textFaint, marginBottom: 7, opacity: 0.7 }}>{hint}</p>}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{ border: `1.5px dashed ${dragOver ? C.orange : currentUrl ? 'rgba(34,197,94,0.5)' : C.border}`, borderRadius: 13, padding: '14px 12px', display: 'flex', alignItems: 'center', gap: 12, cursor: uploading ? 'wait' : 'pointer', background: dragOver ? 'rgba(255,107,53,0.05)' : currentUrl ? 'rgba(34,197,94,0.04)' : 'rgba(255,255,255,0.02)', transition: 'all 0.2s ease' }}
      >
        <input ref={inputRef} type="file" accept={accept} onChange={handleFile} style={{ display: 'none' }} />
        <div style={{ width: 40, height: 40, borderRadius: 11, background: currentUrl ? 'rgba(34,197,94,0.1)' : 'rgba(255,107,53,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${currentUrl ? 'rgba(34,197,94,0.25)' : 'rgba(255,107,53,0.2)'}` }}>
          {uploading ? <Loader2 size={16} style={{ color: C.orange }} className="spin" /> : currentUrl ? <CheckCircle size={16} style={{ color: C.green }} /> : <Upload size={16} style={{ color: C.orange }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {currentUrl ? <p style={{ fontSize: 12, color: C.green, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>✅ {short(currentUrl)}</p>
            : <p style={{ fontSize: 12, color: C.textMuted }}>{uploading ? `Uploading ${progress}%...` : 'Click or drag & drop'}</p>}
          {uploading && <div style={{ marginTop: 6, width: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: 999, height: 4 }}><div style={{ height: '100%', background: 'linear-gradient(90deg, #FF6B35, #FFB800)', borderRadius: 999, transition: 'width 0.4s ease', width: `${progress}%` }} /></div>}
        </div>
        {currentUrl && !uploading && <button onClick={e => { e.stopPropagation(); onUploadComplete(''); }} style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: C.red, borderRadius: 8, padding: '4px 9px', fontSize: 11, cursor: 'pointer' }}>Clear</button>}
      </div>
    </div>
  );
};

// ============ MULTI SCREENSHOT UPLOAD ============
const ScreenshotUpload = ({ screenshots, onAdd, onRemove, addToast }: {
  screenshots: string[];
  onAdd: (url: string) => void;
  onRemove: (idx: number) => void;
  addToast: (msg: string, type: ToastItem['type']) => void;
}) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    if (screenshots.length >= 8) { addToast('❌ Max 8 screenshots', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { addToast('❌ Max 5MB per screenshot', 'error'); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const fileName = `screenshots/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('icons').upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from('icons').getPublicUrl(fileName);
      if (data?.publicUrl) { onAdd(data.publicUrl); addToast('✅ Screenshot added!', 'success'); }
    } catch (e: any) { addToast(`❌ ${e.message}`, 'error'); }
    finally { setUploading(false); if (inputRef.current) inputRef.current.value = ''; }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <label style={{ fontSize: 11.5, color: C.textFaint, fontWeight: 600, letterSpacing: 0.4 }}>APP SCREENSHOTS (max 8)</label>
        <button onClick={() => inputRef.current?.click()} disabled={uploading || screenshots.length >= 8} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.2)', color: C.orange, borderRadius: 9, fontSize: 12, cursor: 'pointer', opacity: screenshots.length >= 8 ? 0.4 : 1 }}>
          {uploading ? <Loader2 size={12} className="spin" /> : <Plus size={12} />} Add Screenshot
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); }} style={{ display: 'none' }} />

      {screenshots.length === 0 ? (
        <div onClick={() => inputRef.current?.click()} style={{ border: `1.5px dashed ${C.border}`, borderRadius: 13, padding: '24px', textAlign: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.01)', transition: 'all 0.2s' }}>
          <Images size={28} style={{ color: C.textFaint, margin: '0 auto 8px', display: 'block' }} />
          <p style={{ color: C.textFaint, fontSize: 12 }}>No screenshots yet — click to add</p>
          <p style={{ color: C.textFaint, fontSize: 11, opacity: 0.5, marginTop: 4 }}>Recommended: 1080×1920px (portrait)</p>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {screenshots.map((s, i) => (
            <div key={i} style={{ position: 'relative', width: 80, height: 142, borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.border}`, flexShrink: 0 }}>
              <img src={s} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button onClick={() => onRemove(i)} style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: 'rgba(239,68,68,0.9)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}><X size={10} /></button>
              <div style={{ position: 'absolute', bottom: 3, left: 0, right: 0, textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,0.6)' }}>{i + 1}</div>
            </div>
          ))}
          {screenshots.length < 8 && (
            <div onClick={() => inputRef.current?.click()} style={{ width: 80, height: 142, borderRadius: 10, border: `1.5px dashed ${C.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.01)', gap: 4 }}>
              {uploading ? <Loader2 size={16} style={{ color: C.orange }} className="spin" /> : <Plus size={16} style={{ color: C.textFaint }} />}
              <span style={{ fontSize: 9, color: C.textFaint }}>Add</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============ APP CARD ============
const AppCard = ({ app, onDownload, unlocked, onViewDetail }: { app: AppData; onDownload: (a: AppData) => void; unlocked: boolean; onViewDetail: (a: AppData) => void }) => {
  const handleShare = () => {
    const text = `🌅 "${app.name}" — Free on SunRise Apps!\n📲 ${window.location.href}`;
    if (navigator.share) navigator.share({ title: app.name, text, url: window.location.href }).catch(() => { });
    else navigator.clipboard.writeText(text).then(() => alert('Link copied!'));
  };
  const isCS = !app.apk_link || app.apk_link === '#';
  const icon = app.icon_url
    ? <img src={app.icon_url} alt={app.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 14 }} />
    : app.icon ? <span style={{ fontSize: 26 }}>{app.icon}</span>
      : <ImageIcon size={22} style={{ color: C.textFaint }} />;

  return (
    <div className="card" style={{ position: 'relative', padding: '22px 18px', overflow: 'visible', cursor: 'default' }}>
      <span style={{ position: 'absolute', top: -11, right: 14, padding: '3px 11px', borderRadius: 999, fontSize: 10, fontWeight: 700, color: 'white', letterSpacing: 0.3, background: getBadgeGradient(app.badge), boxShadow: '0 2px 10px rgba(0,0,0,0.4)' }}>
        {getBadgeEmoji(app.badge)} {app.badge}
      </span>

      {/* Trust micro-badge */}
      {!isCS && (
        <span style={{ position: 'absolute', top: -9, left: 14, padding: '2px 8px', borderRadius: 999, fontSize: 9, fontWeight: 700, color: C.green, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.35)', display: 'flex', alignItems: 'center', gap: 3 }}>
          🛡️ Verified
        </span>
      )}

      <div onClick={() => onViewDetail(app)} style={{ cursor: 'pointer' }}>
        <div style={{ display: 'flex', gap: 14, marginBottom: 14, alignItems: 'flex-start' }}>
          <div style={{ width: 58, height: 58, flexShrink: 0, background: C.accentGlow, border: '1px solid rgba(255,107,53,0.15)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }}>{icon}</div>
          <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
            <h3 style={{ fontWeight: 700, color: C.text, fontSize: 15.5, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.name}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 5, fontSize: 11.5, color: C.textFaint }}>
              <span style={{ background: 'rgba(96,165,250,0.1)', padding: '2px 8px', borderRadius: 7, border: '1px solid rgba(96,165,250,0.2)', color: C.blue }}>v{app.version}</span>
              <span>·</span><span>{app.size}</span>
            </div>
          </div>
        </div>

        <p style={{ color: C.textMuted, fontSize: 13.5, lineHeight: 1.75, marginBottom: 14, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{app.description}</p>

        {app.screenshots && app.screenshots.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflow: 'hidden' }}>
            {app.screenshots.slice(0, 3).map((s, i) => (
              <div key={i} style={{ width: 52, height: 90, borderRadius: 8, overflow: 'hidden', flexShrink: 0, border: `1px solid ${C.border}` }}>
                <img src={s} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
            {app.screenshots.length > 3 && (
              <div style={{ width: 52, height: 90, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 11, color: C.textFaint, fontWeight: 600 }}>+{app.screenshots.length - 3}</span>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, fontSize: 11.5, color: C.textFaint }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.orange }}><Download size={11} /> {formatDownloads(app.downloads)}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.gold }}><Star size={11} /> {app.rating}</span>
          <span style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', padding: '2px 9px', borderRadius: 8, color: C.purple, fontSize: 11 }}>{app.category}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => !isCS && onDownload(app)}
          disabled={isCS}
          className={isCS ? '' : 'btn-primary'}
          style={{ flex: 1, padding: '12px', borderRadius: 13, fontWeight: 700, fontSize: 13.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, border: 'none', cursor: isCS ? 'not-allowed' : 'pointer', background: isCS ? 'rgba(255,255,255,0.04)' : undefined, color: isCS ? C.textFaint : undefined }}
        >
          {isCS ? '🔜 Coming Soon' : unlocked ? <><Download size={14} /> Download APK</> : <><Lock size={14} /> Get APK</>}
        </button>
        <button onClick={() => onViewDetail(app)} style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.2)', color: C.orange, cursor: 'pointer' }}>
          <Eye size={15} />
        </button>
        <button onClick={handleShare} style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', color: C.purple, cursor: 'pointer' }}>
          <Share2 size={14} />
        </button>
      </div>

      {/* Trust mini line */}
      {!isCS && (
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 10.5, color: C.green, opacity: 0.85 }}>
          <ShieldCheck size={11} /> <span>Verified Safe · Scanned by SunRise Security</span>
        </div>
      )}
    </div>
  );
};

// ============ HOME PAGE ============
const HomePage = ({ apps, onDownload, unlockedApps, loading, settings, onViewDetail }: {
  apps: AppData[]; onDownload: (a: AppData) => void; unlockedApps: number[]; loading: boolean; settings: SiteSettings | null; onViewDetail: (a: AppData) => void;
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
      <section style={{ padding: '120px 16px 100px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,107,53,0.06) 0%, transparent 60%)' }} />
        <div style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: 800, height: 600, background: 'radial-gradient(ellipse, rgba(255,107,53,0.12) 0%, transparent 65%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '0', left: '10%', width: 300, height: 300, background: 'radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, transparent 65%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '30%', right: '5%', width: 280, height: 280, background: 'radial-gradient(ellipse, rgba(34,197,94,0.06) 0%, transparent 65%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.25)', borderRadius: 999, padding: '9px 20px', marginBottom: 24, fontSize: 13, color: C.orange, backdropFilter: 'blur(10px)' }}>
            <Sparkles size={13} /> Your Trusted App Source <Zap size={11} style={{ color: C.gold }} />
          </div>

          {/* Trust Banner */}
          <div className="float-anim" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg, rgba(34,197,94,0.12), rgba(16,185,129,0.08))', border: '1px solid rgba(34,197,94,0.35)', borderRadius: 999, padding: '8px 18px', marginBottom: 32, fontSize: 12.5, color: C.green, fontWeight: 600 }}>
            <span style={{ fontSize: 16 }}>🛡️</span> 100% Verified Safe · No Malware · SSL Secured
          </div>

          <h1 style={{ fontSize: 'clamp(48px, 10vw, 100px)', fontWeight: 900, lineHeight: 1.04, marginBottom: 24, letterSpacing: -3 }}>
            <span className="glow-text" style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #FFB800 50%, #FACC15 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>SunRise</span>
            <br />
            <span style={{ background: 'linear-gradient(135deg, #F8FAFC, #94A3B8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Apps</span>
          </h1>

          <p style={{ fontSize: 'clamp(15px, 2.8vw, 20px)', color: C.textMuted, maxWidth: 520, margin: '0 auto 48px', lineHeight: 1.85 }}>
            Get the latest <span style={{ color: C.orange, fontWeight: 700 }}>viral Android tools</span> — free, safe & always updated 🚀
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', marginBottom: 72 }}>
            <button onClick={() => document.getElementById('apps')?.scrollIntoView({ behavior: 'smooth' })} className="btn-primary glow-btn" style={{ padding: '16px 40px', fontSize: 16, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Download size={18} /> Explore Apps
            </button>
            <button onClick={() => document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth' })} className="btn-ghost" style={{ padding: '16px 30px', fontSize: 16, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Heart size={16} style={{ color: C.pink }} /> Learn More
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', maxWidth: 460, margin: '0 auto', gap: 14 }}>
            {[
              { v: formatDownloads(totalDL.toString()), l: 'Downloads', ic: <Download size={18} />, c: C.orange, bg: 'rgba(255,107,53,0.08)', bc: 'rgba(255,107,53,0.2)' },
              { v: pub.filter(a => a.apk_link && a.apk_link !== '#').length + '+', l: 'Apps Live', ic: <Smartphone size={18} />, c: C.blue, bg: 'rgba(96,165,250,0.08)', bc: 'rgba(96,165,250,0.2)' },
              { v: '4.9★', l: 'Avg Rating', ic: <Star size={18} />, c: C.gold, bg: 'rgba(250,204,21,0.08)', bc: 'rgba(250,204,21,0.2)' },
            ].map((s, i) => (
              <div key={i} style={{ background: s.bg, border: `1px solid ${s.bc}`, borderRadius: 18, padding: '20px 12px', textAlign: 'center', backdropFilter: 'blur(10px)' }}>
                <div style={{ color: s.c, marginBottom: 10, display: 'flex', justifyContent: 'center' }}>{s.ic}</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: C.text, lineHeight: 1 }}>{s.v}</div>
                <div style={{ fontSize: 11, color: C.textFaint, marginTop: 6 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 860, margin: '0 auto 32px', padding: '0 16px' }}>
        <AdBanner settings={settings} />
      </div>

      <section id="apps" style={{ padding: '60px 16px 80px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 999, padding: '6px 16px', marginBottom: 16, fontSize: 11, color: C.purple }}>
              <TrendingUp size={11} /> Trending Now
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 900, color: C.text, marginBottom: 14, letterSpacing: -1 }}>
              App <span style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Collection</span>
            </h2>
            <p style={{ color: C.textMuted, fontSize: 15, lineHeight: 1.7 }}>All apps free — watch a short ad to download · 🛡️ Verified Safe</p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, maxWidth: 580, margin: '0 auto 40px' }}>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.textFaint, pointerEvents: 'none' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search apps..." className="input-base" style={{ paddingLeft: 42 }} />
            </div>
            <div style={{ position: 'relative' }}>
              <Filter size={13} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: C.textFaint, pointerEvents: 'none' }} />
              <select value={cat} onChange={e => setCat(e.target.value)} className="input-base" style={{ paddingLeft: 34, paddingRight: 38, appearance: 'none', cursor: 'pointer', minWidth: 140 }}>
                {cats.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={13} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', color: C.textFaint, pointerEvents: 'none' }} />
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 22 }}>
              {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="shimmer-skeleton" style={{ height: 300 }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ width: 80, height: 80, margin: '0 auto 20px', borderRadius: 22, background: C.bgCard, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Search size={30} style={{ color: C.textFaint }} />
              </div>
              <p style={{ color: C.textMuted, fontSize: 18, fontWeight: 600 }}>No apps found</p>
              <p style={{ color: C.textFaint, fontSize: 13, marginTop: 8 }}>Try a different search or category</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 22 }}>
              {filtered.map(app => <AppCard key={app.id} app={app} onDownload={onDownload} unlocked={unlockedApps.includes(app.id)} onViewDetail={onViewDetail} />)}
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
      <div style={{ maxWidth: 420, margin: '0 auto', width: '100%' }}>
        <div className="fade-in glass-panel" style={{ borderRadius: 24, padding: '40px 32px', textAlign: 'center', boxShadow: '0 0 80px rgba(255,107,53,0.1)' }}>
          <div style={{ width: 80, height: 80, margin: '0 auto 24px', borderRadius: 24, background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(255,107,53,0.2)' }}>
            <KeyRound style={{ color: C.orange }} size={34} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 8 }}>Admin Access</h2>
          <p style={{ color: C.textMuted, fontSize: 13.5, marginBottom: 32, lineHeight: 1.6 }}>Sign in with your Supabase credentials</p>
          {err && (
            <div style={{ marginBottom: 20, padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, color: C.red, fontSize: 13, display: 'flex', alignItems: 'center', gap: 9, textAlign: 'left' }}>
              <AlertTriangle size={14} style={{ flexShrink: 0 }} />{err}
            </div>
          )}
          <form onSubmit={handle} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: C.textFaint, marginBottom: 7, fontWeight: 600, letterSpacing: 0.6 }}>EMAIL ADDRESS</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@example.com" required className="input-base" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: C.textFaint, marginBottom: 7, fontWeight: 600, letterSpacing: 0.6 }}>PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••••" required className="input-base" style={{ paddingRight: 46 }} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', color: C.textFaint, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '14px', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, opacity: loading ? 0.55 : 1, fontSize: 15, marginTop: 6 }}>
              {loading ? <Loader2 size={18} className="spin" /> : <Lock size={18} />}
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
        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 9 }}>
          <DollarSign size={18} style={{ color: C.gold }} /> Google AdSense Settings
        </h3>
        <p style={{ color: C.textMuted, fontSize: 13, lineHeight: 1.7 }}>Control all ads from here. Toggle on/off and update your AdSense IDs anytime.</p>
      </div>

      <div style={{ background: settings.ads_enabled ? 'rgba(34,197,94,0.06)' : 'rgba(251,191,36,0.06)', border: `1px solid ${settings.ads_enabled ? 'rgba(34,197,94,0.22)' : 'rgba(251,191,36,0.22)'}`, borderRadius: 16, padding: '20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setSettings(s => ({ ...s, ads_enabled: !s.ads_enabled }))}>
        <div>
          <p style={{ fontWeight: 700, color: C.text, fontSize: 14, marginBottom: 4 }}>{settings.ads_enabled ? '🟢 Ads are ENABLED' : '🔴 Ads are DISABLED'}</p>
          <p style={{ color: C.textMuted, fontSize: 12 }}>{settings.ads_enabled ? 'Google AdSense is running on the website' : 'No ads are shown anywhere on the website'}</p>
        </div>
        {settings.ads_enabled ? <ToggleRight size={34} style={{ color: C.green, flexShrink: 0 }} /> : <ToggleLeft size={34} style={{ color: C.amber, flexShrink: 0 }} />}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
        {[
          { key: 'ad_client_id', label: 'Publisher ID (data-ad-client)', ph: 'ca-pub-1234567890123456', hint: 'Your main AdSense publisher ID' },
          { key: 'ad_slot_header', label: 'Header Banner Slot ID', ph: '1234567890', hint: 'Ad slot for the top horizontal banner' },
          { key: 'ad_slot_sidebar', label: 'Rectangle/Sidebar Slot ID', ph: '0987654321', hint: 'Ad slot for the bottom rectangle banner' },
          { key: 'ad_slot_article', label: 'In-Article Slot ID (optional)', ph: '1122334455', hint: 'Ad slot for in-content placements' },
        ].map(f => (
          <div key={f.key}>
            <label style={{ display: 'block', fontSize: 11.5, color: C.textFaint, marginBottom: 5, fontWeight: 600 }}>{f.label}</label>
            <p style={{ fontSize: 11, color: C.textFaint, marginBottom: 7, opacity: 0.7 }}>{f.hint}</p>
            <input value={(settings as any)[f.key] || ''} onChange={e => setSettings(s => ({ ...s, [f.key]: e.target.value }))} placeholder={f.ph} className="input-base" />
          </div>
        ))}
      </div>

      <div style={{ background: 'rgba(250,204,21,0.05)', border: '1px solid rgba(250,204,21,0.2)', borderRadius: 14, padding: '16px', marginBottom: 24 }}>
        <p style={{ color: C.gold, fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>💡 How to get your AdSense IDs</p>
        {['1. Go to adsense.google.com', '2. Ads → By ad unit → Create new ad unit', '3. Copy the data-ad-client value (ca-pub-xxxxx)', '4. Copy the data-ad-slot value for each placement', '5. Paste them in the fields above and Save'].map((s, i) => (
          <p key={i} style={{ fontSize: 12, color: C.textMuted, marginBottom: 3 }}>{s}</p>
        ))}
      </div>

      <button onClick={save} disabled={saving} className="btn-primary" style={{ padding: '13px 30px', borderRadius: 14, fontSize: 14, display: 'flex', alignItems: 'center', gap: 9, opacity: saving ? 0.55 : 1 }}>
        {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
        {saving ? 'Saving...' : 'Save Monetization Settings'}
      </button>
    </div>
  );
};

// ============ TECH DOCS TAB ============
const TechDocsTab = () => {
  const [copied, setCopied] = useState<string | null>(null);
  const copyText = (text: string, key: string) => { navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(null), 2000); };

  const CopyBtn = ({ text, k }: { text: string; k: string }) => (
    <button onClick={() => copyText(text, k)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied === k ? C.green : C.textFaint, padding: '2px 6px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
      {copied === k ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Copy</>}
    </button>
  );

  const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 18px', marginBottom: 16 }}>
      <h4 style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>{icon}{title}</h4>
      {children}
    </div>
  );

  const Row = ({ label, value, copyKey }: { label: string; value: string; copyKey: string }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 11, color: C.textFaint, marginBottom: 3, fontWeight: 600 }}>{label}</p>
        <p style={{ fontSize: 12.5, color: C.textMuted, fontFamily: 'monospace', wordBreak: 'break-all' }}>{value}</p>
      </div>
      <CopyBtn text={value} k={copyKey} />
    </div>
  );

  const DocLink = ({ label, url, icon }: { label: string; url: string; icon: React.ReactNode }) => (
    <a href={url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 8, transition: 'all 0.2s' }}>
      <span style={{ color: C.orange }}>{icon}</span>
      <span style={{ flex: 1, color: C.textMuted, fontSize: 13 }}>{label}</span>
      <ExternalLink size={13} style={{ color: C.textFaint }} />
    </a>
  );

  return (
    <div>
      <div style={{ background: 'rgba(255,107,53,0.06)', border: '1px solid rgba(255,107,53,0.2)', borderRadius: 16, padding: '16px 18px', marginBottom: 24 }}>
        <p style={{ color: C.orange, fontSize: 13, fontWeight: 700 }}>🔒 Admin Only — Not visible to public</p>
        <p style={{ color: C.textMuted, fontSize: 12.5, marginTop: 4, lineHeight: 1.6 }}>All sensitive links, credentials, and technical documentation stored here for your reference.</p>
      </div>

      <Section title="Supabase Project" icon={<Database size={16} style={{ color: C.blue }} />}>
        <Row label="Project URL" value="https://onczdkiimtfpvohrpcxa.supabase.co" copyKey="url" />
        <Row label="Project Reference ID" value="onczdkiimtfpvohrpcxa" copyKey="ref" />
        <Row label="Anon Key (Public)" value="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uY3pka2lpbXRmcHZvaHJwY3hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczOTQwMDUsImV4cCI6MjA5Mjk3MDAwNX0.1_tll-fX9DvrDiOEisWmz0VOt2qnFMlqYO0DRvv_Kv8" copyKey="anon" />
        <DocLink label="Supabase Dashboard" url="https://supabase.com/dashboard/project/onczdkiimtfpvohrpcxa" icon={<Database size={14} />} />
        <DocLink label="Table Editor" url="https://supabase.com/dashboard/project/onczdkiimtfpvohrpcxa/editor" icon={<Layers size={14} />} />
        <DocLink label="Storage Buckets" url="https://supabase.com/dashboard/project/onczdkiimtfpvohrpcxa/storage/buckets" icon={<HardDrive size={14} />} />
        <DocLink label="Authentication" url="https://supabase.com/dashboard/project/onczdkiimtfpvohrpcxa/auth/users" icon={<Key size={14} />} />
      </Section>

      <Section title="Deployment" icon={<Server size={16} style={{ color: C.green }} />}>
        <DocLink label="Vercel Dashboard" url="https://vercel.com/dashboard" icon={<Server size={14} />} />
        <DocLink label="GitHub Repository" url="https://github.com" icon={<GitBranch size={14} />} />
        <div style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 12, padding: '12px 14px', marginTop: 8 }}>
          <p style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.8 }}>
            <strong style={{ color: C.green }}>Deploy:</strong> git add . → git commit -m "update" → git push<br />
            <strong style={{ color: C.green }}>Build:</strong> npm run build &nbsp;&nbsp; <strong style={{ color: C.green }}>Output:</strong> dist
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
        <DocLink label="Google AdSense Dashboard" url="https://adsense.google.com" icon={<DollarSign size={14} />} />
        <DocLink label="Google Analytics" url="https://analytics.google.com" icon={<BarChart3 size={14} />} />
        <DocLink label="Google AdMob" url="https://admob.google.com" icon={<MonitorSmartphone size={14} />} />
      </Section>

      <Section title="Quick SQL Reference" icon={<Database size={16} style={{ color: C.purple }} />}>
        {[
          { label: 'View all apps', sql: 'SELECT * FROM apps ORDER BY created_at DESC;' },
          { label: 'View all feedbacks', sql: 'SELECT * FROM feedbacks ORDER BY created_at DESC;' },
          { label: 'Count published apps', sql: 'SELECT COUNT(*) FROM apps WHERE published = TRUE;' },
          { label: 'View settings', sql: 'SELECT * FROM settings;' },
        ].map((q, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
              <p style={{ fontSize: 11, color: C.textFaint, fontWeight: 600 }}>{q.label}</p>
              <CopyBtn text={q.sql} k={`sql-${i}`} />
            </div>
            <div style={{ background: 'rgba(0,0,0,0.6)', borderRadius: 10, padding: '10px 14px', fontFamily: 'monospace', fontSize: 12, color: '#67e8f9', border: `1px solid ${C.border}` }}>{q.sql}</div>
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
  const blank: Partial<AppData> = { name: '', version: '1.0.0', description: '', apk_link: '', badge: 'New', icon: '📱', icon_url: '', screenshots: [], downloads: '0', size: '0 MB', category: '📱 Tools', rating: '4.5', updated: new Date().toISOString().slice(0, 10), published: false };
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

  const openAdd = () => { setForm({ ...blank, screenshots: [] }); setEditId(null); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const openEdit = (a: AppData) => { setForm({ ...a, screenshots: a.screenshots || [] }); setEditId(a.id); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const closeForm = () => { setShowForm(false); setEditId(null); };

  const addScreenshot = (url: string) => setForm(p => ({ ...p, screenshots: [...(p.screenshots || []), url] }));
  const removeScreenshot = (idx: number) => setForm(p => ({ ...p, screenshots: (p.screenshots || []).filter((_, i) => i !== idx) }));

  const validate = () => {
    if (!form.name?.trim()) { addToast('❌ App name is required', 'error'); return false; }
    if (form.apk_link && form.apk_link !== '#' && !form.apk_link.startsWith('http')) { addToast('❌ APK link must be a valid URL', 'error'); return false; }
    const r = parseFloat(form.rating || '0');
    if (isNaN(r) || r < 0 || r > 5) { addToast('❌ Rating must be 0–5', 'error'); return false; }
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
      addToast('🗑️ Deleted', 'success'); await refreshApps();
    } catch (e: any) { addToast(`❌ ${e.message}`, 'error'); }
  };

  const togglePub = async (id: number, cur: boolean) => {
    try {
      const { error } = await supabase.from('apps').update({ published: !cur }).eq('id', id);
      if (error) throw error;
      addToast(!cur ? '🟢 Published!' : '📝 Draft', 'success'); await refreshApps();
    } catch (e: any) { addToast(`❌ ${e.message}`, 'error'); }
  };

  const fa = apps.filter(a => filter === 'all' ? true : filter === 'published' ? a.published : !a.published);
  const pubC = apps.filter(a => a.published).length;
  const draftC = apps.filter(a => !a.published).length;

  const iS: React.CSSProperties = { width: '100%', background: 'rgba(15,23,42,0.8)', border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 14px', color: C.text, fontSize: 13.5, outline: 'none', transition: 'all 0.2s' };

  const adminTabs = [
    { k: 'apps' as const, ic: <Smartphone size={14} />, lb: 'Apps', c: C.orange },
    { k: 'feedbacks' as const, ic: <MessageSquare size={14} />, lb: 'Feedbacks', c: C.blue, badge: unread },
    { k: 'monetization' as const, ic: <DollarSign size={14} />, lb: 'Monetization', c: C.gold },
    { k: 'docs' as const, ic: <FileText size={14} />, lb: 'Tech Docs', c: C.purple },
  ];

  return (
    <section style={{ padding: '100px 16px 80px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 6 }}>
              <div style={{ width: 42, height: 42, borderRadius: 14, background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Settings style={{ color: C.orange }} size={20} />
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: C.text, letterSpacing: -0.5 }}>Admin Panel</h2>
            </div>
            <p style={{ color: C.textMuted, fontSize: 13 }}>Logged in as <span style={{ color: C.orange, fontWeight: 600 }}>{session?.user?.email}</span></p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button onClick={refreshApps} disabled={isRefreshing} className="btn-ghost" style={{ padding: '9px 15px', borderRadius: 13, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, opacity: isRefreshing ? 0.5 : 1 }}>
              {isRefreshing ? <Loader2 size={12} className="spin" /> : <RefreshCw size={12} />} Refresh
            </button>
            <button onClick={openAdd} className="btn-primary" style={{ padding: '9px 18px', borderRadius: 13, fontSize: 12, display: 'flex', alignItems: 'center', gap: 7 }}>
              <Plus size={14} /> Add New App
            </button>
            <button onClick={onLogout} style={{ padding: '9px 15px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 13, color: C.red, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <LogOut size={12} /> Logout
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 24 }}>
          {[
            { l: 'Total Apps', v: apps.length, c: C.text, bg: 'rgba(255,255,255,0.03)', bc: C.border, ic: <Layers size={14} /> },
            { l: 'Published', v: pubC, c: C.green, bg: 'rgba(34,197,94,0.07)', bc: 'rgba(34,197,94,0.2)', ic: <Eye size={14} /> },
            { l: 'Drafts', v: draftC, c: C.amber, bg: 'rgba(251,191,36,0.07)', bc: 'rgba(251,191,36,0.2)', ic: <EyeOff size={14} /> },
            { l: 'Feedbacks', v: feedbacks.length, c: C.blue, bg: 'rgba(96,165,250,0.07)', bc: 'rgba(96,165,250,0.2)', ic: <MessageSquare size={14} />, badge: unread },
          ].map((s, i) => (
            <div key={i} style={{ background: s.bg, border: `1px solid ${s.bc}`, borderRadius: 14, padding: '16px', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: s.c, marginBottom: 8, opacity: 0.7 }}>{s.ic}<span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.4 }}>{s.l.toUpperCase()}</span></div>
              <p style={{ fontSize: 28, fontWeight: 900, color: s.c, lineHeight: 1 }}>{s.v}</p>
              {s.badge != null && s.badge > 0 && <span className="pulse" style={{ position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: '50%', background: C.orange, color: 'white', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.badge}</span>}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24, paddingBottom: 18, borderBottom: `1px solid ${C.border}` }}>
          {adminTabs.map(t => (
            <button key={t.k} onClick={() => { setTab(t.k); if (t.k === 'feedbacks') fetchFb(); }} style={{
              padding: '10px 18px', borderRadius: 13, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer',
              background: tab === t.k ? `${t.c}18` : 'transparent',
              color: tab === t.k ? t.c : C.textFaint,
              border: `1px solid ${tab === t.k ? `${t.c}35` : 'transparent'}`,
              transition: 'all 0.2s'
            }}>
              {t.ic}{t.lb}
              {t.badge != null && t.badge > 0 && <span style={{ width: 18, height: 18, borderRadius: '50%', background: C.orange, color: 'white', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.badge}</span>}
            </button>
          ))}
        </div>

        {tab === 'apps' && (
          <>
            {showForm && (
              <div className="slide-down" style={{ background: C.bgCard, border: '1px solid rgba(255,107,53,0.25)', borderRadius: 22, padding: '28px 22px', marginBottom: 32, boxShadow: '0 0 40px rgba(255,107,53,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: C.text, display: 'flex', alignItems: 'center', gap: 9 }}>
                    {editId !== null ? <><Edit3 size={18} style={{ color: C.orange }} />Edit App</> : <><Plus size={18} style={{ color: C.orange }} />Add New App</>}
                  </h3>
                  <button onClick={closeForm} style={{ color: C.textFaint, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, cursor: 'pointer', padding: 8, borderRadius: 10 }}><X size={16} /></button>
                </div>

                <div style={{ marginBottom: 22 }}>
                  <p style={{ fontSize: 11, color: C.orange, fontWeight: 700, letterSpacing: 0.6, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}><BarChart3 size={12} />BASIC INFORMATION</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 13 }}>
                    {[
                      { k: 'name', l: 'App Name *', ph: 'My Awesome App' },
                      { k: 'version', l: 'Version', ph: '1.0.0' },
                      { k: 'icon', l: 'Icon Emoji', ph: '📱' },
                      { k: 'rating', l: 'Rating (0–5)', ph: '4.5' },
                      { k: 'downloads', l: 'Downloads Count', ph: '10000' },
                      { k: 'size', l: 'File Size', ph: '4.5 MB' },
                      { k: 'updated', l: 'Last Updated', ph: '', type: 'date' },
                    ].map(f => (
                      <div key={f.k}>
                        <label style={{ display: 'block', fontSize: 11, color: C.textFaint, marginBottom: 6, fontWeight: 600, letterSpacing: 0.3 }}>{f.l}</label>
                        <input type={f.type || 'text'} value={String((form as any)[f.k] ?? '')} onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))} placeholder={f.ph} style={iS} className="input-base" />
                      </div>
                    ))}

                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: C.textFaint, marginBottom: 6, fontWeight: 600, letterSpacing: 0.3 }}>CATEGORY</label>
                      <div style={{ position: 'relative' }}>
                        <select value={form.category || ''} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={{ ...iS, appearance: 'none', paddingRight: 36, cursor: 'pointer' }} className="input-base">
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronDown size={13} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: C.textFaint, pointerEvents: 'none' }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 22 }}>
                  <label style={{ display: 'block', fontSize: 11, color: C.textFaint, marginBottom: 6, fontWeight: 600, letterSpacing: 0.3 }}>DESCRIPTION (supports emojis 🎉)</label>
                  <textarea value={form.description ?? ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe what this app does, its features and benefits. Be detailed — users see the full text when they tap the app!" rows={6} style={{ ...iS, resize: 'vertical', minHeight: 120, lineHeight: 1.8 }} className="input-base" />
                </div>

                <div style={{ marginBottom: 22 }}>
                  <p style={{ fontSize: 11, color: C.orange, fontWeight: 700, letterSpacing: 0.6, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}><Package size={12} />APK FILE</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: C.textFaint, marginBottom: 6, fontWeight: 600 }}>MANUAL URL (GitHub, Google Drive, etc.)</label>
                      <input value={form.apk_link ?? ''} onChange={e => setForm(p => ({ ...p, apk_link: e.target.value }))} placeholder="https://github.com/user/repo/releases/download/v1.0/app.apk" style={iS} className="input-base" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, height: 1, background: C.border }} />
                      <span style={{ fontSize: 11, color: C.textFaint }}>OR UPLOAD DIRECTLY TO SUPABASE</span>
                      <div style={{ flex: 1, height: 1, background: C.border }} />
                    </div>
                    <FileUpload label="UPLOAD APK FILE (max 100MB)" hint="Stored in Supabase Storage — direct download link auto-fills" accept=".apk,application/vnd.android.package-archive" bucket="apks" folder="uploads" currentUrl={form.apk_link?.includes('supabase') ? form.apk_link : undefined} onUploadComplete={url => setForm(p => ({ ...p, apk_link: url }))} addToast={addToast} />
                  </div>
                </div>

                <div style={{ marginBottom: 22 }}>
                  <p style={{ fontSize: 11, color: C.orange, fontWeight: 700, letterSpacing: 0.6, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}><FileImage size={12} />ICON & BADGE</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 13 }}>
                    <div>
                      <FileUpload label="UPLOAD APP ICON (PNG/JPG, max 5MB)" hint="Recommended: 512×512px" accept="image/png,image/jpeg,image/webp" bucket="icons" folder="app-icons" currentUrl={form.icon_url || undefined} onUploadComplete={url => setForm(p => ({ ...p, icon_url: url }))} addToast={addToast} />
                      {form.icon_url && (
                        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                          <img src={form.icon_url} alt="preview" style={{ width: 52, height: 52, borderRadius: 15, objectFit: 'cover', border: `1px solid ${C.border}` }} />
                          <div>
                            <p style={{ fontSize: 11, color: C.green }}>✅ Icon uploaded</p>
                            <button onClick={() => setForm(p => ({ ...p, icon_url: '' }))} style={{ fontSize: 11, color: C.red, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 4 }}>Remove</button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: C.textFaint, marginBottom: 6, fontWeight: 600, letterSpacing: 0.3 }}>APP BADGE</label>
                      <div style={{ position: 'relative' }}>
                        <select value={form.badge || 'New'} onChange={e => setForm(p => ({ ...p, badge: e.target.value }))} style={{ ...iS, appearance: 'none', paddingRight: 36, cursor: 'pointer' }} className="input-base">
                          {BADGES.map(b => <option key={b.value} value={b.value}>{b.label} — {b.desc}</option>)}
                        </select>
                        <ChevronDown size={13} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: C.textFaint, pointerEvents: 'none' }} />
                      </div>
                      <div style={{ marginTop: 12, padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}` }}>
                        <p style={{ fontSize: 11, color: C.textFaint, marginBottom: 8 }}>Badge Preview:</p>
                        <span style={{ display: 'inline-block', padding: '4px 13px', borderRadius: 999, fontSize: 11, fontWeight: 700, color: 'white', background: getBadgeGradient(form.badge || 'New'), boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                          {getBadgeEmoji(form.badge || 'New')} {form.badge || 'New'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 22 }}>
                  <p style={{ fontSize: 11, color: C.orange, fontWeight: 700, letterSpacing: 0.6, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}><Images size={12} />APP SCREENSHOTS</p>
                  <ScreenshotUpload screenshots={form.screenshots || []} onAdd={addScreenshot} onRemove={removeScreenshot} addToast={addToast} />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: 11, color: C.orange, fontWeight: 700, letterSpacing: 0.6, marginBottom: 13, display: 'flex', alignItems: 'center', gap: 6 }}><Eye size={12} />VISIBILITY</p>
                  <button type="button" onClick={() => setForm(p => ({ ...p, published: !p.published }))} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '16px 18px', borderRadius: 14, cursor: 'pointer', transition: 'all 0.2s',
                    background: form.published ? 'rgba(34,197,94,0.07)' : 'rgba(251,191,36,0.07)',
                    border: `1px solid ${form.published ? 'rgba(34,197,94,0.25)' : 'rgba(251,191,36,0.25)'}`,
                    color: form.published ? C.green : C.amber
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 600 }}>
                      {form.published ? <Eye size={17} /> : <EyeOff size={17} />}
                      {form.published ? '🟢 Published — Visible to everyone' : '📝 Draft — Hidden from website'}
                    </span>
                    {form.published ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 10, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
                  <button onClick={save} disabled={saving} className="btn-primary" style={{ padding: '13px 28px', borderRadius: 14, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, opacity: saving ? 0.55 : 1 }}>
                    {saving ? <Loader2 size={15} className="spin" /> : <Save size={15} />}
                    {saving ? 'Saving...' : editId !== null ? 'Update App' : 'Add App'}
                  </button>
                  <button onClick={closeForm} className="btn-ghost" style={{ padding: '13px 22px', borderRadius: 14, fontSize: 14 }}>Cancel</button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 18 }}>
              {(['all', 'published', 'draft'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: '8px 16px', borderRadius: 13, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                  background: filter === f ? 'rgba(255,107,53,0.1)' : 'rgba(255,255,255,0.03)',
                  color: filter === f ? C.orange : C.textFaint,
                  border: `1px solid ${filter === f ? 'rgba(255,107,53,0.28)' : C.border}`
                }}>
                  {f === 'all' ? `All (${apps.length})` : f === 'published' ? `🟢 Published (${pubC})` : `📝 Drafts (${draftC})`}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {fa.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '64px 0', color: C.textFaint }}>
                  <Inbox size={40} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.3 }} />
                  <p style={{ fontSize: 16 }}>No apps here</p>
                  <button onClick={openAdd} style={{ marginTop: 16, padding: '9px 18px', background: 'rgba(255,107,53,0.08)', color: C.orange, borderRadius: 12, fontSize: 13, border: '1px solid rgba(255,107,53,0.2)', cursor: 'pointer', fontWeight: 600 }}>+ Add your first app</button>
                </div>
              ) : fa.map(app => (
                <div key={app.id} style={{ background: C.bgCard, border: `1px solid ${app.published ? 'rgba(34,197,94,0.18)' : C.border}`, borderRadius: 15, padding: '15px 17px', display: 'flex', alignItems: 'center', gap: 13, opacity: app.published ? 1 : 0.65, transition: 'all 0.2s' }}>
                  <div style={{ width: 50, height: 50, flexShrink: 0, background: 'rgba(255,107,53,0.07)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, overflow: 'hidden', border: `1px solid ${C.border}` }}>
                    {app.icon_url ? <img src={app.icon_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : app.icon || '📱'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>{app.name}</span>
                      <span style={{ background: getBadgeGradient(app.badge), padding: '2px 9px', borderRadius: 999, fontSize: 9, fontWeight: 700, color: 'white' }}>{getBadgeEmoji(app.badge)} {app.badge}</span>
                      <span style={{ padding: '2px 9px', borderRadius: 999, fontSize: 9, fontWeight: 600, background: app.published ? 'rgba(34,197,94,0.12)' : 'rgba(251,191,36,0.12)', color: app.published ? C.green : C.amber }}>
                        {app.published ? '🟢 Live' : '📝 Draft'}
                      </span>
                      {app.screenshots && app.screenshots.length > 0 && <span style={{ padding: '2px 9px', borderRadius: 999, fontSize: 9, fontWeight: 600, background: 'rgba(168,85,247,0.1)', color: C.purple }}>📸 {app.screenshots.length} shots</span>}
                    </div>
                    <p style={{ color: C.textFaint, fontSize: 11.5 }}>v{app.version} · {app.size} · {app.category} · ⬇️ {formatDownloads(app.downloads)}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => togglePub(app.id, app.published)} className="action-btn" style={{ background: app.published ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: app.published ? C.green : C.amber, border: `1px solid ${app.published ? 'rgba(16,185,129,0.22)' : 'rgba(245,158,11,0.22)'}` }}>
                      {app.published ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>
                    <button onClick={() => openEdit(app)} className="action-btn" style={{ background: 'rgba(255,107,53,0.1)', color: C.orange, border: '1px solid rgba(255,107,53,0.22)' }}><Edit3 size={13} /></button>
                    <button onClick={() => del(app.id)} className="action-btn" style={{ background: 'rgba(239,68,68,0.08)', color: C.red, border: '1px solid rgba(239,68,68,0.18)' }}><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'feedbacks' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <p style={{ color: C.textMuted, fontSize: 13 }}>{feedbacks.length} total · <span style={{ color: C.orange, fontWeight: 600 }}>{unread} unread</span></p>
              <button onClick={fetchFb} disabled={fbLoading} className="btn-ghost" style={{ padding: '7px 13px', borderRadius: 11, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, opacity: fbLoading ? 0.5 : 1 }}>
                {fbLoading ? <Loader2 size={11} className="spin" /> : <RefreshCw size={11} />} Refresh
              </button>
            </div>
            {fbLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1, 2, 3].map(i => <div key={i} className="shimmer-skeleton" style={{ height: 80 }} />)}
              </div>
            ) : feedbacks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '72px 0', color: C.textFaint }}>
                <Inbox size={40} style={{ margin: '0 auto 14px', display: 'block', opacity: 0.3 }} />
                <p>No feedbacks yet</p>
                <p style={{ fontSize: 12, marginTop: 6, opacity: 0.5 }}>Messages from users will appear here</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {feedbacks.map(fb => (
                  <div key={fb.id} style={{ border: `1px solid ${!fb.read ? 'rgba(255,107,53,0.25)' : C.border}`, borderRadius: 14, overflow: 'hidden', background: !fb.read ? 'rgba(255,107,53,0.03)' : C.bgCard }}>
                    <div onClick={() => { setExpandFb(expandFb === fb.id ? null : fb.id); if (!fb.read) markRead(fb.id); }} style={{ padding: '15px 18px', display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                      <div style={{ width: 9, height: 9, borderRadius: '50%', marginTop: 5, flexShrink: 0, background: !fb.read ? C.orange : C.border }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 5 }}>
                          <span style={{ fontWeight: 700, color: C.text, fontSize: 13.5 }}>{fb.name}</span>
                          <span style={{ color: C.textFaint, fontSize: 12 }}>{fb.email}</span>
                          <span style={{ padding: '2px 9px', borderRadius: 8, fontSize: 10, background: fb.subject === 'Bug Report' ? 'rgba(239,68,68,0.1)' : fb.subject === 'Feature Request' ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.04)', color: fb.subject === 'Bug Report' ? C.red : fb.subject === 'Feature Request' ? C.blue : C.textMuted, border: `1px solid ${C.border}` }}>{fb.subject}</span>
                          {!fb.read && <span style={{ padding: '2px 9px', borderRadius: 999, fontSize: 9, background: 'rgba(255,107,53,0.12)', color: C.orange, fontWeight: 700 }}>NEW</span>}
                        </div>
                        <p style={{ color: C.textMuted, fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.6 }}>{fb.message}</p>
                        <p style={{ color: C.textFaint, fontSize: 10.5, marginTop: 5 }}>{formatTimeAgo(fb.created_at)}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                        {expandFb === fb.id ? <ChevronUp size={13} style={{ color: C.textFaint }} /> : <ChevronDown size={13} style={{ color: C.textFaint }} />}
                        <button onClick={e => { e.stopPropagation(); deleteFb(fb.id); }} style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textFaint, border: `1px solid ${C.border}`, cursor: 'pointer', padding: 0, marginLeft: 5 }}><Trash2 size={11} /></button>
                      </div>
                    </div>
                    {expandFb === fb.id && (
                      <div style={{ padding: '0 20px 20px' }}>
                        <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 14, padding: '16px', border: `1px solid ${C.border}` }}>
                          <p style={{ color: C.text, fontSize: 13.5, lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>{fb.message}</p>
                        </div>
                        <a href={`mailto:${fb.email}?subject=Re: ${fb.subject} — SunRise Apps`} style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: C.orange, textDecoration: 'none', fontWeight: 600 }}>
                          <Mail size={13} /> Reply to {fb.email}
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'monetization' && <MonetizationTab addToast={addToast} />}
        {tab === 'docs' && <TechDocsTab />}
      </div>
    </section>
  );
};

// ============ ABOUT ============
const AboutSection = () => (
  <section id="about-section" style={{ padding: '80px 16px' }}>
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div className="glass-panel" style={{ borderRadius: 24, padding: '40px 32px', position: 'relative', overflow: 'hidden', boxShadow: '0 0 60px rgba(255,107,53,0.08)' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, background: 'radial-gradient(circle, rgba(255,107,53,0.12), transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 220, height: 220, background: 'radial-gradient(circle, rgba(168,85,247,0.1), transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30, position: 'relative', zIndex: 1 }}>
          <div className="float-anim" style={{ width: 120, height: 120, background: 'linear-gradient(135deg, #FF6B35, #FFB800)', borderRadius: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52, boxShadow: '0 0 60px rgba(255,107,53,0.35)', flexShrink: 0 }}>🌅</div>
          <div style={{ textAlign: 'center', maxWidth: 560 }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: C.text, marginBottom: 18, letterSpacing: -0.5 }}>
              About <span style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SunRise Apps</span>
            </h2>
            <p style={{ color: C.textMuted, marginBottom: 14, lineHeight: 1.9, fontSize: 15 }}>Independent Android developer from India 🇮🇳, building viral utility apps that solve real everyday problems.</p>
            <p style={{ color: C.textMuted, marginBottom: 28, lineHeight: 1.9, fontSize: 15 }}>Every sunrise brings new possibilities — free tools for everyone, powered by non-intrusive ads.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
              <a href="https://instagram.com/SunRise_Apps" target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 18px', background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.2)', borderRadius: 14, color: '#f472b6', fontSize: 13, fontWeight: 500 }}>📸 @SunRise_Apps</a>
              <a href="mailto:thesunrisecode@gmail.com" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 18px', background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 14, color: C.blue, fontSize: 13 }}><Mail size={14} /> thesunrisecode@gmail.com</a>
              <a href="https://sunriseapps.in" target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 18px', background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.2)', borderRadius: 14, color: C.orange, fontSize: 13 }}><Globe size={14} /> sunriseapps.in</a>
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
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ width: 76, height: 76, margin: '0 auto 18px', borderRadius: 22, background: 'linear-gradient(135deg, rgba(34,197,94,0.18), rgba(16,185,129,0.1))', border: '1px solid rgba(34,197,94,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(34,197,94,0.2)' }}>
          <ShieldCheck style={{ color: C.green }} size={34} />
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: C.text, marginBottom: 10, letterSpacing: -0.5 }}>
          Privacy <span style={{ background: 'linear-gradient(135deg, #22c55e, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Policy</span>
        </h2>
        <p style={{ color: C.textMuted, fontSize: 14.5, lineHeight: 1.7 }}>Your privacy is our priority.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 32 }}>
        {[
          { icon: <HardDrive size={16} />, title: 'Offline Processing', desc: 'Apps work without sending your data anywhere', c: C.green },
          { icon: <Wifi size={16} />, title: 'No Data Upload', desc: 'We never upload your personal files', c: C.blue },
          { icon: <ShieldCheck size={16} />, title: 'HTTPS Encrypted', desc: 'All connections secured with SSL/TLS', c: C.purple },
          { icon: <Eye size={16} />, title: 'Transparent', desc: 'Clear about what we collect and why', c: C.orange },
        ].map((b, i) => (
          <div key={i} className="glass-panel" style={{ borderRadius: 16, padding: '16px', display: 'flex', gap: 11 }}>
            <div style={{ color: b.c, flexShrink: 0, marginTop: 2 }}>{b.icon}</div>
            <div>
              <p style={{ fontSize: 12.5, fontWeight: 700, color: b.c, marginBottom: 4 }}>{b.title}</p>
              <p style={{ fontSize: 11.5, color: C.textMuted, lineHeight: 1.6 }}>{b.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-panel" style={{ borderRadius: 22, padding: '28px 26px' }}>
        {[
          { t: '1. Data We Collect', d: 'We collect only what you voluntarily provide through the contact form (name, email, message). No tracking scripts, no cookies without consent, no hidden data collection.' },
          { t: '2. Advertisements', d: 'Google AdSense and AdMob may use anonymous device identifiers for personalized ads. You may opt out at any time via your device settings or at g.co/privacytools.' },
          { t: '3. Data Security', d: 'All data transmission is secured with HTTPS/TLS encryption. Your contact form data is stored securely in our database and never sold or shared with third parties.' },
          { t: '4. Third-Party Services', d: 'We use Supabase (database), Google Analytics (traffic insights), and Google AdSense. Each operates under their own privacy policy, which we encourage you to review.' },
          { t: "5. Children's Privacy", d: 'Our services are not directed at children under 13. We do not knowingly collect personal information from minors. If discovered, such data will be immediately deleted.' },
          { t: '6. Your Rights', d: 'You have the right to request deletion of your data at any time. Contact us at thesunrisecode@gmail.com and we will respond within 48 hours.' },
          { t: '7. Policy Updates', d: 'We may update this policy occasionally. Significant changes will be communicated clearly. Continued use of our services after changes constitutes acceptance.' },
        ].map((p, i, arr) => (
          <div key={i} style={{ marginBottom: i < arr.length - 1 ? 26 : 0, paddingBottom: i < arr.length - 1 ? 26 : 0, borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: C.orange, marginBottom: 9 }}>{p.t}</h3>
            <p style={{ color: C.textMuted, fontSize: 14, lineHeight: 1.95 }}>{p.d}</p>
          </div>
        ))}
        <div style={{ marginTop: 26, paddingTop: 18, borderTop: `1px solid ${C.border}`, textAlign: 'center' }}>
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
        <div style={{ textAlign: 'center', marginBottom: 34 }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: C.text, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 11, letterSpacing: -0.5 }}>
            <Mail style={{ color: C.orange }} size={28} />
            Contact <span style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Us</span>
          </h2>
          <p style={{ color: C.textMuted, fontSize: 14.5, lineHeight: 1.7 }}>Have a question or suggestion? We'd love to hear from you.</p>
        </div>
        <div className="glass-panel" style={{ borderRadius: 22, padding: '28px 24px' }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }} className="fade-in">
              <div style={{ width: 80, height: 80, margin: '0 auto 20px', borderRadius: 24, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(34,197,94,0.15)' }}>
                <CheckCircle style={{ color: C.green }} size={36} />
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 10 }}>Message Sent!</h3>
              <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 28, lineHeight: 1.7 }}>We've received your message and will reply within 24 hours.</p>
              <button onClick={() => setSent(false)} className="btn-ghost" style={{ padding: '11px 24px', borderRadius: 13, fontSize: 13 }}>Send Another</button>
            </div>
          ) : (
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: C.textFaint, marginBottom: 6, fontWeight: 600, letterSpacing: 0.5 }}>NAME *</label>
                  <input type="text" required value={fd.name} onChange={e => setFd(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" className="input-base" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: C.textFaint, marginBottom: 6, fontWeight: 600, letterSpacing: 0.5 }}>EMAIL *</label>
                  <input type="email" required value={fd.email} onChange={e => setFd(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" className="input-base" />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: C.textFaint, marginBottom: 6, fontWeight: 600, letterSpacing: 0.5 }}>SUBJECT</label>
                <div style={{ position: 'relative' }}>
                  <select value={fd.subject} onChange={e => setFd(f => ({ ...f, subject: e.target.value }))} className="input-base" style={{ appearance: 'none', paddingRight: 36, cursor: 'pointer' }}>
                    {['General', 'Bug Report', 'Feature Request', 'Business', 'Other'].map(s => <option key={s}>{s}</option>)}
                  </select>
                  <ChevronDown size={13} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', color: C.textFaint, pointerEvents: 'none' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: C.textFaint, marginBottom: 6, fontWeight: 600, letterSpacing: 0.5 }}>MESSAGE *</label>
                <textarea required rows={5} value={fd.message} onChange={e => setFd(f => ({ ...f, message: e.target.value }))} placeholder="Tell us what's on your mind..." className="input-base" style={{ resize: 'vertical', minHeight: 130, lineHeight: 1.8 }} />
              </div>
              <button type="submit" disabled={busy} className="btn-primary" style={{ padding: '15px', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, opacity: busy ? 0.55 : 1, fontSize: 15 }}>
                {busy ? <Loader2 size={18} className="spin" /> : <Mail size={18} />}
                {busy ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
          <div style={{ marginTop: 30, paddingTop: 22, borderTop: `1px solid ${C.border}`, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, textAlign: 'center' }}>
            {[
              { href: 'mailto:thesunrisecode@gmail.com', icon: <Mail size={18} />, label: 'Email Us', c: C.blue },
              { href: 'https://instagram.com/SunRise_Apps', icon: <span style={{ fontSize: 18 }}>📸</span>, label: '@SunRise_Apps', target: '_blank', c: C.pink },
              { href: 'https://sunriseapps.in', icon: <Globe size={18} />, label: 'Website', target: '_blank', c: C.orange },
            ].map((l, i) => (
              <a key={i} href={l.href} target={(l as any).target} rel="noreferrer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, color: l.c, textDecoration: 'none', fontSize: 11.5, padding: '13px 8px', borderRadius: 13, transition: 'all 0.2s' }}>
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
  const [detailApp, setDetailApp] = useState<AppData | null>(null);
  const [unlocked, setUnlocked] = useState<number[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  const fetchApps = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.from('apps').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setApps(data || []);
    } catch (e: any) { addToast(`❌ ${e.message}`, 'error'); }
    finally { setRefreshing(false); setLoading(false); }
  }, [addToast]);

  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await supabase.from('settings').select('*').single();
      if (data) setSiteSettings(data);
    } catch (_) { }
  }, []);

  useEffect(() => { fetchApps(); fetchSettings(); }, [fetchApps, fetchSettings]);

  useEffect(() => {
    const ch = supabase.channel('apps-live').on('postgres_changes', { event: '*', schema: 'public', table: 'apps' }, fetchApps).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchApps]);

  const logout = async () => { await supabase.auth.signOut(); setPage('home'); addToast('👋 Logged out', 'info'); };

  // 🛡️ SAFE DOWNLOAD FLOW
  const performSafeDownload = useCallback(async (app: AppData) => {
    addToast('⬇️ Preparing safe download...', 'info', 2500);
    await triggerSafeDownload(app.apk_link, app.name, (status) => {
      if (status === 'success') {
        addToast(
          `✅ ${app.name}_SunRise_Official.apk downloaded!\n\n📲 If prompted, tap "Settings" → "Allow from this source" to install. Our app is 100% verified.`,
          'install',
          10000
        );
      } else if (status === 'fallback') {
        addToast('⚠️ Direct download started in new tab', 'info', 4000);
      }
    });
  }, [addToast]);

  const download = useCallback((app: AppData) => {
    if (unlocked.includes(app.id)) {
      performSafeDownload(app);
    } else {
      setModal(app);
    }
  }, [unlocked, performSafeDownload]);

  const unlock = useCallback(() => {
    if (modal) {
      setUnlocked(p => [...p, modal.id]);
      performSafeDownload(modal);
      setModal(null);
    }
  }, [modal, performSafeDownload]);

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
        <div style={{ width: 72, height: 72, background: 'linear-gradient(135deg, #FF6B35, #FFB800)', borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 0 60px rgba(255,107,53,0.4)' }}>
          <Sun size={32} style={{ color: 'white' }} />
        </div>
        <Loader2 style={{ color: C.orange, margin: '0 auto 16px', display: 'block' }} size={28} className="spin" />
        <p style={{ color: C.textMuted, fontSize: 13.5 }}>Loading SunRise Apps...</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text }}>
      <GlobalStyles />

      {siteSettings?.ads_enabled && siteSettings.ad_client_id && (
        <script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${siteSettings.ad_client_id}`} crossOrigin="anonymous" />
      )}

      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
            <button onClick={() => go('home')} style={{ display: 'flex', alignItems: 'center', gap: 11, background: 'none', border: 'none', cursor: 'pointer', color: C.text, flexShrink: 0 }}>
              <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #FF6B35, #FFB800)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(255,107,53,0.35)', flexShrink: 0 }}>
                <Sun size={18} style={{ color: 'white' }} />
              </div>
              <span style={{ fontWeight: 900, fontSize: 17, letterSpacing: -0.5 }}>
                Sun<span style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB800)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Rise</span>
                <span style={{ color: C.textFaint, fontWeight: 400, fontSize: 14, marginLeft: 5 }}>Apps</span>
              </span>
            </button>

            <div className="desktop-nav" style={{ display: 'none', alignItems: 'center', gap: 2 }}>
              {navItems.map(item => (
                <button key={item.id} onClick={() => go(item.id)} className="nav-btn" style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 12,
                  fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none',
                  background: page === item.id ? 'rgba(255,107,53,0.12)' : item.highlight ? 'rgba(250,204,21,0.07)' : 'transparent',
                  color: page === item.id ? C.orange : item.highlight ? C.gold : C.textMuted
                }}>
                  {item.icon}<span>{item.label}</span>
                </button>
              ))}
            </div>

            <button onClick={() => setMenuOpen(!menuOpen)} className="mobile-only btn-ghost" style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, padding: 0 }}>
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          {menuOpen && (
            <div className="slide-down" style={{ paddingBottom: 16, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 12 }}>
              {navItems.map(item => (
                <button key={item.id} onClick={() => go(item.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 16px', borderRadius: 12, fontSize: 14, fontWeight: 500, textAlign: 'left',
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

      {page === 'home' && (
        <>
          <HomePage apps={apps} onDownload={download} unlockedApps={unlocked} loading={loading || refreshing} settings={siteSettings} onViewDetail={setDetailApp} />
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

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '48px 16px', textAlign: 'center', background: 'rgba(15,23,42,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #FF6B35, #FFB800)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(255,107,53,0.3)' }}>
            <Sun size={16} style={{ color: 'white' }} />
          </div>
          <span style={{ fontWeight: 800, color: C.textMuted, fontSize: 15 }}>SunRise Apps</span>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 999, marginBottom: 14, fontSize: 11.5, color: C.green, fontWeight: 600 }}>
          🛡️ All apps verified safe by SunRise Security
        </div>
        <p style={{ color: C.textFaint, fontSize: 12.5, marginBottom: 8 }}>Free viral Android apps — always updated 🚀</p>
        <p style={{ color: C.textFaint, fontSize: 10.5, opacity: 0.5 }}>© 2026 SunRise Apps · Built with ❤️ in India</p>
      </footer>

      <AppDetailModal app={detailApp} onClose={() => setDetailApp(null)} onDownload={download} unlocked={detailApp ? unlocked.includes(detailApp.id) : false} />

      <LockModal app={modal} onClose={() => setModal(null)} onUnlock={unlock} />
      <ScrollToTop />
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}