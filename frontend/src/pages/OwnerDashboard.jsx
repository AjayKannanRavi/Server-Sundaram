import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../api/api';
import {
  Activity,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ChefHat,
  AlertCircle,
  Clock3,
  Copy,
  Edit3,
  IndianRupee,
  LayoutDashboard,
  Loader2,
  Power,
  RefreshCw,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  TrendingUp,
  User,
  Users,
  X
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'staff', label: 'Staff Credentials', icon: Users },
  { id: 'services', label: 'Service Health', icon: Activity },
  { id: 'settings', label: 'Owner Settings', icon: Settings }
];

const STATUS_COLORS = {
  PENDING: 'bg-amber-100 text-amber-700',
  PREPARING: 'bg-sky-100 text-sky-700',
  SERVED: 'bg-violet-100 text-violet-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-rose-100 text-rose-700'
};

const ROLE_COLORS = {
  OWNER: 'bg-amber-500 text-white',
  ADMIN: 'bg-indigo-600 text-white',
  KITCHEN: 'bg-emerald-600 text-white',
  WAITER: 'bg-cyan-600 text-white'
};

const formatCurrency = (value) => `Rs ${Number(value || 0).toLocaleString()}`;

const OWNER_THEME_PRESETS = [
  {
    id: 'ocean',
    name: 'Ocean Slate',
    colors: ['#0D2A4A', '#1D4ED8', '#38BDF8', '#F8FAFC'],
    pageBg: 'linear-gradient(135deg, #F8FBFF 0%, #EAF2FF 100%)',
    sidebarBg: 'linear-gradient(180deg, #0D2A4A 0%, #102E57 100%)',
    primary: '#1D4ED8',
    primarySoft: '#DBEAFE',
    accent: '#38BDF8',
    surface: 'rgba(255,255,255,0.92)',
    border: 'rgba(148,163,184,0.24)',
    text: '#0F172A',
    onPrimary: '#FFFFFF'
  },
  {
    id: 'ember',
    name: 'Ember Gold',
    colors: ['#7C2D12', '#F97316', '#F59E0B', '#FFF7ED'],
    pageBg: 'linear-gradient(135deg, #FFF9F1 0%, #FFF1E6 100%)',
    sidebarBg: 'linear-gradient(180deg, #431407 0%, #7C2D12 100%)',
    primary: '#F97316',
    primarySoft: '#FFEDD5',
    accent: '#F59E0B',
    surface: 'rgba(255,255,255,0.92)',
    border: 'rgba(251,146,60,0.22)',
    text: '#1F2937',
    onPrimary: '#FFFFFF'
  },
  {
    id: 'forest',
    name: 'Forest Mint',
    colors: ['#064E3B', '#10B981', '#34D399', '#ECFDF5'],
    pageBg: 'linear-gradient(135deg, #F5FFFA 0%, #E7FFF4 100%)',
    sidebarBg: 'linear-gradient(180deg, #064E3B 0%, #065F46 100%)',
    primary: '#10B981',
    primarySoft: '#D1FAE5',
    accent: '#34D399',
    surface: 'rgba(255,255,255,0.92)',
    border: 'rgba(16,185,129,0.22)',
    text: '#0F172A',
    onPrimary: '#FFFFFF'
  },
  {
    id: 'royal',
    name: 'Royal Plum',
    colors: ['#581C87', '#8B5CF6', '#C084FC', '#FAF5FF'],
    pageBg: 'linear-gradient(135deg, #FCF7FF 0%, #F3E8FF 100%)',
    sidebarBg: 'linear-gradient(180deg, #3B0764 0%, #581C87 100%)',
    primary: '#8B5CF6',
    primarySoft: '#EDE9FE',
    accent: '#C084FC',
    surface: 'rgba(255,255,255,0.92)',
    border: 'rgba(139,92,246,0.22)',
    text: '#111827',
    onPrimary: '#FFFFFF'
  }
];

const loadJsonStorage = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
};

