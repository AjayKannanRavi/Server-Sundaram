import React, { useEffect, useState } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import axios from 'axios';
import { Clock, ChefHat, CheckCircle, Coffee, Plus, X, ShoppingBag, Receipt } from 'lucide-react';
import { API_BASE_URL, WS_BASE_URL } from '../api/api';

// ─────────────────────────────────────────────────
// StatusBadge helper
// ─────────────────────────────────────────────────
const StatusBadge = ({ status, darkMode }) => {
  const cfg = {
    PENDING:   { cls: darkMode ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-yellow-100 text-yellow-700', label: '⏳ Pending' },
    ACCEPTED:  { cls: darkMode ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-blue-100  text-blue-700',   label: '✓ Accepted' },
    PREPARING: { cls: darkMode ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 'bg-orange-100 text-orange-700', label: '🍳 Preparing' },
    READY:     { cls: darkMode ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : 'bg-purple-100 text-purple-700', label: '🔔 Ready' },
    SERVED:    { cls: darkMode ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-green-100 text-green-700',  label: '✅ Served' },
    COMPLETED: { cls: darkMode ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-emerald-100 text-emerald-700', label: '✓ Completed' },
    REJECTED:  { cls: darkMode ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-red-100   text-red-700',    label: '✕ Rejected' },
  }[status] || { cls: 'bg-gray-100 text-gray-600', label: status };
  
  return <span className={`text-[9px] font-black px-3 py-1.5 rounded-full border ${cfg.cls} uppercase tracking-widest`}>{cfg.label}</span>;
};

// ─────────────────────────────────────────────────
// Progress bar
// ─────────────────────────────────────────────────
const STATUSES = [
  { key: 'PENDING',   label: 'Placed',    icon: <Clock /> },
  { key: 'ACCEPTED',  label: 'Accepted',  icon: <CheckCircle /> },
  { key: 'PREPARING', label: 'Preparing', icon: <ChefHat /> },
  { key: 'READY',     label: 'Ready',     icon: <CheckCircle /> },
  { key: 'SERVED',    label: 'Served',    icon: <Coffee /> },
];

const StatusBar = ({ status, darkMode }) => {
  if (status === 'REJECTED') return null;
  if (status === 'COMPLETED') {
    return (
      <div className={`flex items-center gap-2 font-black text-[10px] uppercase tracking-widest p-4 rounded-2xl mb-6 ${darkMode ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
        <CheckCircle size={16} /> Order fully completed
      </div>
    );
  }
  const cur = STATUSES.findIndex(s => s.key === status);
  return (
    <div className="flex justify-between items-center mb-10 px-0 sm:px-2">
      {STATUSES.map((s, i) => (
        <div key={s.key} className="flex flex-col items-center gap-1.5">
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-500 ${i <= cur ? 'bg-green-500 text-white shadow-xl shadow-green-500/20 scale-110' : darkMode ? 'bg-white/5 text-white/20' : 'bg-gray-100 text-gray-300'}`}>
            {React.cloneElement(s.icon, { size: 14, className: "sm:w-[18px] sm:h-[18px]", strokeWidth: 2.5 })}
          </div>
          <span className={`text-[7px] sm:text-[8px] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] ${i <= cur ? 'text-green-500' : darkMode ? 'text-white/20' : 'text-gray-300'}`}>{s.label}</span>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────
// Add More / Finish Order Modal
// ─────────────────────────────────────────────────
const ChoiceModal = ({ tableId, hotelId, onClose, onFinish, darkMode }) => (
  <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
    <div className={`${darkMode ? 'bg-[#151515] text-white border-white/10' : 'bg-white text-gray-900'} rounded-[2.5rem] p-9 w-full max-w-sm shadow-2xl border transition-all duration-500 animate-in zoom-in-95`}>
      <div className="text-center mb-4">
        <div className="w-16 h-16 rounded-[1.5rem] bg-green-500 flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-green-500/30">
          <Coffee size={32} strokeWidth={2.5} className="text-white" />
        </div>
        <h2 className="text-3xl font-black mb-1">Served!</h2>
        <p className={`${darkMode ? 'text-gray-500' : 'text-gray-400'} font-bold text-xs uppercase tracking-widest`}>Dishes have arrived</p>
      </div>

      <div className="space-y-4 mt-8">
        <button
          onClick={() => {
            const menuUrl = `/${hotelId}/menu?tableId=${tableId}`;
            window.location.href = menuUrl;
          }}
          className={`w-full flex items-center gap-5 p-5 rounded-[1.5rem] border-2 transition-all duration-300 group cursor-pointer ${darkMode ? 'border-white/5 bg-white/5 hover:border-amber-500 hover:bg-amber-500/5' : 'border-gray-100 hover:border-amber-500 hover:bg-amber-50'}`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${darkMode ? 'bg-amber-500/10 text-amber-500' : 'bg-amber-100 text-amber-600'}`}>
            <Plus size={24} strokeWidth={3} />
          </div>
          <div className="text-left">
            <p className="font-black text-sm uppercase tracking-widest">Add Items</p>
            <p className={`text-[10px] font-bold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Order additional delicacies</p>
          </div>
        </button>

        <button
          onClick={onFinish}
          className={`w-full flex items-center gap-5 p-5 rounded-[1.5rem] border-2 transition-all duration-300 group cursor-pointer ${darkMode ? 'border-white/5 bg-white/5 hover:border-green-500 hover:bg-green-500/5' : 'border-gray-100 hover:border-green-500 hover:bg-green-50'}`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${darkMode ? 'bg-green-500/10 text-green-500' : 'bg-green-100 text-green-600'}`}>
            <Receipt size={24} strokeWidth={3} />
          </div>
          <div className="text-left">
            <p className="font-black text-sm uppercase tracking-widest">View Bill</p>
            <p className={`text-[10px] font-bold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Proceed to billing</p>
          </div>
        </button>
      </div>

      <button
        onClick={onClose}
        className="w-full mt-6 py-2 text-gray-500 text-[10px] font-black uppercase tracking-widest hover:text-amber-500 transition cursor-pointer"
      >
        I'm still eating
      </button>
    </div>
  </div>
);

// ─────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────
const CustomerOrderTracker = () => {
  const { hotelId: urlHotelId } = useParams();
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get('tableId');
  const hotelId = urlHotelId;
  const navigate = useNavigate();

  const [sessionOrders, setSessionOrders] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [confirming, setConfirming]       = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // Fetch session orders on mount
  useEffect(() => {
    if (!tableId) return;
    axios.get(`${API_BASE_URL}/orders/session?tableId=${tableId}`, {
      headers: { 'X-Hotel-Id': hotelId }
    })
      .then(res => setSessionOrders(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [tableId, hotelId]);

  // WebSocket live updates
  useEffect(() => {
    if (!tableId) return;
    const client = new Client({
      brokerURL: WS_BASE_URL,
      onConnect: () => {
        client.subscribe(`/topic/customer/${hotelId}/${tableId}`, (message) => {
          const updated = JSON.parse(message.body);
          setSessionOrders(prev => {
            const exists = prev.find(o => o.id === updated.id);
            const next = exists
              ? prev.map(o => o.id === updated.id ? updated : o)
              : [...prev, updated];

            // Auto-show choice modal when ANY order transitions to SERVED
            if (updated.status === 'SERVED') {
              const allPaymentDone = next.every(o => o.paymentStatus === 'PAID');
              if (!allPaymentDone) {
                setTimeout(() => setShowChoiceModal(true), 600);
              }
            }

            // AUTO-REDIRECT TO REVIEW if payment confirmed
            const allPaid = next.length > 0 && next.every(o => o.paymentStatus === 'PAID');
            if (allPaid) {
              setConfirming(true); // show generic processing overlay
              setTimeout(() => {
                const sessionId = next[0]?.sessionId || '';
                const reviewUrl = `/${hotelId}/review?tableId=${tableId}&sessionId=${sessionId}`;
                window.location.href = reviewUrl;
              }, 2000);
            }

            return next;
          });
        });
      }
    });
    client.activate();
    return () => client.deactivate();
  }, [tableId]);

  // Derived state
  const sessionTotal  = sessionOrders.reduce((acc, o) => acc + o.totalAmount, 0);
  const isPaid        = sessionOrders.length > 0 && sessionOrders.every(o => o.paymentStatus === 'PAID');
  const hasServed     = sessionOrders.some(o => o.status === 'SERVED');
  const allDone       = sessionOrders.length > 0 && sessionOrders.every(o => ['SERVED','COMPLETED','REJECTED'].includes(o.status));
  const allReceived   = sessionOrders.length > 0 && sessionOrders.every(o => o.status === 'COMPLETED' || o.status === 'REJECTED' || o.paymentStatus === 'PAID');
  const hasPending    = sessionOrders.some(o => !['SERVED','COMPLETED','REJECTED'].includes(o.status) && o.paymentStatus !== 'PAID');

  const handleFinishOrder = async () => {
    setConfirming(true);
    try {
      await Promise.all(
        sessionOrders
          .filter(o => o.status === 'SERVED')
          .map(o => axios.put(`${API_BASE_URL}/orders/${o.id}/status?status=COMPLETED`, {}, {
            headers: { 'X-Hotel-Id': hotelId }
          }))
      );
      const billUrl = `/${hotelId}/bill?tableId=${tableId}`;
      window.location.href = billUrl;
    } catch (err) {
      console.error('Failed to confirm receipt', err);
      setConfirming(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400 font-bold">Loading session...</div>;
  }

  if (sessionOrders.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
        <ShoppingBag size={40} className="text-gray-300" />
        <p className="text-gray-500 font-bold">No active orders for this table.</p>
        <button
          onClick={() => {
            const menuUrl = `/${hotelId}/menu?tableId=${tableId}`;
            window.location.href = menuUrl;
          }}
          className="bg-gray-900 text-white font-black px-6 py-3 rounded-2xl cursor-pointer"
        >
          Go to Menu
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 pb-44 ${darkMode ? 'bg-[#0D0D0D] text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Universal Header Fix */}
      <div className={`sticky top-0 z-40 h-20 border-b flex items-center px-6 backdrop-blur-xl transition-all ${darkMode ? 'bg-[#0D0D0D]/90 border-white/5' : 'bg-white/90 border-gray-100'}`}>
        <div className="max-w-2xl mx-auto w-full flex justify-between items-center">
           <div className="flex items-center gap-4">
              <div 
                onClick={() => navigate(`/${hotelId}/menu?tableId=${tableId}`)}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition cursor-pointer ${darkMode ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                <ShoppingBag size={20} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                 <h2 className={`font-serif italic text-lg leading-tight ${darkMode ? 'text-amber-400' : 'text-gray-900'}`}>Your Session</h2>
                 <p className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Table {tableId}</p>
              </div>
           </div>
           
           <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${darkMode ? 'bg-amber-400 text-gray-900 shadow-xl shadow-amber-400/20' : 'bg-gray-900 text-white shadow-xl shadow-gray-900/20'}`}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
        </div>
      </div>

      {/* Choice modal */}
      {showChoiceModal && !isPaid && (
        <ChoiceModal
          tableId={tableId}
          hotelId={hotelId}
          darkMode={darkMode}
          onClose={() => setShowChoiceModal(false)}
          onFinish={handleFinishOrder}
        />
      )}

      <div className="max-w-2xl mx-auto p-6 pt-10">
        {/* Paid banner */}
        {isPaid && (
          <div className="bg-emerald-500 text-white text-center py-4 rounded-3xl mb-10 font-black tracking-[0.2em] uppercase text-[10px] shadow-2xl shadow-emerald-500/30 flex justify-center items-center gap-3 animate-in slide-in-from-top duration-500">
            <CheckCircle size={20} strokeWidth={3} /> Session Settled
          </div>
        )}

        <div className="text-center mb-12">
            <h1 className={`text-3xl sm:text-5xl font-black mb-2 tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Live Orders</h1>
            <div className="flex items-center justify-center gap-3">
               <span className={`h-[2px] w-8 rounded-full ${darkMode ? 'bg-amber-400/30' : 'bg-gray-200'}`} />
               <p className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                 {sessionOrders.length} Activity Log{sessionOrders.length > 1 ? 's' : ''}
               </p>
               <span className={`h-[2px] w-8 rounded-full ${darkMode ? 'bg-amber-400/30' : 'bg-gray-200'}`} />
            </div>
        </div>

        {/* Order cards */}
        <div className="space-y-8">
          {sessionOrders.map((order, idx) => (
            <div key={order.id} className={`rounded-[2.5rem] border overflow-hidden transition-all duration-500 shadow-2xl ${
              darkMode ? 'bg-[#151515] border-white/5 shadow-black/40' : 
              order.status === 'SERVED' ? 'bg-white border-green-200 shadow-green-500/5' : 'bg-white border-gray-100 shadow-gray-200/50'
            }`}>
              {/* Card header */}
              <div className={`flex justify-between items-center px-8 py-6 ${
                darkMode ? 'bg-white/5' : 
                order.status === 'SERVED' ? 'bg-green-50/50' : 'bg-gray-50/30'
              }`}>
                <div className="flex flex-col">
                   <span className={`text-[9px] font-black uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Reference</span>
                   <h3 className={`font-black text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Order No. {idx + 1}</h3>
                </div>
                <StatusBadge status={order.status} darkMode={darkMode} />
              </div>

              <div className="p-8">
                {/* Status bar */}
                {order.status === 'REJECTED' ? (
                  <div className={`p-5 rounded-[1.5rem] font-bold italic text-xs mb-6 border ${darkMode ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-red-50 text-red-800 border-red-100'}`}>
                    Rejected: {order.rejectionReason || 'Kitchen could not process this order'}
                  </div>
                ) : (
                  <StatusBar status={order.status} darkMode={darkMode} />
                )}

                {/* "Served – choose action" prompt per card if only this one is served */}
                {order.status === 'SERVED' && !showChoiceModal && (
                  <div className={`rounded-[1.5rem] p-5 mb-8 flex items-center justify-between gap-4 border ${darkMode ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-100'}`}>
                    <p className={`font-black text-xs uppercase tracking-widest ${darkMode ? 'text-green-500' : 'text-green-700'}`}>Your food is here!</p>
                    <button
                      onClick={() => setShowChoiceModal(true)}
                      className="text-[10px] font-black bg-green-500 text-white px-5 py-2.5 rounded-xl cursor-pointer hover:bg-green-600 transition-all shadow-xl shadow-green-500/20"
                    >
                      TAKE ACTION
                    </button>
                  </div>
                )}

                {/* Items list */}
                <div className="space-y-4">
                  {order.items.map(item => (
                    <div key={item.id} className="flex justify-between items-center group">
                      <div className="flex flex-col">
                         <span className={`text-sm font-black ${darkMode ? 'text-white' : 'text-gray-800'}`}>{item.menuItem.name}</span>
                         <span className={`text-[10px] font-bold ${darkMode ? 'text-gray-500' : 'text-gray-400 uppercase'}`}>{item.quantity} Unit{item.quantity > 1 ? 's' : ''}</span>
                      </div>
                      <span className={`font-black text-sm ${darkMode ? 'text-amber-400' : 'text-gray-900'}`}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                  <div className={`flex justify-between items-center pt-5 border-t ${darkMode ? 'border-white/5' : 'border-gray-50'}`}>
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>Subtotal Amount</span>
                    <span className={`font-black text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>₹{order.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Persistent Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 z-40 bg-gradient-to-t from-black/20 to-transparent pointer-events-none">
        <div className="max-w-2xl mx-auto w-full pointer-events-auto">
          <div className={`${darkMode ? 'bg-[#151515] border-white/5 shadow-black/80' : 'bg-gray-900 border-gray-800 shadow-gray-200/50'} border rounded-3xl sm:rounded-[2.5rem] px-4 sm:px-8 py-4 sm:py-6 flex justify-between items-center shadow-2xl transition-all duration-500 min-h-[5.5rem] sm:h-24`}>
            <div className="flex flex-col">
              <p className="text-gray-500 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-0.5 sm:mb-1">Session Value</p>
               <p className="text-xl sm:text-3xl font-black text-white">₹{sessionTotal.toLocaleString('en-IN')}</p>
            </div>

            <div className="flex gap-2">
            {/* All done - can finish */}
            {allDone && !allReceived && !isPaid && (
              <button
                onClick={confirming ? undefined : handleFinishOrder}
                disabled={confirming}
                 className="bg-green-500 hover:bg-green-600 text-white font-black px-4 sm:px-7 py-3 sm:py-4 rounded-xl sm:rounded-2xl flex items-center gap-2 sm:gap-3 text-xs sm:text-sm cursor-pointer transition-all shadow-2xl shadow-green-500/30 disabled:opacity-60"
              >
                <Receipt className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
                {confirming ? 'Wait...' : 'Get Bill'}
              </button>
            )}
 
            {/* Some pending, some served - show both options */}
            {hasServed && hasPending && !isPaid && (
              <button
                onClick={() => setShowChoiceModal(true)}
                className="bg-amber-500 hover:bg-amber-600 text-white font-black px-4 sm:px-7 py-3 sm:py-4 rounded-xl sm:rounded-2xl flex items-center gap-2 sm:gap-3 text-xs sm:text-sm cursor-pointer transition-all shadow-2xl shadow-amber-500/30"
              >
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
                <span>In Kitchen</span>
              </button>
            )}
 
            {/* Nothing served yet - add more */}
            {!hasServed && !isPaid && (
              <button
                onClick={() => {
                  const menuUrl = `/${hotelId}/menu?tableId=${tableId}`;
                  window.location.href = menuUrl;
                }}
                className={`font-black px-4 sm:px-7 py-3 sm:py-4 rounded-xl sm:rounded-2xl flex items-center gap-2 sm:gap-3 text-xs sm:text-sm cursor-pointer transition-all shadow-2xl ${darkMode ? 'bg-white text-gray-900 hover:bg-gray-200 shadow-white/5' : 'bg-white text-gray-900 hover:bg-gray-100 shadow-gray-100'}`}
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={3} /> Explore
              </button>
            )}
 
            {/* Already received, awaiting payment */}
            {allReceived && !isPaid && (
              <button
                onClick={() => {
                  const billUrl = `/${hotelId}/bill?tableId=${tableId}`;
                  window.location.href = billUrl;
                }}
                className={`font-black px-4 sm:px-7 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm cursor-pointer transition-all shadow-2xl ${darkMode ? 'bg-white text-gray-900 hover:bg-gray-100 shadow-white/5' : 'bg-white text-gray-900 hover:bg-gray-100 shadow-gray-100'}`}
              >
                Pay Bill
              </button>
            )}
 
            {/* Paid */}
            {isPaid && (
              <button
                onClick={() => {
                   const menuUrl = `/${hotelId}/menu?tableId=${tableId}`;
                   window.location.href = menuUrl;
                }}
                className="bg-emerald-500 text-white font-black px-4 sm:px-7 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm cursor-pointer hover:bg-emerald-600 transition-all shadow-2xl shadow-emerald-500/30"
              >
                Re-order
              </button>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerOrderTracker;
