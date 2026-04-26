import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import axios from 'axios';
import { ChefHat, Check, Coffee, X, LogOut } from 'lucide-react';
import { API_BASE_URL, WS_BASE_URL } from '../api/api';

const KitchenDashboard = () => {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('live');
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [session, setSession] = useState(() => JSON.parse(localStorage.getItem('kitchen_session') || '{}'));
  const [profilePhoto, setProfilePhoto] = useState('');

  useEffect(() => {
    setSession(JSON.parse(localStorage.getItem('kitchen_session') || '{}'));
  }, []);

  useEffect(() => {
    const key = `staff_ui_prefs_${hotelId || 'global'}_KITCHEN_${session?.username || session?.name || 'user'}`;
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : null;
      setProfilePhoto(parsed?.photoUrl || '');
    } catch (err) {
      console.error('Failed to load kitchen profile photo', err);
      setProfilePhoto('');
    }
  }, [hotelId, session?.username, session?.name]);

  const handleProfilePhotoChange = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const photoUrl = String(reader.result || '');
      const key = `staff_ui_prefs_${hotelId || 'global'}_KITCHEN_${session?.username || session?.name || 'user'}`;
      const existing = (() => {
        try {
          return JSON.parse(localStorage.getItem(key) || '{}');
        } catch {
          return {};
        }
      })();
      localStorage.setItem(key, JSON.stringify({ ...existing, photoUrl }));
      setProfilePhoto(photoUrl);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (hotelId) {
      axios.defaults.headers.common['X-Hotel-Id'] = hotelId;
    }

    const fetchOrders = () => {
      axios.get(`${API_BASE_URL}/orders`)
        .then(res => setOrders(res.data))
        .catch(err => console.error(err));
    };

    fetchOrders();

    const client = new Client({
      brokerURL: WS_BASE_URL,
      onConnect: () => {
        // Subscribe to tenant-specific kitchen topic
        client.subscribe(`/topic/${hotelId}/kitchen`, (message) => {
          const updatedOrder = JSON.parse(message.body);
            setOrders(prev => {
              const exists = prev.find(o => o.id === updatedOrder.id);
              if (exists) {
                return prev.map(o => o.id === updatedOrder.id ? updatedOrder : o);
              }
              return [...prev, updatedOrder];
            });
          });
        }
      });

    client.activate();
    return () => client.deactivate();
  }, [hotelId]);

  const updateStatus = async (orderId, status) => {
    console.log(`ATTEMPT: Updating Order #${orderId} to ${status}`);
    try {
      const res = await axios.put(`${API_BASE_URL}/orders/${orderId}/status?status=${status}`);
      console.log(`SUCCESS: Order #${orderId} updated to ${status}`, res.data);
    } catch (err) {
      console.error(`FAILURE: Failed to update Order #${orderId} to ${status}`, err.response?.data || err.message);
      const msg = err.response?.data?.error || 'Failed to update status. Please check backend logs.';
      alert(`Error: ${msg}`);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    console.log(`ATTEMPT: Rejecting Order #${rejectId} with reason: ${rejectReason}`);
    try {
      const res = await axios.put(`${API_BASE_URL}/orders/${rejectId}/status/reject`, { reason: rejectReason });
      console.log(`SUCCESS: Order #${rejectId} rejected`, res.data);
      setRejectId(null);
      setRejectReason('');
    } catch (err) {
      console.error(`FAILURE: Failed to reject Order #${rejectId}`, err.response?.data || err.message);
      const msg = err.response?.data?.error || 'Failed to reject order';
      alert(`Error: ${msg}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6 w-full md:w-auto">
          <div>
            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
              <ChefHat size={32} className="text-orange-500" />
              Kitchen Dashboard
            </h1>
            <p className="text-gray-500 font-medium mt-1">
              Logged in as <span className="font-black text-gray-900">{session?.name || 'Chef'}</span>
            </p>
          </div>
          <label className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-orange-200 shadow-sm bg-white cursor-pointer flex items-center justify-center text-orange-700 font-black">
            {profilePhoto ? (
              <img src={profilePhoto} alt="Kitchen profile" className="w-full h-full object-cover" />
            ) : (
              (session?.name || session?.username || 'K').charAt(0)
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleProfilePhotoChange(e.target.files?.[0])}
            />
          </label>
          <div className="flex items-center gap-2 ml-auto md:ml-4">
            <button 
              onClick={() => {
                axios.get(`${API_BASE_URL}/orders`)
                  .then(res => setOrders(res.data))
                  .catch(err => console.error(err));
              }}
              className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition shadow-sm border border-blue-100 flex items-center gap-2 font-black text-xs cursor-pointer"
              title="Manual Refresh"
            >
              REFRESH
            </button>
            <button 
              onClick={() => { localStorage.removeItem('kitchen_session'); navigate(`/${hotelId}/kitchen/login`); }}
              className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition shadow-sm border border-red-100 flex items-center gap-2 font-black text-xs cursor-pointer"
            >
              <LogOut size={18} /> LOGOUT
            </button>
          </div>
        </div>
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
          <button 
            onClick={() => setActiveTab('live')}
            className={`px-6 py-2 rounded-xl font-black text-sm transition ${activeTab === 'live' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
          >
            LIVE ORDERS
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2 rounded-xl font-black text-sm transition ${activeTab === 'history' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
          >
            TODAY'S HISTORY
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(() => {
          const today = new Date().toISOString().split('T')[0];
          const filtered = orders.filter(order => {
            const isToday = new Date(order.createdAt).toISOString().split('T')[0] === today;
            if (activeTab === 'live') {
              return order.status !== 'PENDING' && order.status !== 'SERVED' && order.status !== 'COMPLETED' && order.status !== 'REJECTED' && order.paymentStatus !== 'PAID';
            } else {
              // History: Served/Completed or Rejected orders from today
              return isToday && (order.status === 'SERVED' || order.status === 'COMPLETED' || order.status === 'REJECTED' || order.paymentStatus === 'PAID');
            }
          }).sort((a, b) => {
             // Live: FIFO, History: LIFO (most recent first)
             return activeTab === 'live' ? new Date(a.createdAt) - new Date(b.createdAt) : new Date(b.createdAt) - new Date(a.createdAt);
          });

          if (filtered.length === 0) {
            return (
              <div className="col-span-full text-center py-20 text-gray-400 font-bold text-xl border-2 border-dashed border-gray-200 rounded-3xl">
                {activeTab === 'live' ? 'No active orders. Kitchen is clear!' : 'No historical orders for today.'}
              </div>
            );
          }

          return filtered.map(order => (
            <div key={order.id} className={`premium-card p-6 animate-premium relative overflow-hidden ${activeTab === 'history' ? 'opacity-85 grayscale-[0.2]' : ''}`}>
              {activeTab === 'history' && (
                <div className="absolute top-0 right-0 p-2">
                   <span className={`text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase ${order.status === 'REJECTED' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                     {order.status === 'REJECTED' ? 'REJECTED' : 'COMPLETED'}
                   </span>
                </div>
              )}
              <div className="flex justify-between items-center mb-4 border-b border-gray-50 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Order #{order.id}</h3>
                  <p className="font-medium text-orange-600">Table {order.restaurantTable ? order.restaurantTable.tableNumber : 'N/A'}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                  order.status === 'PENDING' ? 'bg-red-100 text-red-700' :
                  order.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-700' :
                  order.status === 'PREPARING' ? 'bg-orange-100 text-orange-700' :
                  order.status === 'READY' ? 'bg-green-100 text-green-700' :
                  order.status === 'REJECTED' ? 'bg-black text-white' :
                  'bg-gray-100 text-gray-600'
                }`}>{order.status}</span>
              </div>

              <div className="space-y-4 mb-6">
                <div className="border-b border-gray-50 pb-2">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Order Items</p>
                  <div className="space-y-2">
                    {order.items && order.items.map(item => (
                      <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3">
                          <span className="bg-orange-500 text-white w-6 h-6 flex items-center justify-center rounded-lg text-xs font-black">
                            {item.quantity}
                          </span>
                          <span className="font-bold text-gray-800">{item.menuItem ? item.menuItem.name : 'Unknown Item'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {order.rejectionReason && (
                   <div className="bg-red-50 p-3 rounded-xl border border-red-100 mb-4">
                      <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Reason for rejection</p>
                      <p className="text-sm font-bold text-red-700 italic">"{order.rejectionReason}"</p>
                   </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">
                    {activeTab === 'history' ? 'Order Time' : 'Total Bill'}
                  </span>
                  <div className="font-black text-gray-900 text-xl">
                    {activeTab === 'history' 
                      ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : `₹${order.totalAmount.toLocaleString('en-IN')}`
                    }
                  </div>
                </div>
              </div>

              {activeTab === 'live' && (
                <div className="flex gap-2">
                  {order.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => updateStatus(order.id, 'ACCEPTED')}
                        className="flex-1 bg-blue-500 text-white font-black py-4 rounded-2xl hover:bg-blue-600 transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-100"
                      >
                        <Check size={20} /> ACCEPT
                      </button>
                      <button
                        onClick={() => setRejectId(order.id)}
                        className="flex-1 bg-red-50 text-red-600 font-black py-4 rounded-2xl hover:bg-red-100 transition flex items-center justify-center gap-2 cursor-pointer border-0"
                      >
                        <X size={20} /> REJECT
                      </button>
                    </>
                  )}
                  {order.status === 'ACCEPTED' && (
                    <button
                      onClick={() => updateStatus(order.id, 'PREPARING')}
                      className="w-full bg-orange-500 text-white font-black py-5 rounded-2xl hover:bg-orange-600 transition cursor-pointer shadow-lg shadow-orange-100 text-lg uppercase tracking-widest"
                    >
                      Start Preparing
                    </button>
                  )}
                  {order.status === 'PREPARING' && (
                    <button
                      onClick={() => updateStatus(order.id, 'READY')}
                      className="w-full bg-green-500 text-white font-black py-5 rounded-2xl hover:bg-green-600 transition flex justify-center items-center gap-3 cursor-pointer shadow-lg shadow-green-100 text-lg uppercase tracking-widest"
                    >
                      <Check size={22} className="stroke-[3]" /> ORDER READY
                    </button>
                  )}
                  {order.status === 'READY' && (
                    <button
                      onClick={() => updateStatus(order.id, 'SERVED')}
                      className="w-full bg-gray-900 text-white font-black py-5 rounded-2xl hover:bg-black transition flex justify-center items-center gap-3 cursor-pointer shadow-xl text-lg uppercase tracking-widest"
                    >
                      <Coffee size={22} /> MARK AS SERVED
                    </button>
                  )}
                </div>
              )}
            </div>
          ));
        })()}
      </div>

      {rejectId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <h2 className="text-2xl font-black mb-4">Reject Order #{rejectId}</h2>
            <p className="text-gray-500 font-medium mb-6">Provide a reason for the customer.</p>
            <textarea 
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full border-2 border-gray-100 rounded-2xl p-4 mb-6 focus:border-red-500 outline-none transition"
              placeholder="e.g. Out of stock..."
            />
            <div className="flex gap-3">
              <button 
                onClick={handleReject}
                className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 cursor-pointer"
              >Confirm Reject</button>
              <button 
                onClick={() => setRejectId(null)}
                className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 cursor-pointer"
              >Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KitchenDashboard;
