import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import { Phone, User, ChevronRight, ArrowLeft, Loader2, ChefHat } from 'lucide-react';
import { API_BASE_URL } from '../api/api';

const CustomerLogin = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { hotelId } = useParams();
    const queryParams = new URLSearchParams(location.search);
    const tableId = queryParams.get('tableId') || queryParams.get('tableid') || '';

    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [restaurantName, setRestaurantName] = useState('Loading...');

    const formatMobileForOtpDisplay = (value) => {
        const raw = String(value || '').trim();
        const digits = raw.replace(/\D/g, '');

        if (!digits) return '';
        if (digits.length === 10) return `+91 ${digits}`;
        if (digits.length === 12 && digits.startsWith('91')) return `+91 ${digits.slice(2)}`;
        if (raw.startsWith('+')) return raw;
        return `+${digits}`;
    };

    useEffect(() => {
        const fetchRestaurant = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/restaurant`, {
                    headers: { 'X-Hotel-Id': hotelId }
                });

                if (response.data && response.data.name) {
                    setRestaurantName(response.data.name);
                }
            } catch (err) {
                setRestaurantName('serversundaram Restaurant');
            }
        };

        fetchRestaurant();

        const customer = localStorage.getItem('customer');
        if (customer && tableId) {
            navigate(`/${hotelId}/menu?tableId=${tableId}`);
        }
    }, [hotelId, navigate, tableId]);

    const handleSendOtp = async (e) => {
        e.preventDefault();

        if (!name || !mobile) {
            setError('Please fill in your name and mobile number');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await axios.post(
                `${API_BASE_URL}/customers/otp/send`,
                {
                    name,
                    mobileNumber: mobile
                },
                {
                    headers: {
                        'X-Hotel-Id': hotelId
                    }
                }
            );

            setStep(2);
        } catch (err) {
            const backendError = err?.response?.data?.error;
            setError(backendError || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();

        if (!otp) {
            setError('Please enter OTP');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await axios.post(
                `${API_BASE_URL}/customers/otp/verify`,
                {
                    mobileNumber: mobile,
                    otp,
                    tableId
                },
                {
                    headers: {
                        'X-Hotel-Id': hotelId
                    }
                }
            );

            const customerData = {
                ...response.data,
                hotelId
            };

            localStorage.setItem('customer', JSON.stringify(customerData));
            navigate(`/${hotelId}/menu?tableId=${tableId}`);
        } catch (err) {
            setError('Invalid OTP. Please check and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-start overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95),transparent_26%),radial-gradient(circle_at_top_right,rgba(224,231,255,0.85),transparent_24%),linear-gradient(180deg,#dbeafe_0%,#e0e7ff_48%,#eff6ff_100%)] px-4 py-8 text-slate-900" style={{ paddingBottom: 'env(safe-area-inset-bottom, 24px)' }}>
            <div className="w-full max-w-sm mx-auto">
                <div className="mb-8 flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-500 to-violet-500 shadow-2xl shadow-blue-500/20">
                        <ChefHat size={32} className="text-white" />
                    </div>
                    <h1 className="font-serif italic text-3xl text-slate-950 text-center">{restaurantName}</h1>
                    <p className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-500 text-center">Premium Dine-In Experience</p>
                </div>

            <div className="relative w-full overflow-hidden rounded-[2.5rem] border border-white/70 bg-white/65 p-8 shadow-[0_30px_90px_rgba(96,130,202,0.14)] backdrop-blur-2xl">
                <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />

                {step === 1 ? (
                    <form onSubmit={handleSendOtp} className="space-y-6">
                        <div className="space-y-2">
                            <h2 className="mb-2 text-2xl font-serif italic text-slate-950">Welcome</h2>
                            <p className="text-sm text-slate-600">
                                Please login to access the menu{tableId ? ` for Table ${tableId}` : ''}.
                            </p>
                        </div>

                        {error && (
                            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600 animate-in zoom-in-95">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="relative group">
                                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Your Name"
                                    className="soft-input w-full rounded-2xl py-4 pl-12 pr-4 font-bold text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="relative group">
                                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                <input
                                    type="tel"
                                    placeholder="Mobile Number"
                                    className="soft-input w-full rounded-2xl py-4 pl-12 pr-4 font-bold text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                                    value={mobile}
                                    onChange={(e) => setMobile(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="soft-button-gradient flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-black text-white transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <>Send OTP <ChevronRight size={18} /></>}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-6">
                        <div className="space-y-2">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="mb-4 flex items-center gap-1 text-xs font-bold text-slate-500 transition-colors hover:text-blue-600"
                            >
                                <ArrowLeft size={14} /> Back
                            </button>
                            <h2 className="mb-2 text-2xl font-serif italic text-slate-950">Verify OTP</h2>
                            <p className="text-sm text-slate-600">
                                Enter the 6-digit code sent to <span className="text-blue-600">{formatMobileForOtpDisplay(mobile)}</span>
                                {tableId ? <> for Table <span className="text-blue-600">{tableId}</span></> : ''}
                            </p>
                        </div>

                        {error && (
                            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600 animate-in zoom-in-95">
                                {error}
                            </div>
                        )}

                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="Enter OTP"
                                className="soft-input w-full rounded-2xl py-4 pl-12 pr-4 text-center text-xl font-black tracking-[0.5em] text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="soft-button-gradient flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-black text-white transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <>Verify & Access Menu</>}
                        </button>

                        <p className="mt-4 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            Didn't receive code? <button type="button" onClick={handleSendOtp} className="text-blue-600 hover:underline">Resend</button>
                        </p>
                    </form>
                )}
            </div>

            <p className="mt-8 text-center text-[10px] font-bold uppercase tracking-[0.2em] leading-relaxed text-slate-500">
                Tip: Check your server console for the mock OTP
            </p>
            </div>
        </div>
    );
};

export default CustomerLogin;
