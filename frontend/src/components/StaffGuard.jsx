import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const StaffGuard = ({ children, requiredRole }) => {
    const navigate = useNavigate();
    const { hotelId } = useParams();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const isOwner = requiredRole === 'OWNER';
        const isAdmin = requiredRole === 'ADMIN';
        const isWaiter = requiredRole === 'WAITER';

        const storageKey = isOwner ? 'owner_session' : isAdmin ? 'admin_session' : isWaiter ? 'captain_session' : 'kitchen_session';
        const loginPath = isOwner ? `/${hotelId}/owner/login` : `/${hotelId}/${isAdmin ? 'admin' : isWaiter ? 'captain' : 'kitchen'}/login`;
        
        const staff = localStorage.getItem(storageKey);
        if (!staff) {
            navigate(loginPath);
            return;
        }

        const session = JSON.parse(staff);
        const today = new Date().toISOString().split('T')[0];

        // Reject stale sessions that don't carry JWT anymore.
        const token = session?.token || session?.accessToken || session?.jwt;
        if (!token) {
            localStorage.removeItem(storageKey);
            navigate(loginPath);
            return;
        }
        
        // Check if session is from today
        if (session.date !== today) {
            localStorage.removeItem(storageKey);
            navigate(loginPath);
            return;
        }

        // Check if hotel matches URL
        if (session.hotelId.toString() !== hotelId) {
            navigate(loginPath);
            return;
        }

        // Check if role matches
        if (requiredRole && session.role !== requiredRole) {
            navigate(loginPath);
            return;
        }

        setIsAuthorized(true);
    }, [navigate, requiredRole, hotelId]);

    if (!isAuthorized) return null;

    return <>{children}</>;
};

export default StaffGuard;
