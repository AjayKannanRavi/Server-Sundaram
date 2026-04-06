import React, { useEffect, useState } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import axios from 'axios';
import { Clock, ChefHat, CheckCircle, Coffee, Plus, X, ShoppingBag, Receipt } from 'lucide-react';
import { API_BASE_URL, WS_BASE_URL } from '../api/api';

// ─────────────────────────────────────────────────
// StatusBadge helper
// ─────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = {
    PENDING:   { cls: 'bg-yellow-100 text-yellow-700', label: '⏳ Pending' },
    ACCEPTED:  { cls: 'bg-blue-100  text-blue-700',   label: '✓ Accepted' },
    PREPARING: { cls: 'bg-orange-100 text-orange-700', label: '🍳 Preparing' },
    READY:     { cls: 'bg-purple-100 text-purple-700', label: '🔔 Ready' },
    SERVED:    { cls: 'bg-green-100 text-green-700',  label: '✅ Served' },
    COMPLETED: { cls: 'bg-emerald-100 text-emerald-700', label: '✓ Completed' },
    REJECTED:  { cls: 'bg-red-100   text-red-700',    label: '✕ Rejected' },
  }[status] || { cls: 'bg-gray-100 text-gray-600', label: status };
  return <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${cfg.cls}`}>{cfg.label}</span>;
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

const StatusBar = ({ status }) => {
  if (status === 'REJECTED') return null;
  if (status === 'COMPLETED') {
    return (
      <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 font-bold text-xs p-3 rounded-xl mb-4">
        <CheckCircle size={16} /> Order completed
      </div>
    );
  }
  const cur = STATUSES.findIndex(s => s.key === status);
  return (
    <div className="flex justify-between items-center mb-6">
      {STATUSES.map((s, i) => (
        <div key={s.key} className="flex flex-col items-center gap-1">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${i <= cur ? 'bg-green-500 text-white shadow-md' : 'bg-gray-100 text-gray-300'}`}>
            {React.cloneElement(s.icon, { size: 16 })}
          </div>
          <span className={`text-[9px] font-black uppercase tracking-tighter ${i <= cur ? 'text-green-600' : 'text-gray-300'}`}>{s.label}</span>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────
