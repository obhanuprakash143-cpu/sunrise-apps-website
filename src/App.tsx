import { useState, useEffect, useCallback } from 'react';
import {
  Sun, Download, Share2, Lock, Shield, Mail,
  Globe, ChevronDown, ChevronRight, Menu, X, Star, Users, Smartphone,
  Settings, Plus, Trash2, Edit3, Save, Eye, EyeOff, BarChart3, BookOpen,
  Check, Copy, ArrowUp, Search, Filter, LogOut, KeyRound, AlertTriangle,
  ToggleLeft, ToggleRight
} from 'lucide-react';
import defaultApps from './data/apps.json';

// ============ TYPES ============
interface AppData {
  id: number;
  name: string;
  version: string;
  description: string;
  apk_link: string;
  badge: string;
  icon: string;
  downloads: string;
  size: string;
  category: string;
  rating: string;
  updated: string;
  published: boolean;
}

// ============ CONFIG ============
const ADMIN_PASSWORD = 'sunrise@2025';
const ADMIN_SECRET_KEY = 'sunrise2025';
const STORAGE_KEY = 'sunrise_apps_data';
const ADMIN_AUTH_KEY = 'sunrise_admin_auth';

// ============ HELPERS ============
const formatDownloads = (num: string) => {
  const n = parseInt(num);
  if (isNaN(n) || n === 0) return '0';
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

const loadApps = (): AppData[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* fallback */ }
  return defaultApps as AppData[];
};

const saveApps = (apps: AppData[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
};

const isAdminLoggedIn = (): boolean => {
  return sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true';
};

// ============ SMALL COMPONENTS ============

const ScrollToTop = () => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  if (!show) return null;
  return (
    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-sunrise to-golden text-black flex items-center justify-center shadow-lg shadow-sunrise/30 hover:scale-110 transition-transform">
      <ArrowUp size={20} />
    </button>
  );
};

