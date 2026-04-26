import React, { useEffect, useState } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import axios from 'axios';
import { CheckCircle, Clock, Receipt, Star } from 'lucide-react';
import { API_BASE_URL, WS_BASE_URL } from '../api/api';

const BillPage = () => {
  const { hotelId: urlHotelId } = useParams();
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get('tableId');
  const hotelId = urlHotelId;

  const [sessionOrders, setSessionOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPaid, setIsPaid] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [restaurant, setRestaurant] = useState({ taxPercentage: 0, serviceCharge: 0 });

  useEffect(() => {
    // Fetch restaurant details for tax/service charge
    axios.get(`${API_BASE_URL}/restaurant`, {
      headers: { 'X-Hotel-Id': hotelId }
    })
      .then(res => setRestaurant(res.data))
      .catch(err => console.error('Error fetching restaurant', err));

    if (!tableId) return;

    axios.get(`${API_BASE_URL}/orders/session?tableId=${tableId}`, {
      headers: { 'X-Hotel-Id': hotelId }
    })
      .then(res => {
        setSessionOrders(res.data);
        setIsPaid(res.data.every(o => o.paymentStatus === 'PAID'));
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));

    const client = new Client({
      brokerURL: WS_BASE_URL,
      onConnect: () => {
        client.subscribe(`/topic/customer/${hotelId}/${tableId}`, (message) => {
          const updated = JSON.parse(message.body);
          setSessionOrders(prev => {
            const exists = prev.find(o => o.id === updated.id);
            const next = exists ? prev.map(o => o.id === updated.id ? updated : o) : [...prev, updated];
            const allPaid = next.length > 0 && next.every(o => o.paymentStatus === 'PAID');
            if (allPaid) {
              setIsPaid(true);
              setRedirecting(true);
              setTimeout(() => {
                const sessionId = next[0]?.sessionId || sessionOrders[0]?.sessionId || '';
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
  }, [tableId, hotelId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500 font-bold italic tracking-widest animate-pulse">Loading your bill...</div>;

  const subtotal = sessionOrders.reduce((acc, o) => acc + o.totalAmount, 0);
  const taxAmount = subtotal * (parseFloat(restaurant.taxPercentage || 0) / 100);
  const serviceChargeAmount = subtotal * (parseFloat(restaurant.serviceCharge || 0) / 100);
  const grandTotal = subtotal + taxAmount + serviceChargeAmount;

  const allReceived = sessionOrders.length > 0 && sessionOrders.every(o => o.status === 'COMPLETED' || o.status === 'SERVED' || o.paymentStatus === 'PAID');

  if (redirecting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 gap-6">
        <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center shadow-2xl">
          <CheckCircle size={48} className="text-white" />
        </div>
        <h1 className="text-3xl font-black text-green-700">Payment Confirmed!</h1>
        <p className="text-gray-500 font-medium">Redirecting you to the review page...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-4 pt-8 pb-36">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Receipt size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-black text-gray-900">Your Bill</h1>
          <p className="text-gray-500 font-medium mt-1">Table {tableId} • {sessionOrders.length} order{sessionOrders.length > 1 ? 's' : ''}</p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-6 text-center space-y-1">
          <p className="text-lg font-black text-gray-900">{restaurant.name}</p>
          {restaurant.address && <p className="text-sm text-gray-500 font-medium">{restaurant.address}</p>}
          {restaurant.contactNumber && <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Ph: {restaurant.contactNumber}</p>}
          {restaurant.gstNumber && <p className="text-xs font-black uppercase tracking-widest text-gray-700">GST ID: {restaurant.gstNumber}</p>}
        </div>

        {/* Order Breakdown */}
        <div className="space-y-4 mb-6">
          {sessionOrders.map((order, idx) => (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex justify-between items-center p-4 bg-gray-50 border-b border-gray-100">
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Order #{idx + 1}</span>
                <span className={`text-[10px] font-black px-2 py-1 rounded-full ${
                  order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                  order.status === 'SERVED' ? 'bg-blue-100 text-blue-700' :
                   order.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-500'
                }`}>{order.status}</span>
              </div>
              <div className="p-4 space-y-2">
                {order.items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{item.quantity}× {item.menuItem.name}</span>
                    <span className="font-bold text-gray-800">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-gray-50">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Subtotal</span>
                   <span className="font-bold text-gray-700">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cost Breakdown Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Items Subtotal</span>
            <span className="font-black text-gray-900 text-lg">₹{subtotal.toLocaleString('en-IN')}</span>
          </div>
          {restaurant.taxPercentage > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">GST ({restaurant.taxPercentage}%)</span>
              <span className="font-bold text-gray-900">₹{taxAmount.toLocaleString('en-IN')}</span>
            </div>
          )}
          {restaurant.serviceCharge > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Service Charge ({restaurant.serviceCharge}%)</span>
              <span className="font-bold text-gray-900">₹{serviceChargeAmount.toLocaleString('en-IN')}</span>
            </div>
          )}
          <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
             <span className="text-gray-900 font-black uppercase tracking-[0.2em] text-xs">Grand Total</span>
             <span className="text-4xl font-black text-gray-900">₹{grandTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Payment Status */}
        <div className={`rounded-2xl p-6 mb-6 flex justify-between items-center ${isPaid ? 'bg-green-500 text-white' : 'bg-gray-900 text-white'}`}>
          <div className="flex items-center gap-3">
            {isPaid ? <CheckCircle size={28} /> : <Clock size={28} />}
            <span className="font-black text-xl uppercase tracking-tighter">{isPaid ? 'PAID' : 'Pending Payment'}</span>
          </div>
          {!isPaid && (
            <div className="p-3 bg-white/10 rounded-xl">
               <span className="text-[10px] font-black uppercase tracking-widest">Pay in Kitchen</span>
            </div>
          )}
        </div>

        {/* Status Message */}
        {!isPaid && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-center">
            <p className="font-bold text-blue-700 mb-1">Payment Pending</p>
            <p className="text-blue-500 text-sm font-medium">
              Please wait while our staff processes your payment. This page will update automatically.
            </p>
          </div>
        )}
        
        {isPaid && !redirecting && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center shadow-sm">
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-lg">
              <CheckCircle size={24} />
            </div>
            <h3 className="text-xl font-black text-emerald-900 mb-2">Session Complete!</h3>
            <p className="text-emerald-700 font-medium mb-6">Thank you for dining with us. We hope you had a wonderful time!</p>
            <button 
              onClick={() => {
                const sessionId = sessionOrders[0]?.sessionId || '';
                window.location.href = `/${hotelId}/review?tableId=${tableId}&sessionId=${sessionId}`;
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl transition shadow-xl shadow-emerald-100 flex items-center justify-center gap-3"
            >
              <Star size={20} fill="currentColor" /> Share Your Experience
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillPage;
