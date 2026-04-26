import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
    AlertCircle,
    ArrowLeft,
    ChefHat,
    ClipboardCheck,
    Eye,
    EyeOff,
    Hotel,
    Loader2,
    Lock,
    Mail,
    ShieldCheck,
    Sparkles,
    TabletSmartphone,
    User,
    UserRound
} from 'lucide-react';
import { API_BASE_URL } from '../api/api';

const ROLE_THEMES = {
    OWNER: {
        title: 'Owner Login',
        eyebrow: 'Strategic Portal',
        description: 'Access the business view, owner controls, and restaurant oversight tools.',
        badge: 'Owner Console',
        icon: ShieldCheck,
        accent: 'indigo',
        heroGradient: 'from-slate-950 via-slate-900 to-indigo-950',
        heroGlow: 'bg-indigo-500/25',
        heroSoft: 'bg-indigo-500/10',
        button: 'from-indigo-600 via-indigo-500 to-sky-500',
        buttonHover: 'hover:from-indigo-500 hover:via-indigo-400 hover:to-sky-400',
        border: 'border-indigo-200/70',
        text: 'text-indigo-700',
        fieldFocus: 'focus-within:border-indigo-500 focus-within:ring-indigo-500/20',
        badgeSoft: 'bg-indigo-50 text-indigo-700',
        ring: 'ring-indigo-500/20'
    },
    ADMIN: {
        title: 'Admin Manager Login',
        eyebrow: 'Operations Hub',
        description: 'Manage menus, billing, staff coordination, and day-to-day restaurant operations.',
        badge: 'Manager Console',
        icon: ClipboardCheck,
        accent: 'sky',
        heroGradient: 'from-sky-950 via-blue-900 to-cyan-950',
        heroGlow: 'bg-sky-500/25',
        heroSoft: 'bg-sky-500/10',
        button: 'from-sky-600 via-blue-500 to-cyan-500',
        buttonHover: 'hover:from-sky-500 hover:via-blue-400 hover:to-cyan-400',
        border: 'border-sky-200/70',
        text: 'text-sky-700',
        fieldFocus: 'focus-within:border-sky-500 focus-within:ring-sky-500/20',
        badgeSoft: 'bg-sky-50 text-sky-700',
        ring: 'ring-sky-500/20'
    },
    KITCHEN: {
        title: 'Kitchen Login',
        eyebrow: 'Preparation Desk',
        description: 'Monitor live tickets, prioritize prep, and keep kitchen flow moving without friction.',
        badge: 'Kitchen Console',
        icon: ChefHat,
        accent: 'orange',
        heroGradient: 'from-orange-950 via-amber-900 to-stone-950',
        heroGlow: 'bg-orange-500/25',
        heroSoft: 'bg-orange-500/10',
        button: 'from-orange-600 via-amber-500 to-yellow-500',
        buttonHover: 'hover:from-orange-500 hover:via-amber-400 hover:to-yellow-400',
        border: 'border-orange-200/70',
        text: 'text-orange-700',
        fieldFocus: 'focus-within:border-orange-500 focus-within:ring-orange-500/20',
        badgeSoft: 'bg-orange-50 text-orange-700',
        ring: 'ring-orange-500/20'
    },
    WAITER: {
        title: 'Captain Login',
        eyebrow: 'Floor Command',
        description: 'Handle table flow, relay orders, and stay synced with kitchen and billing updates.',
        badge: 'Captain Console',
        icon: UserRound,
        accent: 'emerald',
        heroGradient: 'from-emerald-950 via-teal-900 to-slate-950',
        heroGlow: 'bg-emerald-500/25',
        heroSoft: 'bg-emerald-500/10',
        button: 'from-emerald-600 via-teal-500 to-cyan-500',
        buttonHover: 'hover:from-emerald-500 hover:via-teal-400 hover:to-cyan-400',
        border: 'border-emerald-200/70',
        text: 'text-emerald-700',
        fieldFocus: 'focus-within:border-emerald-500 focus-within:ring-emerald-500/20',
        badgeSoft: 'bg-emerald-50 text-emerald-700',
        ring: 'ring-emerald-500/20'
    }
};