const AdBanner = ({ variant = 'horizontal' }: { variant?: 'horizontal' | 'rectangle' }) => (
  <div className={`border border-dashed border-white/10 rounded-2xl flex items-center justify-center text-white/20 ${variant === 'rectangle' ? 'h-60' : 'h-20'}`}>
    <div className="text-center text-xs">
      <p>📢 Google AdSense Ad Space</p>
      <p className="text-[10px] mt-1 text-white/10">Insert your ad unit code here</p>
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

  useEffect(() => {
    if (app) { setCountdown(5); setWatching(false); }
  }, [app]);

  if (!app) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/10 rounded-3xl p-6 max-w-sm w-full relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white"><X size={20} /></button>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-sunrise/20 to-golden/20 border border-sunrise/30 flex items-center justify-center">
            <Lock className="text-sunrise" size={28} />
          </div>
          <h3 className="text-xl font-bold text-white mb-1">Unlock Download</h3>
          <p className="text-white/40 text-sm mb-6">{app.name}</p>
          {!watching ? (
            <button onClick={() => setWatching(true)} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sunrise to-golden text-black font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2">
              <Eye size={18} /> Watch Ad to Unlock
            </button>
          ) : (
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <p className="text-sunrise text-sm font-medium animate-pulse mb-2">⏳ Ad playing...</p>
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-sunrise to-golden rounded-full transition-all duration-1000 ease-linear" style={{ width: `${((5 - countdown) / 5) * 100}%` }} />
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

// ============ APP CARD (Public) ============
const AppCard = ({ app, onDownload, unlocked }: { app: AppData; onDownload: (a: AppData) => void; unlocked: boolean }) => {
  const handleShare = () => {
    const text = `🌅 Check out "${app.name}" on SunRise Apps!\n📲 Download free: ${window.location.href}`;
    if (navigator.share) {
      navigator.share({ title: app.name, text, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      alert('Link copied! Share it on Instagram Story 📸');
    }
  };
  const isComingSoon = app.apk_link === '#';
  return (
    <div className="group relative bg-[#0d0d0d] border border-white/[0.06] rounded-3xl p-5 hover:border-sunrise/30 transition-all duration-500 hover:shadow-xl hover:shadow-sunrise/5">
      <span className={`absolute -top-2.5 right-4 px-3 py-1 rounded-full text-[10px] font-bold text-white bg-gradient-to-r ${getBadgeColors(app.badge)} shadow-lg ${app.badge === 'Viral' ? 'animate-pulse' : ''}`}>
        {app.badge === 'Viral' ? '🔥 ' : app.badge === 'PRO' ? '⭐ ' : '✨ '}{app.badge}
      </span>
      <div className="flex gap-4 mb-4">
        <div className="w-14 h-14 shrink-0 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl flex items-center justify-center text-2xl group-hover:border-sunrise/20 transition-colors">{app.icon}</div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-white text-[15px] leading-tight truncate">{app.name}</h3>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-white/30">
            <span className="bg-white/5 px-2 py-0.5 rounded-md">v{app.version}</span>
            <span>•</span>
            <span>{app.size}</span>
          </div>
        </div>
      </div>
      <p className="text-white/40 text-sm leading-relaxed mb-4" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{app.description}</p>
      <div className="flex items-center gap-4 mb-4 text-[11px] text-white/25">
        <span className="flex items-center gap-1"><Download size={11} /> {formatDownloads(app.downloads)}</span>
        <span className="flex items-center gap-1"><Star size={11} /> {app.rating}</span>
        <span className="bg-white/5 px-2 py-0.5 rounded-md">{app.category}</span>
      </div>
      <div className="flex gap-2">
        <button onClick={() => !isComingSoon && onDownload(app)} disabled={isComingSoon}
          className={`flex-1 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${isComingSoon ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-gradient-to-r from-sunrise to-golden text-black hover:opacity-90 shadow-md shadow-sunrise/20'}`}>
          {isComingSoon ? 'Coming Soon' : unlocked ? (<><Download size={14} /> Download</>) : (<><Lock size={14} /> Get APK</>)}
        </button>
        <button onClick={handleShare} className="w-10 h-10 shrink-0 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-sunrise hover:border-sunrise/30 flex items-center justify-center transition-all">
          <Share2 size={15} />
        </button>
      </div>
    </div>
  );
};

// ============ HOME PAGE ============
const HomePage = ({ apps, onDownload, unlockedApps }: { apps: AppData[]; onDownload: (a: AppData) => void; unlockedApps: number[] }) => {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');

  // 🔥 Only show PUBLISHED apps to visitors
  const publishedApps = apps.filter(a => a.published);
  const categories = ['All', ...Array.from(new Set(publishedApps.map(a => a.category)))];
  const filtered = publishedApps.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'All' || a.category === catFilter;
    return matchSearch && matchCat;
  });
  const totalDownloads = publishedApps.reduce((s, a) => s + (parseInt(a.downloads) || 0), 0);

  return (
    <>
      <section className="pt-28 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-sunrise/[0.04] via-transparent to-transparent" />
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-sunrise/[0.06] rounded-full blur-[120px]" />
        <div className="absolute top-40 right-0 w-64 h-64 bg-golden/[0.04] rounded-full blur-[80px]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-8 text-sm text-white/50">
            <Sun size={14} className="text-sunrise" /><span>Your Trusted App Source</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black leading-[1.1] mb-6">
            <span className="bg-gradient-to-r from-sunrise via-golden to-amber-glow bg-clip-text text-transparent">SunRise</span><br /><span className="text-white">Apps</span>
          </h1>
          <p className="text-lg md:text-xl text-white/40 max-w-lg mx-auto mb-10">
            Get the latest <span className="text-sunrise font-medium">viral Android tools</span> — free, safe & always updated 🚀
          </p>
          <button onClick={() => document.getElementById('apps-section')?.scrollIntoView({ behavior: 'smooth' })} className="px-8 py-4 bg-gradient-to-r from-sunrise to-golden text-black font-bold text-base rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-sunrise/20 inline-flex items-center gap-2">
            <Download size={18} /> Explore Apps
          </button>
          <div className="grid grid-cols-3 max-w-md mx-auto mt-16 gap-4">
            {[
              { value: formatDownloads(totalDownloads.toString()) + '+', label: 'Downloads', icon: <Download size={16} /> },
              { value: publishedApps.filter(a => a.apk_link !== '#').length + '+', label: 'Apps', icon: <Smartphone size={16} /> },
              { value: '4.9', label: 'Avg Rating', icon: <Star size={16} /> },
            ].map((s, i) => (
              <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                <div className="text-sunrise mb-1">{s.icon}</div>
                <div className="text-xl font-bold text-white">{s.value}</div>
                <div className="text-[11px] text-white/25">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4"><AdBanner variant="horizontal" /></div>

      <section id="apps-section" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">App <span className="bg-gradient-to-r from-sunrise to-golden bg-clip-text text-transparent">Collection</span></h2>
            <p className="text-white/30 text-sm">All apps free — watch a short ad to download</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mb-8 max-w-2xl mx-auto">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search apps..." className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white text-sm focus:border-sunrise/50 focus:outline-none transition-colors placeholder:text-white/20" />
            </div>
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
              <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="appearance-none bg-white/[0.03] border border-white/10 rounded-xl pl-9 pr-8 py-3 text-white text-sm focus:border-sunrise/50 focus:outline-none cursor-pointer">
                {categories.map(c => <option key={c} value={c} className="bg-black">{c}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
            </div>
          </div>
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-white/20"><Search size={40} className="mx-auto mb-4" /><p>No apps found.</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(app => (<AppCard key={app.id} app={app} onDownload={onDownload} unlocked={unlockedApps.includes(app.id)} />))}
            </div>
          )}
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4"><AdBanner variant="rectangle" /></div>
    </>
  );
};

// ============ ADMIN LOGIN ============
const AdminLoginGate = ({ onLogin }: { onLogin: () => void }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
      onLogin();
    } else {
      setError(true);
      setAttempts(a => a + 1);
      setPassword('');
      setTimeout(() => setError(false), 3000);
    }
  };

  return (
    <section className="pt-28 pb-20 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-sunrise/20 to-golden/10 rounded-full flex items-center justify-center border border-sunrise/20">
            <KeyRound className="text-sunrise" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Admin Access</h2>
          <p className="text-white/30 text-sm mb-8">This area is restricted to the site owner.</p>
          {attempts >= 3 && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-sm">
              <AlertTriangle size={16} /><span>Too many failed attempts!</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter admin password" disabled={attempts >= 5}
                className={`w-full bg-black/50 border rounded-xl pl-11 pr-4 py-3.5 text-white text-sm focus:outline-none placeholder:text-white/15 transition-colors ${error ? 'border-red-500/50' : 'border-white/10 focus:border-sunrise/50'}`} autoFocus />
            </div>
            {error && <p className="text-red-400 text-xs">❌ Wrong password!</p>}
            <button type="submit" disabled={!password || attempts >= 5} className="w-full py-3.5 bg-gradient-to-r from-sunrise to-golden text-black font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              <Lock size={16} /> Unlock Admin Panel
            </button>
          </form>
          <p className="text-white/10 text-[10px] mt-6">🔒 Protected area. Unauthorized access is prohibited.</p>
        </div>
      </div>
    </section>
  );
};

// ============ ADMIN PAGE ============
const AdminPage = ({ apps, setApps, onLogout }: { apps: AppData[]; setApps: (a: AppData[]) => void; onLogout: () => void }) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AppData>({
    id: 0, name: '', version: '', description: '', apk_link: '', badge: 'New', icon: '📱', downloads: '0', size: '', category: '', rating: '0', updated: '', published: false
  });
  const [jsonView, setJsonView] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [adminFilter, setAdminFilter] = useState<'all' | 'published' | 'draft'>('all');

  const showMsg = (msg: string) => { setSaveMsg(msg); setTimeout(() => setSaveMsg(''), 3000); };

  const startEdit = (app: AppData) => { setForm({ ...app }); setEditingId(app.id); setShowAddForm(true); };
  const startAdd = () => {
    const newId = apps.length > 0 ? Math.max(...apps.map(a => a.id)) + 1 : 1;
    setForm({ id: newId, name: '', version: '1.0.0', description: '', apk_link: '', badge: 'New', icon: '📱', downloads: '0', size: '0 MB', category: 'Tools', rating: '0', updated: new Date().toISOString().slice(0, 10), published: false });
    setEditingId(null);
    setShowAddForm(true);
  };
  const handleSave = () => {
    if (!form.name.trim()) return;
    let updated: AppData[];
    if (editingId !== null) {
      updated = apps.map(a => a.id === editingId ? { ...form } : a);
    } else {
      updated = [...apps, form];
    }
    setApps(updated); saveApps(updated); setShowAddForm(false); setEditingId(null);
    showMsg(editingId !== null ? '✅ App updated!' : '✅ App added as Draft!');
  };
  const handleDelete = (id: number) => {
    if (!confirm('Delete this app permanently?')) return;
    const updated = apps.filter(a => a.id !== id);
    setApps(updated); saveApps(updated); showMsg('🗑️ App deleted');
  };

  // 🔥 PUBLISH / UNPUBLISH TOGGLE
  const togglePublish = (id: number) => {
    const updated = apps.map(a => {
      if (a.id === id) return { ...a, published: !a.published };
      return a;
    });
    const app = updated.find(a => a.id === id);
    setApps(updated); saveApps(updated);
    showMsg(app?.published ? `🟢 "${app.name}" Published!` : `🔴 "${app?.name}" Unpublished`);
  };

  // Publish ALL / Unpublish ALL
  const publishAll = () => {
    const updated = apps.map(a => ({ ...a, published: true }));
    setApps(updated); saveApps(updated); showMsg('🟢 All apps published!');
  };
  const unpublishAll = () => {
    const updated = apps.map(a => ({ ...a, published: false }));
    setApps(updated); saveApps(updated); showMsg('🔴 All apps unpublished');
  };

  const handleCopyJson = () => { navigator.clipboard.writeText(JSON.stringify(apps, null, 2)); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const handleResetData = () => {
    if (!confirm('Reset to default apps? Your changes will be lost.')) return;
    localStorage.removeItem(STORAGE_KEY); setApps(defaultApps as AppData[]); showMsg('🔄 Data reset to default');
  };

  const totalDownloads = apps.reduce((s, a) => s + (parseInt(a.downloads) || 0), 0);
  const publishedCount = apps.filter(a => a.published).length;
  const draftCount = apps.filter(a => !a.published).length;

  const filteredApps = apps.filter(a => {
    if (adminFilter === 'published') return a.published;
    if (adminFilter === 'draft') return !a.published;
    return true;
  });

  return (
    <section className="pt-28 pb-20 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <Settings className="text-sunrise" size={28} /> Admin Panel
            </h2>
            <p className="text-white/30 text-sm mt-1">Manage, publish & unpublish your apps</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setJsonView(!jsonView)} className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white/50 text-xs hover:text-white transition-colors flex items-center gap-1.5">
              {jsonView ? <Eye size={13} /> : <BarChart3 size={13} />} {jsonView ? 'Cards' : 'JSON'}
            </button>
            <button onClick={startAdd} className="px-3 py-2 bg-gradient-to-r from-sunrise to-golden text-black font-semibold rounded-xl text-xs flex items-center gap-1.5 hover:opacity-90">
              <Plus size={13} /> Add App
            </button>
            <button onClick={onLogout} className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-1.5 hover:bg-red-500/20" title="Logout">
              <LogOut size={13} />
            </button>
          </div>
        </div>

        {/* Success Toast */}
        {saveMsg && (
          <div className="mb-6 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm text-center">{saveMsg}</div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {[
            { label: 'Total', value: apps.length, color: 'text-white' },
            { label: 'Published', value: publishedCount, color: 'text-green-400' },
            { label: 'Drafts', value: draftCount, color: 'text-amber-400' },
            { label: 'Downloads', value: formatDownloads(totalDownloads.toString()), color: 'text-sunrise' },
            { label: 'Viral', value: apps.filter(a => a.badge === 'Viral').length, color: 'text-rose-400' },
          ].map((s, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3">
              <p className="text-white/25 text-[10px]">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter Tabs + Bulk Actions */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {(['all', 'published', 'draft'] as const).map(f => (
            <button key={f} onClick={() => setAdminFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${adminFilter === f ? 'bg-sunrise/15 text-sunrise border border-sunrise/30' : 'bg-white/[0.03] text-white/30 border border-white/[0.06] hover:text-white/50'}`}>
              {f === 'all' ? `All (${apps.length})` : f === 'published' ? `🟢 Published (${publishedCount})` : `📝 Drafts (${draftCount})`}
            </button>
          ))}
          <div className="flex-1" />
          <button onClick={publishAll} className="px-3 py-1.5 text-[10px] text-green-400/50 hover:text-green-400 border border-green-400/10 hover:border-green-400/30 rounded-lg transition-colors">
            Publish All
          </button>
          <button onClick={unpublishAll} className="px-3 py-1.5 text-[10px] text-amber-400/50 hover:text-amber-400 border border-amber-400/10 hover:border-amber-400/30 rounded-lg transition-colors">
            Unpublish All
          </button>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white/[0.03] border border-sunrise/20 rounded-3xl p-6 mb-8">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              {editingId !== null ? <Edit3 size={18} className="text-sunrise" /> : <Plus size={18} className="text-sunrise" />}
              {editingId !== null ? 'Edit App' : 'Add New App'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'name', label: 'App Name *', placeholder: 'WhatsApp Chat Analyzer' },
                { key: 'version', label: 'Version', placeholder: '1.0.0' },
                { key: 'icon', label: 'Icon (emoji)', placeholder: '📱' },
                { key: 'size', label: 'File Size', placeholder: '4.5 MB' },
                { key: 'category', label: 'Category', placeholder: 'Tools' },
                { key: 'rating', label: 'Rating', placeholder: '4.9' },
                { key: 'downloads', label: 'Downloads', placeholder: '15200' },
                { key: 'apk_link', label: 'APK Link', placeholder: 'https://github.com/.../app.apk' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs text-white/30 mb-1.5">{f.label}</label>
                  <input value={String((form as unknown as Record<string, string>)[f.key] || '')} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-sunrise/50 focus:outline-none placeholder:text-white/15" />
                </div>
              ))}
              <div className="md:col-span-2">
                <label className="block text-xs text-white/30 mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Short app description..." rows={2}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-sunrise/50 focus:outline-none resize-none placeholder:text-white/15" />
              </div>
              <div>
                <label className="block text-xs text-white/30 mb-1.5">Badge</label>
                <select value={form.badge} onChange={e => setForm({ ...form, badge: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-sunrise/50 focus:outline-none">
                  <option value="New" className="bg-black">✨ New</option>
                  <option value="Viral" className="bg-black">🔥 Viral</option>
                  <option value="PRO" className="bg-black">⭐ PRO</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/30 mb-1.5">Status</label>
                <button type="button" onClick={() => setForm({ ...form, published: !form.published })}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${form.published ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
                  <span>{form.published ? '🟢 Published — Live on website' : '📝 Draft — Hidden from visitors'}</span>
                  {form.published ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                </button>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} className="px-6 py-2.5 bg-gradient-to-r from-sunrise to-golden text-black font-semibold rounded-xl text-sm flex items-center gap-2 hover:opacity-90">
                <Save size={14} /> {editingId !== null ? 'Update App' : 'Add App'}
              </button>
              <button onClick={() => { setShowAddForm(false); setEditingId(null); }} className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white/50 text-sm hover:text-white">Cancel</button>
            </div>
          </div>
        )}

        {/* JSON View */}
        {jsonView ? (
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white/40">apps.json</h3>
              <div className="flex gap-2">
                <button onClick={handleCopyJson} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white/40 hover:text-white flex items-center gap-1.5">
                  {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />} {copied ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={handleResetData} className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400 hover:bg-rose-500/20">Reset</button>
              </div>
            </div>
            <pre className="text-xs text-white/50 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-[500px] overflow-y-auto">{JSON.stringify(apps, null, 2)}</pre>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredApps.length === 0 ? (
              <div className="text-center py-16 text-white/20"><Plus size={40} className="mx-auto mb-4" /><p>No apps in this view.</p></div>
            ) : filteredApps.map(app => (
              <div key={app.id} className={`bg-white/[0.03] border rounded-2xl p-4 flex items-center gap-3 transition-all ${app.published ? 'border-green-500/15 hover:border-green-500/30' : 'border-white/[0.06] hover:border-amber-500/30 opacity-70'}`}>
                {/* Icon */}
                <div className="w-11 h-11 shrink-0 bg-white/5 rounded-xl flex items-center justify-center text-lg">{app.icon}</div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-white text-sm truncate">{app.name}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold text-white bg-gradient-to-r ${getBadgeColors(app.badge)}`}>{app.badge}</span>
                    {app.published ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-green-500/15 text-green-400 border border-green-500/20">🟢 Live</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/20">📝 Draft</span>
                    )}
                  </div>
                  <p className="text-white/25 text-xs mt-0.5">v{app.version} • {app.size} • {formatDownloads(app.downloads)} downloads</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-1.5 shrink-0">
                  {/* Publish/Unpublish Toggle */}
                  <button onClick={() => togglePublish(app.id)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border ${
                      app.published
                        ? 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20'
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20'
                    }`}
                    title={app.published ? 'Click to Unpublish' : 'Click to Publish'}>
                    {app.published ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  {/* Edit */}
                  <button onClick={() => startEdit(app)} className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-sunrise hover:border-sunrise/30 transition-colors" title="Edit">
                    <Edit3 size={14} />
                  </button>
                  {/* Delete */}
                  <button onClick={() => handleDelete(app.id)} className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-rose-400 hover:border-rose-400/30 transition-colors" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {apps.length > 0 && (
              <div className="flex justify-end pt-4">
                <button onClick={handleResetData} className="px-4 py-2 text-xs text-rose-400/50 hover:text-rose-400 transition-colors">Reset to Default</button>
              </div>
            )}
          </div>
        )}

        {/* Tips */}
        <div className="mt-12 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
          <h4 className="text-sm font-semibold text-sunrise mb-3">📋 Admin Quick Reference</h4>
          <ul className="space-y-2 text-white/30 text-xs">
            <li>• 🟢 <span className="text-green-400">Published</span> = visible to all visitors on website</li>
            <li>• 📝 <span className="text-amber-400">Draft</span> = hidden from visitors, only you can see in admin</li>
            <li>• New apps are added as <span className="text-amber-400">Draft</span> by default — publish when ready</li>
            <li>• Click the <span className="text-green-400">eye icon</span> to toggle publish/unpublish instantly</li>
            <li>• Set apk_link to "#" for Coming Soon apps</li>
            <li>• Data is saved in browser localStorage</li>
          </ul>
        </div>
      </div>
    </section>
  );
};

// ============ GUIDE ============
const GuidePage = () => {
  const [openStep, setOpenStep] = useState<number | null>(0);
  const steps = [
    { title: '1. GitHub — APK Hosting (Free)', icon: '🐙', content: [
      '→ github.com → Create account → New repo "my-apps"',
      '→ Releases → Create release → Drag APK file',
      '→ Publish → Copy download URL → Paste in Admin Panel',
      '', '💡 GitHub = unlimited free APK hosting!'
    ]},
    { title: '2. Vercel — Deploy Website (Free)', icon: '🚀', content: [
      '→ vercel.com → Sign in with GitHub',
      '→ Import your website repo → Framework: Vite → Deploy',
      '→ Live at: sunrise-apps.vercel.app',
      '', '⚙️ Custom domain: Settings → Domains → Add sunriseapps.in',
      '  • Buy from GoDaddy (~₹500/yr)',
      '  • DNS: CNAME → cname.vercel-dns.com'
    ]},
    { title: '3. Google AdSense (Earn Money 💰)', icon: '💰', content: [
      '→ adsense.google.com → Add website URL',
      '→ Paste verification code in index.html <head>',
      '', '📋 Requirements (all included!):',
      '  ✅ Privacy Policy  ✅ About  ✅ Contact',
      '  ✅ 15+ days old domain  ✅ Original content',
      '', '💡 Earnings: ₹100-₹2000/day based on traffic'
    ]},
    { title: '4. AdMob — In-App Ads', icon: '📱', content: [
      '→ admob.google.com → Add app → Create ad units',
      '→ "Watch Ad to Unlock" modal = rewarded ad placeholder',
      '', '💡 Rewarded ads pay 5-10x more than banners!'
    ]},
    { title: '5. Instagram Strategy 📸', icon: '📸', content: [
      '→ Account: @SunRise_Apps',
      '→ Bio: "Free Viral Apps 📲 Link below 👇"',
      '', '🎬 Reel Ideas:',
      '  • "This app EXPOSES your partner 😱"',
      '  • "Your WiFi password is... 🔓"',
      '', '📊 Strategy: 2-3 Reels/day + trending audio',
      '🎯 10K followers = ₹500-1000/day from ads'
    ]},
    { title: '6. Publish Your App', icon: '🚀', content: [
      '→ Open Admin Panel (private link / logo 5-tap)',
      '→ Click "+ Add App" → Fill all details',
      '→ App is saved as 📝 Draft (hidden)',
      '→ Click 🟢 eye icon to Publish (goes live!)',
      '→ Click again to 📝 Unpublish (hide from website)',
      '', '💡 You can publish/unpublish anytime — no code changes!'
    ]},
    { title: '7. Track Analytics 📊', icon: '📊', content: [
      '→ Google Analytics → Create property → Add tracking code',
      '→ GitHub Releases → See download counts per APK',
      '→ Admin Panel → Update download numbers manually'
    ]},
    { title: '8. Legal & Safety ⚖️', icon: '⚖️', content: [
      '✅ Privacy Policy, About, Contact — all included',
      '⚠️ Only publish YOUR apps — no pirated content',
      '⚠️ Test everything before publishing'
    ]},
  ];

  return (
    <section className="pt-28 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3 flex items-center justify-center gap-3">
            <BookOpen className="text-sunrise" size={32} />
            <span>Complete <span className="bg-gradient-to-r from-sunrise to-golden bg-clip-text text-transparent">Guide</span></span>
          </h2>
          <p className="text-white/30 text-sm">From zero to earning money with apps</p>
        </div>
        <div className="space-y-3">
          {steps.map((step, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-sunrise/20 transition-colors">
              <button onClick={() => setOpenStep(openStep === i ? null : i)} className="w-full flex items-center gap-4 p-5 text-left">
                <span className="text-2xl">{step.icon}</span>
                <span className="flex-1 font-semibold text-white text-sm md:text-base">{step.title}</span>
                <ChevronRight size={18} className={`text-white/20 transition-transform duration-300 ${openStep === i ? 'rotate-90' : ''}`} />
              </button>
              {openStep === i && (
                <div className="px-5 pb-5">
                  <div className="bg-black/40 rounded-xl p-4 border border-white/[0.05]">
                    {step.content.map((line, j) => (
                      <p key={j} className={`text-sm leading-relaxed ${line === '' ? 'h-3' : line.startsWith('💡') || line.startsWith('🎯') || line.startsWith('⚠️') ? 'text-sunrise font-medium mt-2' : line.startsWith('→') ? 'text-white/50' : line.startsWith('  ') ? 'text-white/35 pl-2' : 'text-white/40'}`}>{line}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-12 bg-gradient-to-br from-sunrise/10 to-golden/5 border border-sunrise/20 rounded-3xl p-6 text-center">
          <p className="text-sunrise text-lg font-bold mb-4">🎯 Checklist</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left max-w-md mx-auto">
            {['GitHub account','Upload APK','Deploy on Vercel','Instagram @SunRise_Apps','Apply AdSense','First Reel','Track Analytics','Add more apps!'].map((item, i) => (
              <label key={i} className="flex items-center gap-2 text-sm text-white/40 cursor-pointer hover:text-white/60">
                <input type="checkbox" className="accent-orange-500 w-4 h-4" />{item}
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
  <section className="py-20 px-4">
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-8 md:p-12">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="w-28 h-28 bg-gradient-to-br from-sunrise to-golden rounded-full flex items-center justify-center text-5xl shrink-0 shadow-xl shadow-sunrise/20">🌅</div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl font-bold text-white mb-4">About <span className="bg-gradient-to-r from-sunrise to-golden bg-clip-text text-transparent">SunRise Apps</span></h2>
            <p className="text-white/40 mb-3">Independent Android developer from India 🇮🇳. Building viral utility apps that solve real problems.</p>
            <p className="text-white/40 mb-6">Every sunrise brings new possibilities — free tools for everyone, supported by non-intrusive ads.</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <a href="https://instagram.com/SunRise_Apps" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-xl text-pink-400 text-sm hover:bg-pink-500/20 transition-colors">📸 @SunRise_Apps</a>
              <a href="mailto:thesunrisecode@gmail.com" className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white/50 text-sm hover:text-white transition-colors"><Mail size={16} /> thesunrisecode@gmail.com</a>
              <a href="https://sunriseapps.in" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-sunrise/10 border border-sunrise/20 rounded-xl text-sunrise text-sm hover:bg-sunrise/20 transition-colors"><Globe size={16} /> sunriseapps.in</a>
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
        <Shield className="text-sunrise" size={28} /><span>Privacy <span className="bg-gradient-to-r from-sunrise to-golden bg-clip-text text-transparent">Policy</span></span>
      </h2>
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-6 md:p-8 space-y-6">
        {[
          { t: '1. Information We Collect', d: 'Minimal data for app functionality. No personal info tracked on this website.' },
          { t: '2. Advertisements', d: 'We use Google AdSense/AdMob. These services may collect device info for personalized ads. Opt out in device settings.' },
          { t: '3. Data Security', d: 'No personal data stored on servers. All processing is local. HTTPS encryption used.' },
          { t: '4. Third-Party Services', d: 'Google Play Services, AdMob, Firebase Analytics may be used. Their policies apply.' },
          { t: '5. Permissions', d: 'Only necessary permissions requested — storage, internet, camera only if required by feature.' },
          { t: '6. Children', d: 'Not directed at children under 13. No data collected from minors.' },
          { t: '7. Updates', d: 'Policy may be updated. Changes reflected on this page.' },
          { t: '8. Contact', d: 'Privacy concerns: thesunrisecode@gmail.com' },
        ].map((item, i) => (
          <div key={i}><h3 className="text-sm font-semibold text-sunrise mb-2">{item.t}</h3><p className="text-white/35 text-sm leading-relaxed">{item.d}</p></div>
        ))}
        <div className="pt-4 border-t border-white/[0.06]"><p className="text-white/15 text-xs text-center">Last updated: January 2025 • SunRise Apps</p></div>
      </div>
    </div>
  </section>
);

// ============ CONTACT ============
const ContactSection = () => {
  const [sent, setSent] = useState(false);
  return (
    <section className="py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-8 text-center flex items-center justify-center gap-3">
          <Mail className="text-sunrise" size={28} /><span>Contact <span className="bg-gradient-to-r from-sunrise to-golden bg-clip-text text-transparent">Us</span></span>
        </h2>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-6 md:p-8">
          {sent ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-xl font-bold text-white mb-2">Message Sent!</h3>
              <p className="text-white/40 text-sm mb-6">We'll respond within 24 hours.</p>
              <button onClick={() => setSent(false)} className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-white/50 text-sm">Send Another</button>
            </div>
          ) : (
            <form onSubmit={e => { e.preventDefault(); setSent(true); }} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-xs text-white/30 mb-1.5">Name</label><input type="text" required placeholder="Your name" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-sunrise/50 focus:outline-none placeholder:text-white/15" /></div>
                <div><label className="block text-xs text-white/30 mb-1.5">Email</label><input type="email" required placeholder="your@email.com" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-sunrise/50 focus:outline-none placeholder:text-white/15" /></div>
              </div>
              <div><label className="block text-xs text-white/30 mb-1.5">Subject</label>
                <select className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-sunrise/50 focus:outline-none">
                  <option className="bg-black">General</option><option className="bg-black">Bug Report</option><option className="bg-black">Feature Request</option><option className="bg-black">Business</option>
                </select>
              </div>
              <div><label className="block text-xs text-white/30 mb-1.5">Message</label><textarea required rows={4} placeholder="Your message..." className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-sunrise/50 focus:outline-none resize-none placeholder:text-white/15" /></div>
              <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-sunrise to-golden text-black font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-sunrise/20">Send Message <ChevronRight size={16} /></button>
            </form>
          )}
          <div className="mt-8 pt-6 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <a href="mailto:thesunrisecode@gmail.com" className="flex flex-col items-center gap-2 text-white/30 hover:text-sunrise transition-colors"><Mail size={20} /><span className="text-xs">thesunrisecode@gmail.com</span></a>
            <a href="https://instagram.com/SunRise_Apps" target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 text-white/30 hover:text-pink-400 transition-colors"><span className="text-xl">📸</span><span className="text-xs">@SunRise_Apps</span></a>
            <a href="https://sunriseapps.in" target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 text-white/30 hover:text-sunrise transition-colors"><Globe size={20} /><span className="text-xs">sunriseapps.in</span></a>
          </div>
        </div>
      </div>
    </section>
  );
};

// ============ MAIN APP ============
export default function App() {
  const [apps, setApps] = useState<AppData[]>(loadApps);
  const [page, setPage] = useState('home');
  const [modalApp, setModalApp] = useState<AppData | null>(null);
  const [unlockedApps, setUnlockedApps] = useState<number[]>([]);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [adminAuth, setAdminAuth] = useState(isAdminLoggedIn);
  const [logoTaps, setLogoTaps] = useState(0);

  // 🔗 Private URL access: yoursite.com?access=sunrise2025
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessKey = params.get('access');
    if (accessKey === ADMIN_SECRET_KEY) {
      sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
      setAdminAuth(true);
      setPage('admin');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // ⌨️ Ctrl+Shift+A shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setPage('admin');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 📱 Logo 5-tap secret
  useEffect(() => {
    if (logoTaps >= 5) { setPage('admin'); setLogoTaps(0); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    if (logoTaps > 0) { const t = setTimeout(() => setLogoTaps(0), 2000); return () => clearTimeout(t); }
  }, [logoTaps]);

  const handleDownload = useCallback((app: AppData) => {
    if (unlockedApps.includes(app.id)) window.open(app.apk_link, '_blank');
    else setModalApp(app);
  }, [unlockedApps]);

  const handleUnlock = useCallback(() => {
    if (modalApp) { setUnlockedApps(prev => [...prev, modalApp.id]); window.open(modalApp.apk_link, '_blank'); setModalApp(null); }
  }, [modalApp]);

  const handleAdminLogout = () => { sessionStorage.removeItem(ADMIN_AUTH_KEY); setAdminAuth(false); navigate('home'); };

  const navigate = (p: string) => { setPage(p); setMobileMenu(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const publicNavItems = [
    { id: 'home', label: 'Home', icon: <Sun size={15} /> },
    { id: 'about', label: 'About', icon: <Users size={15} /> },
    { id: 'privacy', label: 'Privacy', icon: <Shield size={15} /> },
    { id: 'contact', label: 'Contact', icon: <Mail size={15} /> },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-[#050505]/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo — 5 taps = admin */}
            <button onClick={() => { if (page !== 'home') navigate('home'); else setLogoTaps(t => t + 1); }} className="flex items-center gap-2.5 group">
              <div className={`w-9 h-9 bg-gradient-to-br from-sunrise to-golden rounded-xl flex items-center justify-center shadow-lg shadow-sunrise/20 group-hover:shadow-sunrise/40 transition-all ${logoTaps > 0 ? 'scale-90' : ''}`}>
                <Sun size={18} className="text-black" />
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-white">Sun<span className="bg-gradient-to-r from-sunrise to-golden bg-clip-text text-transparent">Rise</span></span>
                <span className="text-white/30 text-sm ml-1">Apps</span>
              </div>
              {logoTaps >= 3 && <span className="text-[8px] text-white/10 ml-1">{5 - logoTaps}...</span>}
            </button>
            {/* Desktop */}
            <div className="hidden md:flex items-center gap-1">
              {publicNavItems.map(item => (
                <button key={item.id} onClick={() => navigate(item.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${page === item.id ? 'text-sunrise bg-sunrise/10' : 'text-white/35 hover:text-white/70 hover:bg-white/5'}`}>
                  {item.icon}{item.label}
                </button>
              ))}
            </div>
            <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-white/50">
              {mobileMenu ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
          {mobileMenu && (
            <div className="md:hidden py-2 pb-4 border-t border-white/[0.06]">
              {publicNavItems.map(item => (
                <button key={item.id} onClick={() => navigate(item.id)}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all ${page === item.id ? 'text-sunrise bg-sunrise/10' : 'text-white/40 hover:bg-white/5'}`}>
                  {item.icon}{item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Pages */}
      {page === 'home' && <HomePage apps={apps} onDownload={handleDownload} unlockedApps={unlockedApps} />}
      {page === 'admin' && (adminAuth ? <AdminPage apps={apps} setApps={setApps} onLogout={handleAdminLogout} /> : <AdminLoginGate onLogin={() => setAdminAuth(true)} />)}
      {page === 'guide' && (adminAuth ? <GuidePage /> : <AdminLoginGate onLogin={() => setAdminAuth(true)} />)}
      {page === 'about' && <AboutSection />}
      {page === 'privacy' && <PrivacySection />}
      {page === 'contact' && <ContactSection />}

      {page === 'home' && (
        <>
          <AboutSection />
          <div className="max-w-4xl mx-auto px-4"><AdBanner variant="horizontal" /></div>
          <PrivacySection />
          <ContactSection />
        </>
      )}

      {/* Admin bottom bar */}
      {adminAuth && (page === 'admin' || page === 'guide') && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-sunrise/20">
          <div className="max-w-md mx-auto flex">
            <button onClick={() => navigate('admin')} className={`flex-1 py-3 text-center text-xs font-medium flex items-center justify-center gap-2 ${page === 'admin' ? 'text-sunrise' : 'text-white/30'}`}><Settings size={14} /> Admin</button>
            <button onClick={() => navigate('guide')} className={`flex-1 py-3 text-center text-xs font-medium flex items-center justify-center gap-2 ${page === 'guide' ? 'text-sunrise' : 'text-white/30'}`}><BookOpen size={14} /> Guide</button>
            <button onClick={() => navigate('home')} className="flex-1 py-3 text-center text-xs font-medium flex items-center justify-center gap-2 text-white/30 hover:text-white"><Eye size={14} /> View Site</button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className={`border-t border-white/[0.06] py-10 px-4 ${adminAuth && (page === 'admin' || page === 'guide') ? 'pb-20' : ''}`}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-sunrise to-golden rounded-lg flex items-center justify-center"><Sun size={16} className="text-black" /></div>
                <span className="font-bold text-white">SunRise Apps</span>
              </div>
              <p className="text-white/25 text-sm">Every sunrise brings new possibilities. Free viral Android tools, built in India 🇮🇳</p>
            </div>
            <div>
              <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">Quick Links</p>
              <div className="space-y-2">
                {publicNavItems.map(item => (<button key={item.id} onClick={() => navigate(item.id)} className="block text-white/25 text-sm hover:text-sunrise transition-colors">{item.label}</button>))}
              </div>
            </div>
            <div>
              <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">Connect</p>
              <div className="space-y-2">
                <a href="mailto:thesunrisecode@gmail.com" className="flex items-center gap-2 text-white/25 text-sm hover:text-sunrise transition-colors"><Mail size={14} /> thesunrisecode@gmail.com</a>
                <a href="https://instagram.com/SunRise_Apps" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-white/25 text-sm hover:text-pink-400 transition-colors"><span>📸</span> @SunRise_Apps</a>
                <a href="https://sunriseapps.in" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-white/25 text-sm hover:text-sunrise transition-colors"><Globe size={14} /> sunriseapps.in</a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/[0.06] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-white/15 text-xs">© 2025 SunRise Apps. Made with 🧡 in India</p>
            <div className="flex gap-4">
              <button onClick={() => navigate('privacy')} className="text-white/15 text-xs hover:text-white/40">Privacy</button>
              <button onClick={() => navigate('contact')} className="text-white/15 text-xs hover:text-white/40">Contact</button>
            </div>
          </div>
        </div>
      </footer>

      <LockModal app={modalApp} onClose={() => setModalApp(null)} onUnlock={handleUnlock} />
      <ScrollToTop />
    </div>
  );
}
