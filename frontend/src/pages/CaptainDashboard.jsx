import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import axios from 'axios';
import { ClipboardCheck, Check, Coffee, X, LogOut, ArrowRight, Bell } from 'lucide-react';
import { API_BASE_URL, WS_BASE_URL } from '../api/api';

const CaptainDashboard = () => {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [session, setSession] = useState(() => JSON.parse(localStorage.getItem('captain_session') || '{}'));

  useEffect(() => {
    setSession(JSON.parse(localStorage.getItem('captain_session') || '{}'));
  }, []);

  const profilePhoto = session?.photoUrl || '';

  const persistStaffPhoto = async (photoUrl) => {
    if (!session?.id) return;
    const response = await axios.put(`${API_BASE_URL}/staff/${session.id}`, {
      name: session.name,
      role: session.role,
      username: session.username,
      phone: session.phone,
      password: '',
      photoUrl,
      uiTheme: session.uiTheme || ''
    });
    const nextSession = { ...session, ...response.data };
    setSession(nextSession);
    localStorage.setItem('captain_session', JSON.stringify(nextSession));
  };

  const handleProfilePhotoChange = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const photoUrl = String(reader.result || '');
      persistStaffPhoto(photoUrl).catch((err) => {
        console.error('Failed to persist captain profile photo', err);
      });
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
        // Subscribe to tenant-specific captain topic
        client.subscribe(`/topic/${hotelId}/captain`, (message) => {
          const updatedOrder = JSON.parse(message.body);
          setOrders(prev => {
            const exists = prev.find(o => o.id === updatedOrder.id);
            if (exists) {
              return prev.map(o => o.id === updatedOrder.id ? updatedOrder : o);
            }
            return [...prev, updatedOrder];
          });
        });

        // Also subscribe to kitchen and admin for updates if they change
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
    console.log(`ATTEMPT: Captain Updating Order #${orderId} to ${status}`);
    try {
      const res = await axios.put(`${API_BASE_URL}/orders/${orderId}/status?status=${status}`);
      console.log(`SUCCESS: Order #${orderId} updated to ${status}`, res.data);
    } catch (err) {
      console.error(`FAILURE: Failed to update Order #${orderId} to ${status}`, err.response?.data || err.message);
      const msg = err.response?.data?.error || 'Failed to update status.';
      alert(`Error: ${msg}`);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    try {
      await axios.put(`${API_BASE_URL}/orders/${rejectId}/status/reject`, { reason: rejectReason });
      setRejectId(null);
      setRejectReason('');
    } catch (err) {
      alert('Failed to reject order');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6 w-full md:w-auto">
          <div>
            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
              <ClipboardCheck size={32} className="text-amber-500" />
              Captain Dashboard
            </h1>
            <p className="text-gray-500 font-medium mt-1">
              Logged in as <span className="font-black text-gray-900">{session?.name || 'Captain'}</span>
            </p>
          </div>
          <label className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-200 shadow-sm bg-white cursor-pointer flex items-center justify-center text-amber-700 font-black">
            {profilePhoto ? (
              <img src={profilePhoto} alt="Captain profile" className="w-full h-full object-cover" />
            ) : (
              (session?.name || session?.username || 'C').charAt(0)
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
            >
              REFRESH
            </button>
            <button 
              onClick={() => { localStorage.removeItem('captain_session'); navigate(`/${hotelId}/captain/login`); }}
              className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition shadow-sm border border-red-100 flex items-center gap-2 font-black text-xs cursor-pointer"
            >
              <LogOut size={18} /> LOGOUT
            </button>
          </div>
        </div>
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
          <button 
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-2 rounded-xl font-black text-sm transition ${activeTab === 'pending' ? 'bg-amber-500 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
          >
            NEW ORDERS
          </button>
          <button 
            onClick={() => setActiveTab('active')}
            className={`px-6 py-2 rounded-xl font-black text-sm transition ${activeTab === 'active' ? 'bg-amber-500 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
          >
            ALL ACTIVE
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(() => {
          const filtered = orders.filter(order => {
            if (activeTab === 'pending') {
              return order.status === 'PENDING';
            } else {
              // Active: Not Completed/Rejected/Paid
              return order.status !== 'COMPLETED' && order.status !== 'REJECTED' && order.paymentStatus !== 'PAID';
            }
          }).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

          if (filtered.length === 0) {
            return (
              <div className="col-span-full text-center py-20 text-gray-400 font-bold text-xl border-2 border-dashed border-gray-200 rounded-3xl">
                {activeTab === 'pending' ? 'No new orders to check.' : 'No active orders in progress.'}
              </div>
            );
          }

          return filtered.map(order => (
            <div key={order.id} className="premium-card p-6 animate-premium relative overflow-hidden bg-white rounded-[2rem] shadow-xl border border-gray-100">
              <div className="flex justify-between items-center mb-4 border-b border-gray-50 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Order #{order.id}</h3>
                  <p className="font-medium text-amber-600">Table {order.restaurantTable ? order.restaurantTable.tableNumber : 'N/A'}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                  order.status === 'PENDING' ? 'bg-red-100 text-red-700' :
                  order.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-700' :
                  order.status === 'PREPARING' ? 'bg-orange-100 text-orange-700' :
                  order.status === 'READY' ? 'bg-green-100 text-green-700' :
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
                          <span className="bg-amber-500 text-white w-6 h-6 flex items-center justify-center rounded-lg text-xs font-black">
                            {item.quantity}
                          </span>
                          <span className="font-bold text-gray-800">{item.menuItem ? item.menuItem.name : 'Unknown Item'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Customer</span>
                  <div className="font-black text-gray-900 truncate max-w-[150px]">
                    {order.customerName || 'Walk-in'}
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Placed At</span>
                  <div className="font-black text-gray-900">
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {order.status === 'PENDING' ? (
                  <>
                    <button
                      onClick={() => updateStatus(order.id, 'ACCEPTED')}
                      className="flex-1 bg-amber-500 text-white font-black py-4 rounded-2xl hover:bg-amber-600 transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-100"
                    >
                      <ArrowRight size={20} /> PASS TO KITCHEN
                    </button>
                    <button
                      onClick={() => setRejectId(order.id)}
                      className="p-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition flex items-center justify-center cursor-pointer border-0"
                    >
                      <X size={20} />
                    </button>
                  </>
                ) : (
                  <div className="w-full text-center py-3 bg-gray-50 rounded-2xl text-gray-400 font-bold text-sm uppercase tracking-widest">
                    Status: {order.status}
                  </div>
                )}
              </div>
            </div>
          ));
        })()}
      </div>

      {rejectId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl">
            <h2 className="text-2xl font-black mb-4">Reject Order #{rejectId}</h2>
            <p className="text-gray-500 font-medium mb-6">Explain why this order is being rejected.</p>
            <textarea 
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full border-2 border-gray-100 rounded-2xl p-4 mb-6 focus:border-red-500 outline-none transition font-bold"
              placeholder="e.g. Item unavailable, kitchen closed..."
            />
            <div className="flex gap-3">
              <button 
                onClick={handleReject}
                className="flex-1 bg-red-600 text-white font-bold py-4 rounded-2xl hover:bg-red-700 cursor-pointer shadow-lg shadow-red-100"
              >Confirm Reject</button>
              <button 
                onClick={() => setRejectId(null)}
                className="flex-1 bg-gray-100 text-gray-700 font-bold py-4 rounded-2xl hover:bg-gray-200 cursor-pointer"
              >Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaptainDashboard;