// Add More / Finish Order Modal
// ─────────────────────────────────────────────────
const ChoiceModal = ({ tableId, hotelId, onClose, onFinish }) => (
  <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl">
      <div className="text-center mb-2">
        <div className="w-14 h-14 rounded-2xl bg-green-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-100">
          <Coffee size={28} className="text-white" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-1">Dishes Served!</h2>
        <p className="text-gray-500 font-medium text-sm">Your food has arrived. What would you like to do?</p>
      </div>

      <div className="space-y-3 mt-6">
        <button
          onClick={() => {
            const menuUrl = `/${hotelId}/menu?tableId=${tableId}`;
            window.location.href = menuUrl;
          }}
          className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 hover:border-blue-400 hover:bg-blue-50 transition group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-100 group-hover:bg-blue-500 flex items-center justify-center transition">
            <Plus size={20} className="text-blue-600 group-hover:text-white transition" />
          </div>
          <div className="text-left">
            <p className="font-black text-gray-900">Add More Items</p>
            <p className="text-xs font-medium text-gray-400">Order additional dishes</p>
          </div>
        </button>

        <button
          onClick={onFinish}
          className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 hover:border-green-400 hover:bg-green-50 transition group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-green-100 group-hover:bg-green-500 flex items-center justify-center transition">
            <Receipt size={20} className="text-green-600 group-hover:text-white transition" />
          </div>
          <div className="text-left">
            <p className="font-black text-gray-900">Finish Order</p>
            <p className="text-xs font-medium text-gray-400">Confirm receipt & view bill</p>
          </div>
        </button>
      </div>

      <button
        onClick={onClose}
        className="w-full mt-4 py-2 text-gray-400 text-xs font-bold hover:text-gray-600 transition cursor-pointer"
      >
        Decide later
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
    <div className="min-h-screen bg-gray-50 pb-36">
      {/* Choice modal */}
      {showChoiceModal && !isPaid && (
        <ChoiceModal
          tableId={tableId}
          hotelId={hotelId}
          onClose={() => setShowChoiceModal(false)}
          onFinish={handleFinishOrder}
        />
      )}

      <div className="max-w-2xl mx-auto p-4 pt-8">
        {/* Paid banner */}
        {isPaid && (
          <div className="bg-green-500 text-white text-center py-3 rounded-2xl mb-8 font-black tracking-widest uppercase text-sm shadow-lg shadow-green-100 flex justify-center items-center gap-2">
            <CheckCircle size={18} /> Visit Complete · Bill Paid
          </div>
        )}

        <h1 className="text-3xl font-black text-gray-900 text-center mb-1">My Orders</h1>
        <p className="text-center text-gray-400 font-medium mb-8 text-sm">
          Table {tableId} · {sessionOrders.length} order{sessionOrders.length > 1 ? 's' : ''}
        </p>

        {/* Order cards */}
        <div className="space-y-6">
          {sessionOrders.map((order, idx) => (
            <div key={order.id} className={`bg-white rounded-3xl border shadow-sm overflow-hidden transition-all ${
              order.status === 'SERVED' ? 'border-green-200 shadow-green-50' :
              order.status === 'RECEIVED' ? 'border-emerald-100' :
              order.status === 'REJECTED' ? 'border-red-100' :
              'border-gray-100'
            }`}>
              {/* Card header */}
              <div className={`flex justify-between items-center px-6 py-4 ${
                order.status === 'SERVED' ? 'bg-green-50' :
                order.status === 'COMPLETED' ? 'bg-emerald-50/50' :
                'bg-gray-50/50'
              }`}>
                <h3 className="font-black text-gray-900">Order #{idx + 1}</h3>
                <StatusBadge status={order.status} />
              </div>

              <div className="p-6">
                {/* Status bar */}
                {order.status === 'REJECTED' ? (
                  <div className="bg-red-50 text-red-800 p-3 rounded-2xl font-bold italic text-sm mb-4">
                    Rejected: {order.rejectionReason || 'Kitchen could not process this order'}
                  </div>
                ) : (
                  <StatusBar status={order.status} />
                )}

                {/* "Served – choose action" prompt per card if only this one is served */}
                {order.status === 'SERVED' && !showChoiceModal && (
                  <div className="bg-green-50 border border-green-100 rounded-2xl p-4 mb-4 flex items-center justify-between gap-3">
                    <p className="text-green-700 font-bold text-sm">This order has arrived!</p>
                    <button
                      onClick={() => setShowChoiceModal(true)}
                      className="text-xs font-black bg-green-500 text-white px-3 py-1.5 rounded-xl cursor-pointer hover:bg-green-600 transition"
                    >
                      Choose Action
                    </button>
                  </div>
                )}

                {/* Items list */}
                <div className="space-y-2">
                  {order.items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm font-medium text-gray-700">
                      <span>{item.quantity}× {item.menuItem.name}</span>
                       <span className="font-bold">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs font-bold text-gray-400 pt-2 border-t border-gray-50">
                    <span>Subtotal</span>
                     <span>₹{order.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-900 text-white rounded-3xl px-6 py-5 flex justify-between items-center shadow-xl">
            <div>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-0.5">Session Total</p>
               <p className="text-2xl font-black">₹{sessionTotal.toLocaleString('en-IN')}</p>
            </div>

            {/* All done - can finish */}
            {allDone && !allReceived && !isPaid && (
              <button
                onClick={confirming ? undefined : handleFinishOrder}
                disabled={confirming}
                className="bg-green-500 hover:bg-green-400 text-white font-black px-5 py-3 rounded-2xl flex items-center gap-2 text-sm cursor-pointer transition disabled:opacity-60"
              >
                <Receipt size={16} />
                {confirming ? 'Processing...' : 'Finish & View Bill'}
              </button>
            )}

            {/* Some pending, some served - show both options */}
            {hasServed && hasPending && !isPaid && (
              <button
                onClick={() => setShowChoiceModal(true)}
                className="bg-orange-500 hover:bg-orange-400 text-white font-black px-5 py-3 rounded-2xl flex items-center gap-2 text-sm cursor-pointer transition"
              >
                <Coffee size={16} /> Order in Progress
              </button>
            )}

            {/* Nothing served yet - add more */}
            {!hasServed && !isPaid && (
              <button
                onClick={() => {
                  const menuUrl = hotelId ? `/?tableId=${tableId}&hotelId=${hotelId}` : `/?tableId=${tableId}`;
                  window.location.href = menuUrl;
                }}
                className="bg-white text-gray-900 font-black px-5 py-3 rounded-2xl flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-100 transition"
              >
                <Plus size={16} /> Add More
              </button>
            )}

            {/* Already received, awaiting payment */}
            {allReceived && !isPaid && (
              <button
                onClick={() => {
                  const billUrl = `/${hotelId}/bill?tableId=${tableId}`;
                  window.location.href = billUrl;
                }}
                className="bg-white text-gray-900 font-black px-5 py-3 rounded-2xl text-sm cursor-pointer hover:bg-gray-100 transition"
              >
                View Bill
              </button>
            )}

            {/* Paid */}
            {isPaid && (
              <button
                onClick={() => {
                  const menuUrl = hotelId ? `/?tableId=${tableId}&hotelId=${hotelId}` : `/?tableId=${tableId}`;
                  window.location.href = menuUrl;
                }}
                className="bg-green-500 text-white font-black px-5 py-3 rounded-2xl text-sm cursor-pointer hover:bg-green-600 transition"
              >
                New Visit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerOrderTracker;
