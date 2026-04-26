import React from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api/api';
import { 
  TrendingUp, Users, Zap, Star, Package, 
  ArrowUpRight, Clock, ShieldCheck, 
  CreditCard, Layout, ChevronRight
} from 'lucide-react';

const HotelSaaSDashboard = ({ analytics, restaurant, tables, staff, setActiveTab, trendSeries = [], chartReady, startDate, endDate, theme }) => {
  const [broadcastForm, setBroadcastForm] = React.useState({
    title: '',
    message: '',
    imageUrl: '',
    audienceType: 'ALL',
    minLoyaltyPoints: ''
  });
  const [isBroadcasting, setIsBroadcasting] = React.useState(false);
  const [broadcastErrors, setBroadcastErrors] = React.useState({});
  const [broadcastResult, setBroadcastResult] = React.useState(null);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    const title = (broadcastForm.title || '').trim();
    const message = (broadcastForm.message || '').trim();
    const audienceType = (broadcastForm.audienceType || 'ALL').toUpperCase();
    const minLoyaltyPointsRaw = String(broadcastForm.minLoyaltyPoints ?? '').trim();
    const parsedThreshold = minLoyaltyPointsRaw === '' ? null : Number(minLoyaltyPointsRaw);

    const errors = {};
    if (!title) errors.title = 'Offer title is required.';
    if (!message) errors.message = 'Broadcast message is required.';
    if (audienceType === 'LOYALTY_THRESHOLD') {
      if (minLoyaltyPointsRaw === '') {
        errors.minLoyaltyPoints = 'Minimum loyalty points are required for this audience.';
      } else if (!Number.isFinite(parsedThreshold) || parsedThreshold < 0) {
        errors.minLoyaltyPoints = 'Enter a valid loyalty points value (0 or higher).';
      }
    }

    if (Object.keys(errors).length > 0) {
      setBroadcastErrors(errors);
      return;
    }

    setBroadcastErrors({});
    setBroadcastResult(null);
    
    setIsBroadcasting(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/analytics/broadcast`, {
        title,
        message,
        imageUrl: (broadcastForm.imageUrl || '').trim(),
        audienceType,
        minLoyaltyPoints: audienceType === 'LOYALTY_THRESHOLD' ? Math.max(0, parsedThreshold ?? 0) : null,
      });

      setBroadcastResult(response.data || null);
      setBroadcastForm({
        title: '',
        message: '',
        imageUrl: '',
        audienceType: 'ALL',
        minLoyaltyPoints: ''
      });
      setBroadcastErrors({});
    } catch (err) {
      console.error('Broadcast failed', err);
      alert(err?.response?.data?.error || 'Failed to initiate broadcast. Please check your connection.');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const getPlanConfig = (type) => {
    switch (type) {
      case 'PREMIUM': return { limit: 1000, label: 'Unlimited', color: 'indigo' };
      case 'CLASSIC': return { limit: 20, label: '20 Tables', color: 'amber' };
      case 'STARTER': return { limit: 5, label: '5 Tables', color: 'blue' };
      default: return { limit: 5, label: '5 Tables', color: 'gray' };
    }
  };

  const planConfig = getPlanConfig(restaurant.planType);
  const tableLimit = planConfig.label;
  const tableUsagePct = (tables.length / planConfig.limit) * 100;
  const paymentRevenue = (analytics.payments || []).reduce((sum, row) => {
    const value = Number(row?.revenue || 0);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);
  const surfaceStyles = {
    background: theme?.surface || 'rgba(255,255,255,0.8)',
    borderColor: theme?.line || 'rgba(148,163,184,0.18)',
    color: theme?.text || '#0f172a'
  };
  const softStyles = {
    background: theme?.surfaceSoft || 'rgba(248,250,252,0.95)',
    borderColor: theme?.line || 'rgba(148,163,184,0.18)'
  };
  const textStyles = { color: theme?.text || '#0f172a' };
  const mutedStyles = { color: theme?.muted || '#64748b' };

  const stats = [
    { 
      label: 'Monthly Revenue', 
      value: `₹${(analytics.summary?.monthlyRevenue || paymentRevenue || analytics.summary?.totalRevenue || 0).toLocaleString('en-IN')}`, 
      change: '+12.5%', 
      icon: TrendingUp, 
      color: 'amber' 
    },
    { 
      label: 'Active Tables', 
      value: `${tables.length} / ${tableLimit}`, 
      change: 'In Use', 
      icon: Layout, 
      color: 'blue' 
    },
    { 
      label: 'Avg Rating', 
      value: `${(analytics.reviews?.averageRating || 0).toFixed(1)}`, 
      change: `${analytics.reviews?.totalReviews || 0} reviews`, 
      icon: Star, 
      color: 'purple' 
    },
    { 
      label: 'Staff Active', 
      value: staff.length, 
      change: 'Roles sync', 
      icon: Users, 
      color: 'orange' 
    },
  ];  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-12">
      {/* Welcome & Subscription Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 backdrop-blur-xl p-8 sm:p-12 rounded-[3.5rem] border shadow-2xl overflow-hidden relative group" style={{ ...surfaceStyles, boxShadow: '0 28px 90px rgba(15,23,42,0.08)' }}>
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full -mr-[200px] -mt-[200px] blur-3xl group-hover:bg-amber-500/10 transition-colors duration-1000"></div>
        <div className="relative z-10 w-full">
          <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] mb-4">Enterprise Hub</p>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4 leading-tight" style={textStyles}>
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">{restaurant.name}</span>
          </h1>
          <div className="flex flex-wrap items-center gap-4">
            <span className={`flex items-center gap-2 px-5 py-2 rounded-2xl text-[10px] font-black tracking-widest uppercase shadow-sm`} style={{ backgroundColor: theme?.surfaceSoft || 'rgba(248,250,252,0.95)', border: `1px solid ${theme?.line || 'rgba(148,163,184,0.18)'}`, color: theme?.accent || '#0D2A4A' }}>
              <ShieldCheck size={14} /> {restaurant.planType} ARCHITECTURE
            </span>
            <span className="font-bold text-xs px-4 py-2 rounded-2xl border" style={{ backgroundColor: theme?.surfaceSoft || 'rgba(248,250,252,0.95)', borderColor: theme?.line || 'rgba(148,163,184,0.18)', color: theme?.muted || '#64748b' }}>
              {restaurant.planExpiry ? `Access expires ${new Date(restaurant.planExpiry).toLocaleDateString()}` : 'Unlimited Lifetime Access'}
            </span>
          </div>
        </div>
        
        {restaurant.planType !== 'PREMIUM' && (
          <button onClick={() => setActiveTab('hotel')} className="w-full sm:w-auto relative z-10 text-white px-10 py-5 rounded-[2rem] font-black transition-all shadow-2xl flex items-center justify-center gap-3 group cursor-pointer text-sm whitespace-nowrap active:scale-95" style={{ backgroundColor: theme?.accent || '#0D2A4A', boxShadow: '0 18px 50px rgba(15,23,42,0.18)' }}>
            <CreditCard size={20} className="group-hover:rotate-12 transition-transform" />
            Scale Operations
          </button>
        )}
      </div>

      {/* Grid of Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <div key={i} className="backdrop-blur-md p-8 rounded-[3rem] border shadow-xl hover:scale-[1.02] transition-all duration-300 relative overflow-hidden group" style={{ ...surfaceStyles, boxShadow: '0 20px 60px rgba(15,23,42,0.08)' }}>
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700 opacity-50" style={{ backgroundColor: theme?.surfaceSoft || 'rgba(248,250,252,0.95)' }}></div>
            <div className={`p-5 bg-${stat.color}-500/10 text-${stat.color}-600 rounded-2xl w-fit mb-6 shadow-sm group-hover:rotate-6 transition-transform`}>
              <stat.icon size={28} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2" style={mutedStyles}>{stat.label}</p>
            <h3 className="text-3xl font-black mb-2 tracking-tight" style={textStyles}>{stat.value}</h3>
            <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-500 bg-emerald-500/5 w-fit px-3 py-1.5 rounded-full border border-emerald-500/10">
               <ArrowUpRight size={14} /> {stat.change}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-12">
        {/* Business Health Card */}
        <div className="backdrop-blur-xl p-8 sm:p-12 rounded-[3.5rem] border shadow-2xl relative overflow-hidden group" style={{ ...surfaceStyles, boxShadow: '0 24px 80px rgba(15,23,42,0.08)' }}>
           <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
           <div className="flex justify-between items-center mb-12 relative z-10">
             <div>
               <h3 className="font-black text-2xl sm:text-3xl tracking-tight mb-2" style={textStyles}>Platform Efficiency</h3>
               <p className="text-sm font-bold" style={mutedStyles}>Real-time resource and quality monitoring.</p>
             </div>
             <div className="flex items-center gap-3">
               <span className="text-[9px] font-black text-amber-500 uppercase tracking-[0.3em] bg-amber-500/5 px-4 py-2 rounded-full border border-amber-500/10 animate-pulse">Live Feed</span>
             </div>
           </div>
           
           <div className="space-y-12 relative z-10">
             {/* Table Usage */}
             <div className="p-8 rounded-[2.5rem] border" style={{ ...softStyles, background: theme?.surfaceSoft || 'rgba(248,250,252,0.95)' }}>
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
                 <div>
                   <p className="font-black text-lg uppercase tracking-tight" style={textStyles}>Capacity Utilization</p>
                   <p className="text-xs font-bold uppercase tracking-widest mt-1" style={mutedStyles}>Allocation: {tables.length} Active / {tableLimit} Limit</p>
                 </div>
                 <p className="text-4xl font-black tabular-nums" style={textStyles}>{Math.round(tableUsagePct)}<span className="text-sm ml-1" style={mutedStyles}>%</span></p>
               </div>
               <div className="h-4 rounded-full overflow-hidden border shadow-inner" style={{ backgroundColor: 'rgba(255,255,255,0.7)', borderColor: theme?.line || 'rgba(148,163,184,0.18)' }}>
                 <div 
                   className={`h-full transition-all duration-[2s] rounded-full shadow-lg ${tableUsagePct > 80 ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'}`}
                   style={{ width: `${Math.min(tableUsagePct, 100)}%` }}
                 ></div>
               </div>
                {tableUsagePct >= 80 && (
                  <div className="mt-4 p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20 flex items-center gap-3">
                    <div className="p-2 bg-orange-500 text-white rounded-xl shadow-lg"><Clock size={16} /></div>
                    <p className="text-[11px] font-black text-orange-700 uppercase tracking-widest leading-relaxed">
                      Critical Capacity Alert: Scaling recommended to avoid performance degradation.
                    </p>
                  </div>
                )}
             </div>

             {/* Order Accuracy/Success */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-amber-500/5 to-transparent p-8 rounded-[3rem] border transition-all group/box" style={{ borderColor: theme?.line || 'rgba(148,163,184,0.18)' }}>
                  <div className="flex items-center gap-6 mb-6">
                    <div className="w-16 h-16 shadow-xl shadow-amber-500/10 text-amber-600 rounded-[1.5rem] flex items-center justify-center group-hover/box:scale-110 transition-transform" style={{ backgroundColor: theme?.surface || 'rgba(255,255,255,0.8)' }}>
                      <Package size={32} />
                    </div>
                    <div>
                      <p className="font-black text-xl tracking-tight" style={textStyles}>Inventory Health</p>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600">Operational Status</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold leading-relaxed mb-6" style={mutedStyles}>
                    Logistical data indicates all high-velocity items are currently available. 0 items require immediate procurement.
                  </p>
                  <button onClick={() => setActiveTab('inventory')} className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:gap-4 transition-all cursor-pointer px-6 py-3 rounded-2xl shadow-sm active:scale-95" style={{ backgroundColor: theme?.surface || 'rgba(255,255,255,0.8)', color: theme?.accent || '#0D2A4A', border: `1px solid ${theme?.line || 'rgba(148,163,184,0.18)'}` }}>
                    Sync Logistics <ChevronRight size={14} />
                  </button>
                </div>

                <div className="bg-gradient-to-br from-purple-500/5 to-transparent p-8 rounded-[3rem] border transition-all group/box" style={{ borderColor: theme?.line || 'rgba(148,163,184,0.18)' }}>
                  <div className="flex items-center gap-6 mb-6">
                    <div className="w-16 h-16 shadow-xl shadow-purple-500/10 text-purple-600 rounded-[1.5rem] flex items-center justify-center group-hover/box:scale-110 transition-transform" style={{ backgroundColor: theme?.surface || 'rgba(255,255,255,0.8)' }}>
                      <Star size={32} />
                    </div>
                    <div>
                      <p className="font-black text-xl tracking-tight" style={textStyles}>Quality Index</p>
                      <p className="text-[10px] font-black text-purple-600 uppercase tracking-[0.2em]">Customer Metrics</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold leading-relaxed mb-6" style={mutedStyles}>
                    Based on {analytics.reviews?.totalReviews || 0} recent interactions, the current service quality benchmark is "Exceptional".
                  </p>
                  <button onClick={() => setActiveTab('reviews')} className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:gap-4 transition-all cursor-pointer px-6 py-3 rounded-2xl shadow-sm active:scale-95" style={{ backgroundColor: theme?.surface || 'rgba(255,255,255,0.8)', color: '#7c3aed', border: `1px solid ${theme?.line || 'rgba(148,163,184,0.18)'}` }}>
                    View Feedback <ChevronRight size={14} />
                  </button>
                </div>
             </div>
           </div>
        </div>

        {/* Premium Broadcast System - Only for Premium Users */}
        {restaurant.planType === 'PREMIUM' && (
          <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-gray-900 p-8 sm:p-12 rounded-[3.5rem] shadow-2xl shadow-gray-950/45 relative overflow-hidden group/broadcast">
             <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-400/10 rounded-full -mr-[250px] -mt-[250px] blur-3xl group-hover/broadcast:bg-amber-300/20 transition-colors duration-1000"></div>
             <div className="flex flex-col lg:flex-row gap-12 relative z-10">
                <div className="lg:w-1/3 text-white">
                   <div className="p-4 bg-amber-500/15 border border-amber-400/30 rounded-2xl w-fit mb-8 shadow-inner"><Star size={32} className="text-amber-300 fill-amber-300" /></div>
                   <h3 className="text-4xl font-black mb-4 tracking-tight">Executive Broadcast</h3>
                   <p className="text-slate-200 text-lg font-medium leading-relaxed mb-8">
                     Reach your entire customer base instantly. Share exclusive offers, new menu launches, or special events directly via VIP messaging channels.
                   </p>
                   <ul className="space-y-4">
                     {['Verify Premium Access', 'Fetch Customer Registry', 'Instant Messaging Pulse'].map((item, idx) => (
                       <li key={idx} className="flex items-center gap-3 text-sm font-bold text-slate-200/85 capitalize">
                         <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div> {item}
                       </li>
                     ))}
                   </ul>
                </div>

                <div className="lg:w-2/3">
                   <form onSubmit={handleBroadcast} noValidate className="bg-slate-900/45 backdrop-blur-xl p-8 sm:p-10 rounded-[2.5rem] border border-amber-400/20 space-y-6 shadow-2xl shadow-black/20">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                           <label className="inline-flex items-center bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] ml-1 shadow-lg shadow-amber-500/20">Offer Title</label>
                            <input 
                               type="text" 
                               value={broadcastForm.title}
                           onChange={e => {
                            setBroadcastForm({...broadcastForm, title: e.target.value});
                            if (broadcastErrors.title) {
                              setBroadcastErrors(prev => ({ ...prev, title: '' }));
                            }
                           }}
                               placeholder="e.g. 20% Weekend Special"
                           aria-invalid={Boolean(broadcastErrors.title)}
                            className={`w-full bg-white rounded-2xl py-4 px-6 text-slate-900 placeholder:text-slate-500 focus:bg-white focus:ring-0 font-bold transition-all ${broadcastErrors.title ? 'border-rose-300 focus:border-rose-200' : 'border-white/15 focus:border-amber-300/60'}`}
                            />
                           {broadcastErrors.title && <p className="text-[11px] font-black text-rose-300 tracking-wide ml-1">{broadcastErrors.title}</p>}
                         </div>
                         <div className="space-y-2">
                           <label className="inline-flex items-center bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] ml-1 shadow-lg shadow-blue-500/20">Asset URL (Optional)</label>
                            <input 
                               type="text" 
                               value={broadcastForm.imageUrl}
                               onChange={e => setBroadcastForm({...broadcastForm, imageUrl: e.target.value})}
                               placeholder="https://image-url.com/promo.jpg"
                               className="w-full bg-white border-white/15 rounded-2xl py-4 px-6 text-slate-900 placeholder:text-slate-500 focus:bg-white focus:ring-0 focus:border-amber-300/60 font-bold transition-all"
                            />
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="inline-flex items-center bg-gradient-to-r from-fuchsia-500 to-indigo-600 text-white rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] ml-1 shadow-lg shadow-indigo-500/20">Audience Filter</label>
                          <select
                            value={broadcastForm.audienceType}
                            onChange={e => {
                              const nextAudienceType = e.target.value;
                              setBroadcastForm({ ...broadcastForm, audienceType: nextAudienceType });
                              setBroadcastResult(null);
                              if (broadcastErrors.minLoyaltyPoints || broadcastErrors.audienceType) {
                                setBroadcastErrors(prev => ({ ...prev, minLoyaltyPoints: '', audienceType: '' }));
                              }
                            }}
                            className="w-full bg-white border-white/15 rounded-2xl py-4 px-6 text-slate-900 focus:bg-white focus:ring-0 focus:border-amber-300/60 font-bold transition-all"
                          >
                            <option value="ALL">All Customers</option>
                            <option value="LOYALTY_THRESHOLD">Loyal Customers (Min Points)</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="inline-flex items-center bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] ml-1 shadow-lg shadow-violet-500/20">Min Loyalty Points</label>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            disabled={broadcastForm.audienceType !== 'LOYALTY_THRESHOLD'}
                            value={broadcastForm.minLoyaltyPoints}
                            onChange={e => {
                              setBroadcastForm({ ...broadcastForm, minLoyaltyPoints: e.target.value });
                              setBroadcastResult(null);
                              if (broadcastErrors.minLoyaltyPoints) {
                                setBroadcastErrors(prev => ({ ...prev, minLoyaltyPoints: '' }));
                              }
                            }}
                            placeholder="e.g. 100"
                            aria-invalid={Boolean(broadcastErrors.minLoyaltyPoints)}
                            className={`w-full bg-white rounded-2xl py-4 px-6 text-slate-900 placeholder:text-slate-500 focus:bg-white focus:ring-0 font-bold transition-all ${broadcastErrors.minLoyaltyPoints ? 'border-rose-300 focus:border-rose-200' : 'border-white/15 focus:border-amber-300/60'} ${broadcastForm.audienceType !== 'LOYALTY_THRESHOLD' ? 'opacity-60 cursor-not-allowed' : ''}`}
                          />
                          {broadcastErrors.minLoyaltyPoints && <p className="text-[11px] font-black text-rose-300 tracking-wide ml-1">{broadcastErrors.minLoyaltyPoints}</p>}
                        </div>
                      </div>
                           <div className="space-y-2">
                             <label className="inline-flex items-center bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] ml-1 shadow-lg shadow-emerald-500/20">Broadcast Message</label>
                         <textarea 
                            rows="4"
                            value={broadcastForm.message}
                           onChange={e => {
                            setBroadcastForm({...broadcastForm, message: e.target.value});
                            if (broadcastErrors.message) {
                              setBroadcastErrors(prev => ({ ...prev, message: '' }));
                            }
                           }}
                            placeholder="Type your message here..."
                           aria-invalid={Boolean(broadcastErrors.message)}
                           className={`w-full bg-white rounded-2xl py-4 px-6 text-slate-900 placeholder:text-slate-500 focus:bg-white focus:ring-0 font-bold transition-all resize-none ${broadcastErrors.message ? 'border-rose-300 focus:border-rose-200' : 'border-white/15 focus:border-amber-300/60'}`}
                         ></textarea>
                         {broadcastErrors.message && <p className="text-[11px] font-black text-rose-300 tracking-wide ml-1">{broadcastErrors.message}</p>}
                      </div>
                      <button 
                        disabled={isBroadcasting}
                        type="submit" 
                        className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-2xl ${isBroadcasting ? 'bg-amber-700/40 text-amber-200' : 'bg-amber-500 text-white hover:bg-amber-400 hoverScale active:scale-95'}`}
                      >
                         {isBroadcasting ? (
                           <div className="w-6 h-6 border-4 border-amber-300 border-t-slate-900 rounded-full animate-spin"></div>
                         ) : (
                           <>
                             <Zap size={20} className="fill-current" /> Send Broadcast
                           </>
                         )}
                      </button>

                      {broadcastResult && (
                        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5 text-emerald-100 space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200">Delivery Report</p>
                          <p className="text-sm font-bold">Audience: {broadcastResult.audienceType === 'LOYALTY_THRESHOLD' ? `Loyalty >= ${broadcastResult.minLoyaltyPoints ?? 0}` : 'All Customers'}</p>
                          <div className="grid grid-cols-3 gap-3 text-xs font-black">
                            <div className="bg-black/20 rounded-xl p-3 text-center">
                              <p className="text-[9px] uppercase tracking-widest text-emerald-200">Targeted</p>
                              <p className="text-lg">{broadcastResult.targetedCount ?? 0}</p>
                            </div>
                            <div className="bg-black/20 rounded-xl p-3 text-center">
                              <p className="text-[9px] uppercase tracking-widest text-emerald-200">Sent</p>
                              <p className="text-lg">{broadcastResult.sentCount ?? 0}</p>
                            </div>
                            <div className="bg-black/20 rounded-xl p-3 text-center">
                              <p className="text-[9px] uppercase tracking-widest text-emerald-200">Skipped</p>
                              <p className="text-lg">{broadcastResult.skippedCount ?? 0}</p>
                            </div>
                          </div>
                        </div>
                      )}
                   </form>
                </div>
             </div>
          </div>
        )}

        {/* Management Toolbox */}
          <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white p-10 sm:p-16 rounded-[4rem] shadow-2xl shadow-gray-950/60 relative overflow-hidden group/toolbox">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-amber-400/20 via-blue-400/10 to-transparent blur-3xl opacity-60 group-hover/toolbox:opacity-100 transition-opacity duration-1000"></div>
            <div className="absolute bottom-0 left-0 w-[520px] h-[520px] bg-gradient-to-tr from-cyan-400/10 to-transparent blur-3xl opacity-60"></div>
           <div className="relative z-10">
             <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-16">
                <div>
                   <h3 className="font-black text-4xl sm:text-5xl mb-4 tracking-tight">Executive Control</h3>
                     <p className="text-slate-300 text-lg font-medium">Precision tools for modern restaurant management.</p>
                </div>
                  <div className="px-8 py-4 bg-slate-900/45 border border-amber-400/20 rounded-[2rem] flex items-center gap-6 backdrop-blur-sm">
                    <div className="p-3 bg-amber-400/20 text-amber-300 rounded-2xl shadow-inner shadow-amber-500/10"><Zap size={24} /></div>
                    <p className="text-[10px] font-black uppercase text-amber-200 tracking-[0.4em]">Optimizing Backend Sync</p>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {[
                 { label: 'Cloud Print QRs', icon: Layout, desc: 'Dynamic session codes', tab: 'hotel' },
                 { label: 'Catalog Sync', icon: Package, desc: 'Pricing & Availability', tab: 'menu' },
                 { label: 'Live Settlement', icon: Zap, desc: 'Active Session Oversight', tab: 'live' },
                 { label: 'Personnel Hub', icon: Users, desc: 'Role & Access Control', tab: 'staff' },
               ].map((action, i) => (
                 <button key={i} onClick={() => setActiveTab(action.tab)} className="w-full flex flex-col gap-6 p-8 rounded-[3rem] bg-slate-900/55 border border-slate-700/70 hover:bg-slate-800/70 hover:border-amber-300/40 hover:shadow-2xl hover:shadow-black/40 transition-all text-left group cursor-pointer active:scale-95">
                   <div className="p-4 bg-amber-400/20 text-amber-300 rounded-[1.5rem] w-fit group-hover:bg-amber-400 group-hover:text-slate-950 transition-all transform group-hover:scale-110 group-hover:rotate-6 shadow-inner">
                     <action.icon size={28} />
                   </div>
                   <div>
                     <p className="font-black text-xl mb-2 tracking-tight text-slate-50 group-hover:text-amber-200 transition-colors">{action.label}</p>
                     <p className="text-xs text-slate-300/80 font-bold uppercase tracking-widest">{action.desc}</p>
                   </div>
                 </button>
               ))}
             </div>
             
             <div className="mt-12 p-8 bg-gradient-to-r from-amber-400/15 via-blue-400/10 to-transparent border border-amber-300/25 rounded-[3rem] flex items-center gap-8 backdrop-blur-sm">
                <div className="hidden md:flex w-24 h-24 bg-amber-400 text-slate-950 rounded-[2rem] items-center justify-center flex-shrink-0 animate-bounce shadow-2xl shadow-amber-500/25">
                   <ShieldCheck size={48} />
                </div>
                <div>
                  <p className="text-amber-200 font-black text-sm mb-2 uppercase tracking-[0.3em]">AI-Driven Analytics</p>
                  <p className="text-slate-200/90 text-sm font-medium leading-relaxed max-w-4xl">
                    Our optimization engine identifies a 15% potential revenue lift by adjusting staff allocation during the 19:00 - 21:00 peak window. Monitor "Live Settlements" to ensure zero leakage.
                  </p>
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default HotelSaaSDashboard;
