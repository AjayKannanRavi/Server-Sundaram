import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../api/api';
import { 
  TrendingUp, ShoppingBag, Users, 
  ShieldCheck, Layout, ChevronRight, 
  AlertCircle, Loader2, ArrowLeft,
  Key, LogIn, ExternalLink, Activity,
  Edit3, Copy, CheckCircle2, X, Settings, User
} from 'lucide-react';

const OwnerDashboard = () => {
    const { hotelId } = useParams();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [copyStatus, setCopyStatus] = useState('');
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'settings'
    
    // Edit Modal State (for staff)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [updateLoading, setUpdateLoading] = useState(false);

    // Profile State (for owner self-update)
    const [profileEmail, setProfileEmail] = useState('');
    const [profilePass, setProfilePass] = useState('');

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(interval);
    }, [hotelId]);

    const fetchDashboardData = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/saas/hotel-stats/${hotelId}`, {
                headers: { 'X-Hotel-Id': hotelId }
            });
            setStats(response.data);
            const owner = response.data.staffCredentials.find(s => s.role === 'OWNER');
            if (owner) setProfileEmail(owner.username);
            setError('');
        } catch (err) {
            console.error('Error fetching owner stats', err);
            setError('Failed to load dashboard data.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (text, label) => {
        navigator.clipboard.writeText(text);
        setCopyStatus(label);
        setTimeout(() => setCopyStatus(''), 2000);
    };

    const openEditModal = (staff) => {
        setEditingStaff(staff);
        setNewUsername(staff.username);
        setNewPassword('');
        setIsEditModalOpen(true);
    };

    const handleUpdateStaff = async (e) => {
        e.preventDefault();
        setUpdateLoading(true);
        try {
            const targetRole = editingStaff ? editingStaff.role : 'OWNER';
            const payload = editingStaff 
                ? { username: newUsername, password: newPassword }
                : { username: profileEmail, password: profilePass };

            await axios.put(`${API_BASE_URL}/staff/update-by-role/${targetRole}`, payload, {
                headers: { 'X-Hotel-Id': hotelId }
            });
            await fetchDashboardData();
            setIsEditModalOpen(false);
            if (!editingStaff) {
                alert('Your partner profile has been updated successfully.');
                setProfilePass('');
            }
        } catch (err) {
            alert('Failed to update credentials. Please try again.');
        } finally {
            setUpdateLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
                <p className="text-gray-500 font-bold animate-pulse">Synchronizing Cloud Data...</p>
            </div>
        );
    }

    const portalLinks = [
        { name: 'Admin Manager', path: `/${hotelId}/admin/login`, icon: <ShieldCheck />, color: 'bg-indigo-600', desc: 'Menu & Operational dashboard' },
        { name: 'Kitchen Terminal', path: `/${hotelId}/kitchen/login`, icon: <Activity />, color: 'bg-emerald-600', desc: 'Order fulfillment display' },
        { name: 'Digital Menu', path: `/${hotelId}/menu`, icon: <Users />, color: 'bg-amber-500', desc: 'Public customer-facing menu' }
    ];

    return (
        <div className="min-h-screen bg-[#FDFDFD] text-gray-900 font-sans pb-20">
            {/* Top Bar */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-xl transition">
                            <ArrowLeft size={20} className="text-gray-400" />
                        </button>
                        <div>
                            <h1 className="text-xl font-black tracking-tight">{stats?.hotelName}</h1>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Partner Portal · {stats?.planType}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex bg-gray-100 p-1 rounded-xl">
                            <button 
                                onClick={() => setActiveTab('overview')}
                                className={`px-4 py-2 rounded-lg text-xs font-black transition ${activeTab === 'overview' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}
                            >
                                OVERVIEW
                            </button>
                            <button 
                                onClick={() => setActiveTab('settings')}
                                className={`px-4 py-2 rounded-lg text-xs font-black transition ${activeTab === 'settings' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}
                            >
                                SETTINGS
                            </button>
                        </div>
                        <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white font-black text-sm shadow-lg shadow-amber-200">
                            {stats?.hotelName?.charAt(0)}
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-8 pt-12">
                {activeTab === 'overview' ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* Hero Overview */}
                        <div className="mb-12 flex justify-between items-end">
                            <div>
                                <h2 className="text-4xl font-black tracking-tight mb-2">Portfolio Overview</h2>
                                <p className="text-gray-500 font-medium">Strategic metrics for your hotel instance.</p>
                            </div>
                            <div className="hidden md:block text-right">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Last Updated</p>
                                <p className="text-sm font-bold text-gray-400">Just now</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left View: Metrics & Hub */}
                            <div className="lg:col-span-2 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm group hover:shadow-xl transition-all duration-500">
                                        <TrendingUp className="text-amber-500 mb-6" size={32} />
                                        <p className="text-[11px] font-black uppercase text-gray-400 tracking-widest mb-1">Today's Revenue</p>
                                        <p className="text-4xl font-black tracking-tighter">₹{stats?.todayRevenue?.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm group hover:shadow-xl transition-all duration-500">
                                        <ShoppingBag className="text-indigo-600 mb-6" size={32} />
                                        <p className="text-[11px] font-black uppercase text-gray-400 tracking-widest mb-1">Today's Orders</p>
                                        <p className="text-4xl font-black tracking-tighter">{stats?.todayOrders}</p>
                                    </div>
                                </div>

                                {/* Portal Links Hub */}
                                <div className="bg-white p-10 rounded-[4rem] border border-gray-100 shadow-sm relative overflow-hidden">
                                     <div className="mb-10">
                                        <h3 className="text-2xl font-black tracking-tight">Operational Hub</h3>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Links for your maintenance and staff teams</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {portalLinks.map((link, idx) => (
                                            <div key={idx} className="bg-gray-50 p-6 rounded-[2.5rem] border border-transparent hover:border-gray-200 transition-all group">
                                                <div className={`w-10 h-10 ${link.color} text-white rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-gray-200`}>
                                                    {link.icon}
                                                </div>
                                                <h4 className="text-sm font-black text-gray-900 mb-1">{link.name}</h4>
                                                <p className="text-[10px] text-gray-400 font-bold mb-4 leading-tight">{link.desc}</p>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => window.open(link.path, '_blank')}
                                                        className="flex-1 bg-white border border-gray-200 text-[10px] font-black p-3 rounded-xl hover:bg-gray-900 hover:text-white transition"
                                                    >
                                                        OPEN
                                                    </button>
                                                    <button 
                                                        onClick={() => handleCopy(`${window.location.origin}${link.path}`, link.name)}
                                                        className="p-3 bg-white border border-gray-200 rounded-xl hover:border-gray-900 transition relative"
                                                    >
                                                        {copyStatus === link.name ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} />}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right View: Staff Keys */}
                            <div className="bg-gray-900 text-white p-10 rounded-[4rem] shadow-2xl relative overflow-hidden flex flex-col">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                                
                                <div className="flex items-center justify-between mb-10 relative z-10">
                                    <div>
                                        <h3 className="text-2xl font-black tracking-tight">Staff Keys</h3>
                                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Access for maintenance teams</p>
                                    </div>
                                    <ShieldCheck className="text-amber-500" size={28} />
                                </div>

                                <div className="space-y-4 flex-1">
                                    {stats?.staffCredentials?.filter(s => s.role !== 'OWNER').map((staff, i) => (
                                        <div key={i} className="p-6 bg-white/5 border border-white/10 rounded-[2.2rem] group hover:bg-white/10 transition-all">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className={`px-2 py-1 rounded-md font-black text-[9px] ${staff.role === 'ADMIN' ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'}`}>
                                                    {staff.role} PANEL
                                                </div>
                                                <button 
                                                    onClick={() => openEditModal(staff)}
                                                    className="p-2 hover:bg-white/10 rounded-lg transition"
                                                >
                                                    <Edit3 size={14} className="text-amber-500" />
                                                </button>
                                            </div>
                                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 leading-none">VITTENO {staff.role} KEY</p>
                                            <p className="text-lg font-bold tracking-tight truncate">{staff.username}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 p-6 bg-white/5 rounded-3xl border border-white/10">
                                    <p className="text-[10px] font-bold text-gray-400">
                                        Sharing these keys grants operational control. Use the <span className="text-amber-500">Settings</span> tab to manage your own profile.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Settings View (Self Management) */
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-2xl">
                        <div className="mb-12">
                            <h2 className="text-4xl font-black tracking-tight mb-2">Partner Settings</h2>
                            <p className="text-gray-500 font-medium">Manage your strategic account and security preferences.</p>
                        </div>

                        <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-10">
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-xl tracking-tight">Partner Identity</h4>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">Credentials for Strategic Access</p>
                                    </div>
                                </div>

                                <form onSubmit={handleUpdateStaff} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black uppercase text-gray-400 ml-1 tracking-widest">Login Email</label>
                                        <input 
                                            type="email" 
                                            value={profileEmail}
                                            onChange={(e) => setProfileEmail(e.target.value)}
                                            className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-4 px-6 text-gray-900 font-bold focus:bg-white focus:border-amber-500 outline-none transition"
                                            placeholder="partner@vitteno.com"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black uppercase text-gray-400 ml-1 tracking-widest">Update Security Password</label>
                                        <input 
                                            type="password" 
                                            value={profilePass}
                                            onChange={(e) => setProfilePass(e.target.value)}
                                            className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-4 px-6 text-gray-900 font-bold focus:bg-white focus:border-amber-500 outline-none transition"
                                            placeholder="Enter new pass (leave blank to keep current)"
                                        />
                                        <p className="text-[10px] font-bold text-gray-400 ml-1 italic leading-tight mt-2">
                                            * Changing your email or password will take effect on next login. Security keys are encrypted.
                                        </p>
                                    </div>

                                    <div className="pt-4">
                                        <button 
                                            type="submit"
                                            disabled={updateLoading}
                                            className="bg-gray-900 text-white px-10 py-5 rounded-2xl font-black hover:bg-black shadow-xl shadow-gray-200 transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50"
                                        >
                                            {updateLoading ? <Loader2 className="animate-spin" /> : 'Save Profile Updates'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Edit Modal (For staff) */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
                        <button 
                            onClick={() => setIsEditModalOpen(false)}
                            className="absolute top-8 right-8 p-2 hover:bg-gray-100 rounded-xl transition"
                        >
                            <X size={20} className="text-gray-400" />
                        </button>

                        <div className="mb-8">
                            <h3 className="text-2xl font-black tracking-tight">Edit Operational {editingStaff?.role}</h3>
                            <p className="text-sm font-medium text-gray-500">Maintain maintenance staff access credentials.</p>
                        </div>

                        <form onSubmit={handleUpdateStaff} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase text-gray-400 ml-1 tracking-widest">Username</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-4 px-6 text-gray-900 font-bold focus:bg-white focus:border-amber-500 outline-none transition"
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase text-gray-400 ml-1 tracking-widest">New Password</label>
                                <input 
                                    type="password" 
                                    placeholder="Leave blank to keep current"
                                    className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-4 px-6 text-gray-900 font-bold focus:bg-white focus:border-amber-500 outline-none transition"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>

                            <div className="pt-4">
                                <button 
                                    type="submit"
                                    disabled={updateLoading}
                                    className="w-full bg-gray-900 text-white font-black py-5 rounded-2xl shadow-xl shadow-gray-200 hover:bg-black active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {updateLoading ? <Loader2 className="animate-spin" /> : 'Confirm Operational Update'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerDashboard;
