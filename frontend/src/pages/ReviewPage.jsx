import React, { useState } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import axios from 'axios';
import { Star, Send, CheckCircle } from 'lucide-react';
import { API_BASE_URL } from '../api/api';

const StarRating = ({ value, onChange, size = 32 }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map(star => (
      <button
        key={star}
        type="button"
        onClick={() => onChange(star)}
        className="transition-transform hover:scale-110 cursor-pointer"
      >
        <Star
          size={size}
          className={star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}
        />
      </button>
    ))}
  </div>
);

const ReviewPage = () => {
  const { hotelId: urlHotelId } = useParams();
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get('tableId');
  const sessionId = searchParams.get('sessionId');
  const hotelId = urlHotelId;

  const [overallRating, setOverallRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (overallRating === 0) { setError('Please select an overall rating.'); return; }
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API_BASE_URL}/reviews`, {
        sessionId,
        tableId: parseInt(tableId),
        overallRating,
        comment,
        itemRatingsJson: null,
      }, {
        headers: {
          'X-Hotel-Id': hotelId
        }
      });

      localStorage.removeItem('customer');
      setSubmitted(true);
    } catch (err) {
      setError('Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex flex-col items-center justify-center p-4 gap-6">
        <div className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center shadow-2xl shadow-yellow-100">
          <CheckCircle size={48} className="text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-4xl font-black text-gray-900 mb-2">Thank You!</h1>
          <p className="text-gray-500 font-medium text-lg">Your feedback means the world to us.</p>
        </div>
        <div className="flex gap-1 mt-2">
          {Array.from({ length: overallRating }).map((_, i) => (
            <Star key={i} size={28} className="text-yellow-400 fill-yellow-400" />
          ))}
        </div>
        <p className="text-gray-400 text-sm font-medium text-center max-w-xs">
          Your session has been logged out. Visit again by scanning the QR code for a new session.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto p-4 pt-8 pb-20">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">⭐</div>
          <h1 className="text-4xl font-black text-gray-900">Rate Your Visit</h1>
          <p className="text-gray-500 font-medium mt-2">Table {tableId} · How was your experience?</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Overall Rating */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm text-center">
            <p className="font-black text-gray-700 mb-1 text-lg">Overall Experience</p>
            <p className="text-gray-400 text-sm font-medium mb-5">How was your visit today?</p>
            <div className="flex justify-center">
              <StarRating value={overallRating} onChange={setOverallRating} size={40} />
            </div>
            {overallRating > 0 && (
              <p className="mt-3 font-bold text-gray-600 text-sm">
                {overallRating === 5 ? '🎉 Excellent!' :
                 overallRating === 4 ? '😊 Good!' :
                 overallRating === 3 ? '😐 Average' :
                 overallRating === 2 ? '😕 Poor' : '😞 Very Poor'}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <label className="font-black text-gray-700 mb-3 block">Your Feedback <span className="font-medium text-gray-400">(optional)</span></label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="w-full border-2 border-gray-100 rounded-2xl p-4 text-gray-700 font-medium focus:border-yellow-400 outline-none transition resize-none h-32"
              placeholder="Tell us what you loved or how we can improve..."
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 font-bold text-sm p-4 rounded-2xl text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-black py-5 rounded-2xl text-lg flex items-center justify-center gap-3 cursor-pointer transition shadow-lg shadow-yellow-100 disabled:opacity-60"
          >
            <Send size={22} />
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>

          <button
            type="button"
            onClick={() => {
              const menuUrl = `/${hotelId}/menu?tableId=${tableId}`;
              window.location.href = menuUrl;
            }}
            className="w-full text-gray-400 font-bold py-3 text-sm hover:text-gray-600 transition cursor-pointer"
          >
            Skip for now
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReviewPage;
