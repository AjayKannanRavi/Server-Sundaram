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

  useEffect(() => {
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
  }, [tableId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500 font-bold">Loading your bill...</div>;

  const sessionTotal = sessionOrders.reduce((acc, o) => acc + o.totalAmount, 0);
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

        {/* Order Breakdown */}
        <div className="space-y-4 mb-6">
          {sessionOrders.map((order, idx) => (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex justify-between items-center p-4 bg-gray-50 border-b border-gray-100">
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Order #{idx + 1}</span>
                <span className={`text-[10px] font-black px-2 py-1 rounded-full ${
                  order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                  order.status === 'SERVED' ? 'bg-blue-100 text-blue-700' :
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

        {/* Grand Total */}
        <div className="bg-gray-900 text-white rounded-3xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Grand Total</p>
               <p className="text-4xl font-black">₹{sessionTotal.toLocaleString('en-IN')}</p>
            </div>
            <div className="text-right">
              {isPaid ? (
                <span className="flex items-center gap-2 text-green-400 font-black text-sm">
                  <CheckCircle size={20} /> PAID
                </span>
              ) : (
                <span className="flex items-center gap-2 text-yellow-400 font-bold text-sm">
                  <Clock size={20} /> Awaiting Payment
                </span>
              )}
            </div>
          </div>
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
      </div>
    </div>
  );
};

export default BillPage;