const StaffLogin = ({ role }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { hotelId: urlHotelId } = useParams();
    const queryHotelId = new URLSearchParams(location.search).get('hotelId') || '';
    const scopedHotelId = urlHotelId || queryHotelId;
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [hotelId, setHotelId] = useState(scopedHotelId || localStorage.getItem('hotelId') || '');
    const [resolvedHotelName, setResolvedHotelName] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [hotelLookupLoading, setHotelLookupLoading] = useState(false);
    const [hotelLookupError, setHotelLookupError] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const googleBtnRef = useRef(null);

    const isOwner = role === 'OWNER';
    const isAdmin = role === 'ADMIN';
    const isKitchen = role === 'KITCHEN';
    const isWaiter = role === 'WAITER';
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    const theme = ROLE_THEMES[role] || ROLE_THEMES.ADMIN;
    const RoleIcon = theme.icon;
    const usernameLabel = isOwner ? 'Email ID' : 'Staff Username';
    const usernamePlaceholder = isOwner ? 'Enter Email Here' : 'Enter Username Here';
    const roleTitle = theme.title;
    const roleSubtitle = theme.description;

    const storageKey = isOwner ? 'owner_session' : isAdmin ? 'admin_session' : isWaiter ? 'captain_session' : 'kitchen_session';
    const dashboardPath = isOwner ? `/${hotelId}/owner` : isAdmin ? `/${hotelId}/admin` : isWaiter ? `/${hotelId}/captain` : `/${hotelId}/kitchen`;

    const persistAndNavigate = (staffData) => {
        const resolvedHotelId = String(staffData?.tenantId || hotelId || '').trim();
        const session = {
            ...staffData,
            hotelId: resolvedHotelId,
            date: new Date().toISOString().split('T')[0],
            loginTime: new Date().getTime()
        };

        localStorage.setItem(storageKey, JSON.stringify(session));
        localStorage.setItem('hotelId', resolvedHotelId);
        setHotelId(resolvedHotelId);

        if (staffData.role === 'OWNER') {
            navigate(`/${resolvedHotelId}/owner`);
        } else if (staffData.role === 'ADMIN') {
            navigate(`/${resolvedHotelId}/admin`);
        } else if (staffData.role === 'WAITER') {
            navigate(`/${resolvedHotelId}/captain`);
        } else {
            navigate(`/${resolvedHotelId}/kitchen`);
        }
    };

    const resolveOwnerHotelId = async (ownerEmail) => {
        if (!isOwner) {
            return hotelId;
        }

        if (scopedHotelId) {
            return scopedHotelId;
        }

        const normalizedEmail = ownerEmail?.trim().toLowerCase();
        if (!normalizedEmail) {
            throw new Error('Please enter owner email first.');
        }

        setHotelLookupLoading(true);
        setHotelLookupError('');
        try {
            const response = await axios.get(`${API_BASE_URL}/saas/owner-hotel`, {
                params: { email: normalizedEmail },
                headers: {
                    Authorization: ''
                }
            });
            const resolvedHotelId = String(response.data?.hotelId || '').trim();
            const resolvedHotelNameValue = String(response.data?.hotelName || '').trim();
            if (!resolvedHotelId) {
                throw new Error('Hotel not found for this owner email.');
            }
            setHotelId(resolvedHotelId);
            setResolvedHotelName(resolvedHotelNameValue);
            return resolvedHotelId;
        } catch (err) {
            const message = err.response?.data?.message || err.response?.data?.error || 'Hotel not found for this owner email.';
            setResolvedHotelName('');
            setHotelLookupError(message);
            throw new Error(message);
        } finally {
            setHotelLookupLoading(false);
        }
    };

    const handleOwnerEmailChange = (value) => {
        setUsername(value);
        if (!scopedHotelId) {
            setHotelId('');
            setResolvedHotelName('');
            setHotelLookupError('');
        }
    };

    const handleOwnerEmailBlur = async () => {
        if (!isOwner || scopedHotelId) {
            return;
        }

        const trimmedEmail = username.trim();
        if (!trimmedEmail) {
            return;
        }

        try {
            await resolveOwnerHotelId(trimmedEmail);
        } catch {
            // Error is already captured in state for display.
        }
    };

    useEffect(() => {
        if (scopedHotelId) setHotelId(scopedHotelId);
    }, [scopedHotelId]);

    useEffect(() => {
        const staff = localStorage.getItem(storageKey);
        if (staff) {
            const session = JSON.parse(staff);
            const today = new Date().toISOString().split('T')[0];
            const matchesHotel = !scopedHotelId || String(session.hotelId) === String(scopedHotelId);
            if (session.date === today && matchesHotel) {
                navigate(dashboardPath);
            } else if (scopedHotelId && String(session.hotelId) === String(scopedHotelId)) {
                localStorage.removeItem(storageKey);
            }
        }
    }, [navigate, storageKey, dashboardPath, scopedHotelId]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const normalizedUsername = role === 'OWNER' ? username.trim().toLowerCase() : username.trim();
            const loginHotelId = isOwner ? await resolveOwnerHotelId(normalizedUsername) : hotelId?.toString().trim();
            const response = await axios.post(`${API_BASE_URL}/staff/login`, {
                username: normalizedUsername,
                password,
                hotelId: loginHotelId
            }, {
                headers: {
                    'X-Hotel-Id': loginHotelId,
                    Authorization: ''
                }
            });
            
            const staffData = response.data;

            // Role enforcement at login
            if (role && staffData.role !== role) {
                setError(`This account does not have ${role} access.`);
                setLoading(false);
                return;
            }

            persistAndNavigate(staffData);
            
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleCredential = async (credentialResponse) => {
        const idToken = credentialResponse?.credential;
        setGoogleLoading(true);
        if (!idToken) {
            setError('Google login failed. Please try again.');
            setGoogleLoading(false);
            return;
        }

        try {
            setError('');
            const resolvedHotelId = await resolveOwnerHotelId(username);
            const response = await axios.post(
                `${API_BASE_URL}/staff/login/google`,
                { idToken },
                { headers: { 'X-Hotel-Id': resolvedHotelId } }
            );

            const staffData = response.data;
            if (staffData.role !== 'OWNER') {
                setError('This Google account is not authorized as owner admin.');
                return;
            }

            persistAndNavigate(staffData);
        } catch (err) {
            setError(err.response?.data?.error || 'Google login failed.');
        } finally {
            setGoogleLoading(false);
        }
    };

    useEffect(() => {
        if (!isOwner || !hotelId || !googleClientId || !googleBtnRef.current) {
            return;
        }

        const renderGoogleButton = () => {
            if (!window.google?.accounts?.id || !googleBtnRef.current) {
                return;
            }

            window.google.accounts.id.initialize({
                client_id: googleClientId,
                callback: handleGoogleCredential
            });

            googleBtnRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(googleBtnRef.current, {
                type: 'standard',
                theme: 'outline',
                size: 'large',
                text: 'continue_with',
                shape: 'pill',
                width: 320
            });
        };

        if (window.google?.accounts?.id) {
            renderGoogleButton();
            return;
        }

        const existingScript = document.getElementById('google-identity-script');
        if (existingScript) {
            existingScript.addEventListener('load', renderGoogleButton, { once: true });
            return () => existingScript.removeEventListener('load', renderGoogleButton);
        }

        const script = document.createElement('script');
        script.id = 'google-identity-script';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = renderGoogleButton;
        document.head.appendChild(script);
        return () => {
            script.onload = null;
        };
    }, [isOwner, hotelId, googleClientId]);

    return (
        <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.75),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(148,163,184,0.35),_transparent_24%),linear-gradient(180deg,_#dceafe_0%,_#c8dcfb_50%,_#b7cdf1_100%)] text-slate-900">
            <div className="absolute inset-0 overflow-hidden">
                <div className={`absolute -left-24 top-16 h-72 w-72 rounded-full ${theme.heroGlow} blur-3xl`} />
                <div className="absolute right-[-5rem] top-28 h-80 w-80 rounded-full bg-white/35 blur-3xl" />
                <div className={`absolute bottom-[-6rem] left-1/3 h-72 w-72 rounded-full ${theme.heroSoft} blur-3xl`} />
            </div>

            <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:gap-14 lg:px-8">
                <section className="flex w-full flex-1 flex-col justify-center gap-8 lg:pt-2">
                    <div className="flex items-center justify-between gap-4 animate-[fadeIn_0.5s_ease-out]">
                        <button onClick={() => navigate('/')} className="flex items-center gap-3 rounded-full border border-white/65 bg-white/55 px-4 py-2 shadow-lg shadow-slate-900/5 backdrop-blur-xl transition hover:bg-white/75">
                            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${theme.heroGradient} text-white shadow-xl ${theme.ring}`}>
                                <Sparkles size={18} />
                            </div>
                            <div className="text-left leading-tight">
                                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">serversundaram</p>
                                <p className="text-sm font-black text-slate-900">Restaurant Portal</p>
                            </div>
                        </button>
                        <div className={`hidden rounded-full border ${theme.border} bg-white/60 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-slate-600 shadow-lg shadow-slate-900/5 backdrop-blur-xl sm:inline-flex`}>
                            <span>{theme.badge}</span>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-[2.5rem] border border-white/70 bg-white/45 p-5 shadow-[0_30px_90px_rgba(15,23,42,0.14)] backdrop-blur-2xl sm:p-8 lg:p-10">
                        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                            <div className="order-2 lg:order-1">
                                <p className={`mb-4 inline-flex rounded-full border ${theme.border} bg-white/70 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] ${theme.text}`}>
                                    {theme.eyebrow}
                                </p>
                                <h1 className="max-w-xl text-4xl font-black leading-[0.95] tracking-[-0.06em] text-slate-950 sm:text-5xl lg:text-6xl">
                                    {roleTitle}
                                </h1>
                                <p className="mt-5 max-w-xl text-base leading-7 text-slate-700 sm:text-lg">
                                    {roleSubtitle}
                                </p>

                                <div className="mt-6 flex flex-wrap gap-3 text-sm font-black text-slate-700">
                                    <div className="inline-flex items-center gap-2 rounded-full bg-white/75 px-4 py-2 shadow-sm">
                                        <TabletSmartphone size={16} className={theme.text} />
                                        Mobile friendly
                                    </div>
                                    <div className="inline-flex items-center gap-2 rounded-full bg-white/75 px-4 py-2 shadow-sm">
                                        <ShieldCheck size={16} className={theme.text} />
                                        Tenant aware
                                    </div>
                                    <div className="inline-flex items-center gap-2 rounded-full bg-white/75 px-4 py-2 shadow-sm">
                                        <Sparkles size={16} className={theme.text} />
                                        Quick access
                                    </div>
                                </div>

                                <div className="mt-8 rounded-[2rem] border border-white/70 bg-white/65 p-4 shadow-xl shadow-slate-900/5 sm:p-5">
                                    <div className="flex items-start gap-4">
                                        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${theme.heroGradient} text-white shadow-lg ${theme.ring}`}>
                                            <RoleIcon size={28} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">Secure access</p>
                                            <p className="mt-1 text-lg font-black text-slate-950">Sign in and continue to your dashboard</p>
                                            <p className="mt-1 text-sm leading-6 text-slate-600">
                                                Use your staff credentials to access the role-specific interface on any screen size.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                                        <div className="rounded-2xl bg-slate-950 px-4 py-4 text-white shadow-lg shadow-slate-950/10">
                                            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/60">Session</p>
                                            <p className="mt-2 text-lg font-black">Protected</p>
                                        </div>
                                        <div className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-slate-200/70">
                                            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Layout</p>
                                            <p className="mt-2 text-lg font-black text-slate-900">Responsive</p>
                                        </div>
                                        <div className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-slate-200/70">
                                            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Target</p>
                                            <p className="mt-2 text-lg font-black text-slate-900">{isAdmin ? 'Manager' : isKitchen ? 'Kitchen' : isWaiter ? 'Captain' : 'Owner'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="order-1 lg:order-2">
                                <div className={`relative overflow-hidden rounded-[2.25rem] border ${theme.border} bg-white/88 p-5 shadow-[0_28px_70px_rgba(15,23,42,0.16)] backdrop-blur-2xl sm:p-8`}>
                                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-white/90 to-transparent" />

                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className={`inline-flex rounded-full ${theme.badgeSoft} px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em]`}>
                                                {theme.badge}
                                            </p>
                                            <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-slate-950">
                                                Login
                                            </h2>
                                            <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
                                                Enter your credentials to get started.
                                            </p>
                                        </div>

                                        <div className={`hidden h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${theme.heroGradient} text-white shadow-xl ${theme.ring} sm:flex`}>
                                            <RoleIcon size={26} />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 shadow-sm">
                                            <AlertCircle size={18} className="mt-0.5 shrink-0" />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    <form onSubmit={handleLogin} className="mt-6 space-y-5" autoComplete="off">
                                        {/* Decoy fields to absorb browser autofill and keep visible inputs empty */}
                                        <input type="text" name="fake_username" autoComplete="username" className="hidden" tabIndex={-1} />
                                        <input type="password" name="fake_password" autoComplete="current-password" className="hidden" tabIndex={-1} />
                                        {!scopedHotelId && !isOwner ? (
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-slate-700">Hotel ID</label>
                                                <div className={`group relative rounded-2xl border border-slate-200 bg-white shadow-sm transition focus-within:ring-4 ${theme.fieldFocus}`}>
                                                    <Hotel size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-slate-700" />
                                                    <input
                                                        type="text"
                                                        placeholder="Enter hotel ID"
                                                        className="h-14 w-full rounded-2xl border-0 bg-transparent pl-12 pr-4 text-slate-900 outline-none placeholder:text-slate-400"
                                                        value={hotelId}
                                                        onChange={(e) => setHotelId(e.target.value)}
                                                        autoComplete="off"
                                                        name="hotelId"
                                                        required
                                                    />
                                                </div>
                                                <p className="text-xs font-medium text-slate-500">Use the hotel ID assigned during registration.</p>
                                            </div>
                                        ) : isOwner && !scopedHotelId ? (
                                            <div className={`flex items-center justify-between rounded-2xl border ${theme.border} bg-slate-50/80 px-4 py-3 shadow-sm`}>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Tenant auto-detect</p>
                                                    <p className="mt-1 text-sm font-black text-slate-900">{resolvedHotelName ? `${resolvedHotelName} (Hotel ${hotelId})` : hotelId ? `Hotel ${hotelId} resolved from owner email` : 'Hotel will be auto-detected from owner email'}</p>
                                                    {hotelLookupError && <p className="mt-1 text-xs font-semibold text-rose-600">{hotelLookupError}</p>}
                                                </div>
                                                <Hotel size={18} className={theme.text} />
                                            </div>
                                        ) : (
                                            <div className={`flex items-center justify-between rounded-2xl border ${theme.border} bg-slate-50/80 px-4 py-3 shadow-sm`}>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Tenant locked</p>
                                                    <p className="mt-1 text-sm font-black text-slate-900">Hotel {scopedHotelId}</p>
                                                </div>
                                                <Hotel size={18} className={theme.text} />
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700">{usernameLabel}</label>
                                            <div className={`group relative rounded-2xl border border-slate-200 bg-white shadow-sm transition focus-within:ring-4 ${theme.fieldFocus}`}>
                                                {isOwner ? (
                                                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-slate-700" />
                                                ) : (
                                                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-slate-700" />
                                                )}
                                                <input
                                                    type={isOwner ? 'email' : 'text'}
                                                    placeholder={usernamePlaceholder}
                                                    className="h-14 w-full rounded-2xl border-0 bg-transparent pl-12 pr-4 text-slate-900 outline-none placeholder:text-slate-400"
                                                    value={username}
                                                    onChange={(e) => (isOwner ? handleOwnerEmailChange(e.target.value) : setUsername(e.target.value))}
                                                    onBlur={isOwner ? handleOwnerEmailBlur : undefined}
                                                    autoComplete="off"
                                                    name="login_username"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700">Password</label>
                                            <div className={`group relative rounded-2xl border border-slate-200 bg-white shadow-sm transition focus-within:ring-4 ${theme.fieldFocus}`}>
                                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-slate-700" />
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    placeholder="Enter password here"
                                                    className="h-14 w-full rounded-2xl border-0 bg-transparent pl-12 pr-12 text-slate-900 outline-none placeholder:text-slate-400"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    autoComplete="new-password"
                                                    name="login_password"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword((current) => !current)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                                >
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading || hotelLookupLoading}
                                            className={`flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r ${theme.button} px-5 font-black text-white shadow-xl shadow-slate-900/15 transition-transform duration-200 ${theme.buttonHover} active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60`}
                                        >
                                            {(loading || hotelLookupLoading) ? <Loader2 className="animate-spin" size={20} /> : <RoleIcon size={20} />}
                                            <span>{loading ? 'Signing in...' : hotelLookupLoading ? 'Finding hotel...' : `Login to ${roleTitle}`}</span>
                                        </button>

                                        {isOwner && hotelId && (
                                            <>
                                                <div className="relative">
                                                    <div className="absolute inset-0 flex items-center">
                                                        <span className="w-full border-t border-slate-200" />
                                                    </div>
                                                    <div className="relative flex justify-center text-xs">
                                                        <span className="bg-white px-3 font-bold text-slate-500">OR</span>
                                                    </div>
                                                </div>

                                                {!googleClientId ? (
                                                    <p className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                                                        Google login is not configured. Set VITE_GOOGLE_CLIENT_ID to enable it.
                                                    </p>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div ref={googleBtnRef} />
                                                        {googleLoading && (
                                                            <p className="text-xs font-semibold text-slate-500">Processing Google login...</p>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        <div className="flex flex-col items-center gap-3 pt-1 text-sm sm:flex-row sm:justify-between">
                                            <a
                                                href="mailto:support@serversundaram.local?subject=Password%20Reset%20Request"
                                                className={`font-bold ${theme.text} transition hover:opacity-80`}
                                            >
                                                Forgot password?
                                            </a>
                                            <p className="text-xs font-medium text-slate-500">
                                                Authorized staff only. Access is monitored per tenant protocol.
                                            </p>
                                        </div>
                                    </form>

                                    <div className="mt-6 border-t border-slate-200/80 pt-5">
                                        <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-800">
                                            <ArrowLeft size={14} />
                                            Back to portal
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default StaffLogin;
