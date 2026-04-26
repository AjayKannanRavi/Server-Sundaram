import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Smart redirect component to handle legacy or QR-style links like:
 * /login?hotelId=1&tableId=2
 * and send them to the correct path-based route:
 * /1/login?tableId=2
 */
const RedirectLogin = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const hotelId = queryParams.get('hotelId');
        const tableId = queryParams.get('tableId') || queryParams.get('tableid');

        if (hotelId) {
            // Found hotelId in query params, redirect to proper path
            let target = `/${hotelId}/login`;
            if (tableId) {
                target += `?tableId=${tableId}`;
            }
            navigate(target, { replace: true });
        } else {
            // No hotelId found, fallback to home
            navigate('/', { replace: true });
        }
    }, [navigate, location]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95),transparent_26%),radial-gradient(circle_at_top_right,rgba(224,231,255,0.85),transparent_24%),linear-gradient(180deg,#dbeafe_0%,#e0e7ff_48%,#eff6ff_100%)]">
            <div className="flex flex-col items-center gap-4 rounded-[2rem] border border-white/70 bg-white/60 px-8 py-10 shadow-[0_30px_90px_rgba(96,130,202,0.12)] backdrop-blur-2xl">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Redirecting to your table...</p>
            </div>
        </div>
    );
};

export default RedirectLogin;