function RevenueChart({ data }) {
  const points = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    const max = Math.max(...data.map((d) => Number(d.revenue || 0)), 1);
    return data.map((d, index) => {
      const x = (index / Math.max(data.length - 1, 1)) * 100;
      const y = 100 - (Number(d.revenue || 0) / max) * 100;
      return { x, y, label: String(d.date || ''), revenue: Number(d.revenue || 0) };
    });
  }, [data]);

  if (points.length === 0) {
    return (
      <div className="h-56 rounded-3xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-sm font-bold text-slate-500">
        No trend data for this period.
      </div>
    );
  }

  const path = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4">
      <svg viewBox="0 0 100 100" className="w-full h-56">
        <polyline
          fill="none"
          stroke="#0f4a8a"
          strokeWidth="2"
          points={path}
          vectorEffect="non-scaling-stroke"
        />
        {points.map((p, idx) => (
          <circle key={idx} cx={p.x} cy={p.y} r="1.8" fill="#0f4a8a" />
        ))}
      </svg>
      <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-slate-500 font-semibold">
        <span>{points[0]?.label || 'Start'}</span>
        <span className="text-center">Revenue curve</span>
        <span className="text-right">{points[points.length - 1]?.label || 'Now'}</span>
      </div>
    </div>
  );
}

