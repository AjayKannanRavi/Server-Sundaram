import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Users, LayoutDashboard, Settings, Power, Star, Calendar, Trash2, Search, CheckCircle, XCircle } from 'lucide-react';
import api from '../api/api';

// Master-scoped axios config — ensures no per-tenant Hibernate filter is activated
const MASTER_HEADERS = { headers: { 'X-Hotel-Id': 'master' } };

const SuperAdminDashboard = () => {
    const navigate = useNavigate();
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
        captainUsername: '',
        captainPassword: '',
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
            const res = await api.get('/saas/stats', MASTER_HEADERS);
            setStats(res.data);
        } catch (err) {
            console.error('Error fetching stats', err);
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await api.get('/saas/settings', MASTER_HEADERS);
            setSettings(res.data);
        } catch (err) {
            console.error('Error fetching settings', err);
        }
    };

    const fetchHotels = async () => {
        try {
            const res = await api.get('/saas/hotels', MASTER_HEADERS);
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
            const payload = {
                restaurant: {
                    name: newHotel.name,
                    ownerName: newHotel.ownerName,
                    ownerEmail: newHotel.ownerEmail,
                    ownerPassword: newHotel.ownerPassword,
                    contactNumber: newHotel.contactNumber,
                    address: newHotel.address,
                    gstNumber: newHotel.gstNumber,
                    planType: newHotel.planType
                },
                ownerEmail: newHotel.ownerEmail,
                adminUsername: newHotel.adminUsername,
                adminPassword: newHotel.adminPassword,
                kitchenUsername: newHotel.kitchenUsername,
                kitchenPassword: newHotel.kitchenPassword,
                captainUsername: newHotel.captainUsername,
                captainPassword: newHotel.captainPassword
            };

            const response = await api.post('/saas/hotels', payload, MASTER_HEADERS);
            const creds = response.data?.generatedCredentials || {};
            alert(
                `Hotel created successfully.\n\nHotel ID: ${response.data?.hotelId || ''}\nOwner: ${creds.ownerUsername || ''} / ${creds.ownerPassword || ''}\nAdmin: ${creds.managerUsername || ''} / ${creds.managerPassword || ''}\nKitchen: ${creds.kitchenUsername || ''} / ${creds.kitchenPassword || ''}\nCaptain: ${creds.captainUsername || ''} / ${creds.captainPassword || ''}`
            );
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
                adminUsername: '',
                adminPassword: '',
                kitchenUsername: '',
                kitchenPassword: '',
                captainUsername: '',
                captainPassword: '',
                planType: 'STARTER'
            });
        } catch (err) {
            console.error('Error creating hotel', err);
            alert(err.response?.data?.message || err.response?.data?.error || 'Failed to create hotel');
        }
    };

    const toggleStatus = async (id) => {
        try {
            await api.put(`/saas/hotels/${id}/toggle-status`, {}, MASTER_HEADERS);
            fetchHotels();
        } catch (err) {
            console.error('Error toggling status', err);
        }
    };

    const deleteHotel = async (id) => {
        if (window.confirm('ARE YOU ABSOLUTELY SURE? This will permanently delete the tenant and their ENTIRE database!')) {
            try {
                await api.delete(`/saas/hotels/${id}`, MASTER_HEADERS);
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
            await api.put('/saas/settings', settings, MASTER_HEADERS);
            alert('System Settings Updated Successfully');
            fetchSettings();
        } catch (err) {
            console.error('Error saving settings', err);
            alert('Failed to save settings');
        }
    };

    const upgradePlan = async (id, planType, months) => {
        try {
            await api.put(`/saas/hotels/${id}/plan`, { planType, months }, MASTER_HEADERS);
            fetchHotels();
        } catch (err) {
            console.error('Error updating plan', err);
        }
    };

    const handleLogout = () => {
        navigate('/');
    };

    if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-400 text-xl">Loading Platform Data...</div>;

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8faff 0%, #eef2ff 100%)', display: 'flex', fontFamily: "'Inter','Outfit',sans-serif", overflow: 'hidden' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
                * { box-sizing: border-box; }
                .reg-input { width: 100%; background: #f8fafc; border: 1.5px solid #e8ecf4; border-radius: 14px; padding: 14px 18px; font-size: 14px; font-weight: 600; color: #0f172a; outline: none; transition: all 0.2s; font-family: inherit; }
                .reg-input:focus { border-color: #6366f1; background: white; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
                .reg-label { display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.18em; color: #94a3b8; margin-bottom: 8px; }
            `}</style>
            
            {/* Sidebar */}
            <aside style={{ width: 280, background: 'linear-gradient(160deg, #0f172a 0%, #1e1b4b 60%, #0f172a 100%)', padding: '32px 24px', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'relative', overflow: 'hidden' }} className="hidden lg:flex">
                <div style={{ position: 'absolute', top: -100, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', filter: 'blur(80px)', pointerEvents: 'none' }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
                        <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <LayoutDashboard size={18} color="white" />
                        </div>
                        <div>
                            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.22em', color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>Platform Admin</p>
                            <p style={{ fontSize: 16, fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>Server Sundaram</p>
                        </div>
                    </div>

                    <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[{ id: 'tenants', icon: Building2, label: 'Hotel Tenants' }, { id: 'users', icon: Users, label: 'Platform Users' }, { id: 'settings', icon: Settings, label: 'System Settings' }].map(tab => (
                            <button 
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 14,
                                    background: activeTab === tab.id ? 'rgba(99,102,241,0.15)' : 'transparent',
                                    border: `1px solid ${activeTab === tab.id ? 'rgba(99,102,241,0.3)' : 'transparent'}`,
                                    color: activeTab === tab.id ? '#818cf8' : '#94a3b8',
                                    fontSize: 14, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s'
                                }}
                            >
                                <tab.icon size={18} /> {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 1 }}>
                    <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 14, background: 'transparent', border: 'none', color: '#f87171', fontSize: 14, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}>
                        <Power size={18} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, height: '100vh', overflowY: 'auto', padding: '40px' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, flexWrap: 'wrap', gap: 20 }}>
                        <div>
                            <h2 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 6 }}>serversundaram Control Panel</h2>
                            <p style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#6366f1' }}>{hotels.length} PLATFORM TENANTS (ALL VISIBLE)</p>
                        </div>
                        <button 
                            onClick={() => setShowCreateModal(true)}
                            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: 16, padding: '14px 24px', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', boxShadow: '0 8px 24px rgba(99,102,241,0.25)', transition: 'transform 0.2s' }}
                        >
                            <Plus size={18} /> Provision New Tenant
                        </button>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 40 }}>
                        {[
                            { label: 'Total Tenants', value: stats.totalHotels, sub: `${stats.activeHotels} Active`, color: '#6366f1', icon: Building2 },
                            { label: 'Total Orders', value: stats.totalOrders, sub: 'Platform-wide', color: '#3b82f6', icon: LayoutDashboard },
                            { label: 'Total Revenue', value: `Rs ${stats.totalRevenue?.toLocaleString()}`, sub: 'GMV', color: '#f59e0b', icon: Star },
                            { label: 'System Status', value: stats.systemStatus, sub: 'All Systems Normal', color: '#10b981', icon: CheckCircle }
                        ].map((s, i) => (
                            <div key={i} style={{ background: 'white', borderRadius: 24, padding: '24px', border: '1.5px solid #e8ecf4', boxShadow: '0 10px 40px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ width: 44, height: 44, borderRadius: 14, background: `${s.color}15`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                    <s.icon size={20} />
                                </div>
                                <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#94a3b8', marginBottom: 4 }}>{s.label}</p>
                                <p style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 4 }}>{s.value}</p>
                                <p style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.sub}</p>
                            </div>
                        ))}
                    </div>

                    {/* Content */}
                    {activeTab === 'tenants' && (
                        <div style={{ background: 'white', borderRadius: 32, padding: 32, border: '1px solid #e8ecf4', boxShadow: '0 10px 40px rgba(0,0,0,0.02)' }}>
                            <div style={{ marginBottom: 24, display: 'flex', gap: 10 }}>
                                <p style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b' }}>All Registered Hotels ({hotels.length})</p>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {hotels.map(hotel => (
                                    <div key={hotel.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', background: '#f8fafc', borderRadius: 20, border: `1.5px solid ${hotel.isActive ? '#e8ecf4' : '#fee2e2'}`, opacity: hotel.isActive ? 1 : 0.6 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                                            <div style={{ width: 48, height: 48, borderRadius: 14, background: hotel.isActive ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#cbd5e1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900 }}>
                                                {hotel.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    {hotel.name}
                                                    {!hotel.isActive && <span style={{ fontSize: 10, background: '#fef2f2', color: '#ef4444', padding: '2px 8px', borderRadius: 8, fontWeight: 800 }}>INACTIVE</span>}
                                                </p>
                                                <p style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>{hotel.ownerEmail} • ID: {hotel.id}</p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                            <span style={{ fontSize: 11, fontWeight: 800, padding: '6px 12px', borderRadius: 10, textTransform: 'uppercase', letterSpacing: '0.1em', background: hotel.planType === 'PREMIUM' ? '#eef2ff' : '#fef3c7', color: hotel.planType === 'PREMIUM' ? '#4f46e5' : '#d97706' }}>
                                                {hotel.planType}
                                            </span>
                                            
                                            <button 
                                                onClick={() => toggleStatus(hotel.id)}
                                                style={{ background: hotel.isActive ? '#ecfdf5' : '#fef2f2', border: 'none', color: hotel.isActive ? '#10b981' : '#ef4444', padding: '8px 16px', borderRadius: 12, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                                            >
                                                {hotel.isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                                {hotel.isActive ? 'Active' : 'Disabled'}
                                            </button>

                                            <select 
                                                style={{ background: 'white', border: '1px solid #e2e8f0', padding: '8px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, color: '#334155', cursor: 'pointer', outline: 'none' }}
                                                value={hotel.planType}
                                                onChange={(e) => upgradePlan(hotel.id, e.target.value, 12)}
                                            >
                                                <option value="STARTER">Starter</option>
                                                <option value="CLASSIC">Classic</option>
                                                <option value="PREMIUM">Premium</option>
                                            </select>

                                            <button 
                                                onClick={() => deleteHotel(hotel.id)}
                                                style={{ background: 'white', border: '1px solid #fee2e2', color: '#ef4444', padding: 8, borderRadius: 10, cursor: 'pointer' }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {hotels.length === 0 && (
                                    <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 14, fontWeight: 600, padding: 40 }}>No tenants found.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div style={{ background: 'white', borderRadius: 32, padding: 32, border: '1px solid #e8ecf4', boxShadow: '0 10px 40px rgba(0,0,0,0.02)' }}>
                            <div style={{ marginBottom: 24, display: 'flex', gap: 10 }}>
                                <p style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b' }}>Platform Owners</p>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                                {hotels.map(hotel => (
                                    <div key={hotel.id} style={{ background: '#f8fafc', padding: 20, borderRadius: 20, border: '1.5px solid #e8ecf4' }}>
                                        <p style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{hotel.ownerName}</p>
                                        <p style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 12 }}>{hotel.ownerEmail}</p>
                                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
                                            <p style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Hotel: <span style={{ color: '#334155' }}>{hotel.name}</span></p>
                                            <p style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Contact: <span style={{ color: '#334155' }}>{hotel.contactNumber}</span></p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                            <div style={{ background: 'white', borderRadius: 32, padding: 32, border: '1px solid #e8ecf4', boxShadow: '0 10px 40px rgba(0,0,0,0.02)' }}>
                                <h4 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 24 }}>Platform Configuration</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    <div>
                                        <label className="reg-label">Branding Name</label>
                                        <input className="reg-input" value={settings.platformName} onChange={e => setSettings({...settings, platformName: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="reg-label">Premium Monthly Price (Rs)</label>
                                        <input type="number" className="reg-input" value={settings.premiumMonthlyPrice} onChange={e => setSettings({...settings, premiumMonthlyPrice: parseFloat(e.target.value)})} />
                                    </div>
                                    <div 
                                        onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})}
                                        style={{ background: '#fef2f2', border: '1.5px solid #fee2e2', padding: 20, borderRadius: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                                    >
                                        <div>
                                            <p style={{ fontSize: 15, fontWeight: 900, color: '#ef4444' }}>Maintenance Mode</p>
                                            <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#f87171' }}>Disables all tenant terminals</p>
                                        </div>
                                        <div style={{ width: 44, height: 24, borderRadius: 12, background: settings.maintenanceMode ? '#ef4444' : '#e2e8f0', position: 'relative', transition: 'all 0.2s' }}>
                                            <div style={{ width: 20, height: 20, background: 'white', borderRadius: 10, position: 'absolute', top: 2, left: settings.maintenanceMode ? 22 : 2, transition: 'all 0.2s' }} />
                                        </div>
                                    </div>
                                </div>
                                <button onClick={saveSettings} style={{ width: '100%', background: 'linear-gradient(135deg, #0f172a, #334155)', color: 'white', border: 'none', borderRadius: 16, padding: '16px', fontSize: 14, fontWeight: 800, marginTop: 24, cursor: 'pointer', boxShadow: '0 8px 24px rgba(15,23,42,0.25)' }}>
                                    Save Platform Changes
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Create Hotel Modal */}
            {showCreateModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div style={{ background: 'white', width: '100%', maxWidth: 700, borderRadius: 32, padding: 40, maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                            <h3 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>Provision New Tenant</h3>
                            <button onClick={() => setShowCreateModal(false)} style={{ background: '#f1f5f9', border: 'none', width: 36, height: 36, borderRadius: 18, cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <XCircle size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateHotel} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label className="reg-label">Hotel Display Name</label>
                                <input required className="reg-input" value={newHotel.name} onChange={e => setNewHotel({...newHotel, name: e.target.value})} placeholder="e.g. Royal Orchid Grand" />
                            </div>
                            <div>
                                <label className="reg-label">Owner Name</label>
                                <input required className="reg-input" value={newHotel.ownerName} onChange={e => setNewHotel({...newHotel, ownerName: e.target.value})} placeholder="Full Name" />
                            </div>
                            <div>
                                <label className="reg-label">Owner Contact</label>
                                <input required className="reg-input" value={newHotel.contactNumber} onChange={e => setNewHotel({...newHotel, contactNumber: e.target.value})} placeholder="Phone" />
                            </div>
                            <div>
                                <label className="reg-label">Owner Email</label>
                                <input type="email" required className="reg-input" value={newHotel.ownerEmail} onChange={e => setNewHotel({...newHotel, ownerEmail: e.target.value})} placeholder="owner@hotel.com" />
                            </div>
                            <div>
                                <label className="reg-label">Owner Password</label>
                                <input required className="reg-input" value={newHotel.ownerPassword} onChange={e => setNewHotel({...newHotel, ownerPassword: e.target.value})} placeholder="Password" />
                            </div>

                            <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #e2e8f0', paddingTop: 20, marginTop: 10 }}>
                                <p style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', marginBottom: 16 }}>Staff Credentials</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    <div>
                                        <label className="reg-label">Admin Username</label>
                                        <input required className="reg-input" value={newHotel.adminUsername} onChange={e => setNewHotel({...newHotel, adminUsername: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="reg-label">Admin Password</label>
                                        <input required className="reg-input" value={newHotel.adminPassword} onChange={e => setNewHotel({...newHotel, adminPassword: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="reg-label">Kitchen Username</label>
                                        <input required className="reg-input" value={newHotel.kitchenUsername} onChange={e => setNewHotel({...newHotel, kitchenUsername: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="reg-label">Kitchen Password</label>
                                        <input required className="reg-input" value={newHotel.kitchenPassword} onChange={e => setNewHotel({...newHotel, kitchenPassword: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="reg-label">Captain Username</label>
                                        <input required className="reg-input" value={newHotel.captainUsername} onChange={e => setNewHotel({...newHotel, captainUsername: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="reg-label">Captain Password</label>
                                        <input required className="reg-input" value={newHotel.captainPassword} onChange={e => setNewHotel({...newHotel, captainPassword: e.target.value})} />
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 16, marginTop: 20 }}>
                                <button type="submit" style={{ flex: 1, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: 16, padding: '16px', fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 24px rgba(99,102,241,0.25)' }}>
                                    Confirm Registration
                                </button>
                                <button type="button" onClick={() => setShowCreateModal(false)} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 16, padding: '16px', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
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
