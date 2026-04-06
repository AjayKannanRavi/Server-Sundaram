import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import { Phone, User, CheckCircle, ChevronRight, ArrowLeft, Loader2, ChefHat } from 'lucide-react';
import { API_BASE_URL } from '../api/api';

const CustomerLogin = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { hotelId: urlHotelId } = useParams();
    const queryParams = new URLSearchParams(location.search);
    const tableId = queryParams.get('tableId') || '1';
    const hotelId = urlHotelId;

    const [step, setStep] = useState(1); // 1: Info, 2: OTP
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [restaurantName, setRestaurantName] = useState("Loading...");

    useEffect(() => {
        // Fetch Restaurant details
        const fetchRestaurant = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/restaurant`, {
                    headers: { 'X-Hotel-Id': hotelId }
                });
                if (res.data && res.data.name) {
                    setRestaurantName(res.data.name);
                }
            } catch (err) {
                setRestaurantName("ServeSmart Restaurant");
            }
        };
        fetchRestaurant();

        // Check if already logged in
        const customer = localStorage.getItem('customer');
        if (customer) {
            const redirectUrl = `/${hotelId}/menu?tableId=${tableId}`;
            navigate(redirectUrl);
        }
    }, [navigate, tableId, hotelId]);

    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!name || !mobile) {
            setError('Please fill in all details');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await axios.post(`${API_BASE_URL}/customers/otp/send`, {
                name,
                mobileNumber: mobile
            }, {
                headers: {
                    'X-Hotel-Id': hotelId
                }
            });
            setStep(2);
        } catch (err) {
            setError('Failed to send OTP. Please try again.');
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
            const response = await axios.post(`${API_BASE_URL}/customers/otp/verify`, {
                mobileNumber: mobile,
                otp,
                tableId
            }, {
                headers: {
                    'X-Hotel-Id': hotelId
                }
            });
            
            const customerData = {
                ...response.data,
                hotelId: hotelId
            };
            
            localStorage.setItem('customer', JSON.stringify(customerData));
            const redirectUrl = `/${hotelId}/menu?tableId=${tableId}`;
            navigate(redirectUrl);
        } catch (err) {
            setError('Invalid OTP. Please check and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center p-4">
            {/* Logo Section */}
            <div className="flex flex-col items-center mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-amber-500/20 mb-4">
                    <ChefHat size={32} className="text-white" />
                </div>
                <h1 className="font-serif italic text-3xl text-amber-400">{restaurantName}</h1>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">Premium Dine-In Experience</p>
            </div>

            {/* Login Card */}
            <div className="w-full max-w-sm bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                {/* Decorative Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl -mr-16 -mt-16 rounded-full" />
                
                {step === 1 ? (
                    <form onSubmit={handleSendOtp} className="space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-white text-2xl font-serif italic mb-2">Welcome</h2>
                            <p className="text-gray-400 text-sm">Please login to access the menu at Table {tableId}</p>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs py-3 px-4 rounded-xl animate-in zoom-in-95">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="relative group">
                                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-amber-500 transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="Your Name" 
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all font-bold"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="relative group">
                                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-amber-500 transition-colors" />
                                <input 
                                    type="tel" 
                                    placeholder="Mobile Number" 
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all font-bold"
                                    value={mobile}
                                    onChange={(e) => setMobile(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-amber-500 hover:bg-amber-600 active:scale-95 disabled:opacity-50 text-gray-900 font-black py-4 rounded-2xl transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2"
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
                                className="flex items-center gap-1 text-gray-500 hover:text-amber-500 text-xs font-bold transition-colors mb-4"
                            >
                                <ArrowLeft size={14} /> Back
                            </button>
                            <h2 className="text-white text-2xl font-serif italic mb-2">Verify OTP</h2>
                            <p className="text-gray-400 text-sm">Enter the 6-digit code sent to <span className="text-amber-400">+{mobile}</span></p>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs py-3 px-4 rounded-xl animate-in zoom-in-95">
                                {error}
                            </div>
                        )}

                        <div className="relative group">
                            <CheckCircle size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-amber-500 transition-colors" />
                            <input 
                                type="text" 
                                maxLength="6"
                                placeholder="Enter 6-digit OTP" 
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 outline-none tracking-[0.5em] text-center text-xl font-black transition-all"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-amber-500 hover:bg-amber-600 active:scale-95 disabled:opacity-50 text-gray-900 font-black py-4 rounded-2xl transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <>Verify & Access Menu</>}
                        </button>

                        <p className="text-center text-gray-600 text-[10px] font-bold uppercase tracking-widest mt-4">
                            Didn't receive code? <button type="button" onClick={handleSendOtp} className="text-amber-500 hover:underline">Resend</button>
                        </p>
                    </form>
                )}
            </div>

            {/* Footer Tip */}
            <p className="mt-8 text-gray-600 text-[10px] font-bold uppercase tracking-[0.2em] text-center max-w-[200px] leading-relaxed">
                Tip: Check your server console for the mock OTP
            </p>
        </div>
    );
};

export default CustomerLogin;