function SegmentedBars({ items, valueKey = 'count', labelKey = 'method', color = 'bg-indigo-500' }) {
  const total = items.reduce((acc, cur) => acc + Number(cur[valueKey] || 0), 0);

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm font-bold text-slate-500 bg-slate-50">
          No data available.
        </div>
      )}
      {items.map((item, idx) => {
        const val = Number(item[valueKey] || 0);
        const pct = total > 0 ? (val / total) * 100 : 0;
        return (
          <div key={`${item[labelKey]}-${idx}`}>
            <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
              <span>{String(item[labelKey] || 'Unknown')}</span>
              <span>{val}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className={`h-full ${color}`} style={{ width: `${Math.max(pct, 3)}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

const OwnerDashboard = () => {
  const { hotelId } = useParams();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [payments, setPayments] = useState([]);
  const [peakHours, setPeakHours] = useState([]);
  const [restaurant, setRestaurant] = useState({ id: null, name: '', address: '', gstNumber: '', taxPercentage: 0, serviceCharge: 0, ownerName: '', ownerEmail: '', contactNumber: '', logoUrl: '', ownerPhotoUrl: '', uiTheme: '' });
  const [ownerProfile, setOwnerProfile] = useState(() => loadJsonStorage(`owner_profile_${hotelId}`, {
    displayName: '',
    title: 'Owner Admin',
    email: '',
    phone: '',
    bio: '',
    photoUrl: ''
  }));
  const [ownerCredentials, setOwnerCredentials] = useState({
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [selectedThemeId, setSelectedThemeId] = useState(() => {
    if (typeof window === 'undefined') return 'ocean';
    return 'ocean';
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('overview');
  const [timePhase, setTimePhase] = useState('today');
  const [copyStatus, setCopyStatus] = useState('');

  const [ownerUsername, setOwnerUsername] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [restaurantSaving, setRestaurantSaving] = useState(false);

  const [planActionLoading, setPlanActionLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [credentialSaving, setCredentialSaving] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [hotelStatsRes, summaryRes, trendRes, paymentsRes, peakRes, restaurantRes] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/saas/hotel-stats/${hotelId}`, { headers: { 'X-Hotel-Id': hotelId } }),
        axios.get(`${API_BASE_URL}/analytics/summary`, { headers: { 'X-Hotel-Id': hotelId } }),
        axios.get(`${API_BASE_URL}/analytics/trend`, { headers: { 'X-Hotel-Id': hotelId } }),
        axios.get(`${API_BASE_URL}/analytics/payments`, { headers: { 'X-Hotel-Id': hotelId } }),
        axios.get(`${API_BASE_URL}/analytics/peak-hours`, { headers: { 'X-Hotel-Id': hotelId } }),
        axios.get(`${API_BASE_URL}/restaurant`, { headers: { 'X-Hotel-Id': hotelId } })
      ]);

      setStats(hotelStatsRes.status === 'fulfilled' ? hotelStatsRes.value.data || null : null);
      setSummary(summaryRes.status === 'fulfilled' ? summaryRes.value.data || null : null);
      setTrend(trendRes.status === 'fulfilled' && Array.isArray(trendRes.value.data) ? trendRes.value.data : []);
      setPayments(paymentsRes.status === 'fulfilled' && Array.isArray(paymentsRes.value.data) ? paymentsRes.value.data : []);
      setPeakHours(peakRes.status === 'fulfilled' && Array.isArray(peakRes.value.data) ? peakRes.value.data : []);
      setRestaurant(restaurantRes.status === 'fulfilled' ? restaurantRes.value.data || { id: null, name: '', address: '', gstNumber: '', taxPercentage: 0, serviceCharge: 0, ownerName: '', ownerEmail: '', contactNumber: '', logoUrl: '', ownerPhotoUrl: '', uiTheme: '' } : { id: null, name: '', address: '', gstNumber: '', taxPercentage: 0, serviceCharge: 0, ownerName: '', ownerEmail: '', contactNumber: '', logoUrl: '', ownerPhotoUrl: '', uiTheme: '' });

      const owner = (hotelStatsRes.data?.staffCredentials || []).find((s) => s.role === 'OWNER');
      if (owner) {
        setOwnerUsername(owner.username || '');
      } else {
        const ownerSessionRaw = localStorage.getItem('owner_session');
        if (ownerSessionRaw) {
          try {
            setOwnerUsername(JSON.parse(ownerSessionRaw).username || '');
          } catch {
            setOwnerUsername('');
          }
        }
      }

      const restaurantData = restaurantRes.status === 'fulfilled' ? (restaurantRes.value.data || {}) : {};
      setOwnerCredentials((prev) => ({
        ...prev,
        email: restaurantData.ownerEmail || owner?.username || ownerUsername || prev.email || ''
      }));
      setOwnerProfile((prev) => ({
        ...prev,
        displayName: restaurantData.ownerName || prev.displayName || 'Owner Admin',
        email: restaurantData.ownerEmail || owner?.username || prev.email || '',
        phone: restaurantData.contactNumber || prev.phone || '',
        photoUrl: restaurantData.ownerPhotoUrl || prev.photoUrl || ''
      }));

      if (restaurantData.uiTheme) {
        setSelectedThemeId(restaurantData.uiTheme);
      }

      setError('');
    } catch (err) {
      console.error('Owner dashboard fetch failed', err);
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 20000);
    return () => clearInterval(interval);
  }, [hotelId]);

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(label);
    setTimeout(() => setCopyStatus(''), 1800);
  };

  const handleRestaurantSave = async (e) => {
    e.preventDefault();
    setRestaurantSaving(true);
    try {
      const restaurantId = Number(hotelId);
      await axios.put(
        `${API_BASE_URL}/restaurant/${restaurantId}`,
        restaurant,
        { headers: { 'X-Hotel-Id': hotelId } }
      );
      await fetchDashboardData();
      alert('Hotel settings updated successfully.');
    } catch (err) {
      console.error('Restaurant settings update failed', err);
      alert('Failed to update hotel settings.');
    } finally {
      setRestaurantSaving(false);
    }
  };

  const handleOwnerProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const restaurantId = Number(hotelId);
      const safeLogoUrl = ownerProfile.photoUrl && ownerProfile.photoUrl.startsWith('data:')
        ? ''
        : ownerProfile.photoUrl;
      await axios.put(
        `${API_BASE_URL}/restaurant/${restaurantId}`,
        {
          ...restaurant,
          ownerName: ownerProfile.displayName,
          ownerEmail: ownerProfile.email,
          contactNumber: ownerProfile.phone,
          logoUrl: safeLogoUrl
        },
        { headers: { 'X-Hotel-Id': hotelId } }
      );
      setRestaurant((prev) => ({
        ...prev,
        ownerName: ownerProfile.displayName,
        ownerEmail: ownerProfile.email,
        contactNumber: ownerProfile.phone,
        logoUrl: safeLogoUrl
      }));
      fetchDashboardData().catch((refreshErr) => {
        console.error('Owner profile refresh failed', refreshErr);
      });
      alert('Owner profile updated successfully.');
    } catch (err) {
      console.error('Owner profile update failed', err);
      alert(err.response?.data?.error || 'Failed to update owner profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleOwnerCredentialsSave = async (e) => {
    e.preventDefault();
    if (ownerCredentials.newPassword && ownerCredentials.newPassword !== ownerCredentials.confirmPassword) {
      alert('New password and confirm password do not match.');
      return;
    }
    setCredentialSaving(true);
    try {
      const ownerSessionRaw = localStorage.getItem('owner_session');
      let requesterUsername = ownerUsername || ownerCredentials.email || '';
      if (ownerSessionRaw) {
        try {
          requesterUsername = JSON.parse(ownerSessionRaw)?.username || requesterUsername;
        } catch {
          requesterUsername = requesterUsername;
        }
      }

      await axios.put(
        `${API_BASE_URL}/staff/update-by-role/OWNER`,
        {
          currentPassword: ownerCredentials.currentPassword,
          password: ownerCredentials.newPassword,
          username: ownerCredentials.email,
          requesterUsername
        },
        { headers: { 'X-Hotel-Id': hotelId } }
      );

      let nextSession = {};
      if (ownerSessionRaw) {
        try {
          nextSession = JSON.parse(ownerSessionRaw);
        } catch {
          nextSession = {};
        }
      }
      localStorage.setItem('owner_session', JSON.stringify({ ...nextSession, username: ownerCredentials.email }));
      setOwnerUsername(ownerCredentials.email);
      setOwnerProfile((prev) => ({ ...prev, email: ownerCredentials.email }));
      setOwnerCredentials((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      await fetchDashboardData();
      alert('Owner login updated successfully.');
    } catch (err) {
      console.error('Owner credentials update failed', err);
      alert(err.response?.data?.error || 'Failed to update owner login.');
    } finally {
      setCredentialSaving(false);
    }
  };

  const handleProfilePhotoChange = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setOwnerProfile((prev) => ({ ...prev, photoUrl: String(reader.result || '') }));
    };
    reader.readAsDataURL(file);
  };

  const openEditModal = (staff) => {
    setEditingStaff(staff);
    setNewUsername(staff.username || '');
    setNewPassword('');
    setIsEditModalOpen(true);
  };

  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    try {
      if (editingStaff) {
        await axios.put(
          `${API_BASE_URL}/staff/update-by-role/${editingStaff.role}`,
          {
            id: editingStaff.id,
            username: newUsername,
            password: newPassword,
            name: editingStaff.name,
            role: editingStaff.role,
            phone: editingStaff.phone || '0000000000'
          },
          { headers: { 'X-Hotel-Id': hotelId } }
        );
      }

      await fetchDashboardData();
      setIsEditModalOpen(false);
      alert('Credentials updated successfully.');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update credentials.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('owner_session');
    navigate(`/${hotelId}/owner/login`);
  };

  const openUpgradeCenter = () => {
    setPlanActionLoading(true);
    navigate('/saas-admin');
    setPlanActionLoading(false);
  };

  const operationalLinks = [
    { name: 'Admin Console', path: `/${hotelId}/admin/login`, icon: ShieldCheck, note: 'Menu and billing operations' },
    { name: 'Kitchen Console', path: `/${hotelId}/kitchen/login`, icon: ChefHat, note: 'Live preparation queue' },
    { name: 'Captain Console', path: `/${hotelId}/captain/login`, icon: Users, note: 'Floor and order relay' },
    { name: 'Customer Menu', path: `/${hotelId}/menu`, icon: Store, note: 'Guest facing menu view' }
  ];

  const statusRows = Object.entries(summary?.orderStatusBreakdown || {})
    .map(([status, count]) => ({ status, count: Number(count || 0) }))
    .sort((a, b) => b.count - a.count);

  const metricCards = [
    {
      title: `${timePhase[0].toUpperCase() + timePhase.slice(1)} Revenue`,
      value: formatCurrency(stats?.metrics?.[timePhase]?.revenue ?? summary?.totalRevenue ?? 0),
      icon: IndianRupee,
      tone: 'text-emerald-700 bg-emerald-50 border-emerald-100'
    },
    {
      title: `${timePhase[0].toUpperCase() + timePhase.slice(1)} Orders`,
      value: Number(stats?.metrics?.[timePhase]?.orders ?? summary?.totalOrders ?? 0).toLocaleString(),
      icon: ShoppingBag,
      tone: 'text-indigo-700 bg-indigo-50 border-indigo-100'
    },
    {
      title: 'Avg Order Value',
      value: formatCurrency(summary?.avgOrderValue ?? 0),
      icon: TrendingUp,
      tone: 'text-sky-700 bg-sky-50 border-sky-100'
    },
    {
      title: 'Active Staff Keys',
      value: String((stats?.staffCredentials || []).length || 0),
      icon: Users,
      tone: 'text-amber-700 bg-amber-50 border-amber-100'
    }
  ];

  const activeTheme = OWNER_THEME_PRESETS.find((theme) => theme.id === selectedThemeId) || OWNER_THEME_PRESETS[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center" style={{ fontFamily: 'Sora, Poppins, Segoe UI, sans-serif' }}>
        <div className="flex items-center gap-3 text-slate-600 font-extrabold text-lg">
          <Loader2 className="w-7 h-7 animate-spin text-blue-700" /> Loading owner command center...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ fontFamily: 'Sora, Poppins, Segoe UI, sans-serif', background: activeTheme.pageBg }}>
      <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] min-h-screen">
        <aside className="text-white px-5 py-6 border-r" style={{ background: activeTheme.sidebarBg, borderColor: 'rgba(255,255,255,0.10)' }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-sky-200 font-black">Owner Admin</p>
              <h1 className="text-2xl font-black mt-1">{ownerProfile.displayName || 'Vitteno Hub'}</h1>
            </div>
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition"
              title="Back"
            >
              <ArrowLeft size={16} />
            </button>
          </div>

          <div className="space-y-2 mb-8">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black transition ${
                    active ? 'bg-white text-[#0D2A4A]' : 'text-sky-100 hover:bg-white/10'
                  }`}
                  style={active ? { background: activeTheme.primary, color: activeTheme.onPrimary } : undefined}
                >
                  <Icon size={18} /> {item.label}
                </button>
              );
            })}
          </div>

          <div className="rounded-3xl bg-white/10 p-4 border border-white/15">
            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-sky-100">Current Hotel</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                {ownerProfile.photoUrl ? (
                  <img src={ownerProfile.photoUrl} alt="Owner profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={20} className="text-white/70" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-black text-lg leading-tight truncate">{stats?.hotelName || `Hotel ${hotelId}`}</p>
                <p className="text-xs text-sky-200 mt-1 truncate">{ownerProfile.email || ownerUsername || 'Owner login'}</p>
              </div>
            </div>
            <p className="text-xs text-sky-200 mt-3">Plan: {stats?.planType || 'STARTER'}</p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full mt-8 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-rose-500/15 text-rose-100 font-black hover:bg-rose-500/25 transition"
          >
            <Power size={15} /> Secure Logout
          </button>
        </aside>

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="rounded-3xl shadow-sm p-4 sm:p-6" style={{ background: activeTheme.surface, border: `1px solid ${activeTheme.border}` }}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">{stats?.hotelName || 'Owner Dashboard'}</h2>
                <p className="text-slate-500 text-sm font-semibold mt-1">Full service overview, staff access, and analytics control.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={fetchDashboardData}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-slate-700 font-bold transition"
                  style={{ background: activeTheme.primarySoft }}
                >
                  <RefreshCw size={14} /> Refresh
                </button>
                {['today', 'monthly', 'yearly'].map((phase) => (
                  <button
                    key={phase}
                    onClick={() => setTimePhase(phase)}
                    className={`px-4 py-2 rounded-xl text-xs uppercase tracking-widest font-black transition ${
                      phase === timePhase ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                    style={phase === timePhase ? { background: activeTheme.primary, color: activeTheme.onPrimary } : undefined}
                  >
                    {phase}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 font-bold text-sm flex items-center gap-2">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              {metricCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.title} className={`rounded-2xl border p-4 ${card.tone}`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[11px] uppercase tracking-widest font-black">{card.title}</p>
                      <Icon size={18} />
                    </div>
                    <p className="text-2xl font-black">{card.value}</p>
                  </div>
                );
              })}
            </div>

            {activeSection === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-2">
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-black text-slate-900">Revenue Trend</h3>
                        <span className="text-xs font-bold text-slate-500">Last 30 days</span>
                      </div>
                      <RevenueChart data={trend} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-3xl border border-slate-200 p-4 bg-white">
                      <h3 className="font-black text-slate-900 mb-3">Order Status Snapshot</h3>
                      <div className="space-y-2">
                        {statusRows.length === 0 && <p className="text-sm text-slate-500 font-semibold">No status data.</p>}
                        {statusRows.map((row) => (
                          <div key={row.status} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 border border-slate-100">
                            <span className={`text-[11px] uppercase font-black px-2 py-1 rounded-md ${STATUS_COLORS[row.status] || 'bg-slate-200 text-slate-700'}`}>
                              {row.status}
                            </span>
                            <span className="font-black text-slate-900">{row.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 p-4 bg-white">
                      <h3 className="font-black text-slate-900 mb-3">Payment Mix</h3>
                      <SegmentedBars items={payments} valueKey="count" labelKey="method" color="bg-indigo-500" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="rounded-3xl border border-slate-200 p-4 bg-white">
                    <h3 className="font-black text-slate-900 mb-3">Operational Portals</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {operationalLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                          <div key={link.name} className="rounded-2xl border border-slate-200 p-3 bg-slate-50">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Icon size={16} className="text-blue-700" />
                                  <p className="font-black text-sm text-slate-900">{link.name}</p>
                                </div>
                                <p className="text-xs text-slate-500 font-semibold">{link.note}</p>
                              </div>
                            </div>
                            <div className="mt-3 flex gap-2">
                              <button
                                onClick={() => window.open(link.path, '_blank')}
                                className="flex-1 px-3 py-2 rounded-xl bg-blue-700 text-white text-xs font-black uppercase tracking-wider hover:bg-blue-800 transition"
                              >
                                Open
                              </button>
                              <button
                                onClick={() => handleCopy(`${window.location.origin}${link.path}`, link.name)}
                                className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                              >
                                {copyStatus === link.name ? <CheckCircle2 size={14} className="text-emerald-600" /> : <Copy size={14} />}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 p-4 bg-white">
                    <h3 className="font-black text-slate-900 mb-3">Peak Hours</h3>
                    <SegmentedBars items={peakHours} valueKey="count" labelKey="hour" color="bg-emerald-500" />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'analytics' && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <h3 className="font-black text-slate-900 mb-3">Revenue Growth Curve</h3>
                  <RevenueChart data={trend} />
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <h3 className="font-black text-slate-900 mb-3">Payment Channel Distribution</h3>
                  <SegmentedBars items={payments} valueKey="revenue" labelKey="method" color="bg-amber-500" />
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <h3 className="font-black text-slate-900 mb-3">Order Status Breakdown</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {statusRows.map((row) => (
                      <div key={row.status} className="rounded-xl border border-slate-200 p-3 bg-slate-50">
                        <p className={`inline-flex text-[11px] uppercase px-2 py-1 rounded-md font-black ${STATUS_COLORS[row.status] || 'bg-slate-200 text-slate-700'}`}>
                          {row.status}
                        </p>
                        <p className="text-2xl font-black text-slate-900 mt-2">{row.count}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <h3 className="font-black text-slate-900 mb-3">Top Dishes (Live Snapshot)</h3>
                  <div className="space-y-2">
                    {(stats?.topDishes || []).length === 0 && <p className="text-sm text-slate-500 font-semibold">No top dish data.</p>}
                    {(stats?.topDishes || []).map((dish, idx) => (
                      <div key={`${dish.name}-${idx}`} className="rounded-xl border border-slate-200 p-3 bg-slate-50 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-black text-slate-900">{dish.name}</p>
                          <p className="text-xs font-semibold text-slate-500">Qty {dish.quantity}</p>
                        </div>
                        <p className="font-black text-slate-900">{formatCurrency(dish.revenue)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'staff' && (
              <div className="space-y-5">
                <div className="rounded-3xl border border-slate-200 p-4 bg-gradient-to-r from-blue-50 to-cyan-50">
                  <h3 className="text-xl font-black text-slate-900">Staff Credential Control</h3>
                  <p className="text-sm font-semibold text-slate-600 mt-1">
                    Manage all login identities for admin, kitchen, captain, and owner access from one secure view.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {(stats?.staffCredentials || []).map((staff) => (
                    <div key={staff.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-[10px] uppercase tracking-widest font-black px-2 py-1 rounded-md ${ROLE_COLORS[staff.role] || 'bg-slate-700 text-white'}`}>
                          {staff.role}
                        </span>
                        <button
                          onClick={() => openEditModal(staff)}
                          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition"
                          title="Edit credentials"
                        >
                          <Edit3 size={14} />
                        </button>
                      </div>
                      <p className="text-xs uppercase tracking-widest text-slate-400 font-black">{staff.name}</p>
                      <p className="mt-1 text-lg font-black text-slate-900 break-all">{staff.username}</p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleCopy(staff.username || '', `staff-${staff.id}`)}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-black uppercase tracking-wider"
                        >
                          {copyStatus === `staff-${staff.id}` ? 'Copied' : 'Copy User'}
                        </button>
                        <button
                          onClick={() => openEditModal(staff)}
                          className="px-3 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-black uppercase tracking-wider"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'services' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {[
                  { name: 'Admin Console', status: 'Operational', icon: ShieldCheck, text: 'Menu, billing, and table management are available.' },
                  { name: 'Kitchen Queue', status: 'Operational', icon: ChefHat, text: 'Live order stream and preparation workflow running.' },
                  { name: 'Analytics Engine', status: trend.length ? 'Operational' : 'Warning', icon: BarChart3, text: trend.length ? 'Charts are receiving trend data.' : 'No trend records in selected range.' },
                  { name: 'Broadcast Service', status: 'Operational', icon: Sparkles, text: 'Promotional offer broadcast endpoint is active.' },
                  { name: 'Inventory Tracking', status: 'Operational', icon: Store, text: 'Raw material logs and usage exports available.' },
                  { name: 'Review Insights', status: 'Operational', icon: Activity, text: 'Guest sentiment and rating summaries are enabled.' }
                ].map((service) => {
                  const Icon = service.icon;
                  const warn = service.status === 'Warning';
                  return (
                    <div key={service.name} className={`rounded-3xl border p-4 ${warn ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon size={18} className={warn ? 'text-amber-600' : 'text-blue-700'} />
                          <p className="font-black text-slate-900">{service.name}</p>
                        </div>
                        <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-md font-black ${warn ? 'bg-amber-200 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {service.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 font-semibold">{service.text}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {activeSection === 'settings' && (
              <div className="max-w-6xl space-y-6">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="rounded-3xl border border-slate-200 p-5 bg-white shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-black text-slate-900">Owner Profile</h3>
                        <p className="text-sm text-slate-500 font-semibold">Profile photo and owner details for the dashboard.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {stats?.planType !== 'PREMIUM' && (
                          <button
                            onClick={openUpgradeCenter}
                            disabled={planActionLoading}
                            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black uppercase tracking-widest"
                          >
                            {planActionLoading ? 'Opening...' : 'Upgrade'}
                          </button>
                        )}
                      </div>
                    </div>

                    <form onSubmit={handleOwnerProfileSave} className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                          {ownerProfile.photoUrl ? (
                            <img src={ownerProfile.photoUrl} alt="Owner profile" className="w-full h-full object-cover" />
                          ) : (
                            <User size={28} className="text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <label className="text-[11px] uppercase tracking-widest font-black text-slate-500">Profile Photo</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleProfilePhotoChange(e.target.files?.[0])}
                            className="block w-full text-xs text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-blue-700 file:px-4 file:py-2 file:text-xs file:font-black file:text-white hover:file:bg-blue-800"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] uppercase tracking-widest font-black text-slate-500">Owner Name</label>
                        <input
                          type="text"
                          value={ownerProfile.displayName || ''}
                          onChange={(e) => setOwnerProfile((prev) => ({ ...prev, displayName: e.target.value }))}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Owner display name"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] uppercase tracking-widest font-black text-slate-500">Display Title</label>
                          <input
                            type="text"
                            value={ownerProfile.title || ''}
                            onChange={(e) => setOwnerProfile((prev) => ({ ...prev, title: e.target.value }))}
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Owner Admin"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] uppercase tracking-widest font-black text-slate-500">Phone</label>
                          <input
                            type="text"
                            value={ownerProfile.phone || ''}
                            onChange={(e) => setOwnerProfile((prev) => ({ ...prev, phone: e.target.value }))}
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Contact number"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] uppercase tracking-widest font-black text-slate-500">Owner Bio</label>
                        <textarea
                          rows="3"
                          value={ownerProfile.bio || ''}
                          onChange={(e) => setOwnerProfile((prev) => ({ ...prev, bio: e.target.value }))}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-semibold outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          placeholder="Short owner profile note"
                        />
                      </div>

                      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                        <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1">Login Email</p>
                        <p className="font-black text-slate-900 break-all">{ownerProfile.email || ownerUsername || 'Owner login pending'}</p>
                        <p className="text-xs text-slate-500 mt-1">Use the login card to change the email and password.</p>
                      </div>

                      <button
                        type="submit"
                        disabled={profileSaving}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white font-black uppercase tracking-widest text-xs"
                        style={{ background: activeTheme.primary }}
                      >
                        {profileSaving ? <Loader2 size={14} className="animate-spin" /> : <Settings size={14} />} Save Profile
                      </button>
                    </form>
                  </div>

                  <div className="rounded-3xl border border-slate-200 p-5 bg-white shadow-sm">
                    <h3 className="font-black text-slate-900 mb-1">Owner Login & Password</h3>
                    <p className="text-sm text-slate-500 font-semibold mb-4">Change the owner email and password together.</p>

                    <form onSubmit={handleOwnerCredentialsSave} className="space-y-4">
                      <div>
                        <label className="text-[11px] uppercase tracking-widest font-black text-slate-500">Owner Email</label>
                        <input
                          type="email"
                          value={ownerCredentials.email || ''}
                          onChange={(e) => setOwnerCredentials((prev) => ({ ...prev, email: e.target.value }))}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="owner@restaurant.com"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[11px] uppercase tracking-widest font-black text-slate-500">Current Password</label>
                        <input
                          type="password"
                          value={ownerCredentials.currentPassword || ''}
                          onChange={(e) => setOwnerCredentials((prev) => ({ ...prev, currentPassword: e.target.value }))}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] uppercase tracking-widest font-black text-slate-500">New Password</label>
                          <input
                            type="password"
                            value={ownerCredentials.newPassword || ''}
                            onChange={(e) => setOwnerCredentials((prev) => ({ ...prev, newPassword: e.target.value }))}
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] uppercase tracking-widest font-black text-slate-500">Confirm Password</label>
                          <input
                            type="password"
                            value={ownerCredentials.confirmPassword || ''}
                            onChange={(e) => setOwnerCredentials((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={credentialSaving}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white font-black uppercase tracking-widest text-xs"
                        style={{ background: activeTheme.primary }}
                      >
                        {credentialSaving ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />} Save Login
                      </button>
                    </form>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 p-5 bg-white shadow-sm">
                  <h3 className="font-black text-slate-900 mb-1">Theme Studio</h3>
                  <p className="text-sm text-slate-500 font-semibold mb-4">Choose one of four color combinations for this owner dashboard.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                    {OWNER_THEME_PRESETS.map((theme) => {
                      const selected = selectedThemeId === theme.id;
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => setSelectedThemeId(theme.id)}
                          className={`text-left rounded-3xl border p-4 transition ${selected ? 'ring-2 ring-offset-2 ring-slate-900' : 'hover:shadow-md'}`}
                          style={{ background: theme.surface, borderColor: selected ? theme.primary : theme.border }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="font-black text-slate-900">{theme.name}</p>
                              <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">{selected ? 'Active theme' : 'Tap to apply'}</p>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full" style={{ background: theme.primarySoft, color: theme.primary }}>
                              4 colors
                            </span>
                          </div>
                          <div className="flex gap-2 mb-3">
                            {theme.colors.map((color) => (
                              <span key={color} className="h-7 flex-1 rounded-full border border-white/50" style={{ background: color }} />
                            ))}
                          </div>
                          <p className="text-xs text-slate-600 font-semibold">A balanced {theme.name.toLowerCase()} combination for the owner workspace.</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 p-5 bg-white shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-black text-slate-900">Hotel Identity</h3>
                      <p className="text-sm text-slate-500 font-semibold">Name, address, GST, and tax are maintained here.</p>
                    </div>
                  </div>

                  <form onSubmit={handleRestaurantSave} className="space-y-4">
                    <div>
                      <label className="text-[11px] uppercase tracking-widest font-black text-slate-500">Restaurant Name</label>
                      <input
                        type="text"
                        value={restaurant.name || ''}
                        onChange={(e) => setRestaurant((prev) => ({ ...prev, name: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] uppercase tracking-widest font-black text-slate-500">Address</label>
                      <input
                        type="text"
                        value={restaurant.address || ''}
                        onChange={(e) => setRestaurant((prev) => ({ ...prev, address: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] uppercase tracking-widest font-black text-slate-500">GST / Tax ID</label>
                      <input
                        type="text"
                        value={restaurant.gstNumber || ''}
                        onChange={(e) => setRestaurant((prev) => ({ ...prev, gstNumber: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] uppercase tracking-widest font-black text-slate-500">Tax Percentage (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={restaurant.taxPercentage ?? 0}
                        onChange={(e) => setRestaurant((prev) => ({ ...prev, taxPercentage: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={restaurantSaving}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white font-black uppercase tracking-widest text-xs"
                      style={{ background: activeTheme.primary }}
                    >
                      {restaurantSaving ? <Loader2 size={14} className="animate-spin" /> : <Settings size={14} />} Save Hotel Info
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-slate-900 text-xl">Update Staff Credential</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 rounded-lg hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateStaff} className="space-y-4">
              <div>
                <label className="text-[11px] uppercase tracking-widest font-black text-slate-500">Role</label>
                <div className="mt-1 rounded-xl bg-slate-50 border border-slate-200 px-3 py-3 font-black text-slate-900">
                  {editingStaff?.role || '-'}
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-widest font-black text-slate-500">Username</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-widest font-black text-slate-500">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep unchanged"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={updateLoading}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-black uppercase tracking-widest text-xs"
              >
                {updateLoading ? <Loader2 size={14} className="animate-spin" /> : <Edit3 size={14} />} Update Credential
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;
