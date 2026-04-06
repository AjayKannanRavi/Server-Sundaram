import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { Building2, User, Mail, Lock, Phone, MapPin, CheckCircle, ArrowRight, Share2, ExternalLink, Zap, Star, ShieldCheck } from 'lucide-react';
import { API_BASE_URL } from '../api/api';

const HotelRegistration = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialPlan = queryParams.get('plan') || 'STARTER';

    const [step, setStep] = useState(1);
    const [regHotelId, setRegHotelId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        ownerName: '',
        ownerEmail: '',
        ownerPassword: '',
        contactNumber: '',
        address: '',
        gstNumber: '',
        planType: initialPlan,
        adminUsername: '',
        adminPassword: '',
        kitchenUsername: '',
        kitchenPassword: ''
    });

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        try {
            // Input Validation
            if (!formData.name || !formData.ownerName || !formData.ownerEmail || !formData.ownerPassword || !formData.adminUsername || !formData.adminPassword || !formData.kitchenUsername || !formData.kitchenPassword) {
                alert('Please fill in all required fields including owner, admin, and kitchen credentials.');
                return;
            }

            if (!/@gmail\.com$/i.test(formData.ownerEmail.trim())) {
                alert('Owner admin email must be a valid Gmail address.');
                return;
            }

            const payload = {
                restaurant: {
                    name: formData.name,
                    ownerName: formData.ownerName,
                    ownerEmail: formData.ownerEmail,
                    ownerPassword: formData.ownerPassword,
                    contactNumber: formData.contactNumber,
                    address: formData.address,
                    gstNumber: formData.gstNumber,
                    planType: formData.planType
                },
                ownerEmail: formData.ownerEmail,
                adminUsername: formData.adminUsername,
                adminPassword: formData.adminPassword,
                kitchenUsername: formData.kitchenUsername,
                kitchenPassword: formData.kitchenPassword
            };
            const response = await axios.post(`${API_BASE_URL}/saas/hotels`, payload);
            setRegHotelId(response.data.hotelId);
            setStep(4); // Success step
        } catch (err) {
            console.error('Registration Error:', err.response?.data || err.message);
            const errorMessage = err.response?.data?.message || 'Registration failed. This could be due to a duplicate email or missing information. Please check your details and try again.';
            alert(errorMessage);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Link copied to clipboard!');
    };

    const baseUrl = window.location.origin;

    return (
        <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-4 font-sans selection:bg-amber-500/30">
            <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-12 bg-white rounded-[48px] shadow-2xl overflow-hidden border border-white/5 relative">
                
                {/* Immersive Sidebar */}
                <div className="md:col-span-5 bg-[#0D0D0D] p-12 text-white relative flex flex-col justify-between overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-amber-500/20 via-transparent to-transparent"></div>
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-amber-500/10 blur-[100px] rounded-full"></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-16">
                            <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/40">
                                <Building2 size={24} className="text-white" />
                            </div>
                            <span className="text-2xl font-black tracking-tighter">Vitteno <span className="text-white/40 italic font-serif">SaaS</span></span>
                        </div>
                        
                        <h2 className="text-5xl font-black leading-[1.1] mb-8">Empower your restaurant with Vitteno.</h2>
                        <p className="text-gray-400 font-medium text-base leading-relaxed mb-12 max-w-xs">
                            Join the elite ecosystem of digital-first hospitality partners.
                        </p>
                        
                        <div className="space-y-8">
                            {[
                                { title: 'Multi-Tenant Isolation', desc: 'Secure, private data environment for your hotel.' },
                                { title: 'Vitteno Control Panel', desc: 'Manage your entire business from one place.' },
                                { title: 'Seamless Onboarding', desc: 'Go live in less than 60 seconds.' }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-5 group">
                                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-amber-500 flex-shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                                        <CheckCircle size={16} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-white/90">{item.title}</p>
                                        <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="relative z-10 pt-12">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">Built by Vitteno Technologies</p>
                    </div>
                </div>

                {/* Main Form Area */}
                <div className="md:col-span-7 p-12 lg:p-16 bg-white overflow-y-auto max-h-[90vh]">
                    {step === 1 && (
                        <div className="animate-in fade-in slide-in-from-right duration-700">
                            <div className="mb-12">
                                <span className="text-amber-600 font-black text-[10px] uppercase tracking-widest bg-amber-50 px-3 py-1.5 rounded-full">Step 01/03</span>
                                <h3 className="text-4xl font-black text-gray-900 mt-4 mb-2">The Basics.</h3>
                                <p className="text-gray-500 font-bold text-sm italic serif">Tell us about your culinary empire.</p>
                            </div>
                            
                            <form className="space-y-8">
                                <div className="group">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3 block ml-1 group-focus-within:text-amber-500 transition-colors">Restaurant Identity</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-amber-500 transition-colors" size={20} />
                                        <input 
                                            value={formData.name}
                                            onChange={e => setFormData({...formData, name: e.target.value})}
                                            className="w-full bg-gray-50 border-2 border-transparent rounded-[2rem] py-5 pl-16 pr-8 font-bold text-gray-900 focus:bg-white focus:border-amber-500 outline-none transition-all shadow-sm"
                                            placeholder="e.g. The Grand Pavilion"
                                        />
                                    </div>
                                </div>

                                <div className="group">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3 block ml-1 group-focus-within:text-amber-500 transition-colors">Physical Address</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-6 top-6 text-gray-300 group-focus-within:text-amber-500 transition-colors" size={20} />
                                        <textarea 
                                            value={formData.address}
                                            onChange={e => setFormData({...formData, address: e.target.value})}
                                            className="w-full bg-gray-50 border-2 border-transparent rounded-[2rem] py-6 pl-16 pr-8 font-bold text-gray-900 focus:bg-white focus:border-amber-500 outline-none transition-all h-36 resize-none shadow-sm"
                                            placeholder="Downtown Financial District, Floor 4..."
                                        />
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button 
                                        type="button"
                                        onClick={() => setStep(2)}
                                        className="w-full bg-gray-900 hover:bg-black text-white py-6 rounded-[2rem] font-black flex items-center justify-center gap-3 transition-all shadow-2xl shadow-gray-200 active:scale-95 group"
                                    >
                                        Next Component <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-right duration-700">
                             <button onClick={() => setStep(1)} className="text-gray-400 font-black text-[10px] uppercase tracking-widest mb-8 hover:text-amber-600 transition flex items-center gap-2">
                                <ArrowRight size={14} className="rotate-180" /> Back to Identity
                             </button>
                             <div className="mb-12">
                                <span className="text-amber-600 font-black text-[10px] uppercase tracking-widest bg-amber-50 px-3 py-1.5 rounded-full">Step 02/03</span>
                                <h3 className="text-4xl font-black text-gray-900 mt-4 mb-2">Master Admin.</h3>
                                <p className="text-gray-500 font-bold text-sm italic serif">Define your administrative authority.</p>
                            </div>
                            
                            <form className="space-y-6" autoComplete="off">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="group">
                                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3 block ml-1 group-focus-within:text-amber-500 transition-colors">Owner Name</label>
                                        <input 
                                            autoComplete="off"
                                            value={formData.ownerName}
                                            onChange={e => setFormData({...formData, ownerName: e.target.value})}
                                            className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-5 px-6 font-bold text-gray-900 focus:bg-white focus:border-amber-500 outline-none transition-all shadow-sm"
                                            placeholder="Enter owner full name"
                                        />
                                    </div>
                                    <div className="group">
                                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3 block ml-1 group-focus-within:text-amber-500 transition-colors">Master Phone</label>
                                        <input 
                                            autoComplete="tel"
                                            value={formData.contactNumber}
                                            onChange={e => setFormData({...formData, contactNumber: e.target.value})}
                                            className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-5 px-6 font-bold text-gray-900 focus:bg-white focus:border-amber-500 outline-none transition-all shadow-sm"
                                            placeholder="10-digit mobile number"
                                        />
                                    </div>
                                </div>

                                <div className="group">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3 block ml-1 group-focus-within:text-amber-500 transition-colors">Owner Admin Gmail</label>
                                    <input 
                                        type="email"
                                        autoComplete="email"
                                        value={formData.ownerEmail}
                                        onChange={e => setFormData({...formData, ownerEmail: e.target.value})}
                                        className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-5 px-6 font-bold text-gray-900 focus:bg-white focus:border-amber-500 outline-none transition-all shadow-sm"
                                        placeholder="your.email@example.com"
                                    />
                                </div>

                                <div className="group">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3 block ml-1 group-focus-within:text-amber-500 transition-colors">Secure Key</label>
                                    <div className="relative">
                                        <Lock className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                        <input 
                                            type="password"
                                            autoComplete="new-password"
                                            value={formData.ownerPassword}
                                            onChange={e => setFormData({...formData, ownerPassword: e.target.value})}
                                            className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-5 px-6 font-bold text-gray-900 focus:bg-white focus:border-amber-500 outline-none transition-all shadow-sm"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <button 
                                        type="button"
                                        onClick={() => setStep(3)}
                                        className="w-full bg-gray-900 text-white py-6 rounded-[2rem] font-black flex items-center justify-center gap-3 hover:bg-black transition-all shadow-2xl shadow-gray-100 active:scale-95"
                                    >
                                        Configure Credentials <ArrowRight size={22} />
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="animate-in fade-in slide-in-from-right duration-700">
                             <button onClick={() => setStep(2)} className="text-gray-400 font-black text-[10px] uppercase tracking-widest mb-8 hover:text-amber-600 transition flex items-center gap-2">
                                <ArrowRight size={14} className="rotate-180" /> Back to Admin
                             </button>
                             <div className="mb-12">
                                <span className="text-amber-600 font-black text-[10px] uppercase tracking-widest bg-amber-50 px-3 py-1.5 rounded-full">Step 03/03</span>
                                <h3 className="text-4xl font-black text-gray-900 mt-4 mb-2">Subscription & Access.</h3>
                                <p className="text-gray-500 font-bold text-sm italic serif">Choose your plan and set functional access.</p>
                            </div>

                            <div className="mb-10 space-y-4">
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3 block ml-1">Selected Plan</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {[
                                        { id: 'STARTER', label: 'Starter', price: '₹1,099', icon: Zap },
                                        { id: 'CLASSIC', label: 'Classic', price: '₹1,499', icon: Zap },
                                        { id: 'PREMIUM', label: 'Premium', price: '₹2,499', icon: Star },
                                    ].map((p) => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, planType: p.id })}
                                            className={`p-5 rounded-3xl border-2 transition-all text-left relative overflow-hidden group ${
                                                formData.planType === p.id 
                                                ? 'border-amber-500 bg-amber-50 shadow-lg shadow-amber-500/10' 
                                                : 'border-gray-100 hover:border-gray-200 bg-white'
                                            }`}
                                        >
                                            <div className="relative z-10">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${
                                                    formData.planType === p.id ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-400'
                                                }`}>
                                                    <p.icon size={16} />
                                                </div>
                                                <p className={`font-black text-xs uppercase tracking-tight ${formData.planType === p.id ? 'text-amber-700' : 'text-gray-900'}`}>{p.label}</p>
                                                <p className={`font-black text-lg ${formData.planType === p.id ? 'text-amber-600' : 'text-gray-400'}`}>{p.price}</p>
                                            </div>
                                            {formData.planType === p.id && (
                                                <CheckCircle size={20} className="absolute top-4 right-4 text-amber-500 animate-in zoom-in" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="p-8 bg-amber-50/50 rounded-[2.5rem] border border-amber-100/50 space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-200">
                                            <Lock size={16} />
                                        </div>
                                        <h4 className="font-black text-gray-900 tracking-tight">Admin Credentials</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="group">
                                            <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Admin Username</label>
                                            <input 
                                                autoComplete="off"
                                                value={formData.adminUsername}
                                                onChange={e => setFormData({...formData, adminUsername: e.target.value})}
                                                className="w-full bg-white border border-gray-100 rounded-xl py-4 px-5 font-bold text-gray-900 outline-none focus:border-amber-500 transition-all shadow-sm"
                                                placeholder="Enter admin username"
                                            />
                                        </div>
                                        <div className="group">
                                            <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Admin Password</label>
                                            <input 
                                                type="password"
                                                autoComplete="new-password"
                                                value={formData.adminPassword}
                                                onChange={e => setFormData({...formData, adminPassword: e.target.value})}
                                                className="w-full bg-white border border-gray-100 rounded-xl py-4 px-5 font-bold text-gray-900 outline-none focus:border-amber-500 transition-all shadow-sm"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-gray-200">
                                            <User size={16} />
                                        </div>
                                        <h4 className="font-black text-gray-900 tracking-tight">Kitchen Credentials</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="group">
                                            <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Kitchen Username</label>
                                            <input 
                                                autoComplete="off"
                                                value={formData.kitchenUsername}
                                                onChange={e => setFormData({...formData, kitchenUsername: e.target.value})}
                                                className="w-full bg-white border border-gray-100 rounded-xl py-4 px-5 font-bold text-gray-900 outline-none focus:border-gray-900 transition-all shadow-sm"
                                                placeholder="Enter kitchen username"
                                            />
                                        </div>
                                        <div className="group">
                                            <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Kitchen Password</label>
                                            <input 
                                                type="password"
                                                autoComplete="new-password"
                                                value={formData.kitchenPassword}
                                                onChange={e => setFormData({...formData, kitchenPassword: e.target.value})}
                                                className="w-full bg-white border border-gray-100 rounded-xl py-4 px-5 font-bold text-gray-900 outline-none focus:border-gray-900 transition-all shadow-sm"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button 
                                        type="submit"
                                        className="w-full bg-amber-500 text-white py-6 rounded-[2rem] font-black flex items-center justify-center gap-3 hover:bg-amber-600 transition-all shadow-2xl shadow-amber-500/20 active:scale-95"
                                    >
                                        Initialize Ecosystem <CheckCircle size={22} />
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="text-center animate-in zoom-in duration-700 max-w-md mx-auto">
                            <div className="w-24 h-24 bg-green-50 text-green-500 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-lg shadow-green-100 rotate-12">
                                <CheckCircle size={48} />
                            </div>
                            <h3 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Ecosystem Live!</h3>
                            <p className="text-gray-500 font-bold mb-12 text-sm leading-relaxed">
                                Your multi-tenant environment for <span className="text-amber-600">{formData.name}</span> is now active. Save these unique access credentials and links.
                            </p>
                            
                            {/* User-Provided Staff Credentials */}
                            <div className="space-y-4 mb-8 text-left bg-blue-50 p-6 rounded-[2rem] border border-blue-100">
                                <div className="flex items-center gap-2 mb-4">
                                    <ShieldCheck size={18} className="text-blue-600" />
                                    <h4 className="font-black text-blue-900 text-sm">Your Access Credentials</h4>
                                </div>
                                
                                {/* Owner Admin */}
                                <div className="bg-white rounded-xl p-4 border border-blue-100">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Owner Admin</p>
                                    <div className="font-mono text-xs text-gray-900 space-y-1">
                                        <div>Email: <span className="font-bold text-amber-600">{formData.ownerEmail}</span></div>
                                        <div>Password: <span className="font-bold text-gray-700">{formData.ownerPassword}</span></div>
                                    </div>
                                </div>
                                
                                {/* Manager */}
                                <div className="bg-white rounded-xl p-4 border border-blue-100">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Manager / Admin</p>
                                    <div className="font-mono text-xs text-gray-900 space-y-1">
                                        <div>Username: <span className="font-bold text-amber-600">{formData.adminUsername}</span></div>
                                        <div>Password: <span className="font-bold text-gray-700">{formData.adminPassword}</span></div>
                                    </div>
                                </div>
                                
                                {/* Kitchen */}
                                <div className="bg-white rounded-xl p-4 border border-blue-100">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Kitchen Staff</p>
                                    <div className="font-mono text-xs text-gray-900 space-y-1">
                                        <div>Username: <span className="font-bold text-amber-600">{formData.kitchenUsername}</span></div>
                                        <div>Password: <span className="font-bold text-gray-700">{formData.kitchenPassword}</span></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-4 mb-12 text-left">
                                {[
                                    { label: 'Owner Admin Login', path: `/admin/login`, color: 'bg-purple-50 text-purple-700' },
                                    { label: 'Manager Admin Panel', path: `/${regHotelId}/admin/login`, color: 'bg-indigo-50 text-indigo-700' },
                                    { label: 'Kitchen Display', path: `/${regHotelId}/kitchen/login`, color: 'bg-orange-50 text-orange-700' }
                                ].map((link, i) => (
                                    <div key={i} className={`p-5 rounded-3xl border border-transparent hover:border-gray-200 transition-all ${link.color}`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{link.label}</span>
                                            <div className="flex gap-2">
                                                <button onClick={() => copyToClipboard(`${baseUrl}${link.path}`)} className="p-1.5 hover:bg-white rounded-lg transition"><Share2 size={14}/></button>
                                                <button onClick={() => window.open(link.path, '_blank')} className="p-1.5 hover:bg-white rounded-lg transition"><ExternalLink size={14}/></button>
                                            </div>
                                        </div>
                                        <p className="text-xs font-mono font-bold truncate tracking-tight">{baseUrl}{link.path}</p>
                                    </div>
                                ))}
                            </div>

                            <button 
                                onClick={() => navigate(`/${regHotelId}/admin/login`)}
                                className="w-full bg-gray-900 text-white py-6 rounded-[2rem] font-black hover:bg-black transition-all shadow-2xl shadow-gray-200"
                            >
                                Enter Admin Terminal
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            <p className="fixed bottom-8 left-0 right-0 text-center text-white/20 text-[10px] font-bold uppercase tracking-[0.4em] pointer-events-none">
                Vitteno Technologies · PaaS Multi-Tenant Solution
            </p>
        </div>
    );
};

export default HotelRegistration;
