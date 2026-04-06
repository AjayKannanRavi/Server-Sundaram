import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Client } from '@stomp/stompjs';
import {
  Settings, Plus, Trash2, Edit2, Package, TrendingUp, CheckCircle,
  Clock, Users, Hotel, History, Zap, ChevronRight, Star, ClipboardList,
  ArrowUpRight, ArrowDownRight, Activity, Search, Calendar, Download, Filter,
  AlertCircle, XCircle, Printer, QrCode, UserCheck, User, LogOut
} from 'lucide-react';
import * as XLSX from 'xlsx';
import HotelSaaSDashboard from './HotelSaaSDashboard';
import { API_BASE_URL, WS_BASE_URL } from '../api/api';

const API = API_BASE_URL;

const AdminMenuManager = () => {
  const { hotelId: urlHotelId } = useParams();
  const [session, setSession] = useState(null);
  
  useEffect(() => {
    const adminSession = localStorage.getItem('admin_session');
    const kitchenSession = localStorage.getItem('kitchen_session');
    const currentSession = adminSession ? JSON.parse(adminSession) : (kitchenSession ? JSON.parse(kitchenSession) : null);
    
    // Use URL hotelId as source of truth for scoping
    if (urlHotelId) {
      axios.defaults.headers.common['X-Hotel-Id'] = urlHotelId;
      if (currentSession) setSession(currentSession);
    } else if (currentSession && currentSession.hotelId) {
      axios.defaults.headers.common['X-Hotel-Id'] = currentSession.hotelId;
      setSession(currentSession);
    }
  }, [urlHotelId]);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [staff, setStaff] = useState([]);
  const [restaurant, setRestaurant] = useState({ id: null, name: '' });
  const [reviews, setReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('saas');
  const [confirmPaymentId, setConfirmPaymentId] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [showClosingModal, setShowClosingModal] = useState(false);
  const [printingSession, setPrintingSession] = useState(null);
  const [printingQRTable, setPrintingQRTable] = useState(null);
  const [closingUsages, setClosingUsages] = useState({}); // materialId -> usedQuantity
  const [menuSearch, setMenuSearch] = useState('');
  const [menuFilterCategory, setMenuFilterCategory] = useState('');
  const [menuFilterAvailability, setMenuFilterAvailability] = useState('all');
  const [historyFilterStartDate, setHistoryFilterStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [historyFilterEndDate, setHistoryFilterEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [rejectedStartDate, setRejectedStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [rejectedEndDate, setRejectedEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [historyFilterTable, setHistoryFilterTable] = useState('');
  const [historyFilterPayment, setHistoryFilterPayment] = useState('all');
  const [analyticsStartDate, setAnalyticsStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [analyticsEndDate, setAnalyticsEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [analyticsCategory, setAnalyticsCategory] = useState('all');
  const [analyticsSearch, setAnalyticsSearch] = useState('');
  const [analytics, setAnalytics] = useState({ 
    summary: { 
      dailyRevenue: 0, weeklyRevenue: 0, monthlyRevenue: 0, yearlyRevenue: 0, 
      dailyOrders: 0, monthlyOrders: 0, avgOrderValue: 0, revenueGrowth: 0,
      orderStatusBreakdown: {} 
    },
    topDishes: [],
    bottomDishes: [],
    categories: [],
    trend: [],
    peakHours: [],
    payments: [],
    reviews: { averageRating: 0, totalReviews: 0, distribution: [] },
    inventory: [] 
  });
  const [rawMaterials, setRawMaterials] = useState([]);
  const [tables, setTables] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSort, setCustomerSort] = useState('recent'); // frequent, recent, sparse
  const [showTableForm, setShowTableForm] = useState(false);
  const [tableForm, setTableForm] = useState({ tableNumber: '', status: 'AVAILABLE' });
  const [inventoryLogs, setInventoryLogs] = useState([]);
  const [invLogStart, setInvLogStart] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [invLogEnd, setInvLogEnd] = useState(new Date().toISOString().split('T')[0]);
  const [showUsageHistory, setShowUsageHistory] = useState(false);

  // Menu form state
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState(null);
  const [menuForm, setMenuForm] = useState({ name: '', description: '', price: '', available: true, categoryId: '', imageUrl: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Staff form state
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [staffForm, setStaffForm] = useState({ name: '', role: 'KITCHEN', username: '', phone: '' });

  // Raw Material form state
  const [showRawForm, setShowRawForm] = useState(false);
  const [editingRawId, setEditingRawId] = useState(null);
  const [rawForm, setRawForm] = useState({ name: '', quantity: 0, unit: 'kg' });

  useEffect(() => {
    fetchAll();
    if (!urlHotelId) return;

    const client = new Client({
      brokerURL: WS_BASE_URL,
      onConnect: () => {
        // Subscribe to tenant-specific admin topic
        client.subscribe(`/topic/${urlHotelId}/admin`, (message) => {
          const updatedOrder = JSON.parse(message.body);
          setOrders(prev => {
            const exists = prev.find(o => o.id === updatedOrder.id);
            if (exists) return prev.map(o => o.id === updatedOrder.id ? updatedOrder : o);
            return [...prev, updatedOrder];
          });
        });

        // Subscribe to tenant-specific reviews topic
        client.subscribe(`/topic/${urlHotelId}/reviews`, (message) => {
          console.log('Real-time tenant review received');
          fetchAll();
        });
      }
    });
    client.activate();
    return () => client.deactivate();
  }, [urlHotelId, analyticsStartDate, analyticsEndDate, invLogStart, invLogEnd]);

  useEffect(() => {
    if (activeTab === 'inventory') {
      fetchInventoryLogs();
    }
  }, [activeTab, invLogStart, invLogEnd]);

  const fetchInventoryLogs = async () => {
    try {
      const response = await axios.get(`${API}/analytics/inventory/logs`, {
        params: { 
          start: invLogStart + 'T00:00:00', 
          end: invLogEnd + 'T23:59:59' 
        }
      });
      setInventoryLogs(response.data);
    } catch (err) {
      console.error('Failed to fetch inventory logs', err);
    }
  };

  const handleExportCustomers = async () => {
    try {
      const response = await axios.get(`${API}/customers/export`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', "ServeSmart_Customers.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("handleExportCustomers error:", error);
      alert("Failed to export customer data.");
    }
  };

  const filteredCustomers = customers
    .filter(c => 
      (c.name?.toLowerCase() || "").includes(customerSearch.toLowerCase()) || 
      (c.mobileNumber || "").includes(customerSearch)
    )
    .sort((a, b) => {
      if (customerSort === 'frequent') return b.visitCount - a.visitCount;
      if (customerSort === 'sparse') return a.visitCount - b.visitCount;
      if (customerSort === 'recent') return new Date(b.lastVisitedDate || 0) - new Date(a.lastVisitedDate || 0);
      return 0;
    });

  const fetchAll = async () => {
    try {
      const params = { 
        start: analyticsStartDate ? `${analyticsStartDate}T00:00:00` : undefined, 
        end: analyticsEndDate ? `${analyticsEndDate}T23:59:59` : undefined 
      };
      const results = await Promise.allSettled([
        axios.get(`${API}/menu`),
        axios.get(`${API}/menu/categories`),
        axios.get(`${API}/admin/orders`),
        axios.get(`${API}/staff`),
        axios.get(`${API}/restaurant`),
        axios.get(`${API}/analytics/summary`, { params }),
        axios.get(`${API}/analytics/dishes`, { params }),
        axios.get(`${API}/analytics/categories`, { params }),
        axios.get(`${API}/analytics/trend`, { params }),
        axios.get(`${API}/tables`),
        axios.get(`${API}/analytics/yearly`), // conceptually old but keep for now
        axios.get(`${API}/reviews`),
        axios.get(`${API}/analytics/dishes/bottom`, { params }),
        axios.get(`${API}/analytics/peak-hours`, { params }),
        axios.get(`${API}/analytics/payments`, { params }),
        axios.get(`${API}/analytics/inventory`),
        axios.get(`${API}/analytics/reviews`),
        axios.get(`${API}/raw-materials`),
        axios.get(`${API}/customers/admin`),
      ]);

      const data = results.map(r => r.status === 'fulfilled' ? r.value.data : null);
      
      if (data[0]) setMenuItems(data[0]);
      if (data[1]) setCategories(data[1]);
      if (data[2]) setOrders(data[2]);
      if (data[3]) setStaff(data[3]);
      if (data[4]) setRestaurant(data[4]);
      if (data[11]) setReviews(data[11]);
      if (data[17]) setRawMaterials(data[17]);
      if (data[18]) setCustomers(data[18]);
      
      const summaryData = data[5] || { dailyRevenue: 0, weeklyRevenue: 0, monthlyRevenue: 0, dailyOrders: 0, monthlyOrders: 0, avgOrderValue: 0 };
      const yearlyData = data[10] || { revenue: 0 };
      
      setAnalytics({ 
        summary: { ...summaryData, yearlyRevenue: (data[10] && data[10].revenue) || 0 }, 
        topDishes: data[6] || [], 
        bottomDishes: data[12] || [],
        categories: data[7] || [], 
        trend: data[8] || [],
        peakHours: data[13] || [],
        payments: data[14] || [],
        inventory: data[15] || [],
        reviews: data[16] || { averageRating: 0, totalReviews: 0, distribution: [] }
      });
      if (data[9]) setTables(data[9]);

      if (data[1] && data[1].length > 0) setMenuForm(prev => ({ ...prev, categoryId: data[1][0].id }));
    } catch (err) { console.error('Fetch all failed', err); }
  };

  // --- Category Handlers ---
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API}/menu/categories`, { name: categoryName });
      setCategoryName('');
      setShowCategoryForm(false);
      await fetchAll();
      if (res.data && res.data.id) {
        setMenuForm(prev => ({ ...prev, categoryId: res.data.id }));
      }
    } catch { alert('Failed to add category'); }
  };
  const handleCategoryDelete = async (id) => {
    if (window.confirm('Delete category? All items in it will also be deleted.')) {
      await axios.delete(`${API}/menu/categories/${id}`);
      fetchAll();
    }
  };

  // --- Menu Handlers ---
  const handleMenuSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      // Add the menu item data as a JSON blob
      formData.append('item', new Blob([JSON.stringify(menuForm)], { type: 'application/json' }));
      
      // Add the image file if selected
      if (selectedFile) {
        formData.append('image', selectedFile);
      }

      if (editingMenuId) {
        await axios.put(`${API}/menu/${editingMenuId}`, formData);
      } else {
        await axios.post(`${API}/menu`, formData);
      }

      setShowMenuForm(false);
      setEditingMenuId(null);
      setMenuForm({ name: '', description: '', price: '', available: true, categoryId: categories[0]?.id || '', imageUrl: '' });
      setSelectedFile(null);
      setPreviewUrl(null);
      fetchAll();
    } catch (err) {
      console.error(err);
      alert('Failed to save item');
    }
  };
  const handleMenuEdit = (item) => {
    setEditingMenuId(item.id);
    setMenuForm({ name: item.name, description: item.description, price: item.price, available: item.available, categoryId: item.category.id, imageUrl: item.imageUrl || '' });
    setPreviewUrl(item.imageUrl);
    setSelectedFile(null);
    setShowMenuForm(true);
  };
  const handleMenuDelete = async (id) => {
    if (window.confirm('Delete this item?')) { await axios.delete(`${API}/menu/${id}`); fetchAll(); }
  };
  const toggleAvailability = async (item) => {
    try {
      await axios.put(`${API}/menu/${item.id}`, { ...item, categoryId: item.category.id, available: !item.available });
      fetchAll();
    } catch { alert('Failed to update availability'); }
  };

  // --- Staff Handlers ---
  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStaffId) await axios.put(`${API}/staff/${editingStaffId}`, staffForm);
      else await axios.post(`${API}/staff`, staffForm);
      setShowStaffForm(false); setEditingStaffId(null);
      setStaffForm({ name: '', role: 'KITCHEN', username: '', phone: '' });
      fetchAll();
    } catch { alert('Failed to save staff member'); }
  };
  const handleStaffEdit = (s) => {
    setEditingStaffId(s.id);
    setStaffForm({ name: s.name, role: s.role, username: s.username, phone: s.phone });
    setShowStaffForm(true);
  };
  const handleStaffDelete = async (id) => {
    if (window.confirm('Remove this staff member?')) { await axios.delete(`${API}/staff/${id}`); fetchAll(); }
  };

  // --- Hotel Handlers ---
  const handleTableSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { 
        tableNumber: parseInt(tableForm.tableNumber), 
        status: tableForm.status || 'AVAILABLE',
        qrCodeUrl: `http://localhost:5173/${urlHotelId}/login?tableId=${tableForm.tableNumber}`
      };
      await axios.post(`${API}/tables`, data);
      setShowTableForm(false); 
      setTableForm({ tableNumber: '', status: 'AVAILABLE' });
      fetchAll();
    } catch (err) { 
      console.error(err);
      alert('Failed to save table: ' + (err.response?.data?.error || 'Unknown error')); 
    }
  };
  const handleAutoAddTable = async () => {
    try {
      const nextNumber = tables.length > 0 ? Math.max(...tables.map(t => t.tableNumber)) + 1 : 1;
      const data = { 
        tableNumber: nextNumber, 
        status: 'AVAILABLE',
        qrCodeUrl: `http://localhost:5173/${urlHotelId}/login?tableId=${nextNumber}`
      };
      await axios.post(`${API}/tables`, data);
      fetchAll();
    } catch (err) {
      console.error(err);
      alert('Failed to auto-add table: ' + (err.response?.data?.error || 'Unknown error'));
    }
  };

  const handleTableDelete = async (id) => {
    // Deprecated for security
    alert("Tables are permanent and cannot be deleted.");
    return;
  };

  const handleGenerateQR = async (id) => {
    try {
      await axios.post(`${API}/tables/${id}/generate-qr`);
      fetchAll();
    } catch (err) {
      console.error('Failed to generate QR', err);
    }
  };
 
  const handleRestaurantSave = async (e) => {
    e.preventDefault();
    try {
      const restId = restaurant.id || 1; // Fallback to 1 if not yet fetched
      await axios.put(`${API}/restaurant/${restId}`, restaurant);
      alert('Restaurant info updated!');
      fetchAll();
    } catch (err) { 
      console.error(err);
      alert('Failed to update restaurant info'); 
    }
  };
  const handleReviewDelete = async (id) => {
    if (window.confirm('Delete this review?')) {
      try {
        await axios.delete(`${API}/reviews/${id}`);
        fetchAll();
      } catch { alert('Failed to delete review'); }
    }
  };

  // --- Raw Material Handlers ---
  const handleRawSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRawId) await axios.put(`${API}/raw-materials/${editingRawId}`, rawForm);
      else await axios.post(`${API}/raw-materials`, rawForm);
      setShowRawForm(false); setEditingRawId(null);
      setRawForm({ name: '', quantity: 0, unit: 'kg' });
      fetchAll();
    } catch { alert('Failed to save raw material'); }
  };
  const handleRawEdit = (m) => {
    setEditingRawId(m.id);
    setRawForm({ name: m.name, quantity: m.quantity, unit: m.unit });
    setShowRawForm(true);
  };
  const handleRawDelete = async (id) => {
    if (window.confirm('Delete this raw material?')) { await axios.delete(`${API}/raw-materials/${id}`); fetchAll(); }
  };

  // --- Order / Payment ---
  const markAsPaid = async () => {
    if (!selectedPaymentMethod) {
      alert('Please select a payment method');
      return;
    }
    console.log(`ATTEMPT: Marking Order #${confirmPaymentId} as PAID (Full Session settlement) with ${selectedPaymentMethod}`);
    try {
      const res = await axios.put(`${API}/orders/${confirmPaymentId}/payment`, { 
        status: 'PAID',
        paymentMethod: selectedPaymentMethod 
      });
      console.log(`SUCCESS: Order #${confirmPaymentId} and session marked as PAID`, res.data);
      setConfirmPaymentId(null);
      setSelectedPaymentMethod(null);
      fetchAll();
    } catch (err) {
      console.error(`FAILURE: Failed to mark Order #${confirmPaymentId} as paid`, err.response?.data || err.message);
      const msg = err.response?.data?.error || 'Failed to mark as paid';
      alert(`Error: ${msg}`);
    }
  };

  // --- Day Closing ---
  const handleClosingSubmit = async () => {
    const usages = Object.entries(closingUsages).map(([id, qty]) => ({
      materialId: parseInt(id),
      usedQuantity: parseFloat(qty)
    })).filter(u => u.usedQuantity > 0);

    if (usages.length === 0) {
      alert('Please enter at least one usage amount.');
      return;
    }

    try {
      await axios.post(`${API}/admin/closing`, { usages });
      alert('Day closed successfully! Stock updated.');
      setShowClosingModal(false);
      setClosingUsages({});
      fetchAll();
    } catch (err) {
      console.error('Day closing failed', err);
      alert('Failed to perform day closing.');
    }
  };

  const handleExportExcelAnalytics = async () => {
    try {
      const start = analyticsStartDate ? `${analyticsStartDate}T00:00:00` : undefined;
      const end = analyticsEndDate ? `${analyticsEndDate}T23:59:59` : undefined;
      const response = await axios.get(`${API}/analytics/export`, {
        params: { start, end },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ServeSmart_Report_${analyticsStartDate}_to_${analyticsEndDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("handleExportExcelAnalytics error:", error);
    }
  };

  const handleExportInventoryExcel = async () => {
    try {
      const response = await axios.get(`${API}/analytics/inventory/export`, {
        params: { 
          start: invLogStart + 'T00:00:00', 
          end: invLogEnd + 'T23:59:59' 
        },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Inventory_Usage_${invLogStart}_to_${invLogEnd}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("handleExportInventoryExcel error:", error);
      alert("Failed to export inventory data.");
    }
  };
  
  const handleHistoryExportExcel = async () => {
    try {
      const start = historyFilterStartDate ? `${historyFilterStartDate}T00:00:00` : undefined;
      const end = historyFilterEndDate ? `${historyFilterEndDate}T23:59:59` : undefined;
      const response = await axios.get(`${API}/analytics/export`, {
        params: { start, end },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Order_History_${historyFilterStartDate}_to_${historyFilterEndDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('History Export failed', err);
      alert('Failed to export history.');
    }
  };

  const filteredCategories = analytics.categories.filter(c => 
    analyticsCategory === 'all' || c.category === analyticsCategory
  );

  const filteredTrend = analytics.trend.filter(d => 
    (!analyticsSearch || d.date.toLowerCase().includes(analyticsSearch.toLowerCase()))
  );

  const filteredDishes = analytics.topDishes.filter(d => 
    (!analyticsSearch || d.name.toLowerCase().includes(analyticsSearch.toLowerCase()))
  );

  const filteredBottomDishes = analytics.bottomDishes.filter(d => 
    (!analyticsSearch || d.name.toLowerCase().includes(analyticsSearch.toLowerCase()))
  );
  
  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase());
    const matchesCategory = menuFilterCategory === '' || item.category?.name === menuFilterCategory;
    const matchesAvailability = menuFilterAvailability === 'all' || 
      (menuFilterAvailability === 'available' ? item.available : !item.available);
    return matchesSearch && matchesCategory && matchesAvailability;
  });
  
  const liveBills = orders.filter(o => o.paymentStatus !== 'PAID' && o.status !== 'REJECTED');
  
  // Group live bills by sessionId for unified table view
  const sessionGroups = liveBills.reduce((acc, order) => {
    const sId = order.sessionId || 'legacy-' + order.id;
    if (!acc[sId]) {
      acc[sId] = {
        sessionId: sId,
        tableNumber: order.restaurantTable?.tableNumber,
        tableId: order.restaurantTable?.id,
        orders: [],
        total: 0,
        createdAt: order.createdAt
      };
    }
    acc[sId].orders.push(order);
    acc[sId].total += order.totalAmount;
    // Keep the earliest createdAt for the session
    if (new Date(order.createdAt) < new Date(acc[sId].createdAt)) {
      acc[sId].createdAt = order.createdAt;
    }
    return acc;
  }, {});

  const groupedLiveBills = Object.values(sessionGroups).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const historyOrders = orders.filter(o => o.paymentStatus === 'PAID' || o.status === 'REJECTED');
  const totalRevenue = historyOrders.filter(o => o.paymentStatus === 'PAID').reduce((s, o) => s + o.totalAmount, 0);

  const navItems = [
    { id: 'saas', label: 'Business Overview', icon: Activity },
    { id: 'dashboard', label: 'Analytics', icon: TrendingUp },
    { id: 'menu', label: 'Menu', icon: Package },
    { id: 'live', label: 'Live Bills', icon: Zap },
    { id: 'history', label: 'History', icon: History },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'rejected', label: 'Rejected', icon: AlertCircle },
    { id: 'staff', label: 'Staff', icon: UserCheck },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'inventory', label: 'Inventory', icon: ClipboardList },
    { id: 'hotel', label: 'Hotel & Tables', icon: Hotel },
  ];

  const roleColors = { ADMIN: 'bg-purple-100 text-purple-700', KITCHEN: 'bg-orange-100 text-orange-700', WAITER: 'bg-blue-100 text-blue-700' };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-100 min-h-screen p-6 hidden md:flex flex-col gap-1">
        <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
          <Settings size={20} className="text-amber-500" /> Admin Portal
        </h2>
        
        {/* Session Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Logged in as</p>
          <p className="font-bold text-gray-800 truncate">{JSON.parse(localStorage.getItem('admin_session') || '{}').name || 'Admin'}</p>
        </div>
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`w-full cursor-pointer text-left px-4 py-3 rounded-xl font-bold transition flex items-center justify-between gap-3 ${activeTab === id ? 'bg-amber-500 text-white shadow-md shadow-amber-100' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}
          >
            <span className="flex items-center gap-3"><Icon size={18} />{label}</span>
            {activeTab === id && <ChevronRight size={16} />}
          </button>
        ))}

        <div className="mt-auto pt-6 border-t border-gray-50 flex-shrink-0 space-y-2">
          <button 
            onClick={() => window.open('/admin/login', '_blank')}
            className="w-full cursor-pointer text-left px-4 py-3 rounded-xl font-bold text-purple-600 hover:bg-purple-50 transition flex items-center gap-3"
          >
            <User size={18} /> Owner Admin Login
          </button>
          <button 
            onClick={() => { localStorage.removeItem('admin_session'); window.location.href = '/admin/login'; }}
            className="w-full cursor-pointer text-left px-4 py-3 rounded-xl font-bold text-red-500 hover:bg-red-50 transition flex items-center gap-3"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex md:hidden z-50 px-2 py-1">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)} className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-[10px] font-black cursor-pointer rounded-lg transition ${activeTab === id ? 'text-amber-600' : 'text-gray-400'}`}>
            <Icon size={18} />{label}
          </button>
        ))}
      </div>

      <div className="flex-1 p-6 md:p-10 pb-24 md:pb-10 h-screen overflow-y-auto">
        {/* ===== SAAS DASHBOARD TAB ===== */}
        {activeTab === 'saas' && (
          <HotelSaaSDashboard 
            analytics={analytics} 
            restaurant={restaurant} 
            tables={tables} 
            staff={staff} 
            setActiveTab={setActiveTab}
          />
        )}

        {/* ===== DASHBOARD TAB ===== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-1">Business Analytics</h1>
                <p className="text-gray-500 font-medium">Real-time performance and filtered insights.</p>
              </div>
              <button 
                onClick={handleExportExcelAnalytics}
                className="flex items-center gap-2 bg-amber-600 text-white px-8 py-4 rounded-3xl font-black hover:bg-amber-700 transition shadow-xl shadow-amber-100 cursor-pointer"
              >
                <Download size={22} /> Export Report
              </button>
            </div>

            {/* Analytics Filter Bar */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-wrap gap-6 items-end">
               <div className="flex-1 min-w-[200px]">
                 <label className="text-[11px] font-black uppercase text-gray-400 mb-2 block ml-1">Search Analytics</label>
                 <div className="relative">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                   <input 
                     type="text" 
                     placeholder="Search item, order, or customer..."
                     value={analyticsSearch}
                     onChange={(e) => setAnalyticsSearch(e.target.value)}
                     className="w-full bg-gray-50 border-0 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-amber-500 font-bold transition"
                   />
                 </div>
               </div>
               <div className="w-52">
                 <label className="text-[11px] font-black uppercase text-gray-400 mb-2 block ml-1">From Date</label>
                 <input 
                   type="date" 
                   value={analyticsStartDate}
                   onChange={(e) => setAnalyticsStartDate(e.target.value)}
                   className="w-full bg-gray-50 border-0 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-amber-500 font-bold transition"
                 />
               </div>
               <div className="w-52">
                 <label className="text-[11px] font-black uppercase text-gray-400 mb-2 block ml-1">To Date</label>
                 <input 
                   type="date" 
                   value={analyticsEndDate}
                   onChange={(e) => setAnalyticsEndDate(e.target.value)}
                   className="w-full bg-gray-50 border-0 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-amber-500 font-bold transition"
                 />
               </div>
               <div className="w-48">
                 <label className="text-[11px] font-black uppercase text-gray-400 mb-2 block ml-1">Scoping</label>
                 <select 
                   value={analyticsCategory}
                   onChange={(e) => setAnalyticsCategory(e.target.value)}
                   className="w-full bg-gray-50 border-0 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-amber-500 font-bold transition cursor-pointer"
                 >
                   <option value="all">Any Category</option>
                   {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                 </select>
               </div>
               <button 
                 onClick={() => { setAnalyticsStartDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); setAnalyticsEndDate(new Date().toISOString().split('T')[0]); setAnalyticsCategory('all'); setAnalyticsSearch(''); }}
                 className="p-4 rounded-2xl bg-gray-50 text-gray-400 hover:text-red-500 transition cursor-pointer border-0"
                 title="Reset Filters"
               >
                 <Filter size={20} />
               </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Revenue', value: `₹${(analytics.summary.totalRevenue || 0).toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-50' },
                { label: 'Total Orders', value: analytics.summary.totalOrders || 0, icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50' },
                { label: 'Avg Order Value', value: `₹${(analytics.summary.avgOrderValue || 0).toLocaleString('en-IN')}`, icon: Zap, color: 'text-purple-500', bg: 'bg-purple-50' },
                { label: 'Best Day Revenue', value: `₹${Math.max(...analytics.trend.map(d => d.revenue), 0).toLocaleString('en-IN')}`, icon: CheckCircle, color: 'text-orange-500', bg: 'bg-orange-50' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 ${stat.bg} rounded-2xl transition`}>
                      <stat.icon size={20} className={stat.color} />
                    </div>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{stat.label}</p>
                  <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Revenue Trend Chart */}
              <div className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="font-black text-xl text-gray-900">Revenue Performance</h3>
                  <span className="text-[10px] font-black p-2 bg-gray-50 text-gray-400 rounded-lg">TRENDING</span>
                </div>
                <div className="h-72 relative flex items-end gap-1 px-4 mb-6 border-b border-gray-100">
                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => (
                    <div 
                      key={idx} 
                      className="absolute left-0 right-0 border-t border-gray-50 z-0" 
                      style={{ bottom: `${p * 100}%` }}
                    >
                      <span className="absolute right-full mr-2 -translate-y-1/2 text-[8px] font-black text-gray-300">
                        {p === 0 ? '' : `₹${(Math.max(...analytics.trend.map(d => d.revenue), 10) * p).toFixed(0)}`}
                      </span>
                    </div>
                  ))}

                  {filteredTrend.map((day, i) => {
                    const max = Math.max(...analytics.trend.map(d => d.revenue), 10);
                    const rawHeight = (day.revenue / max) * 100;
                    // Ensure bars with revenue are visible even if small
                    const height = day.revenue > 0 ? Math.max(rawHeight, 2) : 0;
                    
                    return (
                      <div key={i} className="flex-1 h-full group/bar relative z-10">
                        <div 
                          className="w-full bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-lg transition-all duration-700 ease-out hover:from-amber-500 hover:to-amber-300 cursor-help shadow-[0_-4px_12px_rgba(245,158,11,0.15)] group-hover/bar:shadow-amber-200"
                          style={{ height: `${height}%` }}
                        >
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-gray-900 text-white text-[10px] font-bold py-2 px-4 rounded-xl opacity-0 group-hover/bar:opacity-100 transition-all duration-300 transform scale-90 group-hover/bar:scale-100 whitespace-nowrap z-20 shadow-2xl border border-white/10 backdrop-blur-md">
                             <p className="text-amber-400 text-[8px] uppercase tracking-widest mb-0.5">{day.date}</p>
                             <p className="text-sm">₹{day.revenue.toLocaleString('en-IN')}</p>
                          </div>
                        </div>
                        <div className="absolute top-full left-0 right-0 mt-3 text-[8px] font-black uppercase text-gray-400 text-center truncate px-1 group-hover/bar:text-amber-500 transition-colors">
                          {day.date.split('-').slice(1).join('/')}
                        </div>
                      </div>
                    );
                  })}
                  {filteredTrend.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-300 font-bold italic z-0">No trend data for this range</div>
                  )}
                </div>
              </div>

              {/* Category distribution */}
              <div className="lg:col-span-4 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <h3 className="font-black text-xl text-gray-900 mb-8">Revenue Scoping</h3>
                <div className="space-y-6">
                  {filteredCategories.map((cat, i) => {
                    const total = filteredCategories.reduce((s, c) => s + c.revenue, 0);
                    const pct = (cat.revenue / total) * 100;
                    const colors = ['bg-amber-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500'];
                    return (
                      <div key={i} className="animate-in slide-in-from-right duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                        <div className="flex justify-between text-xs font-black mb-2">
                          <span className="text-gray-600">{cat.category}</span>
                           <span className="text-gray-900">₹{cat.revenue.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="w-full h-3 bg-gray-50 rounded-full overflow-hidden">
                          <div className={`h-full ${colors[i % colors.length]} transition-all duration-1000`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {filteredCategories.length === 0 && <p className="text-gray-400 italic text-center py-10 font-bold">No category data</p>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Best Sellers */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative">
                <div className="flex justify-between items-center mb-8">
                   <h3 className="font-black text-xl text-gray-900 flex items-center gap-2">
                     <Star size={20} className="text-yellow-500 fill-yellow-500" /> Best Sellers
                   </h3>
                   <span className="text-[10px] font-black p-2 bg-yellow-50 text-yellow-600 rounded-lg uppercase tracking-widest">Performance</span>
                </div>
                <div className="space-y-3">
                  {filteredDishes.slice(0, 5).map((dish, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition border border-transparent hover:border-gray-100 group">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-sm group-hover:bg-amber-500 group-hover:text-white transition-colors">{i + 1}</div>
                      <div className="flex-1">
                        <p className="font-black text-gray-900 text-sm">{dish.name}</p>
                        <p className="text-[10px] font-bold text-gray-400">{dish.quantity} units sold</p>
                      </div>
                      <p className="font-black text-gray-900">₹{(dish.revenue || 0).toLocaleString('en-IN')}</p>
                    </div>
                  ))}
                  {filteredDishes.length === 0 && <p className="text-gray-400 italic text-center py-10 font-bold">No best sellers match your filters</p>}
                </div>
              </div>

              {/* Poor Performers */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative">
                <div className="flex justify-between items-center mb-8">
                   <h3 className="font-black text-xl text-gray-900 flex items-center gap-2">
                     <TrendingUp size={20} className="text-red-400 rotate-180" /> Low Traction Items
                   </h3>
                   <span className="text-[10px] font-black p-2 bg-red-50 text-red-600 rounded-lg uppercase tracking-widest">Action Needed</span>
                </div>
                <div className="space-y-3">
                  {[...filteredDishes].reverse().slice(0, 5).map((dish, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition border border-transparent hover:border-gray-100">
                      <div className="w-10 h-10 rounded-xl bg-red-50 text-red-400 flex items-center justify-center font-black text-sm">{i + 1}</div>
                      <div className="flex-1">
                        <p className="font-black text-gray-900 text-sm">{dish.name}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{dish.quantity} sold</p>
                      </div>
                      <p className="font-black text-gray-400 italic">₹{(dish.revenue || 0).toLocaleString('en-IN')}</p>
                    </div>
                  ))}
                  {filteredDishes.length === 0 && <p className="text-gray-400 italic text-center py-10 font-bold">No results match</p>}
                </div>
              </div>
            </div>
          </div>
        )}
        {/* ===== MENU TAB ===== */}
        {activeTab === 'menu' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-black text-gray-900">Menu Management</h1>
                <div className="flex gap-2">
                  <button onClick={() => setShowCategoryForm(!showCategoryForm)} className="bg-gray-100 text-gray-600 px-5 py-2.5 rounded-xl font-bold hover:bg-gray-200 transition flex items-center gap-2">
                    <Settings size={18} /> Categories
                  </button>
                  <button onClick={() => { setEditingMenuId(null); setShowMenuForm(true); }} className="bg-amber-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-amber-700 cursor-pointer transition flex items-center gap-2 shadow-lg shadow-amber-100">
                    <Plus size={18} /> Add Item
                  </button>
                </div>
              </div>

              {showCategoryForm && (
                <div className="bg-white p-6 rounded-2xl border border-gray-100 mb-8 shadow-sm animate-in slide-in-from-top duration-300">
                  <h3 className="font-black text-sm text-gray-400 uppercase tracking-widest mb-4">Manage Categories</h3>
                  <form onSubmit={handleCategorySubmit} className="flex gap-2 mb-6">
                    <input 
                      required 
                      value={categoryName} 
                      onChange={e => setCategoryName(e.target.value)} 
                      className="flex-1 bg-gray-50 border-0 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500 font-bold" 
                      placeholder="New Category (e.g. Starters)" 
                    />
                    <button type="submit" className="bg-black text-white px-6 py-2.5 rounded-xl font-bold hover:bg-gray-800 transition">Add</button>
                  </form>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(c => (
                      <div key={c.id} className="bg-gray-50 px-4 py-2 rounded-xl flex items-center gap-3 border border-gray-100">
                        <span className="font-bold text-gray-700">{c.name}</span>
                        <button onClick={() => handleCategoryDelete(c.id)} className="text-red-400 hover:text-red-600 transition"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Advanced Menu Filters */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mb-8 flex flex-wrap gap-4 items-center animate-in slide-in-from-top duration-300">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 block">Search Item</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search items..." 
                      value={menuSearch}
                      onChange={(e) => setMenuSearch(e.target.value)}
                      className="w-full bg-gray-50 border-0 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-amber-500 font-bold"
                    />
                  </div>
                </div>
                <div className="w-48">
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 block">Category</label>
                  <select 
                    value={menuFilterCategory}
                    onChange={(e) => setMenuFilterCategory(e.target.value)}
                    className="w-full bg-gray-50 border-0 rounded-xl py-3 px-4 focus:ring-2 focus:ring-amber-500 font-bold"
                  >
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="w-48">
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 block">Status</label>
                  <select 
                    value={menuFilterAvailability}
                    onChange={(e) => setMenuFilterAvailability(e.target.value)}
                    className="w-full bg-gray-50 border-0 rounded-xl py-3 px-4 focus:ring-2 focus:ring-amber-500 font-bold"
                  >
                    <option value="all">Any Availability</option>
                    <option value="available">Available</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>
              </div>
              {showMenuForm && (
                <form onSubmit={handleMenuSubmit} className="bg-white p-6 rounded-2xl border border-gray-100 mb-8 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2"><label className="font-bold text-sm text-gray-500 mb-1 block">Item Name</label><input required value={menuForm.name} onChange={e => setMenuForm({ ...menuForm, name: e.target.value })} className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-amber-500 outline-none transition" placeholder="e.g. Margherita Pizza" /></div>
                    <div className="md:col-span-2"><label className="font-bold text-sm text-gray-500 mb-1 block">Description</label><input required value={menuForm.description} onChange={e => setMenuForm({ ...menuForm, description: e.target.value })} className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-amber-500 outline-none transition" /></div>
                    <div className="md:col-span-2">
                        <label className="font-bold text-sm text-gray-500 mb-1 block">Food Image</label>
                        <div className="flex flex-col md:flex-row gap-4 items-start">
                          <div className="w-full md:w-48 h-32 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative group">
                            {previewUrl ? (
                              <>
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                  <label className="cursor-pointer text-white text-xs font-bold bg-white/20 px-3 py-1.5 rounded-lg border border-white/40">Change</label>
                                </div>
                              </>
                            ) : (
                              <div className="text-gray-400 flex flex-col items-center gap-1">
                                <Plus size={24} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Upload Photo</span>
                              </div>
                            )}
                            <input 
                              type="file" 
                              className="absolute inset-0 opacity-0 cursor-pointer" 
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  setSelectedFile(file);
                                  setPreviewUrl(URL.createObjectURL(file));
                                }
                              }}
                            />
                          </div>
                          <div className="flex-1 w-full">
                            <label className="font-bold text-[10px] text-gray-400 mb-1 block uppercase tracking-widest">Or Image URL</label>
                            <input value={menuForm.imageUrl} onChange={e => setMenuForm({ ...menuForm, imageUrl: e.target.value })} className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-amber-500 outline-none transition text-sm" placeholder="Paste Unsplash or external URL" />
                            <p className="text-[10px] text-gray-400 mt-2 italic font-medium">Tip: Direct upload is recommended for the best experience.</p>
                          </div>
                        </div>
                    </div>
                    <div><label className="font-bold text-sm text-gray-500 mb-1 block">Price (₹)</label><input type="number" step="1" required value={menuForm.price} onChange={e => setMenuForm({ ...menuForm, price: e.target.value })} className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-amber-500 outline-none transition" /></div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-bold text-sm text-gray-500 block">Category</label>
                        {!showCategoryForm && (
                          <button type="button" onClick={() => setShowCategoryForm(true)} className="text-xs font-bold text-amber-600 hover:text-amber-700 cursor-pointer">
                            + New Category
                          </button>
                        )}
                      </div>
                      {categories.length === 0 ? (
                        <div className="w-full border-2 border-red-100 bg-red-50 p-3 rounded-xl text-red-600 text-sm font-bold flex flex-col gap-2">
                          No categories exist. Please create one first!
                          <button type="button" onClick={() => setShowCategoryForm(true)} className="bg-red-600 text-white py-2 px-4 rounded-lg self-start cursor-pointer hover:bg-red-700 transition shadow-sm">Create Category</button>
                        </div>
                      ) : (
                        <select required value={menuForm.categoryId} onChange={e => setMenuForm({ ...menuForm, categoryId: e.target.value })} className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-amber-500 outline-none transition bg-white">
                          <option value="" disabled>Select a category</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      )}
                    </div>
                  </div>
                  <div className="mt-6 gap-3 flex">
                    <button type="submit" className="flex-1 bg-black text-white py-3 rounded-xl font-bold cursor-pointer hover:bg-gray-800 transition">Save</button>
                    <button type="button" onClick={() => setShowMenuForm(false)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl cursor-pointer transition">Cancel</button>
                  </div>
                </form>
              )}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100"><tr><th className="p-5 font-black text-gray-400 text-xs uppercase tracking-widest">Item</th><th className="p-5 font-black text-gray-400 text-xs uppercase tracking-widest text-center">Price</th><th className="p-5 font-black text-gray-400 text-xs uppercase tracking-widest text-center">Availability</th><th className="p-5 text-right font-black text-gray-400 text-xs uppercase tracking-widest">Actions</th></tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredMenuItems.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition">
                        <td className="p-5">
                          <div className="flex items-center gap-3">
                            <img src={item.imageUrl || '/food_placeholder.png'} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-gray-100" onError={e => e.target.src = '/food_placeholder.png'} loading="lazy" />
                            <div>
                              <div className="font-bold text-gray-900">{item.name}</div>
                              <div className="text-xs font-bold text-amber-600 mt-0.5">{item.category.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-5 text-center font-black text-gray-700">₹{(item.price || 0).toLocaleString('en-IN')}</td>
                        <td className="p-5 text-center">
                           <button 
                             onClick={() => toggleAvailability(item)}
                             className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest transition-all cursor-pointer ${item.available ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                           >
                             {item.available ? 'AVAILABLE' : 'OUT OF STOCK'}
                           </button>
                        </td>
                        <td className="p-5 flex gap-1 justify-end">
                          <button onClick={() => handleMenuEdit(item)} className="text-blue-500 p-2 hover:bg-blue-50 rounded-lg cursor-pointer transition"><Edit2 size={16} /></button>
                          <button onClick={() => handleMenuDelete(item.id)} className="text-red-500 p-2 hover:bg-red-50 rounded-lg cursor-pointer transition"><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-gray-900 rounded-3xl p-6 text-white">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="font-bold flex items-center gap-2"><Zap size={16} className="text-yellow-400" /> Live Activity</h2>
                  <span className="text-[10px] bg-white/10 px-2 py-1 rounded-lg font-bold text-gray-400">LIVE</span>
                </div>
                <div className="space-y-3">
                  {groupedLiveBills.slice(0, 5).map(session => (
                    <div key={session.sessionId} className="p-3 rounded-2xl bg-white/5 border border-white/10">
                      <div className="flex justify-between mb-1">
                        <span className="font-black">Table {session.tableNumber}</span>
                        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-lg text-gray-400">
                          {session.orders.length} order{session.orders.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="font-bold text-amber-400">₹{session.total.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  ))}
                  {groupedLiveBills.length === 0 && <p className="text-gray-500 text-center py-8 font-bold italic text-sm">All clear!</p>}
                </div>
                <button onClick={() => setActiveTab('live')} className="w-full mt-5 bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 rounded-2xl transition text-sm cursor-pointer">View Live Bills →</button>
              </div>
              <div className="bg-white rounded-3xl p-6 border border-gray-100">
                <h3 className="font-black text-gray-400 text-xs uppercase tracking-widest mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-gray-500 font-medium">Live Bills</span><span className="font-black text-orange-500">{liveBills.length}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500 font-medium">Staff Members</span><span className="font-black text-gray-900">{staff.length}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500 font-medium">Menu Items</span><span className="font-black text-gray-900">{menuItems.length}</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== LIVE BILLS TAB ===== */}
        {activeTab === 'live' && (
          <div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">Live Bills</h1>
            <p className="text-gray-500 font-medium mb-8">Active orders that are unpaid and not rejected.</p>
            <div className="space-y-4">
              {groupedLiveBills.map(session => {
                const isAnyPending = session.orders.some(o => o.status === 'PENDING');
                const isAllReady = session.orders.every(o => o.status === 'READY');
                
                return (
                  <div key={session.sessionId} className={`p-6 bg-white rounded-2xl border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${isAnyPending ? 'border-orange-200 ring-1 ring-orange-100' : 'border-gray-100'}`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-black text-xl text-gray-900">Table {session.tableNumber}</h3>
                        <span className={`text-xs font-black px-3 py-1 rounded-full ${isAnyPending ? 'bg-orange-100 text-orange-700' : isAllReady ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                          {session.orders.length} Part{session.orders.length > 1 ? 's' : 'ly'}
                        </span>
                      </div>
                      <p className="text-gray-600 font-medium">Session started at {new Date(session.createdAt).toLocaleTimeString()}</p>
                      
                      <div className="mt-4 space-y-3">
                        {session.orders.map((order, idx) => (
                          <div key={order.id} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Order #{idx + 1} ({order.status})</span>
                               <span className="font-bold text-gray-700">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {order.items?.map(item => (
                                <span key={item.id} className="text-[10px] bg-white text-gray-500 font-bold px-1.5 py-0.5 rounded border border-gray-100">{item.quantity}× {item.menuItem?.name}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="text-left md:text-right min-w-[200px] flex flex-col gap-2">
                      <div className="flex justify-between items-center mb-1">
                        <button 
                          onClick={() => { setPrintingSession(session); setTimeout(() => window.print(), 500); }}
                          className="bg-white text-gray-500 hover:text-blue-600 p-2.5 rounded-xl border border-gray-100 shadow-sm transition cursor-pointer flex items-center justify-center gap-2 text-xs font-black uppercase"
                          title="Print Thermal Bill"
                        >
                          <Printer size={18} /> Print Bill
                        </button>
                        <p className="font-black text-3xl text-gray-900">₹{session.total.toLocaleString('en-IN')}</p>
                      </div>
                      <button 
                        onClick={() => setConfirmPaymentId(session.orders[0].id)} 
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 px-6 rounded-xl cursor-pointer transition shadow-lg shadow-amber-100"
                      >
                        Settle Full Bill
                      </button>
                    </div>
                  </div>
                );
              })}
              {groupedLiveBills.length === 0 && <div className="text-center py-20 text-gray-400 font-bold text-xl border-2 border-dashed border-gray-200 rounded-3xl">No active bills right now.</div>}
            </div>
          </div>
        )}

        {/* ===== HISTORY TAB ===== */}
        {activeTab === 'history' && (
          <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-black text-gray-900 mb-1">Order History</h1>
                <p className="text-gray-500 font-medium">Full session lifecycle — paid orders grouped by visit.</p>
              </div>
              {(() => {
                const paid = orders.filter(o => o.paymentStatus === 'PAID' || o.status === 'REJECTED');
                const sessionMap = paid.reduce((acc, order) => {
                  const sId = order.sessionId || 'legacy-' + order.id;
                  if (!acc[sId]) {
                    acc[sId] = {
                      sessionId: sId,
                      tableNumber: order.restaurantTable?.tableNumber,
                      orders: [],
                      total: 0,
                      paymentMethod: order.paymentMethod,
                      createdAt: order.createdAt
                    };
                  }
                  acc[sId].orders.push(order);
                  if (order.paymentStatus === 'PAID') acc[sId].total += order.totalAmount;
                  if (new Date(order.createdAt) < new Date(acc[sId].createdAt)) {
                    acc[sId].createdAt = order.createdAt;
                  }
                  return acc;
                }, {});

                const sessions = Object.values(sessionMap).filter(session => {
                   // Fix: Use local date parts to avoid UTC shift
                   const d = new Date(session.createdAt);
                   const sDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                   
                   const matchesDate = (!historyFilterStartDate || sDate >= historyFilterStartDate) && 
                                      (!historyFilterEndDate || sDate <= historyFilterEndDate);
                   const matchesTable = historyFilterTable === '' || session.tableNumber?.toString() === historyFilterTable;
                   const matchesPayment = historyFilterPayment === 'all' || session.paymentMethod === historyFilterPayment;
                   return matchesDate && matchesTable && matchesPayment;
                }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                return (
                  <button 
                    onClick={handleHistoryExportExcel}
                    disabled={sessions.length === 0}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black transition shadow-lg ${
                      sessions.length > 0 ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-amber-100 cursor-pointer' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Download size={20} /> Export Excel
                  </button>
                );
              })()}
            </div>

            {/* History Filters */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mb-8 flex flex-wrap gap-4 items-center">
               <div className="w-44">
                 <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 block">From Date</label>
                 <div className="relative">
                   <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                   <input 
                     type="date" 
                     value={historyFilterStartDate}
                     onChange={(e) => setHistoryFilterStartDate(e.target.value)}
                     className="w-full bg-gray-50 border-0 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-amber-500 font-bold text-sm"
                   />
                 </div>
               </div>
               <div className="w-44">
                 <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 block">To Date</label>
                 <div className="relative">
                   <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                   <input 
                     type="date" 
                     value={historyFilterEndDate}
                     onChange={(e) => setHistoryFilterEndDate(e.target.value)}
                     className="w-full bg-gray-50 border-0 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-amber-500 font-bold text-sm"
                   />
                 </div>
               </div>
               <div className="w-32">
                 <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 block">Table</label>
                 <select 
                   value={historyFilterTable}
                   onChange={(e) => setHistoryFilterTable(e.target.value)}
                   className="w-full bg-gray-50 border-0 rounded-xl py-3 px-4 focus:ring-2 focus:ring-amber-500 font-bold"
                 >
                   <option value="">All Tables</option>
                   {tables.map(t => <option key={t.id} value={t.tableNumber}>{t.tableNumber}</option>)}
                 </select>
               </div>
               <div className="w-40">
                 <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 block">Payment</label>
                 <select 
                   value={historyFilterPayment}
                   onChange={(e) => setHistoryFilterPayment(e.target.value)}
                   className="w-full bg-gray-50 border-0 rounded-xl py-3 px-4 focus:ring-2 focus:ring-amber-500 font-bold"
                 >
                   <option value="all">Any Method</option>
                   <option value="CASH">Cash</option>
                   <option value="UPI">UPI</option>
                   <option value="CARD">Card</option>
                 </select>
               </div>
               <button 
                 onClick={() => { setHistoryFilterStartDate(new Date().toISOString().split('T')[0]); setHistoryFilterEndDate(new Date().toISOString().split('T')[0]); setHistoryFilterTable(''); setHistoryFilterPayment('all'); }}
                 className="mt-5 text-[10px] font-black uppercase text-gray-400 hover:text-red-500 transition cursor-pointer"
               >
                 Clear Filters
               </button>
            </div>
            
            {/* Group paid orders by session */}
            {(() => {
              const paid = orders.filter(o => o.paymentStatus === 'PAID' || o.status === 'REJECTED');
              const sessionMap = paid.reduce((acc, order) => {
                const sId = order.sessionId || 'legacy-' + order.id;
                if (!acc[sId]) {
                  acc[sId] = {
                    sessionId: sId,
                    tableNumber: order.restaurantTable?.tableNumber,
                    orders: [],
                    total: 0,
                    paymentMethod: order.paymentMethod,
                    createdAt: order.createdAt
                  };
                }
                acc[sId].orders.push(order);
                if (order.paymentStatus === 'PAID') acc[sId].total += order.totalAmount;
                if (new Date(order.createdAt) < new Date(acc[sId].createdAt)) {
                  acc[sId].createdAt = order.createdAt;
                }
                return acc;
              }, {});

              const sessions = Object.values(sessionMap).filter(session => {
                const sDate = new Date(session.createdAt).toISOString().split('T')[0];
                const matchesDate = (!historyFilterStartDate || sDate >= historyFilterStartDate) && 
                                   (!historyFilterEndDate || sDate <= historyFilterEndDate);
                const matchesTable = historyFilterTable === '' || session.tableNumber?.toString() === historyFilterTable;
                const matchesPayment = historyFilterPayment === 'all' || session.paymentMethod === historyFilterPayment;
                return matchesDate && matchesTable && matchesPayment;
              }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
              
              if (sessions.length === 0) return (
                <div className="text-center py-20 text-gray-400 font-bold text-xl border-2 border-dashed border-gray-200 rounded-3xl">No order history yet.</div>
              );

              return (
                <div className="space-y-6">
                  {sessions.map(session => (
                    <div key={session.sessionId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      {/* Session header */}
                      <div className="flex justify-between items-center bg-gray-50 px-6 py-4 border-b border-gray-100">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-black text-xl text-gray-900">Table {session.tableNumber}</h3>
                            <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                              <CheckCircle size={10} /> PAID {session.paymentMethod && `(${session.paymentMethod})`}
                            </span>
                            <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                              {session.orders.length} order{session.orders.length > 1 ? 's' : ''}
                            </span>
                          </div>
                          <p className="text-gray-500 text-sm font-medium mt-0.5">
                            {new Date(session.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                           <p className="font-black text-2xl text-gray-900">₹{session.total.toLocaleString('en-IN')}</p>
                           <button 
                             onClick={() => { setPrintingSession(session); setTimeout(() => window.print(), 500); }}
                             className="bg-white text-gray-400 hover:text-blue-600 p-2 rounded-xl border border-gray-100 shadow-sm transition cursor-pointer"
                             title="Print Thermal Bill"
                           >
                             <Printer size={20} />
                           </button>
                        </div>
                      </div>

                      {/* Per-order breakdown */}
                      <div className="p-6 space-y-4">
                        {session.orders.map((order, idx) => (
                          <div key={order.id} className={`rounded-xl border p-4 ${
                            order.status === 'REJECTED' ? 'border-red-100 bg-red-50' : 'border-gray-100 bg-gray-50'
                          }`}>
                            <div className="flex justify-between items-center mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Order #{idx + 1}</span>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                  order.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                  order.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700':
                                  'bg-amber-100 text-amber-700'
                                }`}>
                                  {order.status}
                                </span>
                              </div>
                              <span className="font-bold text-gray-700">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                            </div>
                            {order.rejectionReason && (
                              <p className="text-xs text-red-600 font-bold italic mb-2">Reason: "{order.rejectionReason}"</p>
                            )}
                            <div className="flex flex-wrap gap-1.5">
                              {order.items?.map(item => (
                                <span key={item.id} className="text-[10px] bg-white text-gray-600 font-bold px-2 py-0.5 rounded-lg border border-gray-100">
                                  {item.quantity}× {item.menuItem?.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* ===== REJECTED ORDERS TAB ===== */}
        {activeTab === 'rejected' && (
          <div className="animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-black text-gray-900 mb-1 flex items-center gap-3">
                  <AlertCircle size={32} className="text-red-500" />
                  Rejected Orders
                </h1>
                <p className="text-gray-500 font-medium">Orders declined by the kitchen with reasons.</p>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mb-8 flex flex-wrap gap-4 items-center">
               <div className="w-44">
                 <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 block">From Date</label>
                 <div className="relative">
                   <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                   <input 
                     type="date" 
                     value={rejectedStartDate}
                     onChange={(e) => setRejectedStartDate(e.target.value)}
                     className="w-full bg-gray-50 border-0 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-red-500 font-bold text-sm"
                   />
                 </div>
               </div>
               <div className="w-44">
                 <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 block">To Date</label>
                 <div className="relative">
                   <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                   <input 
                     type="date" 
                     value={rejectedEndDate}
                     onChange={(e) => setRejectedEndDate(e.target.value)}
                     className="w-full bg-gray-50 border-0 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-red-500 font-bold text-sm"
                   />
                 </div>
               </div>
               <button 
                 onClick={() => { setRejectedStartDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); setRejectedEndDate(new Date().toISOString().split('T')[0]); }}
                 className="mt-5 text-[10px] font-black uppercase text-gray-400 hover:text-red-500 transition cursor-pointer"
               >
                 Reset Dates
               </button>
            </div>

            <div className="space-y-4">
               {(() => {
                 const rejectedItems = orders.filter(o => {
                   const sDate = new Date(o.createdAt).toISOString().split('T')[0];
                   const matchesDate = (!rejectedStartDate || sDate >= rejectedStartDate) && 
                                      (!rejectedEndDate || sDate <= rejectedEndDate);
                   return o.status === 'REJECTED' && matchesDate;
                 }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                 if (rejectedItems.length === 0) {
                   return (
                     <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                        <AlertCircle size={48} className="text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-400 font-bold">No rejected orders found in this range.</p>
                     </div>
                   );
                 }

                 return rejectedItems.map(order => (
                   <div key={order.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col lg:flex-row gap-6 hover:border-red-100 transition">
                      <div className="lg:w-48">
                         <div className="flex justify-between items-start mb-2">
                           <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Order #{order.id}</span>
                           <span className="text-[10px] bg-red-50 text-red-600 font-black px-2 py-0.5 rounded-lg border border-red-100">REJECTED</span>
                         </div>
                         <h3 className="text-2xl font-black text-gray-900 mb-1">Table {order.restaurantTable?.tableNumber || 'N/A'}</h3>
                         <p className="text-xs text-gray-500 font-medium">{new Date(order.createdAt).toLocaleString()}</p>
                      </div>

                      <div className="flex-1 space-y-3">
                         <div className="flex flex-wrap gap-2">
                            {order.items?.map(item => (
                              <div key={item.id} className="bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 flex items-center gap-2">
                                <span className="bg-gray-200 text-gray-700 w-5 h-5 flex items-center justify-center rounded-lg text-[10px] font-black">{item.quantity}</span>
                                <span className="text-xs font-black text-gray-700">{item.menuItem?.name}</span>
                              </div>
                            ))}
                         </div>
                         <div className="bg-red-50 p-4 rounded-2xl border border-red-100 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition">
                               <XCircle size={40} className="text-red-500" />
                            </div>
                            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1.5">Reason for Rejection</p>
                            <p className="text-sm font-black text-red-700 italic leading-relaxed">
                               {order.rejectionReason || "No specific reason provided."}
                            </p>
                         </div>
                      </div>

                      <div className="lg:w-32 lg:text-right flex lg:flex-col justify-between items-center lg:items-end">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Impact</p>
                         <p className="text-xl font-black text-gray-400 line-through decoration-red-300">₹{order.totalAmount.toLocaleString('en-IN')}</p>
                      </div>
                   </div>
                 ));
               })()}
            </div>
          </div>
        )}

        {/* ===== STAFF TAB ===== */}
        {activeTab === 'staff' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <div><h1 className="text-3xl font-black text-gray-900">Staff Management</h1><p className="text-gray-500 font-medium mt-1">Manage your restaurant team.</p></div>
              <button onClick={() => { setEditingStaffId(null); setStaffForm({ name: '', role: 'KITCHEN', username: '', phone: '' }); setShowStaffForm(true); }} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 cursor-pointer flex items-center gap-2 shadow-lg shadow-blue-100 transition">
                <Plus size={18} /> Add Staff
              </button>
            </div>
            {showStaffForm && (
              <form onSubmit={handleStaffSubmit} className="bg-white p-6 rounded-2xl border border-gray-100 mb-8 shadow-sm">
                <h3 className="font-black text-lg mb-4">{editingStaffId ? 'Edit Staff' : 'New Staff Member'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="font-bold text-sm text-gray-500 mb-1 block">Full Name</label><input required value={staffForm.name} onChange={e => setStaffForm({ ...staffForm, name: e.target.value })} className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-blue-500 outline-none transition" placeholder="e.g. John Doe" /></div>
                  <div><label className="font-bold text-sm text-gray-500 mb-1 block">Role</label><select value={staffForm.role} onChange={e => setStaffForm({ ...staffForm, role: e.target.value })} className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-blue-500 outline-none transition bg-white"><option value="ADMIN">Admin</option><option value="KITCHEN">Kitchen</option><option value="WAITER">Waiter</option></select></div>
                  <div><label className="font-bold text-sm text-gray-500 mb-1 block">Username</label><input required value={staffForm.username} onChange={e => setStaffForm({ ...staffForm, username: e.target.value })} className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-blue-500 outline-none transition" placeholder="john.doe" /></div>
                  <div><label className="font-bold text-sm text-gray-500 mb-1 block">Phone</label><input required value={staffForm.phone} onChange={e => setStaffForm({ ...staffForm, phone: e.target.value })} className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-blue-500 outline-none transition" placeholder="+1 234 567 890" /></div>
                </div>
                <div className="mt-6 flex gap-3">
                  <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold cursor-pointer hover:bg-blue-700 transition">Save</button>
                  <button type="button" onClick={() => setShowStaffForm(false)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl cursor-pointer transition">Cancel</button>
                </div>
              </form>
            )}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100"><tr><th className="p-5 font-black text-gray-400 text-xs uppercase tracking-widest">Name</th><th className="p-5 font-black text-gray-400 text-xs uppercase tracking-widest">Role</th><th className="p-5 font-black text-gray-400 text-xs uppercase tracking-widest">Username</th><th className="p-5 font-black text-gray-400 text-xs uppercase tracking-widest">Phone</th><th className="p-5 font-black text-gray-400 text-xs uppercase tracking-widest text-right">Actions</th></tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {staff.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition">
                      <td className="p-5 font-bold text-gray-900">{s.name}</td>
                      <td className="p-5"><span className={`text-xs font-black px-3 py-1.5 rounded-full ${roleColors[s.role] || 'bg-gray-100 text-gray-600'}`}>{s.role}</span></td>
                      <td className="p-5 text-gray-500 font-medium">{s.username}</td>
                      <td className="p-5 text-gray-500 font-medium">{s.phone}</td>
                      <td className="p-5 flex gap-1 justify-end">
                        <button onClick={() => handleStaffEdit(s)} className="text-blue-500 p-2 hover:bg-blue-50 rounded-lg cursor-pointer transition"><Edit2 size={16} /></button>
                        <button onClick={() => handleStaffDelete(s.id)} className="text-red-500 p-2 hover:bg-red-50 rounded-lg cursor-pointer transition"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {staff.length === 0 && <p className="text-center text-gray-400 font-bold py-16">No staff members yet. Add your first one!</p>}
            </div>
          </div>
        )}

        {/* ===== RAW INVENTORY TAB ===== */}
        {activeTab === 'inventory' && (
          <>
            <div className="space-y-8 animate-in fade-in duration-500 pb-20">
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-4xl font-black text-gray-900 tracking-tight">Raw Material Inventory</h1>
                  <p className="text-gray-500 font-medium">Internal tracking for kitchen supplies and ingredients.</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      const initialUsage = {};
                      rawMaterials.forEach(m => initialUsage[m.id] = '');
                      setClosingUsages(initialUsage);
                      setShowClosingModal(true);
                    }} 
                    className="bg-orange-500 text-white px-6 py-3 rounded-2xl font-black hover:bg-orange-600 transition shadow-lg shadow-orange-100 flex items-center gap-2"
                  >
                    <Calendar size={20} /> Close Day
                  </button>
                  <button 
                    onClick={() => { setEditingRawId(null); setRawForm({ name: '', quantity: 0, unit: 'kg' }); setShowRawForm(true); }} 
                    className="bg-amber-600 text-white px-6 py-3 rounded-2xl font-black hover:bg-amber-700 transition shadow-lg shadow-amber-100 flex items-center gap-2"
                  >
                    <Plus size={20} /> Add Material
                  </button>
                </div>
              </div>
  
              {showRawForm && (
                <form onSubmit={handleRawSubmit} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm animate-in zoom-in duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="font-bold text-[10px] uppercase tracking-widest text-gray-400 mb-2 block">Material Name</label>
                      <input required value={rawForm.name} onChange={e => setRawForm({ ...rawForm, name: e.target.value })} className="w-full border-2 border-gray-100 p-4 rounded-2xl focus:border-amber-500 outline-none transition font-bold" placeholder="e.g. Chicken Breast" />
                    </div>
                    <div>
                      <label className="font-bold text-[10px] uppercase tracking-widest text-gray-400 mb-2 block">Current Quantity</label>
                      <input required type="number" step="0.1" value={rawForm.quantity} onChange={e => setRawForm({ ...rawForm, quantity: e.target.value })} className="w-full border-2 border-gray-100 p-4 rounded-2xl focus:border-amber-500 outline-none transition font-bold" />
                    </div>
                    <div>
                      <label className="font-bold text-[10px] uppercase tracking-widest text-gray-400 mb-2 block">Unit</label>
                      <select value={rawForm.unit} onChange={e => setRawForm({ ...rawForm, unit: e.target.value })} className="w-full border-2 border-gray-100 p-4 rounded-2xl focus:border-amber-500 outline-none transition font-bold bg-white">
                        <option value="kg">Kilograms (kg)</option>
                        <option value="liters">Liters (L)</option>
                        <option value="pieces">Pieces (pcs)</option>
                        <option value="grams">Grams (g)</option>
                        <option value="packets">Packets</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-8 flex gap-4">
                    <button type="submit" className="flex-1 bg-black text-white py-4 rounded-2xl font-black hover:bg-gray-800 transition shadow-lg shadow-gray-200">Save Material</button>
                    <button type="button" onClick={() => setShowRawForm(false)} className="px-8 bg-gray-100 text-gray-500 font-black py-4 rounded-2xl hover:bg-gray-200 transition">Cancel</button>
                  </div>
                </form>
              )}
            </div>
  
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowUsageHistory(!showUsageHistory)}
                  className={`px-6 py-3 rounded-2xl font-black transition ${showUsageHistory ? 'bg-amber-600 text-white shadow-lg shadow-amber-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  {showUsageHistory ? 'VIEW CURRENT STOCK' : 'VIEW USAGE HISTORY'}
                </button>
                {showUsageHistory && (
                  <div className="flex items-center gap-3 ml-4 animate-in slide-in-from-left duration-300">
                    <div className="w-40">
                      <input 
                        type="date" 
                        value={invLogStart}
                        onChange={(e) => setInvLogStart(e.target.value)}
                        className="w-full bg-gray-50 border-0 rounded-xl py-2 px-4 focus:ring-2 focus:ring-amber-500 font-bold text-xs"
                      />
                    </div>
                    <span className="text-gray-400 font-black text-xs">TO</span>
                    <div className="w-40">
                      <input 
                        type="date" 
                        value={invLogEnd}
                        onChange={(e) => setInvLogEnd(e.target.value)}
                        className="w-full bg-gray-50 border-0 rounded-xl py-2 px-4 focus:ring-2 focus:ring-amber-500 font-bold text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
              {showUsageHistory && (
                <button 
                  onClick={handleExportInventoryExcel}
                  className="bg-green-600 text-white px-6 py-3 rounded-2xl font-black hover:bg-green-700 transition shadow-lg shadow-green-100 flex items-center gap-2"
                >
                  <Download size={20} /> Export Excel
                </button>
              )}
            </div>
  
            {!showUsageHistory ? (
              <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="p-6 font-black text-gray-400 text-[10px] uppercase tracking-widest">Material</th>
                      <th className="p-6 font-black text-gray-400 text-[10px] uppercase tracking-widest text-center">Stock Level</th>
                      <th className="p-6 font-black text-gray-400 text-[10px] uppercase tracking-widest text-center">Unit</th>
                      <th className="p-6 font-black text-gray-400 text-[10px] uppercase tracking-widest text-center">Status</th>
                      <th className="p-6 text-right font-black text-gray-400 text-[10px] uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {rawMaterials.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition group">
                        <td className="p-6 font-black text-gray-900 text-lg">{item.name}</td>
                        <td className="p-6 text-center">
                          <span className={`text-xl font-black ${item.quantity < 5 ? 'text-red-500' : 'text-gray-900'}`}>{item.quantity}</span>
                        </td>
                        <td className="p-6 text-center">
                          <span className="text-xs font-black px-3 py-1 bg-gray-100 text-gray-500 rounded-full">{item.unit}</span>
                        </td>
                        <td className="p-6 text-center">
                          <span className={`text-[10px] font-black px-4 py-2 rounded-full ${item.quantity < 5 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-amber-50 text-amber-600'}`}>
                            {item.quantity < 5 ? 'LOW STOCK' : 'IN STOCK'}
                          </span>
                        </td>
                        <td className="p-6 text-right">
                           <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleRawEdit(item)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition"><Edit2 size={18} /></button>
                              <button onClick={() => handleRawDelete(item.id)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition"><Trash2 size={18} /></button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rawMaterials.length === 0 && (
                  <div className="text-center py-24">
                     <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package size={32} className="text-gray-300" />
                     </div>
                     <p className="text-gray-400 font-bold">No raw materials added yet.</p>
                     <p className="text-xs text-gray-300">Start by adding common ingredients like Flour, Eggs, or Milk.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden animate-in slide-in-from-right duration-500">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="p-6 font-black text-gray-400 text-[10px] uppercase tracking-widest">Date & Time</th>
                      <th className="p-6 font-black text-gray-400 text-[10px] uppercase tracking-widest">Material</th>
                      <th className="p-6 font-black text-gray-400 text-[10px] uppercase tracking-widest text-center">Used Qty</th>
                      <th className="p-6 font-black text-gray-400 text-[10px] uppercase tracking-widest text-center">Final Stock</th>
                      <th className="p-6 font-black text-gray-400 text-[10px] uppercase tracking-widest text-center">Unit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {inventoryLogs.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50/50 transition duration-300">
                        <td className="p-6">
                           <p className="font-bold text-gray-900 text-sm">{new Date(log.date).toLocaleDateString()}</p>
                           <p className="text-[10px] text-gray-400 font-black">{new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </td>
                        <td className="p-6 font-black text-gray-900">{log.materialName}</td>
                        <td className="p-6 text-center font-black text-orange-600">-{log.usedQuantity}</td>
                        <td className="p-6 text-center font-black text-gray-900">{log.remainingQuantity}</td>
                        <td className="p-6 text-center">
                          <span className="text-[10px] font-black px-3 py-1 bg-gray-100 text-gray-500 rounded-lg">{log.unit}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {inventoryLogs.length === 0 && (
                  <div className="text-center py-24">
                     <History size={48} className="text-gray-100 mx-auto mb-4" />
                     <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No usage history for this period</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ===== CUSTOMERS TAB ===== */}
        {activeTab === 'customers' && (
          <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-1">Customer Database</h1>
                <p className="text-gray-500 font-medium">Identify regular guests and track visit frequency.</p>
              </div>
              <button 
                onClick={handleExportCustomers}
                className="flex items-center gap-2 bg-black text-white px-8 py-4 rounded-3xl font-black hover:bg-gray-800 transition shadow-xl shadow-gray-200 cursor-pointer"
              >
                <Download size={22} /> Export CSV/Excel
              </button>
            </div>

            {/* Customer Filter Bar */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-wrap gap-6 items-end">
               <div className="flex-1 min-w-[200px]">
                 <label className="text-[11px] font-black uppercase text-gray-400 mb-2 block ml-1">Search Customer</label>
                 <div className="relative">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                   <input 
                     type="text" 
                     placeholder="Search by name or mobile..."
                     value={customerSearch}
                     onChange={(e) => setCustomerSearch(e.target.value)}
                     className="w-full bg-gray-50 border-0 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-amber-500 font-bold transition"
                   />
                 </div>
               </div>
               <div className="w-56">
                 <label className="text-[11px] font-black uppercase text-gray-400 mb-2 block ml-1">Filter By Behavior</label>
                 <div className="flex bg-gray-50 p-1.5 rounded-2xl">
                    <button onClick={() => setCustomerSort('frequent')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition ${customerSort === 'frequent' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Frequent</button>
                    <button onClick={() => setCustomerSort('recent')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition ${customerSort === 'recent' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Recent</button>
                    <button onClick={() => setCustomerSort('sparse')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition ${customerSort === 'sparse' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Sparse</button>
                 </div>
               </div>
            </div>

            {/* Customers Table */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
               <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="p-6 font-black text-gray-400 text-[10px] uppercase tracking-widest">Customer Profile</th>
                      <th className="p-6 font-black text-gray-400 text-[10px] uppercase tracking-widest text-center">Contact</th>
                      <th className="p-6 font-black text-gray-400 text-[10px] uppercase tracking-widest text-center">Total Visits</th>
                      <th className="p-6 font-black text-gray-400 text-[10px] uppercase tracking-widest text-center">Last Seen</th>
                      <th className="p-6 font-black text-gray-400 text-[10px] uppercase tracking-widest text-center">Last Table</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredCustomers.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50/50 transition duration-300">
                        <td className="p-6">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center font-black text-xl">
                                 {c.name?.charAt(0) || '?'}
                              </div>
                              <div>
                                 <p className="font-black text-gray-900">{c.name || 'Anonymous'}</p>
                                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Joined {new Date(c.createdAt).toLocaleDateString()}</p>
                              </div>
                           </div>
                        </td>
                        <td className="p-6 text-center font-bold text-gray-700">{c.mobileNumber}</td>
                        <td className="p-6 text-center">
                           <span className={`inline-block w-8 h-8 rounded-full flex items-center justify-center font-black ${c.visitCount > 5 ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'bg-gray-100 text-gray-500'}`}>
                              {c.visitCount}
                           </span>
                        </td>
                        <td className="p-6 text-center">
                           <p className="text-sm font-black text-gray-900">{c.lastVisitedDate ? new Date(c.lastVisitedDate).toLocaleDateString() : 'N/A'}</p>
                           <p className="text-[10px] text-gray-400 font-bold">{c.lastVisitedDate ? new Date(c.lastVisitedDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                        </td>
                        <td className="p-6 text-center">
                           <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-black">Table {c.lastTableUsed || '?' }</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
               {filteredCustomers.length === 0 && (
                  <div className="text-center py-20">
                     <Users size={48} className="text-gray-100 mx-auto mb-4" />
                     <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No matching customers found</p>
                  </div>
               )}
            </div>
          </div>
        )}

        {/* ===== HOTEL & TABLES TAB ===== */}
        {activeTab === 'hotel' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in slide-in-from-bottom duration-500 pb-20">
            {/* Hotel details */}
            <div>
              <h1 className="text-3xl font-black text-gray-900 mb-2">Hotel Settings</h1>
              <p className="text-gray-500 font-medium mb-8">Manage identity, tax, and service parameters.</p>
              
              <form onSubmit={handleRestaurantSave} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="font-bold text-[10px] uppercase tracking-widest text-gray-400 mb-2 block">Restaurant Name</label>
                    <input required value={restaurant.name} onChange={e => setRestaurant({ ...restaurant, name: e.target.value })} className="w-full border-2 border-gray-100 p-4 rounded-2xl focus:border-amber-500 outline-none transition text-lg font-black" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="font-bold text-[10px] uppercase tracking-widest text-gray-400 mb-2 block">Address</label>
                    <input value={restaurant.address || ''} onChange={e => setRestaurant({ ...restaurant, address: e.target.value })} className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-amber-500 outline-none transition" />
                  </div>
                  <div>
                    <label className="font-bold text-[10px] uppercase tracking-widest text-gray-400 mb-2 block">Contact Number</label>
                    <input value={restaurant.contactNumber || ''} onChange={e => setRestaurant({ ...restaurant, contactNumber: e.target.value })} className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-amber-500 outline-none transition" />
                  </div>
                  <div>
                    <label className="font-bold text-[10px] uppercase tracking-widest text-gray-400 mb-2 block">GST / Tax ID</label>
                    <input value={restaurant.gstNumber || ''} onChange={e => setRestaurant({ ...restaurant, gstNumber: e.target.value })} className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-amber-500 outline-none transition" />
                  </div>
                  <div>
                    <label className="font-bold text-[10px] uppercase tracking-widest text-gray-400 mb-2 block">Tax Percentage (%)</label>
                    <input type="number" step="0.1" value={restaurant.taxPercentage || 0} onChange={e => setRestaurant({ ...restaurant, taxPercentage: e.target.value })} className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-amber-500 outline-none transition" />
                  </div>
                  <div>
                    <label className="font-bold text-[10px] uppercase tracking-widest text-gray-400 mb-2 block">Service Charge (%)</label>
                    <input type="number" step="0.1" value={restaurant.serviceCharge || 0} onChange={e => setRestaurant({ ...restaurant, serviceCharge: e.target.value })} className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-amber-500 outline-none transition" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-amber-600 text-white py-4 rounded-2xl font-black hover:bg-amber-700 cursor-pointer transition text-lg shadow-lg shadow-amber-100">Update Hotel Info</button>
              </form>
            </div>

            {/* Table Management */}
            <div>
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h2 className="text-3xl font-black text-gray-900">Table Management</h2>
                  <p className="text-gray-500 font-medium">Control floor capacity and status.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAutoAddTable} className="bg-amber-600 text-white px-6 py-3 rounded-2xl font-black hover:bg-amber-700 transition shadow-lg shadow-amber-100 flex items-center gap-2 cursor-pointer">
                    <Plus size={20} /> Quick Add
                  </button>
                  <button onClick={() => setShowTableForm(true)} className="bg-gray-900 text-white p-3 rounded-2xl hover:bg-gray-800 transition shadow-lg shadow-gray-200 cursor-pointer"><Plus size={24} /></button>
                </div>
              </div>

              {showTableForm && (
                <form onSubmit={handleTableSubmit} className="bg-white p-6 rounded-3xl border-2 border-gray-100 mb-8 animate-in zoom-in duration-300">
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="font-bold text-xs text-gray-400 mb-1 block uppercase">Table Number</label>
                      <input required type="number" value={tableForm.tableNumber} onChange={e => setTableForm({ ...tableForm, tableNumber: e.target.value })} className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-black outline-none transition font-black" />
                    </div>
                    <button type="submit" className="bg-black text-white px-8 py-3.5 rounded-xl font-bold hover:bg-gray-800 transition cursor-pointer">Add Table</button>
                    <button type="button" onClick={() => setShowTableForm(false)} className="bg-gray-100 text-gray-500 font-bold px-4 py-3.5 rounded-xl hover:bg-gray-200 transition cursor-pointer">✕</button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {tables.map(t => (
                  <div key={t.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative group hover:border-amber-200 transition overflow-hidden">
                    {/* Status corner */}
                    <div className={`absolute top-0 right-0 px-2 py-1 rounded-bl-xl text-[8px] font-black uppercase ${t.status === 'AVAILABLE' ? 'bg-amber-100 text-amber-700' : 'bg-orange-100 text-orange-700'}`}>
                      {t.status}
                    </div>
                    
                    <h3 className="text-4xl font-black text-gray-900 mb-1">T{t.tableNumber}</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.currentSessionId ? 'Order Active' : 'Waiting'}</p>
                    
                    <div className="mt-4 flex gap-2">
                       {t.qrGenerated ? (
                         <>
                           <button onClick={() => setPrintingQRTable(t)} className="flex-1 text-center bg-amber-50 hover:bg-amber-100 py-2 rounded-xl text-[10px] font-black uppercase text-amber-700 transition flex items-center justify-center gap-1">
                             <QrCode size={12} /> View QR
                           </button>
                           <button 
                             onClick={() => { setPrintingQRTable(t); setTimeout(() => window.print(), 500); }} 
                             className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-500 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                           >
                             <Printer size={16} />
                           </button>
                         </>
                       ) : (
                         <button onClick={() => handleGenerateQR(t.id)} className="flex-1 text-center bg-gray-900 hover:bg-black py-3 rounded-xl text-[10px] font-black uppercase text-white shadow-lg shadow-gray-200 transition">
                           Generate QR
                         </button>
                       )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== REVIEWS TAB ===== */}
        {activeTab === 'reviews' && (
          <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Customer Reviews</h1>
                <p className="text-gray-500 font-medium mt-1">Direct feedback from your diners.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
               <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className="p-4 bg-yellow-50 rounded-2xl text-yellow-500"><Star size={24} className="fill-yellow-500" /></div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Avg Rating</p>
                    <p className="text-2xl font-black text-gray-900">{(analytics.reviews.averageRating || 0).toFixed(1)} / 5.0</p>
                  </div>
               </div>
               <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className="p-4 bg-blue-50 rounded-2xl text-blue-500"><Users size={24} /></div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Feedback</p>
                    <p className="text-2xl font-black text-gray-900">{analytics.reviews.totalReviews}</p>
                  </div>
               </div>
               <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className="flex-1 space-y-1">
                    {analytics.reviews.distribution?.slice(0, 3).map((d, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-[8px] font-black text-gray-400 w-4">{d.rating}★</span>
                        <div className="flex-1 h-1 bg-gray-50 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-400" style={{ width: `${(d.count / analytics.reviews.totalReviews) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map(review => (
                <div key={review.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative group hover:border-yellow-200 transition flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star 
                          key={star} 
                          size={14} 
                          className={star <= review.overallRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-100'} 
                        />
                      ))}
                    </div>
                    <button 
                      onClick={() => handleReviewDelete(review.id)}
                      className="text-red-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-xl transition cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex-1">
                    <p className="text-gray-700 font-medium leading-relaxed italic mb-4">
                      "{review.comment || 'No comment provided.'}"
                    </p>
                  </div>

                  <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Table {review.tableId}</p>
                      <p className="text-[8px] font-bold text-gray-300 truncate max-w-[100px]">{review.sessionId}</p>
                    </div>
                    <p className="text-[10px] font-bold text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {reviews.length === 0 && (
                <div className="col-span-full py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center grayscale opacity-50">
                  <Star size={40} className="text-gray-300 mb-3" />
                  <p className="font-black text-gray-400">No reviews found yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== REVENUE TAB (LEGACY - REDIRECT TO DASHBOARD) ===== */}
        {activeTab === 'revenue' && (
          <div className="flex flex-col items-center justify-center py-20">
            <TrendingUp size={60} className="text-gray-200 mb-4" />
            <h2 className="text-2xl font-black text-gray-400 text-center">Revenue has moved to Business Overview.</h2>
            <button onClick={() => setActiveTab('dashboard')} className="mt-6 bg-amber-500 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-amber-100 cursor-pointer">Take me there →</button>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {confirmPaymentId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle size={32} /></div>
            <h2 className="text-2xl font-black mb-1">Confirm Payment</h2>
            <p className="text-gray-500 font-medium mb-6 text-sm">How was the payment received for Order #{confirmPaymentId}?</p>
            
            <div className="grid grid-cols-2 gap-3 mb-8">
              {['CASH', 'UPI', 'CARD'].map(method => (
                <button
                  key={method}
                  onClick={() => setSelectedPaymentMethod(method)}
                  className={`py-3 rounded-xl font-black text-xs transition-all border-2 cursor-pointer ${
                    selectedPaymentMethod === method 
                    ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-md translate-y-[-2px]' 
                    : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={markAsPaid} 
                disabled={!selectedPaymentMethod}
                className={`w-full font-black py-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                  selectedPaymentMethod 
                  ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-amber-100' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                }`}
              >
                Confirm Payment
              </button>
              <button 
                onClick={() => { setConfirmPaymentId(null); setSelectedPaymentMethod(null); }} 
                className="w-full bg-gray-100 text-gray-500 font-bold py-4 rounded-xl hover:bg-gray-200 cursor-pointer transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Day Closing Modal */}
      {showClosingModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] p-10 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-3xl font-black text-gray-900 mb-1">End of Day Closing</h2>
                <p className="text-gray-500 font-medium">Record daily raw material consumption to update inventory.</p>
              </div>
              <div className="p-4 bg-orange-100 text-orange-600 rounded-3xl"><Calendar size={32} /></div>
            </div>

            <div className="flex-1 overflow-y-auto pr-4 space-y-6">
              <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100">
                 <p className="text-sm font-bold text-orange-800 flex items-center gap-2 italic">
                   <Clock size={16} /> Data recorded for: {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                 </p>
              </div>

              <div className="space-y-4">
                {rawMaterials.map(m => (
                  <div key={m.id} className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl border border-transparent hover:border-gray-200 transition">
                    <div className="flex-1">
                      <p className="font-black text-gray-900">{m.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">In Stock: {m.quantity} {m.unit}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number" 
                        step="0.1"
                        placeholder="Qty Used"
                        value={closingUsages[m.id] || ''}
                        onChange={(e) => setClosingUsages({ ...closingUsages, [m.id]: e.target.value })}
                        className="w-24 bg-white border-2 border-gray-100 rounded-xl p-2.5 font-bold focus:border-orange-500 outline-none transition text-center" 
                      />
                      <span className="text-xs font-black text-gray-400 w-12">{m.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 flex gap-4">
              <button 
                onClick={handleClosingSubmit} 
                className="flex-1 bg-gray-900 text-white py-5 rounded-2xl font-black hover:bg-gray-800 transition shadow-xl shadow-gray-100 text-lg"
              >
                Submit & Close Day
              </button>
              <button 
                onClick={() => setShowClosingModal(false)} 
                className="px-10 bg-gray-100 text-gray-500 py-5 rounded-2xl font-black hover:bg-gray-200 transition text-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ===== PRINTABLE BILL COMPONENT (Hidden from screen) ===== */}
      <div id="thermal-bill-parent" style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        {printingSession && (
          <div id="thermal-bill" style={{ 
            width: '80mm', 
            padding: '5mm', 
            fontFamily: 'Courier New, Courier, monospace', 
            fontSize: '12px', 
            color: '#000',
            lineHeight: '1.4',
            backgroundColor: '#fff'
          }}>
            <style>{`
              @media print {
                @page { size: 80mm auto; margin: 0; }
                body { background: #fff !important; }
                #root { visibility: hidden !important; }
                #thermal-bill-parent { 
                  visibility: visible !important; 
                  display: block !important;
                  position: absolute !important; 
                  left: 0 !important; 
                  top: 0 !important; 
                  width: 80mm !important;
                  margin: 0 !important;
                  padding: 0 !important;
                }
                #thermal-bill-parent * { visibility: visible !important; }
                #thermal-bill { 
                   width: 80mm !important;
                   padding: 5mm !important;
                   background: #fff !important;
                }
              }
              .bill-hr { border-top: 1px dashed #000; margin: 5px 0; }
              .text-center { text-align: center; }
              .flex-between { display: flex; justify-content: space-between; }
              .font-black { font-weight: 900; }
            `}</style>

            {/* Header */}
            <div className="text-center">
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '2px' }}>{restaurant.name}</div>
              <div style={{ fontSize: '10px' }}>{restaurant.address}</div>
              <div style={{ fontSize: '10px' }}>Ph: {restaurant.contactNumber}</div>
              {restaurant.gstNumber && <div style={{ fontSize: '10px' }}>GST: {restaurant.gstNumber}</div>}
            </div>

            <div className="bill-hr"></div>
            
            <div className="flex-between">
              <span>Bill No: {printingSession.sessionId?.slice(-6).toUpperCase() || 'N/A'}</span>
              <span>Table: {printingSession.tableNumber}</span>
            </div>
            <div>Date: {new Date(printingSession.createdAt).toLocaleString()}</div>

            <div className="bill-hr"></div>

            {/* Items Table */}
            <div className="flex-between font-black" style={{ marginBottom: '5px' }}>
              <span style={{ width: '50%' }}>Item</span>
              <span style={{ width: '15%', textAlign: 'center' }}>Qty</span>
              <span style={{ width: '35%', textAlign: 'right' }}>Amount</span>
            </div>
            
            {printingSession.orders?.map(order => 
              order.items?.map(item => (
                <div key={item.id} className="flex-between">
                  <span style={{ width: '50%', textTransform: 'uppercase' }}>{item.menuItem?.name}</span>
                  <span style={{ width: '15%', textAlign: 'center' }}>{item.quantity}</span>
                  <span style={{ width: '35%', textAlign: 'right' }}>{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))
            )}

            <div className="bill-hr"></div>

            {/* Totals */}
            <div className="flex-between">
              <span>Subtotal</span>
              <span>₹{printingSession.total.toFixed(2)}</span>
            </div>
            {restaurant.taxPercentage > 0 && (
              <div className="flex-between">
                <span>GST ({restaurant.taxPercentage}%)</span>
                <span>₹{(printingSession.total * (restaurant.taxPercentage / 100)).toFixed(2)}</span>
              </div>
            )}
            {restaurant.serviceCharge > 0 && (
              <div className="flex-between">
                <span>Service Charge ({restaurant.serviceCharge}%)</span>
                <span>₹{(printingSession.total * (restaurant.serviceCharge / 100)).toFixed(2)}</span>
              </div>
            )}
            
            <div className="bill-hr"></div>
            
            <div className="flex-between font-black" style={{ fontSize: '16px' }}>
              <span>GRAND TOTAL</span>
              <span>₹{(printingSession.total * (1 + (restaurant.taxPercentage / 100) + (restaurant.serviceCharge / 100))).toFixed(2)}</span>
            </div>

            <div className="bill-hr"></div>
            
            <div className="text-center" style={{ marginTop: '10px' }}>
              <div>THANK YOU! VISIT AGAIN</div>
              <div style={{ fontSize: '8px', color: '#666', marginTop: '4px' }}>ServeSmart POS</div>
            </div>
          </div>
        )}
      </div>

      {/* ===== PRINTABLE QR COMPONENT (Hidden from screen) ===== */}
      <div id="qr-print-parent" style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        {printingQRTable && (
          <div id="printable-qr" style={{ 
            width: '100mm', 
            padding: '10mm', 
            fontFamily: 'system-ui, sans-serif', 
            textAlign: 'center',
            backgroundColor: '#fff'
          }}>
             <style>{`
              @media print {
                @page { size: 100mm 150mm; margin: 0; }
                body { background: #fff !important; }
                #root { display: none !important; }
                #qr-print-parent, #qr-print-parent * { display: block !important; visibility: visible !important; }
                #printable-qr { 
                  display: block !important;
                  position: absolute;
                  top: 0;
                  left: 0;
                  width: 100mm;
                  height: 150mm;
                  padding: 15mm;
                  text-align: center;
                  background: #fff !important;
                }
              }
            `}</style>
            
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#111', marginBottom: '8px' }}>Table {printingQRTable.tableNumber}</div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '2px' }}>Scan to Order</div>
            
            <div style={{ 
              backgroundColor: '#fff', 
              padding: '15px', 
              borderRadius: '24px', 
              border: '2px solid #eee',
              display: 'inline-block',
              marginBottom: '20px'
            }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(printingQRTable.qrCodeUrl)}`} 
                alt="Table QR Code"
                style={{ width: '200px', height: '200px' }}
              />
            </div>
            
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#333', marginTop: '10px' }}>{restaurant.name}</div>
            <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>Powered by ServeSmart</div>
          </div>
        )}
      </div>

      {/* QR VIEW MODAL */}
      {printingQRTable && !window.matchMedia('print').matches && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-[40px] p-10 max-w-sm w-full shadow-2xl relative">
              <button 
                onClick={() => setPrintingQRTable(null)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 transition"
              >
                <XCircle size={24} />
              </button>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-amber-600">
                  <QrCode size={32} />
                </div>
                <h3 className="text-3xl font-black text-gray-900 mb-2">Table {printingQRTable.tableNumber}</h3>
                <p className="text-gray-500 font-medium mb-8 uppercase text-xs tracking-widest">Digital QR Code</p>
                
                <div className="p-4 bg-gray-50 rounded-3xl border border-gray-100 mb-8 aspect-square flex items-center justify-center">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(printingQRTable.qrCodeUrl)}`} 
                    alt="Table QR"
                    className="w-full h-full object-contain"
                  />
                </div>
                
                <button 
                  onClick={() => window.print()} 
                  className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black hover:bg-black transition flex items-center justify-center gap-2"
                >
                  <Printer size={20} /> Print for Table
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminMenuManager;
