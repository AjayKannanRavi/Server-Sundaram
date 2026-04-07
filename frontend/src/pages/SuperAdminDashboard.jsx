import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Building2, Plus, Users, LayoutDashboard, Settings, Power, Star, Calendar, Trash2, Search, CheckCircle, XCircle } from 'lucide-react';
import { API_BASE_URL } from '../api/api';

const SuperAdminDashboard = () => {
    const [hotels, setHotels] = useState([]);
    const [stats, setStats] = useState({ totalHotels: 0, activeHotels: 0, totalOrders: 0, totalRevenue: 0, systemStatus: 'INITIALIZING' });
    const [settings, setSettings] = useState({ platformName: 'Vitteno', maintenanceMode: false, freePlanLimit: 10, premiumMonthlyPrice: 49.99 });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('tenants');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newHotel, setNewHotel] = useState({
        name: '',
        ownerName: '',
        ownerEmail: '',
        ownerPassword: '',
        contactNumber: '',
        address: '',
        gstNumber: '',
        adminUsername: '',
        adminPassword: '',
        kitchenUsername: '',
        kitchenPassword: '',
        planType: 'STARTER'
    });
    
    useEffect(() => {
        fetchInitialData();
        const interval = setInterval(fetchStats, 30000); // Live update every 30s
        return () => clearInterval(interval);
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        await Promise.all([fetchHotels(), fetchStats(), fetchSettings()]);
        setLoading(false);
    };

    const fetchStats = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/saas/stats`);
            setStats(res.data);
        } catch (err) {
            console.error('Error fetching stats', err);
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/saas/settings`);
            setSettings(res.data);
        } catch (err) {
            console.error('Error fetching settings', err);
        }
    };

    const fetchHotels = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/saas/hotels`);
            setHotels(res.data);
        } catch (err) {
            console.error('Error fetching hotels', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateHotel = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE_URL}/saas/hotels`, newHotel);
            setShowCreateModal(false);
            fetchHotels();
            setNewHotel({
                name: '',
                ownerName: '',
                ownerEmail: '',
                ownerPassword: '',
                contactNumber: '',
                address: '',
                gstNumber: '',
                planType: 'STARTER'
            });
        } catch (err) {
            console.error('Error creating hotel', err);
            alert('Failed to create hotel');
        }
    };

    const toggleStatus = async (id) => {
        try {
            await axios.put(`${API_BASE_URL}/saas/hotels/${id}/toggle-status`);
            fetchHotels();
        } catch (err) {
            console.error('Error toggling status', err);
        }
    };

    const deleteHotel = async (id) => {
        if (window.confirm('ARE YOU ABSOLUTELY SURE? This will permanently delete the tenant and their ENTIRE database!')) {
            try {
                await axios.delete(`${API_BASE_URL}/saas/hotels/${id}`);
                fetchHotels();
                fetchStats(); // Update platform stats
            } catch (err) {
                console.error('Error deleting hotel', err);
                alert('Deletion failed');
            }
        }
    };

    const saveSettings = async () => {
        try {
            await axios.put(`${API_BASE_URL}/saas/settings`, settings);
            alert('System Settings Updated Successfully');
            fetchSettings();
        } catch (err) {
            console.error('Error saving settings', err);
            alert('Failed to save settings');
        }
    };

    const upgradePlan = async (id, planType, months) => {
        try {
            await axios.put(`${API_BASE_URL}/saas/hotels/${id}/plan`, { planType, months });
            fetchHotels();
        } catch (err) {
            console.error('Error updating plan', err);
        }
    };

    if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-400 text-xl">Loading Platform Data...</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-72 bg-gray-900 text-white flex flex-col p-8 sticky top-0 h-screen shadow-2xl">
                <div className="flex items-center gap-3 mb-12">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                        <LayoutDashboard size={20} />
                    </div>
                    <h1 className="text-xl font-black tracking-tighter">SERVE<span className="text-indigo-400">SMART</span></h1>
                </div>

                <nav className="flex-1 space-y-2">
                    <button 
                        onClick={() => setActiveTab('tenants')}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${activeTab === 'tenants' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                    >
                        <Building2 size={20} /> Hotel Tenants
                    </button>
                    <button 
                        onClick={() => setActiveTab('users')}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                    >
                        <Users size={20} /> Platform Users
                    </button>
                    <button 
                        onClick={() => setActiveTab('settings')}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                    >
                        <Settings size={20} /> System Settings
                    </button>
                </nav>

                <div className="pt-8 border-t border-gray-800">
                    <button className="w-full flex items-center gap-4 p-4 rounded-2xl text-red-400 hover:bg-red-500/10 font-bold transition-all">
                        <Power size={20} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-10 max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h2 className="text-4xl font-black text-gray-900 tracking-tight">ServeSmart Control Panel</h2>
                        <p className="text-gray-500 font-bold mt-1 uppercase text-xs tracking-widest">{hotels.length} Active Platform Tenants</p>
                    </div>
                    <button 
                        onClick={() => setShowCreateModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black px-6 py-4 rounded-2xl flex items-center gap-2 shadow-xl shadow-indigo-100 transition-all cursor-pointer"
                    >
                        <Plus size={22} /> Provision New Tenant
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                        <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-1">Total Tenants</p>
                        <p className="text-3xl font-black text-gray-900 tracking-tighter">{stats.totalHotels}</p>
                        <p className="text-[10px] font-bold text-green-500 mt-1">{stats.activeHotels} Active</p>
                    </div>
                    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm border-l-4 border-l-indigo-600">
                        <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-1">Total Orders</p>
                        <p className="text-3xl font-black text-indigo-600 tracking-tighter">{stats.totalOrders}</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-1">Platform-wide</p>
                    </div>
                    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm border-l-4 border-l-amber-500">
                        <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-1">Total Revenue</p>
                        <p className="text-3xl font-black text-amber-600 tracking-tighter">₹{stats.totalRevenue?.toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-1">Gross Merchandise Volume</p>
                    </div>
                    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm border-l-4 border-l-emerald-500">
                        <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-1">System Status</p>
                        <p className="text-3xl font-black text-emerald-600 tracking-tighter">{stats.systemStatus}</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-1">All Systems Normal</p>
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'tenants' && (
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-left">
                                <th className="px-8 py-6 text-xs font-black uppercase text-gray-400 tracking-widest">Hotel Details</th>
                                <th className="px-8 py-6 text-xs font-black uppercase text-gray-400 tracking-widest text-center">Plan Status</th>
                                <th className="px-8 py-6 text-xs font-black uppercase text-gray-400 tracking-widest text-center">Activation</th>
                                <th className="px-8 py-6 text-xs font-black uppercase text-gray-400 tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {hotels.map(hotel => (
                                <tr key={hotel.id} className="hover:bg-gray-50/50 transition">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center font-black text-gray-400 text-lg">
                                                {hotel.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-black text-gray-900 text-lg">{hotel.name}</p>
                                                <p className="text-gray-500 font-bold text-xs tracking-tight">{hotel.ownerEmail} • ID: {hotel.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border-2 ${
                                                hotel.planType === 'PREMIUM' 
                                                    ? 'bg-indigo-50 text-indigo-600 border-indigo-200' 
                                                    : hotel.planType === 'CLASSIC'
                                                    ? 'bg-amber-50 text-amber-600 border-amber-200'
                                                    : 'bg-blue-50 text-blue-600 border-blue-200'
                                            }`}>
                                                {hotel.planType}
                                            </span>
                                            {hotel.planExpiry && (
                                                <p className="text-[10px] font-bold text-gray-400 mt-2">Ends {new Date(hotel.planExpiry).toLocaleDateString()}</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <button 
                                            onClick={() => toggleStatus(hotel.id)}
                                            className={`flex items-center gap-2 mx-auto px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                                hotel.isActive 
                                                    ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                                                    : 'text-red-600 bg-red-50 hover:bg-red-100'
                                            }`}
                                        >
                                            {hotel.isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                            {hotel.isActive ? 'Active' : 'Disabled'}
                                        </button>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex justify-end gap-2">
                                            <select 
                                                className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer"
                                                value={hotel.planType}
                                                onChange={(e) => upgradePlan(hotel.id, e.target.value, 12)}
                                            >
                                                <option value="STARTER">Starter Plan</option>
                                                <option value="CLASSIC">Classic Plan</option>
                                                <option value="PREMIUM">Premium Plan</option>
                                            </select>
                                            <button 
                                                onClick={() => deleteHotel(hotel.id)}
                                                className="bg-red-50 hover:bg-red-100 text-red-600 font-black p-2 rounded-xl transition cursor-pointer"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {activeTab === 'users' && (
                    <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100 text-left">
                                    <th className="px-8 py-6 text-xs font-black uppercase text-gray-400 tracking-widest">Platform User</th>
                                    <th className="px-8 py-6 text-xs font-black uppercase text-gray-400 tracking-widest">Associated Hotel</th>
                                    <th className="px-8 py-6 text-xs font-black uppercase text-gray-400 tracking-widest">Contact Info</th>
                                    <th className="px-8 py-6 text-xs font-black uppercase text-gray-400 tracking-widest text-right">Join Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {hotels.map(hotel => (
                                    <tr key={hotel.id} className="hover:bg-gray-50/50 transition">
                                        <td className="px-8 py-6">
                                            <p className="font-black text-gray-900">{hotel.ownerName}</p>
                                            <p className="text-xs text-gray-500 font-bold">{hotel.ownerEmail}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-[10px] font-black text-indigo-600">
                                                    {hotel.name.charAt(0)}
                                                </div>
                                                <span className="font-bold text-gray-700">{hotel.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-bold text-gray-600">{hotel.contactNumber}</p>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <p className="text-xs font-bold text-gray-400">Mar 2024</p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
                            <h4 className="text-2xl font-black text-gray-900 mb-8 tracking-tight">Platform Configuration</h4>
                            <div className="space-y-6">
                                <div className="group">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3 block">Branding Name</label>
                                    <input 
                                        value={settings.platformName}
                                        onChange={e => setSettings({...settings, platformName: e.target.value})}
                                        className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-4 px-6 font-bold text-gray-900 outline-none focus:bg-white focus:border-indigo-600 transition-all"
                                    />
                                </div>
                                <div className="group">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3 block">Premium Monthly Price (₹)</label>
                                    <input 
                                        type="number"
                                        value={settings.premiumMonthlyPrice}
                                        onChange={e => setSettings({...settings, premiumMonthlyPrice: parseFloat(e.target.value)})}
                                        className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-4 px-6 font-bold text-gray-900 outline-none focus:bg-white focus:border-indigo-600 transition-all"
                                    />
                                </div>
                                <div 
                                    onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})}
                                    className="flex items-center justify-between p-6 bg-red-50 rounded-3xl border border-red-100 cursor-pointer group"
                                >
                                    <div>
                                        <p className="font-black text-red-700">Maintenance Mode</p>
                                        <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-1">Disables all tenant terminals</p>
                                    </div>
                                    <div className={`w-14 h-8 rounded-full p-1 transition-all flex ${settings.maintenanceMode ? 'bg-red-600 justify-end' : 'bg-gray-200 justify-start'}`}>
                                        <div className="w-6 h-6 bg-white rounded-full shadow-sm" />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-8 pt-8 border-t border-gray-100 flex justify-end">
                                <button 
                                    onClick={saveSettings}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-10 py-4 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95"
                                >
                                    Save Platform Changes
                                </button>
                            </div>
                        </div>
                        
                        <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
                            <h4 className="text-2xl font-black text-gray-900 mb-8 tracking-tight">Infrastructure Health</h4>
                            <div className="space-y-4">
                                {[
                                    { label: 'Cloud Database', status: 'Healthy', color: 'text-emerald-500' },
                                    { label: 'Authentication Service', status: 'Healthy', color: 'text-emerald-500' },
                                    { label: 'Payment Gateway', status: 'Operational', color: 'text-emerald-500' },
                                    { label: 'Static Asset CDN', status: 'Congested', color: 'text-amber-500' }
                                ].map((service, i) => (
                                    <div key={i} className="flex justify-between items-center p-4 rounded-2xl bg-gray-50">
                                        <span className="font-bold text-gray-700">{service.label}</span>
                                        <span className={`text-xs font-black uppercase tracking-widest ${service.color}`}>{service.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Create Hotel Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[40px] p-10 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-3xl font-black text-gray-900">Onboard Hotel</h3>
                            <button onClick={() => setShowCreateModal(false)} className="bg-gray-100 p-3 rounded-2xl text-gray-400 hover:text-gray-900 transition cursor-pointer">
                                <Plus size={20} className="rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateHotel} className="grid grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Hotel Display Name</label>
                                <input 
                                    required
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 font-bold focus:border-blue-500 outline-none transition"
                                    placeholder="e.g. Royal Orchid Grand"
                                    value={newHotel.name}
                                    onChange={e => setNewHotel({...newHotel, name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Owner Name</label>
                                <input 
                                    required
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 font-bold focus:border-blue-500 outline-none transition"
                                    placeholder="Full Name"
                                    value={newHotel.ownerName}
                                    onChange={e => setNewHotel({...newHotel, ownerName: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Owner Contact</label>
                                <input 
                                    required
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 font-bold focus:border-blue-500 outline-none transition"
                                    placeholder="Phone/Mobile"
                                    value={newHotel.contactNumber}
                                    onChange={e => setNewHotel({...newHotel, contactNumber: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Login Email</label>
                                <input 
                                    required type="email"
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 font-bold focus:border-blue-500 outline-none transition"
                                    placeholder="owner@hotel.com"
                                    value={newHotel.ownerEmail}
                                    onChange={e => setNewHotel({...newHotel, ownerEmail: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Admin Login Username</label>
                                <input 
                                    required 
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 font-bold focus:border-indigo-600 outline-none transition"
                                    placeholder="admin_username"
                                    value={newHotel.adminUsername}
                                    onChange={e => setNewHotel({...newHotel, adminUsername: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Admin Login Password</label>
                                <input 
                                    required type="text"
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 font-bold focus:border-indigo-600 outline-none transition"
                                    placeholder="••••••••"
                                    value={newHotel.adminPassword}
                                    onChange={e => setNewHotel({...newHotel, adminPassword: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Kitchen Login Username</label>
                                <input 
                                    required 
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 font-bold focus:border-indigo-600 outline-none transition"
                                    placeholder="kitchen_username"
                                    value={newHotel.kitchenUsername}
                                    onChange={e => setNewHotel({...newHotel, kitchenUsername: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Kitchen Login Password</label>
                                <input 
                                    required type="text"
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 font-bold focus:border-indigo-600 outline-none transition"
                                    placeholder="••••••••"
                                    value={newHotel.kitchenPassword}
                                    onChange={e => setNewHotel({...newHotel, kitchenPassword: e.target.value})}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">GST Number (Optional)</label>
                                <input 
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 font-bold focus:border-blue-500 outline-none transition"
                                    placeholder="22AAAAA0000A1Z5"
                                    value={newHotel.gstNumber}
                                    onChange={e => setNewHotel({...newHotel, gstNumber: e.target.value})}
                                />
                            </div>
                            
                            <div className="col-span-2 mt-4 pt-6 border-t border-gray-50 flex gap-4">
                                <button 
                                    type="submit"
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-[24px] shadow-xl shadow-blue-100 transition-all cursor-pointer"
                                >
                                    Confirm Registration
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 bg-gray-900 hover:bg-black text-white font-black py-5 rounded-[24px] transition-all cursor-pointer"
                                >
                                    Discard
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminDashboard;
