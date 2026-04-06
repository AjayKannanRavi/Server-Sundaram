import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { User, Lock, ChefHat, Loader2, ArrowLeft, AlertCircle, Hotel } from 'lucide-react';
import { API_BASE_URL } from '../api/api';

const StaffLogin = ({ role }) => {
    const navigate = useNavigate();
    const { hotelId: urlHotelId } = useParams();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [hotelId, setHotelId] = useState(urlHotelId || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const storageKey = role === 'OWNER' ? 'owner_session' : role === 'ADMIN' ? 'admin_session' : 'kitchen_session';
    const dashboardPath = role === 'OWNER' ? `/${hotelId}/owner` : role === 'ADMIN' ? `/${hotelId}/admin` : `/${hotelId}/kitchen`;

    useEffect(() => {
        if (urlHotelId) setHotelId(urlHotelId);
    }, [urlHotelId]);

    useEffect(() => {
        const staff = localStorage.getItem(storageKey);
        if (staff) {
            const session = JSON.parse(staff);
            const today = new Date().toISOString().split('T')[0];
            if (session.date === today && session.hotelId.toString() === urlHotelId) {
                navigate(dashboardPath);
            } else if (session.hotelId.toString() === urlHotelId) {
                localStorage.removeItem(storageKey);
            }
        }
    }, [navigate, storageKey, dashboardPath, urlHotelId]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await axios.post(`${API_BASE_URL}/staff/login`, {
                username,
                password,
                hotelId: hotelId?.toString()
            });
            
            const staffData = response.data;

            // Role enforcement at login
            if (role && staffData.role !== role) {
                setError(`This account does not have ${role} access.`);
                setLoading(false);
                return;
            }

            const session = {
                ...staffData,
                hotelId: hotelId,
                date: new Date().toISOString().split('T')[0],
                loginTime: new Date().getTime()
            };
            
            localStorage.setItem(storageKey, JSON.stringify(session));
            
            // Redirect based on role
            if (staffData.role === 'OWNER') {
                navigate(`/${hotelId}/owner`);
            } else if (staffData.role === 'ADMIN') {
                navigate(`/${hotelId}/admin`);
            } else {
                navigate(`/${hotelId}/kitchen`);
            }
            
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid credentials. Please try again.');
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
                <h1 className="font-serif italic text-3xl text-amber-400">Vitteno <span className="text-white/50">SaaS</span></h1>
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Partner Portal Access</p>
            </div>

            {/* Login Card */}
            <div className="w-full max-w-md bg-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                <form onSubmit={handleLogin} className="space-y-8">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black text-gray-900 mb-1">{role} Login</h2>
                        <p className="text-gray-500 font-medium">Access your restaurant dashboard.</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-bold py-4 px-5 rounded-2xl flex items-center gap-3 animate-in zoom-in-95">
                            <AlertCircle size={18} /> {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black uppercase text-gray-400 ml-1">Hotel ID</label>
                            <div className="relative group overflow-hidden rounded-2xl">
                                <Hotel size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="Enter Hotel ID" 
                                    className={`w-full bg-gray-50 border-2 border-transparent rounded-2xl py-4 pl-12 pr-4 text-gray-900 placeholder:text-gray-300 focus:bg-white focus:border-amber-500 outline-none transition-all font-bold shadow-sm ${urlHotelId ? 'cursor-not-allowed opacity-75' : ''}`}
                                    value={hotelId}
                                    onChange={(e) => setHotelId(e.target.value)}
                                    readOnly={!!urlHotelId}
                                    required
                                />
                            </div>
                            {urlHotelId && <p className="text-[9px] font-bold text-gray-400 mt-1 ml-1 tracking-tight">LOCKED TO CURRENT DOMAIN TENANT</p>}
                            {!urlHotelId && <p className="text-[9px] font-bold text-amber-500 mt-1 ml-1 tracking-tight uppercase">Enter your unique Hotel Identity from registration</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black uppercase text-gray-400 ml-1">{role === 'OWNER' ? 'Partner Email' : 'Staff Username'}</label>
                            <div className="relative group">
                                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder={role === 'OWNER' ? "Enter partner email" : "Enter username"} 
                                    className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-4 pl-12 pr-4 text-gray-900 placeholder:text-gray-300 focus:bg-white focus:border-amber-500 outline-none transition-all font-bold shadow-sm"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black uppercase text-gray-400 ml-1">Password</label>
                            <div className="relative group">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                                <input 
                                    type="password" 
                                    placeholder="••••••••" 
                                    className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-4 pl-12 pr-4 text-gray-900 placeholder:text-gray-300 focus:bg-white focus:border-amber-500 outline-none transition-all font-bold shadow-sm"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-gray-900 hover:bg-black text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-2 text-lg active:scale-[0.98] disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : `Enter ${role} Dashboard`}
                        </button>
                    </div>
                </form>

                <div className="mt-8 pt-8 border-t border-gray-50 flex justify-between items-center text-xs text-gray-400 font-bold uppercase tracking-widest">
                    <button onClick={() => navigate('/')} className="flex items-center gap-2 hover:text-gray-600 transition cursor-pointer">
                        <ArrowLeft size={14} /> Back to Portal
                    </button>
                    <span>Vitteno Secure</span>
                </div>
            </div>

            <p className="mt-8 text-gray-600 text-[10px] font-bold uppercase tracking-[0.2em] text-center max-w-[300px] leading-relaxed opacity-50">
                Authorized staff only. Access is monitored per tenant protocols.
            </p>
        </div>
    );
};

export default StaffLogin;
