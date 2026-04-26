import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Client } from '@stomp/stompjs';
import QRCode from 'qrcode';
import {
  Settings, Plus, Trash2, Edit2, Package, TrendingUp, CheckCircle,
  Clock, Users, History, Zap, ChevronRight, Star, ClipboardList,
  ArrowUpRight, ArrowDownRight, Activity, Search, Calendar, Download, Filter,
  AlertCircle, XCircle, Printer, QrCode, UserCheck, User, LogOut, UserPlus, ShieldCheck, ChefHat, Camera, Palette
} from 'lucide-react';
import * as XLSX from 'xlsx';
import HotelSaaSDashboard from './HotelSaaSDashboard';
import { API_BASE_URL, WS_BASE_URL, getFullImageUrl } from '../api/api';

const API = API_BASE_URL;

const MANAGER_THEMES = {
  midnight: {
    label: 'Midnight Blue',
    pageBg: 'linear-gradient(180deg, #eef4fb 0%, #f7fbff 100%)',
    sidebarBg: 'linear-gradient(180deg, #0C2847 0%, #0A1D34 100%)',
    headerBg: 'rgba(255,255,255,0.85)',
    accent: '#0D2A4A',
    surface: 'rgba(255,255,255,0.82)',
    surfaceSoft: 'rgba(248,250,252,0.95)',
    surfaceStrong: 'rgba(15,23,42,0.95)',
    line: 'rgba(148,163,184,0.22)',
    text: '#0f172a',
    muted: '#64748b'
  },
  ocean: {
    label: 'Ocean Mint',
    pageBg: 'linear-gradient(180deg, #e9fbf7 0%, #f5fffc 100%)',
    sidebarBg: 'linear-gradient(180deg, #0B3D3A 0%, #092C2A 100%)',
    headerBg: 'rgba(241,255,252,0.88)',
    accent: '#0F766E',
    surface: 'rgba(244,255,252,0.86)',
    surfaceSoft: 'rgba(236,253,245,0.95)',
    surfaceStrong: 'rgba(6,95,70,0.96)',
    line: 'rgba(20,184,166,0.18)',
    text: '#042f2e',
    muted: '#4b5563'
  },
  ember: {
    label: 'Ember Gold',
    pageBg: 'linear-gradient(180deg, #fff7ec 0%, #fffcf6 100%)',
    sidebarBg: 'linear-gradient(180deg, #3F2714 0%, #2A1A0E 100%)',
    headerBg: 'rgba(255,249,240,0.9)',
    accent: '#B45309',
    surface: 'rgba(255,250,242,0.9)',
    surfaceSoft: 'rgba(255,247,237,0.97)',
    surfaceStrong: 'rgba(69,26,3,0.96)',
    line: 'rgba(245,158,11,0.18)',
    text: '#2b1600',
    muted: '#6b7280'
  }
};

const AdminMenuManager = () => {
  const { hotelId: urlHotelId } = useParams();
  const [session, setSession] = useState(null);
  const [uiPrefs, setUiPrefs] = useState({ theme: 'midnight', photoUrl: '' });
  const storageKeyForRole = (role) => {
    if (role === 'OWNER') return 'owner_session';
    if (role === 'ADMIN') return 'admin_session';
    if (role === 'WAITER') return 'captain_session';
    return 'kitchen_session';
  };

  const syncSessionFromStorage = () => {
    const adminSession = localStorage.getItem('admin_session');
    const kitchenSession = localStorage.getItem('kitchen_session');
    const currentSession = adminSession ? JSON.parse(adminSession) : (kitchenSession ? JSON.parse(kitchenSession) : null);
    if (currentSession) setSession(currentSession);
    return currentSession;
  };
  
  useEffect(() => {
    const currentSession = syncSessionFromStorage();
    
    // Use URL hotelId as source of truth for scoping
    if (urlHotelId) {
      axios.defaults.headers.common['X-Hotel-Id'] = urlHotelId;
      if (currentSession) setSession(currentSession);
    } else if (currentSession && currentSession.hotelId) {
      axios.defaults.headers.common['X-Hotel-Id'] = currentSession.hotelId;
      setSession(currentSession);
    }
  }, [urlHotelId]);

  useEffect(() => {
    if (!session) return;
    setUiPrefs({
      theme: session.uiTheme && MANAGER_THEMES[session.uiTheme] ? session.uiTheme : 'midnight',
      photoUrl: session.photoUrl || ''
    });
  }, [session]);

  const persistManagerPrefs = async (patch) => {
    if (!session?.id) return;
    const response = await axios.put(`${API}/staff/${session.id}`, {
      name: session.name,
      role: session.role,
      username: session.username,
      phone: session.phone,
      password: '',
      photoUrl: patch.photoUrl ?? session.photoUrl ?? '',
      uiTheme: patch.uiTheme ?? session.uiTheme ?? 'midnight'
    });
    const nextSession = {
      ...session,
      ...response.data,
      token: session.token,
      hotelId: session.hotelId || urlHotelId,
      date: session.date,
      loginTime: session.loginTime
    };
    setSession(nextSession);
    localStorage.setItem(storageKeyForRole(nextSession.role || 'ADMIN'), JSON.stringify(nextSession));
    setUiPrefs({
      theme: nextSession.uiTheme && MANAGER_THEMES[nextSession.uiTheme] ? nextSession.uiTheme : 'midnight',
      photoUrl: nextSession.photoUrl || ''
    });
  };

  const handleProfilePhotoChange = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const photoUrl = String(reader.result || '');
      setUiPrefs((prev) => ({ ...prev, photoUrl }));
      persistManagerPrefs({ photoUrl }).catch((err) => {
        console.error('Failed to persist manager photo', err);
      });
    };
    reader.readAsDataURL(file);
  };

  const activeTheme = MANAGER_THEMES[uiPrefs.theme] || MANAGER_THEMES.midnight;
  const uiSurfaceStyles = {
    '--ui-surface': activeTheme.surface,
    '--ui-surface-soft': activeTheme.surfaceSoft,
    '--ui-surface-strong': activeTheme.surfaceStrong,
    '--ui-line': activeTheme.line,
    '--ui-text': activeTheme.text,
    '--ui-muted': activeTheme.muted,
    '--ui-accent': activeTheme.accent
  };

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key && event.key.endsWith('_session')) {
        syncSessionFromStorage();
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
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
  const [printingQRImage, setPrintingQRImage] = useState('');
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
    inventory: [],
    margins: [] 
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
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryUnitFilter, setInventoryUnitFilter] = useState('all');
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState('all');
  const [inventorySort, setInventorySort] = useState('name-asc');
  const [chartReady, setChartReady] = useState(false);

  const getTenantHeaders = () => {
    const scopedHotelId = urlHotelId || session?.hotelId || localStorage.getItem('hotelId') || 'master';
    return { 'X-Hotel-Id': String(scopedHotelId) };
  };

  // Menu form state
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState(null);
  const [menuForm, setMenuForm] = useState({ name: '', description: '', price: '', available: true, categoryId: '', imageUrl: '', isVeg: true });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Staff form state
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [staffForm, setStaffForm] = useState({ name: '', role: 'KITCHEN', username: '', phone: '', password: '' });

  // Raw Material form state
  const [showRawForm, setShowRawForm] = useState(false);
  const [editingRawId, setEditingRawId] = useState(null);
  const [rawForm, setRawForm] = useState({ name: '', quantity: 0, unit: 'kg' });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // New Petpooja Professional Features State
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [targetMenuItem, setTargetMenuItem] = useState(null);
  const [currentRecipe, setCurrentRecipe] = useState([]); // [{materialId, quantityRequired}]
  const [showPaymentReceipt, setShowPaymentReceipt] = useState(false);
  const [discountValue, setDiscountValue] = useState(0);
  const [taxRate, setTaxRate] = useState(5.0);

  useEffect(() => {
    if (activeTab === 'menu' && categories.length === 0) {
      setShowCategoryForm(true);
    }
  }, [activeTab, categories.length]);

  useEffect(() => {
    fetchAll();
    if (!urlHotelId) return;

    const frame = requestAnimationFrame(() => setChartReady(true));

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
          fetchAll();
        });

        // Subscribe to tenant-specific reviews topic
        client.subscribe(`/topic/${urlHotelId}/reviews`, (message) => {
          console.log('Real-time tenant review received');
          fetchAll();
        });
      }
    });
    client.activate();
    return () => {
      cancelAnimationFrame(frame);
      client.deactivate();
    };
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
      link.setAttribute('download', "serversundaram_Customers.xlsx");
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
        axios.get(`${API}/menu`, { headers: getTenantHeaders() }),
        axios.get(`${API}/menu/categories`, { headers: getTenantHeaders() }),
        axios.get(`${API}/admin/orders`, { headers: getTenantHeaders() }),
        axios.get(`${API}/staff`, { headers: getTenantHeaders() }),
        axios.get(`${API}/restaurant`, { headers: getTenantHeaders() }),
        axios.get(`${API}/analytics/summary`, { params, headers: getTenantHeaders() }),
        axios.get(`${API}/analytics/dishes`, { params, headers: getTenantHeaders() }),
        axios.get(`${API}/analytics/categories`, { params, headers: getTenantHeaders() }),
        axios.get(`${API}/analytics/trend`, { params, headers: getTenantHeaders() }),
        axios.get(`${API}/tables`, { headers: getTenantHeaders() }),
        axios.get(`${API}/analytics/yearly`, { headers: getTenantHeaders() }), // conceptually old but keep for now
        axios.get(`${API}/reviews`, { headers: getTenantHeaders() }),
        axios.get(`${API}/analytics/dishes/bottom`, { params, headers: getTenantHeaders() }),
        axios.get(`${API}/analytics/peak-hours`, { params, headers: getTenantHeaders() }),
        axios.get(`${API}/analytics/payments`, { params, headers: getTenantHeaders() }),
        axios.get(`${API}/analytics/inventory`, { headers: getTenantHeaders() }),
        axios.get(`${API}/analytics/reviews`, { headers: getTenantHeaders() }),
        axios.get(`${API}/raw-materials`, { headers: getTenantHeaders() }),
        axios.get(`${API}/customers/admin`, { headers: getTenantHeaders() }),
        axios.get(`${API}/analytics/margins`, { headers: getTenantHeaders() }),
      ]);

      const data = results.map(r => r.status === 'fulfilled' ? r.value.data : null);
      
      if (data[0]) setMenuItems(data[0]);
      if (data[1]) setCategories(data[1]);
      if (data[2]) setOrders(data[2]);
      if (Array.isArray(data[3]) && data[3].length > 0) {
        setStaff(data[3]);
      } else {
        try {
          const fallbackHotelId = urlHotelId || session?.hotelId || localStorage.getItem('hotelId');
          if (!fallbackHotelId) {
            setStaff([]);
            return;
          }
          const fallbackStats = await axios.get(`${API}/saas/hotel-stats/${fallbackHotelId}`, { headers: getTenantHeaders() });
          const fallbackStaff = (fallbackStats.data?.staffCredentials || []).map((s) => ({
            id: s.id,
            name: s.name || '',
            role: s.role || 'WAITER',
            username: s.username || '',
            phone: s.phone || ''
          }));
          setStaff(fallbackStaff);
        } catch (fallbackErr) {
          console.error('Fallback staff fetch failed', fallbackErr);
          setStaff([]);
        }
      }
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
        reviews: data[16] || { averageRating: 0, totalReviews: 0, distribution: [] },
        margins: data[19] || []
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
      const trimmedName = categoryName.trim();
      if (!trimmedName) {
        alert('Category name is required');
        return;
      }

      const res = await axios.post(`${API}/menu/categories`, { name: trimmedName }, { headers: getTenantHeaders() });
      setCategoryName('');
      setShowCategoryForm(false);
      await fetchAll();
      if (res.data && res.data.id) {
        setMenuForm(prev => ({ ...prev, categoryId: res.data.id }));
      }
    } catch (err) {
      console.error('Failed to add category', err);
      alert('Failed to add category: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCategoryDelete = async (categoryId) => {
    const category = categories.find((c) => c.id === categoryId);
    const categoryName = category?.name || 'this category';

    if (!window.confirm(`Delete ${categoryName}?`)) {
      return;
    }

    try {
      await axios.delete(`${API}/menu/categories/${categoryId}`, { headers: getTenantHeaders() });
      await fetchAll();

      // Keep menu form selection valid after deletion.
      setMenuForm((prev) => {
        if (String(prev.categoryId) !== String(categoryId)) return prev;
        const nextCategoryId = categories.find((c) => c.id !== categoryId)?.id || '';
        return { ...prev, categoryId: nextCategoryId };
      });
    } catch (err) {
      console.error('Failed to delete category', err);
      const msg = err.response?.data?.message || 'Unable to delete category. Remove linked menu items first.';
      alert(msg);
    }
  };

  const handleMenuSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!menuForm.categoryId) {
        alert('Category is required');
        return;
      }

      const normalizedMenuForm = {
        ...menuForm,
        name: menuForm.name?.trim(),
        description: menuForm.description?.trim(),
        imageUrl: selectedFile ? '' : (menuForm.imageUrl || '').trim(),
        price: parseFloat(menuForm.price)
      };

      const formData = new FormData();
      // Send JSON as text to keep multipart parsing stable across browsers
      formData.append('item', JSON.stringify(normalizedMenuForm));

      // Add the image file if selected
      if (selectedFile) {
        formData.append('image', selectedFile);
      }

      // Create config with headers - let axios handle multipart/form-data boundary automatically
      const config = {
        headers: getTenantHeaders()
      };

      if (editingMenuId) {
        await axios.put(`${API}/menu/${editingMenuId}`, formData, config);
      } else {
        await axios.post(`${API}/menu`, formData, config);
      }

      setShowMenuForm(false);
      setEditingMenuId(null);
      setMenuForm({ name: '', description: '', price: '', available: true, categoryId: categories[0]?.id || '', imageUrl: '', isVeg: true });
      setSelectedFile(null);
      setPreviewUrl(null);
      fetchAll();
    } catch (err) {
      console.error('Failed to save menu item:', err);
      alert('Failed to save item: ' + (err.response?.data?.message || err.message));
    }
  };
  const handleMenuEdit = (item) => {
    setEditingMenuId(item.id);
    setMenuForm({ name: item.name, description: item.description, price: item.price, available: item.available, categoryId: item.category.id, imageUrl: item.imageUrl || '', isVeg: item.isVeg });
    setPreviewUrl(item.imageUrl);
    setSelectedFile(null);
    setShowMenuForm(true);
  };
  const handleMenuDelete = async (id) => {
    if (window.confirm('Delete this item?')) { await axios.delete(`${API}/menu/${id}`, { headers: getTenantHeaders() }); fetchAll(); }
  };
  const toggleAvailability = async (item) => {
    try {
      await axios.put(`${API}/menu/${item.id}`, { ...item, categoryId: item.category.id, available: !item.available }, { headers: getTenantHeaders() });
      fetchAll();
    } catch { alert('Failed to update availability'); }
  };

  const handleOpenRecipe = async (item) => {
    setTargetMenuItem(item);
    try {
      const res = await axios.get(`${API}/recipes/${item.id}`);
      setCurrentRecipe(res.data.map(r => ({
        materialId: r.rawMaterial.id,
        quantityRequired: r.quantityRequired
      })));
    } catch {
      setCurrentRecipe([]);
    }
    setShowRecipeModal(true);
  };

  const handleSaveRecipe = async () => {
    try {
      const payload = currentRecipe.map(r => ({
        rawMaterial: { id: r.materialId },
        quantityRequired: r.quantityRequired
      }));
      await axios.post(`${API}/recipes/${targetMenuItem.id}`, payload);
      setShowRecipeModal(false);
      alert('Recipe saved successfully!');
    } catch {
      alert('Failed to save recipe');
    }
  };

  // --- Staff Handlers ---
  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    try {
      let savedStaff = null;
      if (editingStaffId) {
        const res = await axios.put(`${API}/staff/${editingStaffId}`, staffForm);
        savedStaff = res.data || null;
      } else {
        const res = await axios.post(`${API}/staff`, staffForm);
        savedStaff = res.data || null;
      }

      const sessionIdMatch = session ? (Number(savedStaff.id) === Number(session.id) || Number(savedStaff.id) === Number(session.userId)) : false;
      if (savedStaff && sessionIdMatch) {
        const updatedSession = {
          ...session,
          id: savedStaff.id,
          userId: savedStaff.id,
          name: savedStaff.name,
          username: savedStaff.username,
          role: savedStaff.role,
          phone: savedStaff.phone,
          hotelId: session.hotelId || urlHotelId,
          token: session.token,
          date: session.date,
          loginTime: session.loginTime
        };
        const storageKey = storageKeyForRole(updatedSession.role);
        localStorage.setItem(storageKey, JSON.stringify(updatedSession));
        setSession(updatedSession);
      } else {
        syncSessionFromStorage();
      }

      setShowStaffForm(false); setEditingStaffId(null);
      setStaffForm({ name: '', role: 'KITCHEN', username: '', phone: '', password: '' });
      fetchAll();
    } catch { alert('Failed to save staff member'); }
  };
  const handleStaffEdit = (s) => {
    setEditingStaffId(s.id);
    setStaffForm({ name: s.name, role: s.role, username: s.username, phone: s.phone, password: '' }); // Keep password empty for edits
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
      // Ensure tables are loaded before calculating next number
      if (!tables || tables.length === 0) {
        // Fetch current tables first to ensure we have the latest data
        const response = await axios.get(`${API}/tables`);
        const currentTables = response.data || [];
        const nextNumber = currentTables.length > 0 ? Math.max(...currentTables.map(t => t.tableNumber)) + 1 : 1;
        
        const data = { 
          tableNumber: nextNumber, 
          status: 'AVAILABLE',
          qrCodeUrl: `http://localhost:5173/${urlHotelId}/login?tableId=${nextNumber}`
        };
        const result = await axios.post(`${API}/tables`, data);
        alert(`Table #${result.data.tableNumber} added successfully!`);
        fetchAll();
      } else {
        const nextNumber = Math.max(...tables.map(t => t.tableNumber)) + 1;
        const data = { 
          tableNumber: nextNumber, 
          status: 'AVAILABLE',
          qrCodeUrl: `http://localhost:5173/${urlHotelId}/login?tableId=${nextNumber}`
        };
        const result = await axios.post(`${API}/tables`, data);
        alert(`Table #${result.data.tableNumber} added successfully!`);
        fetchAll();
      }
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.error || err.message || 'Unknown error';
      alert('Failed to auto-add table: ' + errorMsg);
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

  const handlePrintQR = async (table) => {
    if (!table?.qrCodeUrl) return;
    try {
      const dataUrl = await QRCode.toDataURL(table.qrCodeUrl, {
        width: 600,
        margin: 1,
        errorCorrectionLevel: 'M'
      });
      setPrintingSession(null);
      setPrintingQRTable(table);
      setPrintingQRImage(dataUrl);
      setTimeout(() => window.print(), 500);
    } catch (error) {
      console.error('Failed to build QR image', error);
      alert('Unable to generate QR for printing.');
    }
  };
 
  const handleRestaurantSave = async (e) => {
    e.preventDefault();
    try {
      const restId = restaurant.id || 1; // Fallback to 1 if not yet fetched
      
      // Prepare data with proper types for numeric fields
      const restaurantData = {
        ...restaurant,
        id: parseInt(restaurant.id) || 1,
        taxPercentage: restaurant.taxPercentage ? parseFloat(restaurant.taxPercentage) : 0,
        serviceCharge: restaurant.serviceCharge ? parseFloat(restaurant.serviceCharge) : 0,
        name: restaurant.name?.trim() || 'My Restaurant',
        address: restaurant.address?.trim() || '',
        contactNumber: restaurant.contactNumber?.trim() || '',
        gstNumber: restaurant.gstNumber?.trim() || '',
      };
      
      console.log('Sending restaurant update:', restaurantData);
      const response = await axios.put(`${API}/restaurant/${restId}`, restaurantData);
      console.log('Restaurant update response:', response.data);
      alert('Restaurant info updated!');
      fetchAll();
    } catch (err) { 
      console.error('Failed to update restaurant:', err.response?.data || err.message);
      alert('Failed to update restaurant info: ' + (err.response?.data?.message || err.message)); 
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
      const response = await axios.put(`${API}/orders/${confirmPaymentId}/payment`, { 
        status: 'PAID', 
        paymentMethod: selectedPaymentMethod,
        discountAmount: discountValue,
        taxPercentage: taxRate
      });
      console.log(`SUCCESS: Order #${confirmPaymentId} and session marked as PAID`, response.data);
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
      link.setAttribute('download', `serversundaram_Report_${analyticsStartDate}_to_${analyticsEndDate}.xlsx`);
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

  const handlePrintBill = async (session) => {
    try {
      const response = await axios.get(`${API}/restaurant`, {
        headers: { 'X-Hotel-Id': urlHotelId }
      });
      setRestaurant(response.data || restaurant);
    } catch (error) {
      console.error('Failed to refresh restaurant before printing bill', error);
    }

    setPrintingQRTable(null);
    setPrintingSession(session);
    setTimeout(() => window.print(), 500);
  };

  const handleExportRejectedExcel = async () => {
    try {
      const start = rejectedStartDate ? `${rejectedStartDate}T00:00:00` : undefined;
      const end = rejectedEndDate ? `${rejectedEndDate}T23:59:59` : undefined;
      const response = await axios.get(`${API}/analytics/rejected/export`, {
        params: { start, end },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Rejected_Orders_${rejectedStartDate}_to_${rejectedEndDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Rejected Export failed', err);
      alert('Failed to export rejected orders.');
    }
  };

  const filteredCategories = analytics.categories.filter(c => 
    analyticsCategory === 'all' || c.category === analyticsCategory
  );

  const buildTrendSeries = (trendData, startDate, endDate) => {
    const source = Array.isArray(trendData) ? trendData : [];
    const revenueByDate = new Map(
      source.map(item => [String(item.date || '').slice(0, 10), Number(item.revenue || 0)])
    );

    if (!startDate || !endDate) {
      return source;
    }

    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T23:59:59`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
      return source;
    }

    const series = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      const key = cursor.toISOString().split('T')[0];
      series.push({
        date: key,
        revenue: revenueByDate.get(key) || 0
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    return series;
  };

  const trendSeries = buildTrendSeries(analytics.trend, analyticsStartDate, analyticsEndDate);

  const filteredTrend = trendSeries.filter(d => 
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

  const inventoryUnits = Array.from(new Set(rawMaterials.map(item => item.unit).filter(Boolean))).sort();

  const filteredRawMaterials = rawMaterials
    .filter(item => {
      const quantity = Number(item.quantity || 0);
      const search = inventorySearch.trim().toLowerCase();
      const matchesSearch = !search || (item.name || '').toLowerCase().includes(search);
      const matchesUnit = inventoryUnitFilter === 'all' || item.unit === inventoryUnitFilter;
      const matchesStatus =
        inventoryStatusFilter === 'all' ||
        (inventoryStatusFilter === 'out' && quantity <= 0) ||
        (inventoryStatusFilter === 'low' && quantity > 0 && quantity < 5) ||
        (inventoryStatusFilter === 'in' && quantity >= 5);
      return matchesSearch && matchesUnit && matchesStatus;
    })
    .sort((a, b) => {
      const qtyA = Number(a.quantity || 0);
      const qtyB = Number(b.quantity || 0);
      if (inventorySort === 'qty-high') return qtyB - qtyA;
      if (inventorySort === 'qty-low') return qtyA - qtyB;
      if (inventorySort === 'name-desc') return (b.name || '').localeCompare(a.name || '');
      return (a.name || '').localeCompare(b.name || '');
    });
  
  const liveBills = orders.filter(o => o.paymentStatus !== 'PAID' && o.status !== 'REJECTED');
  
  const processGroups = (orders) => {
    const acc = {};
    orders.forEach(order => {
       const sId = order.sessionId || 'nosession';
       if (!acc[sId]) {
          acc[sId] = { 
            orders: [], 
            subtotal: 0,
            taxAmount: 0,
            serviceChargeAmount: 0, 
            total: 0, 
            tableNumber: order.restaurantTable?.tableNumber || '?',
            tableId: order.restaurantTable?.id,
            createdAt: order.createdAt,
            sessionId: sId,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            paymentMethod: order.paymentMethod
          };
       }
       acc[sId].orders.push(order);
       acc[sId].subtotal += order.totalAmount;
    });

    // Calculate final totals for each group
    Object.values(acc).forEach(group => {
      group.taxAmount = group.subtotal * (parseFloat(restaurant.taxPercentage || 0) / 100);
      group.serviceChargeAmount = group.subtotal * (parseFloat(restaurant.serviceCharge || 0) / 100);
      group.total = group.subtotal + group.taxAmount + group.serviceChargeAmount;
    });

    return Object.values(acc).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const groupedLiveBills = processGroups(liveBills);
  const groupedHistory = processGroups(orders.filter(o => o.paymentStatus === 'PAID' || o.status === 'REJECTED'));

  const navItems = [
    { id: 'saas', label: 'Overview', icon: Activity },
    { id: 'dashboard', label: 'Analytics', icon: TrendingUp },
    { id: 'menu', label: 'Menu', icon: Package },
    { id: 'live', label: 'Live', icon: Zap },
    { id: 'rejected', label: 'Rejected', icon: XCircle },
    { id: 'history', label: 'History', icon: History },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'staff', label: 'Staff', icon: UserCheck },
    { id: 'inventory', label: 'Inventory', icon: ClipboardList },
    { id: 'hotel', label: 'Settings', icon: Settings },
  ];
  const primaryNavItems = navItems.slice(0, 4);
  const secondaryNavItems = navItems.slice(4);
  const activeTabLabel = navItems.find(item => item.id === activeTab)?.label || 'Overview';

  const roleColors = { ADMIN: 'bg-purple-100 text-purple-700', KITCHEN: 'bg-orange-100 text-orange-700', WAITER: 'bg-blue-100 text-blue-700' };

  const buildPaidSessions = (applyFilters) => {
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
          createdAt: order.createdAt,
          taxAmount: 0,
          serviceChargeAmount: 0,
          subtotal: 0
        };
      }
      acc[sId].orders.push(order);
      if (order.paymentStatus === 'PAID') {
        acc[sId].total += (order.totalAmount || 0);
        acc[sId].taxAmount += (order.taxAmount || 0);
        acc[sId].serviceChargeAmount += (order.serviceChargeAmount || 0);
        acc[sId].subtotal += (order.subtotal || 0);
      }
      if (new Date(order.createdAt) < new Date(acc[sId].createdAt)) {
        acc[sId].createdAt = order.createdAt;
      }
      return acc;
    }, {});

    return Object.values(sessionMap).filter(session => {
      if (!applyFilters) return true;
      const d = new Date(session.createdAt);
      const sDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const matchesDate = (!historyFilterStartDate || sDate >= historyFilterStartDate) &&
        (!historyFilterEndDate || sDate <= historyFilterEndDate);
      const matchesTable = historyFilterTable === '' || session.tableNumber?.toString() === historyFilterTable;
      const matchesPayment = historyFilterPayment === 'all' || session.paymentMethod === historyFilterPayment;
      return matchesDate && matchesTable && matchesPayment;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const orderHistorySessions = buildPaidSessions(true);
  const allPaidSessions = buildPaidSessions(false);

  const hotelBillCode = (() => {
    const parts = (restaurant?.name || 'Hotel').match(/[A-Za-z0-9]+/g) || [];
    const initials = parts.map(part => part.charAt(0)).join('').toUpperCase();
    return (initials || 'HT').slice(0, 3);
  })();

  const billRefBySession = (() => {
    const ordered = [...allPaidSessions].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const map = {};
    ordered.forEach((session, index) => {
      map[session.sessionId] = `${hotelBillCode}${String(index + 1).padStart(3, '0')}`;
    });
    return map;
  })();

  const getBillRef = (session) => billRefBySession[session?.sessionId] || `${hotelBillCode}000`;

  return (
    <div className="admin-manager-ui min-h-screen flex overflow-hidden" style={{ background: activeTheme.pageBg }}>
      {/* Sidebar */}
      <div className="w-80 text-white border-r h-screen px-4 py-4 hidden md:flex md:fixed md:inset-y-0 md:left-0 flex-col z-40" style={{ background: activeTheme.sidebarBg, borderColor: 'rgba(255,255,255,0.12)' }}>
        <div className="px-3 pb-3 border-b border-white/10">
          <p className="text-[10px] font-black text-sky-200 uppercase tracking-[0.28em] mb-1">Manager Suite</p>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Settings size={18} className="text-sky-300" /> Command Center
          </h2>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pr-1 no-scrollbar pt-3">
          <p className="text-[10px] font-black text-sky-300 uppercase tracking-[0.25em] mb-2 px-3">Core</p>
          <div className="space-y-1 mb-4">
            {primaryNavItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full cursor-pointer text-left px-4 py-2.5 rounded-2xl font-bold transition flex items-center justify-between gap-3 ${activeTab === id ? 'bg-white text-[#0C2847] shadow-lg shadow-black/10' : 'text-sky-100 hover:bg-white/10 hover:text-white'}`}
              >
                <span className="flex items-center gap-3"><Icon size={18} />{label}</span>
                {activeTab === id && <ChevronRight size={16} />}
              </button>
            ))}
          </div>

          <p className="text-[10px] font-black text-sky-300 uppercase tracking-[0.25em] mb-2 px-3">Operations</p>
          <div className="space-y-1">
            {secondaryNavItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full cursor-pointer text-left px-4 py-2.5 rounded-2xl font-bold transition flex items-center justify-between gap-3 ${activeTab === id ? 'bg-white text-[#0C2847] shadow-lg shadow-black/10' : 'text-sky-100 hover:bg-white/10 hover:text-white'}`}
              >
                <span className="flex items-center gap-3"><Icon size={18} />{label}</span>
                {activeTab === id && <ChevronRight size={16} />}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-3 mt-3 border-t border-white/10 flex-shrink-0 space-y-2">
          <div className="px-4 py-2.5 rounded-2xl bg-white/10 border border-white/10">
            <p className="text-[10px] font-black text-sky-200 uppercase tracking-widest mb-1">Logged in as</p>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 rounded-full overflow-hidden border border-white/30 bg-white/10 flex items-center justify-center text-sm font-black">
                {uiPrefs.photoUrl ? (
                  <img src={uiPrefs.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  (session?.name || session?.username || 'A').charAt(0)
                )}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-white truncate">{session?.name || 'Admin'}</p>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest truncate">@{session?.username || 'admin'}</p>
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1.5">View: {activeTabLabel}</p>
            <label className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/15 border border-white/20 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-white/25 transition">
              <Camera size={12} /> Update Photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleProfilePhotoChange(e.target.files?.[0])}
              />
            </label>
          </div>
          <button 
            onClick={() => window.open(`/${urlHotelId || session?.hotelId || localStorage.getItem('hotelId') || 'master'}/owner/login`, '_blank')}
            className="w-full cursor-pointer text-left px-4 py-2.5 rounded-2xl font-bold text-sky-100 hover:bg-white/10 transition flex items-center gap-3"
          >
            <User size={18} /> Owner Admin Login
          </button>
          <button 
            onClick={() => {
              localStorage.removeItem(storageKeyForRole(session?.role || 'ADMIN'));
              window.location.href = `/${urlHotelId || session?.hotelId || localStorage.getItem('hotelId') || 'master'}/admin/login`;
            }}
            className="w-full cursor-pointer text-left px-4 py-2.5 rounded-2xl font-bold text-rose-100 hover:bg-rose-500/15 transition flex items-center gap-3"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 px-4 h-20 flex items-center justify-between backdrop-blur-xl border-b shadow-sm md:left-80 md:right-0" style={{ background: activeTheme.headerBg, borderColor: 'rgba(255,255,255,0.45)' }}>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMobileSidebarOpen(true)}
            className="md:hidden p-2 hover:bg-slate-100 rounded-xl transition text-slate-600"
          >
            <Activity size={24} />
          </button>
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Admin Portal</h2>
            <p className="hidden md:block text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">{restaurant.name || 'serversundaram'} - {activeTabLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 bg-white/70 border border-white/70 rounded-2xl px-3 py-2 shadow-sm">
            <Palette size={14} className="text-slate-600" />
            <select
              value={uiPrefs.theme}
              onChange={(e) => {
                const theme = e.target.value;
                setUiPrefs((prev) => ({ ...prev, theme }));
                persistManagerPrefs({ uiTheme: theme }).catch((err) => {
                  console.error('Failed to persist manager theme', err);
                });
              }}
              className="bg-transparent text-xs font-black text-slate-700 outline-none"
              title="Select manager theme"
            >
              {Object.entries(MANAGER_THEMES).map(([key, theme]) => (
                <option key={key} value={key}>{theme.label}</option>
              ))}
            </select>
          </div>
          {restaurant.logoUrl && (
            <img
              src={restaurant.logoUrl}
              alt={restaurant.name || 'Restaurant logo'}
              className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-900 truncate max-w-[120px]">{session?.name || 'Admin'}</p>
            <p className="text-[10px] font-black text-slate-500 truncate max-w-[120px]">@{session?.username || 'admin'}</p>
          </div>
          <label className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 shadow-lg shadow-slate-200 cursor-pointer flex items-center justify-center text-white text-xs font-black" style={{ backgroundColor: activeTheme.accent }} title="Change profile photo">
            {uiPrefs.photoUrl ? (
              <img src={uiPrefs.photoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              (session?.name || session?.username || 'A').charAt(0)
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleProfilePhotoChange(e.target.files?.[0])}
            />
          </label>
        </div>
      </div>

      {/* Mobile Drawer (Sidebar) */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          {/* Drawer Content */}
          <div className="absolute top-0 left-0 bottom-0 w-[320px] text-white shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col p-6" style={{ background: activeTheme.sidebarBg }}>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Settings size={20} className="text-sky-300" /> Manager Menu
              </h2>
              <button onClick={() => setIsMobileSidebarOpen(false)} className="p-2 text-sky-200 hover:text-white">
                <XCircle size={24} />
              </button>
            </div>

            <div className="mb-6 p-4 bg-white/10 rounded-2xl border border-white/10">
              <p className="text-[10px] font-black text-sky-200 uppercase tracking-widest mb-1">Signed in</p>
              <div className="flex items-center gap-3">
                <label className="w-12 h-12 rounded-full overflow-hidden border border-white/30 bg-white/10 cursor-pointer flex items-center justify-center text-sm font-black">
                  {uiPrefs.photoUrl ? (
                    <img src={uiPrefs.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    (session?.name || session?.username || 'A').charAt(0)
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleProfilePhotoChange(e.target.files?.[0])}
                  />
                </label>
                <div className="min-w-0">
                  <p className="font-bold text-white truncate">{session?.name || 'Admin'}</p>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1 truncate">@{session?.username || 'admin'}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 bg-white/10 rounded-xl px-2.5 py-2 border border-white/15">
                <Palette size={13} className="text-sky-200" />
                <select
                  value={uiPrefs.theme}
                  onChange={(e) => {
                    const theme = e.target.value;
                    setUiPrefs((prev) => ({ ...prev, theme }));
                    persistManagerPrefs({ uiTheme: theme }).catch((err) => {
                      console.error('Failed to persist manager theme', err);
                    });
                  }}
                  className="w-full bg-transparent text-xs font-black text-white outline-none"
                >
                  {Object.entries(MANAGER_THEMES).map(([key, theme]) => (
                    <option key={key} value={key} className="text-slate-900">{theme.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-5 -mx-2 px-2 no-scrollbar">
              <div>
                <p className="text-[10px] font-black text-sky-300 uppercase tracking-[0.28em] mb-2 px-2">Core</p>
                <div className="space-y-1">
                  {primaryNavItems.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => { setActiveTab(id); setIsMobileSidebarOpen(false); }}
                      className={`w-full cursor-pointer text-left px-4 py-3.5 rounded-2xl font-bold transition flex items-center justify-between gap-3 ${activeTab === id ? 'bg-white text-[#0D2A4A] shadow-lg shadow-black/10' : 'text-sky-100 hover:bg-white/10'}`}
                    >
                      <span className="flex items-center gap-3"><Icon size={20} />{label}</span>
                      {activeTab === id && <ChevronRight size={16} />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-sky-300 uppercase tracking-[0.28em] mb-2 px-2">Operations</p>
                <div className="space-y-1">
                  {secondaryNavItems.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => { setActiveTab(id); setIsMobileSidebarOpen(false); }}
                      className={`w-full cursor-pointer text-left px-4 py-3.5 rounded-2xl font-bold transition flex items-center justify-between gap-3 ${activeTab === id ? 'bg-white text-[#0D2A4A] shadow-lg shadow-black/10' : 'text-sky-100 hover:bg-white/10'}`}
                    >
                      <span className="flex items-center gap-3"><Icon size={20} />{label}</span>
                      {activeTab === id && <ChevronRight size={16} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-gray-100 space-y-3">
              <button 
                onClick={() => { setIsMobileSidebarOpen(false); window.open(`/${urlHotelId || session?.hotelId || localStorage.getItem('hotelId') || 'master'}/owner/login`, '_blank'); }}
                className="w-full cursor-pointer text-left px-4 py-4 rounded-2xl font-black text-sm text-slate-900 bg-white flex items-center gap-3 transition active:scale-95"
              >
                <User size={20} /> Owner Admin
              </button>
              <button 
                onClick={() => {
                  localStorage.removeItem(storageKeyForRole(session?.role || 'ADMIN'));
                  window.location.href = `/${urlHotelId || session?.hotelId || localStorage.getItem('hotelId') || 'master'}/admin/login`;
                }}
                className="w-full cursor-pointer text-left px-4 py-4 rounded-2xl font-black text-sm text-rose-100 bg-rose-500/20 flex items-center gap-3 transition active:scale-95"
              >
                <LogOut size={20} /> Logout Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Nav removed for clarity - User requested cleaner view */}

      <div className="manager-content flex-1 p-4 md:p-8 pt-24 md:pt-24 pb-28 md:pb-10 h-full overflow-y-auto md:ml-80" style={uiSurfaceStyles}>
        {/* ===== SAAS DASHBOARD TAB ===== */}
        {activeTab === 'saas' && (
          <HotelSaaSDashboard 
            analytics={analytics} 
            restaurant={restaurant} 
            tables={tables} 
            staff={staff} 
            setActiveTab={setActiveTab}
            trendSeries={trendSeries}
            chartReady={chartReady}
            startDate={analyticsStartDate}
            endDate={analyticsEndDate}
            theme={activeTheme}
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
            <div className="bg-white/70 backdrop-blur-xl p-6 sm:p-8 rounded-[2.5rem] border shadow-2xl flex flex-wrap gap-6 items-end relative overflow-hidden group" style={{ background: 'var(--ui-surface)', borderColor: 'var(--ui-line)', boxShadow: '0 24px 70px rgba(15,23,42,0.10)' }}>
               <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-amber-500/10 transition-colors duration-700"></div>
               <div className="flex-1 min-w-[240px] relative z-10">
                 <label className="text-[10px] font-black uppercase text-gray-400 mb-3 block ml-1 tracking-widest">Search Insights</label>
                 <div className="relative group/input">
                   <div className="absolute inset-0 bg-amber-500/5 rounded-2xl blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity"></div>
                   <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-amber-500 transition-colors" size={20} />
                   <input 
                     type="text" 
                     placeholder="Search item, order, or customer..."
                     value={analyticsSearch}
                     onChange={(e) => setAnalyticsSearch(e.target.value)}
                     className="w-full bg-gray-50/50 backdrop-blur-sm border-2 border-transparent rounded-2xl py-4 pl-14 pr-6 focus:bg-white focus:ring-0 font-bold transition-all placeholder:text-gray-300"
                     style={{ backgroundColor: 'var(--ui-surface-soft)', color: 'var(--ui-text)' }}
                   />
                 </div>
               </div>
               <div className="w-full lg:w-48 relative z-10">
                 <label className="text-[10px] font-black uppercase text-gray-400 mb-3 block ml-1 tracking-widest">From</label>
                 <input 
                   type="date" 
                   value={analyticsStartDate}
                   onChange={(e) => setAnalyticsStartDate(e.target.value)}
                   className="w-full bg-gray-50/50 border-2 border-transparent rounded-2xl py-4 px-6 focus:bg-white font-bold transition-all text-gray-700"
                   style={{ backgroundColor: 'var(--ui-surface-soft)', color: 'var(--ui-text)' }}
                 />
               </div>
               <div className="w-full lg:w-48 relative z-10">
                 <label className="text-[10px] font-black uppercase text-gray-400 mb-3 block ml-1 tracking-widest">To</label>
                 <input 
                   type="date" 
                   value={analyticsEndDate}
                   onChange={(e) => setAnalyticsEndDate(e.target.value)}
                   className="w-full bg-gray-50/50 border-2 border-transparent rounded-2xl py-4 px-6 focus:bg-white font-bold transition-all text-gray-700"
                   style={{ backgroundColor: 'var(--ui-surface-soft)', color: 'var(--ui-text)' }}
                 />
               </div>
               <div className="w-full lg:w-48 relative z-10">
                 <label className="text-[10px] font-black uppercase text-gray-400 mb-3 block ml-1 tracking-widest">Scope</label>
                 <select 
                   value={analyticsCategory}
                   onChange={(e) => setAnalyticsCategory(e.target.value)}
                   className="w-full bg-gray-50/50 border-2 border-transparent rounded-2xl py-4 px-6 focus:bg-white font-bold transition-all cursor-pointer appearance-none text-gray-700"
                   style={{ backgroundColor: 'var(--ui-surface-soft)', color: 'var(--ui-text)' }}
                 >
                   <option value="all">Global Store</option>
                   {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                 </select>
               </div>
               <button 
                 onClick={() => { setAnalyticsStartDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); setAnalyticsEndDate(new Date().toISOString().split('T')[0]); setAnalyticsCategory('all'); setAnalyticsSearch(''); }}
                 className="p-5 rounded-2xl bg-gray-50/50 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer border-2 border-transparent hover:border-red-100 z-10"
                 title="Reset Filters"
               >
                 <Filter size={22} />
               </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { 
                  label: 'Monthly Revenue', 
                  value: `Rs ${((analytics.summary.monthlyRevenue ?? analytics.summary.totalRevenue ?? 0)).toLocaleString('en-IN')}`, 
                  icon: TrendingUp, 
                  color: 'text-amber-500', 
                  bg: 'bg-amber-500/10',
                  glow: 'shadow-amber-500/20'
                },
                { label: 'Order Volume', value: analytics.summary.totalOrders || 0, icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/10', glow: 'shadow-blue-500/20' },
                { 
                  label: 'Unit Average', 
                  value: `Rs ${(((analytics.summary.avgOrderValue || 0) * (1 + (parseFloat(restaurant.taxPercentage || 0) + parseFloat(restaurant.serviceCharge || 0)) / 100))).toLocaleString('en-IN')}`, 
                  icon: Zap, 
                  color: 'text-purple-500', 
                  bg: 'bg-purple-500/10',
                  glow: 'shadow-purple-500/20'
                },
                { 
                  label: 'Peak Revenue', 
                  value: `Rs ${((Math.max(...trendSeries.map(d => d.revenue), 0) * (1 + (parseFloat(restaurant.taxPercentage || 0) + parseFloat(restaurant.serviceCharge || 0)) / 100))).toLocaleString('en-IN')}`, 
                  icon: CheckCircle, 
                  color: 'text-emerald-500', 
                  bg: 'bg-emerald-500/10',
                  glow: 'shadow-emerald-500/20'
                },
              ].map((stat, i) => (
                <div key={i} className={`p-8 rounded-[2.5rem] border shadow-xl ${stat.glow} hover:scale-[1.02] transition-all duration-300 relative overflow-hidden group`} style={{ background: 'var(--ui-surface)', borderColor: 'var(--ui-line)' }}>
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700 opacity-50" style={{ backgroundColor: 'var(--ui-surface-soft)' }}></div>
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className={`p-4 ${stat.bg} rounded-2xl transition-all duration-300 group-hover:rotate-12`}>
                      <stat.icon size={28} className={stat.color} />
                    </div>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 relative z-10">{stat.label}</p>
                  <p className="text-3xl font-black tracking-tight relative z-10" style={{ color: 'var(--ui-text)' }}>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Revenue Trend Chart */}
              <div className="backdrop-blur-md p-8 md:p-12 rounded-[3rem] border shadow-2xl relative overflow-hidden group lg:col-span-2" style={{ background: 'var(--ui-surface)', borderColor: 'var(--ui-line)', boxShadow: '0 30px 90px rgba(15,23,42,0.10)' }}>
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full -mr-48 -mt-48 blur-3xl group-hover:bg-amber-500/10 transition-colors duration-1000"></div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-14 relative z-10">
                  <div>
                      <h3 className="font-black text-4xl mb-2 tracking-tight" style={{ color: 'var(--ui-text)' }}>Revenue Performance</h3>
                      <p className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--ui-muted)' }}>
                       <TrendingUp size={16} className="text-emerald-500" /> Professional transaction trend analysis.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-5 py-2.5 bg-amber-500/10 text-amber-600 text-[10px] font-black rounded-2xl uppercase tracking-[0.2em] border border-amber-500/20">Live Pulse</span>
                  </div>
                </div>
                
                <div className="mb-4 relative z-10">
                  {filteredTrend.length === 0 ? (
                    <div className="h-[460px] rounded-[3rem] border-2 border-dashed backdrop-blur-sm flex flex-col items-center justify-center gap-4" style={{ borderColor: 'var(--ui-line)', background: 'var(--ui-surface-soft)', color: 'var(--ui-muted)' }}>
                      <div className="p-6 rounded-full shadow-lg" style={{ background: 'var(--ui-surface)' }}><Activity size={48} style={{ color: 'var(--ui-line)' }} /></div>
                      <p className="font-black tracking-widest uppercase text-xs">No active data for this period</p>
                    </div>
                  ) : (
                    (() => {
                      const chartData = filteredTrend;
                      // Improved scaling logic: give 20% headroom
                      const rawMax = Math.max(...chartData.map(d => Number(d.revenue || 0)), 0);
                      const maxRevenue = rawMax > 0 ? rawMax * 1.2 : 100;
                      
                      const chartHeight = 400;
                      const chartWidth = 1200;
                      const padding = { top: 40, right: 60, bottom: 80, left: 80 };
                      const innerWidth = chartWidth - padding.left - padding.right;
                      const innerHeight = chartHeight - padding.top - padding.bottom;
                      const barWidth = Math.max(Math.min((innerWidth / chartData.length) - 12, 60), 8);
                      const barStep = chartData.length === 1 ? innerWidth : innerWidth / chartData.length;

                      // Fix labels: if more than 15 entries, sample them
                      const labelStep = Math.max(Math.ceil(chartData.length / 10), 1);

                      return (
                        <div className="grid grid-cols-[80px_1fr] gap-8 h-[460px]">
                          <div className="relative h-[340px] mt-[40px]">
                            {[1, 0.75, 0.5, 0.25, 0].map((p) => {
                              const labelValue = maxRevenue * p;
                              return (
                                <div
                                  key={p}
                                  className="absolute left-0 right-0 flex items-center transition-all duration-500"
                                  style={{ bottom: `${p * 100}%` }}
                                >
                                  <span className="w-full pr-4 text-right text-[10px] font-black text-gray-400 tabular-nums tracking-tighter">
                                    {p === 0 ? '0' : `Rs ${labelValue >= 1000 ? (labelValue/1000).toFixed(1) + 'k' : labelValue.toFixed(0)}`}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          <div className="relative h-full rounded-[3rem] bg-gradient-to-br from-white to-gray-50/50 border border-white shadow-inner overflow-hidden">
                            {/* Grid Lines */}
                            {[0.25, 0.5, 0.75, 1].map((p, idx) => (
                              <div
                                key={idx}
                                className="absolute left-0 right-0 border-t border-gray-100/60"
                                style={{ bottom: `${p * (innerHeight / (chartHeight/100)) + (padding.bottom / (chartHeight/100))}%` }}
                              />
                            ))}

                            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="absolute inset-0 h-full w-full">
                              <defs>
                                <linearGradient id="premiumBarFill" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#FDB931" />
                                  <stop offset="100%" stopColor="#9E7B1C" />
                                </linearGradient>
                                <linearGradient id="activeBarFill" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#FDB931" />
                                  <stop offset="100%" stopColor="#B8860B" />
                                </linearGradient>
                                <filter id="glow">
                                  <feGaussianBlur stdDeviation="3" result="blur" />
                                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>
                              </defs>

                              {chartData.map((day, index) => {
                                const value = Number(day.revenue || 0);
                                const height = (value / maxRevenue) * innerHeight;
                                const x = padding.left + (index * barStep) + (barStep - barWidth) / 2;
                                const y = padding.top + innerHeight - height;
                                const pulseDelay = `${index * 50}ms`;
                                const shouldShowLabel = index % labelStep === 0 || index === chartData.length - 1;
                                
                                return (
                                  <g key={day.date} className="group/bar cursor-pointer">
                                    {/* Glassy Background Path */}
                                    <rect
                                      x={padding.left + (index * barStep)}
                                      y={padding.top}
                                      width={barStep}
                                      height={innerHeight}
                                      fill="transparent"
                                      className="hover:fill-amber-500/5 transition-colors"
                                    />
                                    
                                    {/* The Bar */}
                                    <rect
                                      x={x}
                                      y={chartReady ? y : padding.top + innerHeight}
                                      width={barWidth}
                                      height={chartReady ? Math.max(height, 2) : 0}
                                      rx={barWidth / 2}
                                      fill={value > 0 ? "url(#premiumBarFill)" : "#f3f4f6"}
                                      className="transition-all duration-1000 ease-out group-hover/bar:filter group-hover/bar:brightness-110"
                                      style={{ transitionDelay: pulseDelay }}
                                    >
                                      <title>{day.date} - Rs {value.toLocaleString('en-IN')}</title>
                                    </rect>

                                    {/* Peak Indicator */}
                                    {value > 0 && chartReady && (
                                      <circle
                                        cx={x + barWidth / 2}
                                        cy={y}
                                        r="4"
                                        fill="white"
                                        className="opacity-0 group-hover/bar:opacity-100 transition-opacity"
                                      />
                                    )}

                                    {/* Date Label */}
                                    {shouldShowLabel && (
                                      <text
                                        x={x + barWidth / 2}
                                        y={chartHeight - 35}
                                        textAnchor="middle"
                                        className="fill-gray-400 font-black"
                                        fontSize="11"
                                        style={{ letterSpacing: '0.05em' }}
                                      >
                                        {day.date.split('-').slice(1).reverse().join('/')}
                                      </text>
                                    )}
                                  </g>
                                );
                              })}
                            </svg>

                            <div className="absolute bottom-6 right-10 text-[9px] font-black uppercase tracking-[0.3em] text-amber-500/40 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-100">
                              Timeline Analysis: {analyticsStartDate} to {analyticsEndDate}
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>

              {/* Best Sellers */}
              <div className="p-10 rounded-[3rem] border shadow-2xl relative overflow-hidden group" style={{ background: 'var(--ui-surface)', borderColor: 'var(--ui-line)', boxShadow: '0 24px 70px rgba(15,23,42,0.08)' }}>
                <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full -ml-16 -mt-16 blur-2xl"></div>
                <div className="flex justify-between items-center mb-10 relative z-10">
                   <h3 className="font-black text-2xl flex items-center gap-4" style={{ color: 'var(--ui-text)' }}>
                     <div className="p-3 text-white rounded-2xl shadow-lg shadow-amber-500/20" style={{ backgroundColor: 'var(--ui-accent)' }}><Star size={24} className="fill-white" /></div>
                     Best Sellers
                   </h3>
                   <span className="text-[9px] font-black p-3 bg-amber-50 text-amber-600 rounded-xl uppercase tracking-[0.2em] border border-amber-100">Top Performance</span>
                </div>
                <div className="space-y-4 relative z-10">
                  {filteredDishes.slice(0, 5).map((dish, i) => (
                    <div key={i} className="flex items-center gap-6 p-5 rounded-[2rem] transition-all border hover:shadow-xl group/item" style={{ backgroundColor: 'var(--ui-surface-soft)', borderColor: 'var(--ui-line)' }}>
                      <div className="w-14 h-14 rounded-2xl shadow-md flex items-center justify-center font-black text-lg group-hover/item:text-white transition-all transform group-hover/item:rotate-6" style={{ backgroundColor: 'var(--ui-surface)', color: 'var(--ui-accent)' }}>{i + 1}</div>
                      <div className="flex-1">
                        <p className="font-black text-lg group-hover/item:text-amber-600 transition-colors uppercase tracking-tight" style={{ color: 'var(--ui-text)' }}>{dish.name}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--ui-muted)' }}>{dish.quantity} units moved</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-xl" style={{ color: 'var(--ui-text)' }}>Rs {(dish.revenue || 0).toLocaleString('en-IN')}</p>
                        <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 justify-end">
                           <ArrowUpRight size={12} /> MAX SELL
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredDishes.length === 0 && (
                      <div className="text-center py-20 rounded-[2rem] border-2 border-dashed" style={{ backgroundColor: 'var(--ui-surface-soft)', borderColor: 'var(--ui-line)' }}>
                        <Package size={48} className="mx-auto mb-4" style={{ color: 'var(--ui-line)' }} />
                        <p className="font-black uppercase text-xs tracking-widest" style={{ color: 'var(--ui-muted)' }}>No matching items found</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Profitability Index (Petpooja Pro Feature) */}
              <div className="rounded-[3rem] p-10 border shadow-xl relative overflow-hidden group" style={{ background: 'var(--ui-surface)', borderColor: 'var(--ui-line)' }}>
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h3 className="text-2xl font-black tracking-tight" style={{ color: 'var(--ui-text)' }}>Profitability Index</h3>
                    <p className="text-emerald-600 font-black text-[10px] uppercase tracking-widest mt-1">Real-time Margin Tracking</p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600"><TrendingUp size={24} /></div>
                </div>

                <div className="space-y-6">
                  {analytics.margins.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-6 group/item">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black group-hover/item:bg-emerald-500 group-hover/item:text-white transition-all" style={{ backgroundColor: 'var(--ui-surface-soft)', color: 'var(--ui-muted)' }}>#{idx+1}</div>
                      <div className="flex-1">
                        <div className="flex justify-between items-end mb-2">
                          <p className="font-black" style={{ color: 'var(--ui-text)' }}>{item.name}</p>
                          <p className="text-emerald-600 font-black text-sm">{item.percent?.toFixed(1)}% Margin</p>
                        </div>
                        <div className="h-3 rounded-full overflow-hidden border p-0.5" style={{ backgroundColor: 'var(--ui-surface-soft)', borderColor: 'var(--ui-line)' }}>
                          <div 
                            className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-sm" 
                            style={{ width: `${item.percent}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-gray-400">Net Profit</p>
                        <p className="font-black" style={{ color: 'var(--ui-text)' }}>Rs {item.margin?.toFixed(0)}</p>
                      </div>
                    </div>
                  ))}
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
              <div className="bg-white p-4 sm:p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-wrap gap-4 items-end animate-in slide-in-from-top duration-300">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 block ml-1">Search Item</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search items..." 
                      value={menuSearch}
                      onChange={(e) => setMenuSearch(e.target.value)}
                      className="w-full bg-gray-50 border-0 rounded-xl py-3.5 pl-11 pr-4 focus:ring-2 focus:ring-amber-500 font-bold text-sm"
                    />
                  </div>
                </div>
                <div className="w-full sm:w-48">
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 block ml-1">Category</label>
                  <select 
                    value={menuFilterCategory}
                    onChange={(e) => setMenuFilterCategory(e.target.value)}
                    className="w-full bg-gray-50 border-0 rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-amber-500 font-bold text-sm"
                  >
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="w-full sm:w-48">
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 block ml-1">Status</label>
                  <select 
                    value={menuFilterAvailability}
                    onChange={(e) => setMenuFilterAvailability(e.target.value)}
                    className="w-full bg-gray-50 border-0 rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-amber-500 font-bold text-sm"
                  >
                    <option value="all">Any Status</option>
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
                                <img src={getFullImageUrl(previewUrl)} alt="Preview" className="w-full h-full object-cover" />
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
                                  setMenuForm(prev => ({ ...prev, imageUrl: '' }));
                                  setPreviewUrl(URL.createObjectURL(file));
                                }
                              }}
                            />
                          </div>
                          <div className="flex-1 w-full">
                            <label className="font-bold text-[10px] text-gray-400 mb-1 block uppercase tracking-widest">Or Image URL</label>
                            <input value={menuForm.imageUrl} onChange={e => { const value = e.target.value; setMenuForm({ ...menuForm, imageUrl: value }); if (value.trim()) { setSelectedFile(null); setPreviewUrl(value.trim()); } else if (!selectedFile) { setPreviewUrl(null); } }} className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-amber-500 outline-none transition text-sm" placeholder="Paste Unsplash or external URL" />
                            <p className="text-[10px] text-gray-400 mt-2 italic font-medium">Tip: Direct upload is recommended for the best experience.</p>
                          </div>
                        </div>
                    </div>
                    <div><label className="font-bold text-sm text-gray-500 mb-1 block">Price (Rs)</label><input type="number" step="1" required value={menuForm.price} onChange={e => setMenuForm({ ...menuForm, price: e.target.value })} className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-amber-500 outline-none transition" /></div>
                    <div>
                      <label className="font-bold text-sm text-gray-500 mb-1 block">Food Type</label>
                      <div className="flex bg-gray-50 p-1.5 rounded-xl border-2 border-gray-100">
                        <button
                          type="button"
                          onClick={() => setMenuForm({ ...menuForm, isVeg: true })}
                          className={`flex-1 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${menuForm.isVeg ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                          Veg
                        </button>
                        <button
                          type="button"
                          onClick={() => setMenuForm({ ...menuForm, isVeg: false })}
                          className={`flex-1 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${!menuForm.isVeg ? 'bg-red-500 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                          Non-Veg
                        </button>
                      </div>
                    </div>
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
              <div className="bg-white rounded-[2rem] sm:rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Desktop Menu Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100"><tr><th className="p-5 font-black text-gray-400 text-xs uppercase tracking-widest">Item</th><th className="p-5 font-black text-gray-400 text-xs uppercase tracking-widest text-center">Price</th><th className="p-5 font-black text-gray-400 text-xs uppercase tracking-widest text-center">Availability</th><th className="p-5 text-right font-black text-gray-400 text-xs uppercase tracking-widest">Actions</th></tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredMenuItems.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition">
                          <td className="p-5">
                            <div className="flex items-center gap-3">
                              <img src={getFullImageUrl(item.imageUrl) || '/food_placeholder.png'} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-gray-100" onError={e => e.target.src = '/food_placeholder.png'} loading="lazy" />
                              <div>
                                <div className="font-bold text-gray-900">{item.name}</div>
                                <div className="text-xs font-bold text-amber-600 mt-0.5 flex items-center gap-2">
                                  {item.category.name}
                                  <span className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} title={item.isVeg ? 'Veg' : 'Non-Veg'}></span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-5 text-center font-black text-gray-700">Rs {(item.price || 0).toLocaleString('en-IN')}</td>
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

                {/* Mobile Menu Cards */}
                <div className="md:hidden divide-y divide-gray-50">
                   {filteredMenuItems.map(item => (
                     <div key={item.id} className="p-5 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                           <div className="flex gap-4">
                              <img src={getFullImageUrl(item.imageUrl) || '/food_placeholder.png'} alt={item.name} className="w-14 h-14 rounded-2xl object-cover bg-gray-100 border border-gray-100" />
                              <div>
                                 <p className="font-black text-gray-900 leading-tight">{item.name}</p>
                                 <div className="flex items-center gap-2 mt-1">
                                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{item.category.name}</p>
                                    <span className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                 </div>
                              </div>
                           </div>
                           <p className="font-black text-lg text-gray-900">Rs {item.price}</p>
                        </div>
                        <div className="flex gap-2">
                           <button 
                             onClick={() => toggleAvailability(item)}
                             className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition shadow-sm border ${item.available ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-red-50 border-red-100 text-red-600'}`}
                           >
                             {item.available ? 'AVAILABLE' : 'OUT OF STOCK'}
                           </button>
                           <button onClick={() => handleMenuEdit(item)} className="p-3 bg-gray-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition shadow-sm border border-gray-100"><Edit2 size={16} /></button>
                           <button onClick={() => handleMenuDelete(item.id)} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition shadow-sm border border-red-100"><Trash2 size={16} /></button>
                        </div>
                     </div>
                   ))}
                </div>

                {filteredMenuItems.length === 0 && (
                  <div className="text-center py-20 px-6">
                     <Package size={40} className="text-gray-100 mx-auto mb-4" />
                     <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">No items match your search</p>
                  </div>
                )}
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
                        <span className="font-bold text-amber-400">Rs {session.total.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  ))}
                  {groupedLiveBills.length === 0 && <p className="text-gray-500 text-center py-8 font-bold italic text-sm">All clear!</p>}
                </div>
                <button onClick={() => setActiveTab('live')} className="w-full mt-5 bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 rounded-2xl transition text-sm cursor-pointer">View Live Bills</button>
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
                               <span className="font-bold text-gray-700">Rs {order.totalAmount.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {order.items?.map(item => (
                                <span key={item.id} className="text-[10px] bg-white text-gray-500 font-bold px-1.5 py-0.5 rounded border border-gray-100">{item.quantity}x {item.menuItem?.name}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="text-left md:text-right min-w-[200px] flex flex-col gap-2">
                      <div className="flex justify-between items-center mb-1">
                        <button 
                          onClick={() => handlePrintBill(session)}
                          className="bg-white text-gray-500 hover:text-blue-600 p-2.5 rounded-xl border border-gray-100 shadow-sm transition cursor-pointer flex items-center justify-center gap-2 text-xs font-black uppercase"
                          title="Print Thermal Bill"
                        >
                          <Printer size={18} /> Print Bill
                        </button>
                        <div className="flex flex-col">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Bill</p>
                          <p className="font-black text-3xl text-gray-900">Rs {session.total.toLocaleString('en-IN')}</p>
                          {(session.taxAmount > 0 || session.serviceChargeAmount > 0) && (
                            <p className="text-[10px] text-gray-400 font-bold mt-1">
                              Incl. Rs {session.taxAmount.toFixed(2)} Tax + Rs {session.serviceChargeAmount.toFixed(2)} SC
                            </p>
                          )}
                        </div>
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
          <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-[2.5rem] p-8 sm:p-10 shadow-2xl shadow-slate-200/50 border border-slate-800 overflow-hidden relative">
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.18),transparent_25%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.18),transparent_24%)]"></div>
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                <div className="max-w-2xl">
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-amber-300 mb-3">Operations Ledger</p>
                  <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-3">Order History</h1>
                  <p className="text-slate-300 font-medium max-w-xl">A table-first audit view for payments, sessions, and settlement traceability.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="bg-white/10 border border-white/10 rounded-2xl px-4 py-3 min-w-[120px]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Sessions</p>
                    <p className="text-2xl font-black">{orderHistorySessions.length}</p>
                  </div>
                  <button 
                    onClick={handleHistoryExportExcel}
                    disabled={orderHistorySessions.length === 0}
                    className={`px-6 py-4 rounded-2xl font-black transition shadow-lg flex items-center gap-2 ${
                      orderHistorySessions.length > 0 ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 cursor-pointer' : 'bg-white/10 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Download size={18} /> Export Ledger
                  </button>
                </div>
              </div>
            </div>

            {/* History Filters */}
            <div className="bg-white/85 backdrop-blur-xl p-4 sm:p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-wrap gap-4 items-end">
               <div className="flex-1 min-w-[140px]">
                 <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 block ml-1">From Date</label>
                 <div className="relative">
                   <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                   <input 
                     type="date" 
                     value={historyFilterStartDate}
                     onChange={(e) => setHistoryFilterStartDate(e.target.value)}
                     className="w-full bg-gray-50 border-0 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-amber-500 font-bold text-xs"
                   />
                 </div>
               </div>
               <div className="flex-1 min-w-[140px]">
                 <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 block ml-1">To Date</label>
                 <div className="relative">
                   <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                   <input 
                     type="date" 
                     value={historyFilterEndDate}
                     onChange={(e) => setHistoryFilterEndDate(e.target.value)}
                     className="w-full bg-gray-50 border-0 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-amber-500 font-bold text-xs"
                   />
                 </div>
               </div>
               <div className="w-full sm:w-32">
                 <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 block ml-1">Table</label>
                 <select 
                   value={historyFilterTable}
                   onChange={(e) => setHistoryFilterTable(e.target.value)}
                   className="w-full bg-gray-50 border-0 rounded-xl py-3 px-4 focus:ring-2 focus:ring-amber-500 font-bold text-xs"
                 >
                   <option value="">All Tables</option>
                   {tables.map(t => <option key={t.id} value={t.tableNumber}>{t.tableNumber}</option>)}
                 </select>
               </div>
               <div className="w-full sm:w-40 flex gap-2 items-end">
                 <div className="flex-1">
                   <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 block ml-1">Payment</label>
                   <select 
                     value={historyFilterPayment}
                     onChange={(e) => setHistoryFilterPayment(e.target.value)}
                     className="w-full bg-gray-50 border-0 rounded-xl py-3 px-4 focus:ring-2 focus:ring-amber-500 font-bold text-xs"
                   >
                     <option value="all">Any Method</option>
                     <option value="CASH">Cash</option>
                     <option value="UPI">UPI</option>
                     <option value="CARD">Card</option>
                   </select>
                 </div>
                 <button 
                   onClick={() => { setHistoryFilterStartDate(new Date().toISOString().split('T')[0]); setHistoryFilterEndDate(new Date().toISOString().split('T')[0]); setHistoryFilterTable(''); setHistoryFilterPayment('all'); }}
                   className="p-3.5 bg-gray-100 text-gray-400 hover:text-red-500 rounded-xl transition cursor-pointer"
                   title="Clear Filters"
                 >
                   <XCircle size={18} />
                 </button>
               </div>
            </div>
            {orderHistorySessions.length === 0 ? (
              <div className="text-center py-20 text-gray-400 font-bold text-xl border-2 border-dashed border-gray-200 rounded-3xl bg-white/80">No order history yet.</div>
            ) : (
              <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[980px]">
                    <thead>
                      <tr>
                        <th className="p-5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Table</th>
                        <th className="p-5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Bill Ref</th>
                        <th className="p-5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Payment</th>
                        <th className="p-5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Order Details</th>
                        <th className="p-5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Settlement</th>
                        <th className="p-5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orderHistorySessions.map(session => {
                        const billRef = getBillRef(session);
                        const orderedItems = session.orders
                          .flatMap(order => order.items || [])
                          .map(item => ({
                            key: item.id,
                            label: `${item.quantity}x ${item.menuItem?.name || 'Item'}`
                          }));
                        const previewItems = orderedItems.slice(0, 3);
                        const remainingCount = Math.max(orderedItems.length - previewItems.length, 0);

                        return (
                        <tr key={session.sessionId} className="hover:bg-slate-50/70 transition">
                          <td className="p-5">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black">
                                {session.tableNumber || '?'}
                              </div>
                              <div>
                                <p className="font-black text-slate-900">Table {session.tableNumber || 'N/A'}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{new Date(session.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-5">
                            <p className="font-black text-sm text-slate-700">{billRef}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </td>
                          <td className="p-5">
                            <span className="inline-flex px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-emerald-50 text-emerald-700 border border-emerald-100">
                              {session.paymentMethod || 'PAID'}
                            </span>
                          </td>
                          <td className="p-5">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                {previewItems.map(item => (
                                  <span key={item.key} className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 font-black text-xs">
                                    {item.label}
                                  </span>
                                ))}
                                {remainingCount > 0 && (
                                  <span
                                    className="px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 font-black text-xs border border-amber-100"
                                    title={orderedItems.map(i => i.label).join(', ')}
                                  >
                                    +{remainingCount} more
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{session.orders.length} batches</p>
                            </div>
                          </td>
                          <td className="p-5">
                            <p className="font-black text-slate-900 text-lg">Rs {session.total.toLocaleString('en-IN')}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Incl. tax and charges</p>
                          </td>
                          <td className="p-5 text-right">
                            <button 
                              onClick={() => handlePrintBill(session)}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-[0.18em] hover:bg-black cursor-pointer"
                            >
                              <Printer size={16} /> Print
                            </button>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== REJECTED ORDERS TAB ===== */}
        {activeTab === 'rejected' && (
          <div className="animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
              <div>
                <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight mb-2">Rejected Orders</h1>
                <p className="text-sm sm:text-base text-gray-500 font-medium">Review kitchen-declined orders and feedback.</p>
              </div>
              <div className="w-full sm:w-auto">
                {(() => {
                  const hasRejected = orders.some(o => {
                    const sDate = new Date(o.createdAt).toISOString().split('T')[0];
                    const matchesDate = (!rejectedStartDate || sDate >= rejectedStartDate) && 
                                       (!rejectedEndDate || sDate <= rejectedEndDate);
                    return o.status === 'REJECTED' && matchesDate;
                  });
                  return (
                    <button 
                      onClick={handleExportRejectedExcel}
                      disabled={!hasRejected}
                      className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black transition shadow-lg ${
                        hasRejected ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-100 cursor-pointer' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Download size={20} /> Export History
                    </button>
                  );
                })()}
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 sm:p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-wrap gap-4 items-end mb-8">
               <div className="flex-1 min-w-[140px]">
                 <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 block ml-1">From Date</label>
                 <div className="relative">
                   <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                   <input 
                     type="date" 
                     value={rejectedStartDate}
                     onChange={(e) => setRejectedStartDate(e.target.value)}
                     className="w-full bg-gray-50 border-0 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-red-500 font-bold text-xs"
                   />
                 </div>
               </div>
               <div className="flex-1 min-w-[140px]">
                 <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 block ml-1">To Date</label>
                 <div className="relative">
                   <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                   <input 
                     type="date" 
                     value={rejectedEndDate}
                     onChange={(e) => setRejectedEndDate(e.target.value)}
                     className="w-full bg-gray-50 border-0 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-red-500 font-bold text-xs"
                   />
                 </div>
               </div>
               <button 
                 onClick={() => { setRejectedStartDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); setRejectedEndDate(new Date().toISOString().split('T')[0]); }}
                 className="p-3.5 bg-gray-100 text-gray-400 hover:text-red-500 rounded-xl transition cursor-pointer"
                 title="Reset Dates"
               >
                 <XCircle size={18} />
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

                 return (
                   <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                     <div className="overflow-x-auto">
                       <table className="w-full text-left min-w-[1080px]">
                         <thead>
                           <tr>
                             <th className="p-5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Table</th>
                             <th className="p-5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Bill Ref</th>
                             <th className="p-5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Payment</th>
                             <th className="p-5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Order Details</th>
                             <th className="p-5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Rejection Reason</th>
                             <th className="p-5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Impact</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                           {rejectedItems.map(order => {
                             const sessionKey = order.sessionId || `legacy-${order.id}`;
                             const billRef = getBillRef({ sessionId: sessionKey });
                             const itemPreview = (order.items || []).slice(0, 3);
                             const extraItems = Math.max((order.items || []).length - itemPreview.length, 0);

                             return (
                               <tr key={order.id} className="hover:bg-rose-50/40 transition">
                                 <td className="p-5">
                                   <div className="flex items-center gap-3">
                                     <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black">
                                       {order.restaurantTable?.tableNumber || '?'}
                                     </div>
                                     <div>
                                       <p className="font-black text-slate-900">Table {order.restaurantTable?.tableNumber || 'N/A'}</p>
                                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                                     </div>
                                   </div>
                                 </td>
                                 <td className="p-5">
                                   <p className="font-black text-sm text-slate-700">{billRef}</p>
                                   <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mt-1">Order #{order.id} Rejected</p>
                                 </td>
                                 <td className="p-5">
                                   <span className="inline-flex px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-red-50 text-red-700 border border-red-100">
                                     {order.paymentMethod || 'UNPAID'}
                                   </span>
                                 </td>
                                 <td className="p-5">
                                   <div className="flex items-center gap-2 flex-wrap">
                                     {itemPreview.map(item => (
                                       <span key={item.id} className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 font-black text-xs">
                                         {item.quantity}x {item.menuItem?.name || 'Item'}
                                       </span>
                                     ))}
                                     {extraItems > 0 && (
                                       <span className="px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 font-black text-xs border border-amber-100">
                                         +{extraItems} more
                                       </span>
                                     )}
                                   </div>
                                 </td>
                                 <td className="p-5">
                                   <p className="text-sm font-black text-red-700 italic leading-relaxed max-w-[300px]">
                                     {order.rejectionReason || 'No specific reason provided.'}
                                   </p>
                                 </td>
                                 <td className="p-5">
                                   <p className="text-xl font-black text-slate-500 line-through decoration-red-300">Rs {order.totalAmount.toLocaleString('en-IN')}</p>
                                   <p className="text-[10px] font-black uppercase tracking-widest text-red-500">Rejected impact</p>
                                 </td>
                               </tr>
                             );
                           })}
                         </tbody>
                       </table>
                     </div>
                   </div>
                 );
               })()}
            </div>
          </div>
        )}

        {/* ===== STAFF TAB ===== */}
        {activeTab === 'staff' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <div><h1 className="text-3xl font-black text-gray-900">Staff Management</h1><p className="text-gray-500 font-medium mt-1">Manage your restaurant team.</p></div>
              <button onClick={() => { setEditingStaffId(null); setStaffForm({ name: '', role: 'KITCHEN', username: '', phone: '', password: '' }); setShowStaffForm(true); }} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 cursor-pointer flex items-center gap-2 shadow-lg shadow-blue-100 transition">
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
                  <div className="md:col-span-2">
                    <label className="font-bold text-sm text-gray-500 mb-1 block">Password {editingStaffId && '(Leave blank to keep current)'}</label>
                    <input 
                      required={!editingStaffId} 
                      type="password" 
                      value={staffForm.password} 
                      onChange={e => setStaffForm({ ...staffForm, password: e.target.value })} 
                      className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-blue-500 outline-none transition" 
                      placeholder="********" 
                    />
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold cursor-pointer hover:bg-blue-700 transition">Save</button>
                  <button type="button" onClick={() => setShowStaffForm(false)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl cursor-pointer transition">Cancel</button>
                </div>
              </form>
            )}
            <div className="bg-white rounded-[2rem] sm:rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
               <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[600px] sm:min-w-0">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="p-6 font-black text-gray-400 text-[10px] uppercase tracking-widest">Team Member</th>
                      <th className="p-6 font-black text-gray-400 text-[10px] uppercase tracking-widest text-center">Role</th>
                      <th className="p-6 font-black text-gray-400 text-[10px] uppercase tracking-widest text-center">Credentials</th>
                      <th className="p-6 font-black text-gray-400 text-[10px] uppercase tracking-widest text-center">Contact</th>
                      <th className="p-6 text-right font-black text-gray-400 text-[10px] uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(() => {
                      const roleColors = {
                        ADMIN: 'bg-indigo-100 text-indigo-700',
                        KITCHEN: 'bg-emerald-100 text-emerald-700',
                        WAITER: 'bg-amber-100 text-amber-700',
                        OWNER: 'bg-amber-500 text-white shadow-sm'
                      };
                      return staff.map(s => (
                      <tr key={s.id} className={`hover:bg-gray-50/50 transition duration-300 ${s.role === 'OWNER' ? 'bg-amber-50/30' : ''}`}>
                        <td className="p-6">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                                 {s.role === 'OWNER' ? <ShieldCheck size={18} className="text-amber-500" /> : <User size={18} />}
                              </div>
                              <span className="font-black text-gray-900">
                                {s.name} {s.role === 'OWNER' && <span className="text-[10px] text-amber-600 ml-2 font-black uppercase">(Partner)</span>}
                              </span>
                           </div>
                        </td>
                        <td className="p-6 text-center">
                           <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${roleColors[s.role] || 'bg-gray-100 text-gray-600'}`}>
                             {s.role === 'WAITER' ? 'CAPTAIN' : s.role}
                           </span>
                        </td>
                        <td className="p-6 text-center text-gray-500 font-bold text-xs">@{s.username}</td>
                        <td className="p-6 text-center text-gray-500 font-bold text-xs">{s.phone}</td>
                        <td className="p-6 text-right">
                           <div className="flex gap-1 justify-end">
                              {s.role !== 'OWNER' && (
                                <button onClick={() => handleStaffEdit(s)} title="Edit Member" className="text-blue-500 p-2.5 hover:bg-blue-50 rounded-xl cursor-pointer transition"><Edit2 size={16} /></button>
                              )}
                              {s.role !== 'OWNER' && (
                                <button onClick={() => handleStaffDelete(s.id)} title="Delete Member" className="text-red-500 p-2.5 hover:bg-red-50 rounded-xl cursor-pointer transition"><Trash2 size={16} /></button>
                              )}
                           </div>
                        </td>
                      </tr>
                    ))})()}
                  </tbody>
                </table>
              </div>
              {staff.length === 0 && (
                 <div className="text-center py-20">
                    <UserPlus size={48} className="text-gray-100 mx-auto mb-4" />
                    <p className="text-gray-400 font-black text-sm uppercase tracking-widest">Your team is empty</p>
                 </div>
              )}
            </div>
          </div>
        )}

        {/* ===== RAW INVENTORY TAB ===== */}
        {activeTab === 'inventory' && (
          <>
            <div className="space-y-6 animate-in fade-in duration-500 pb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-2">
                <div>
                  <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">Material Inventory</h1>
                  <p className="text-sm sm:text-base text-gray-500 font-medium">Internal tracking for kitchen supplies and ingredients.</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button 
                    onClick={() => {
                      const initialUsage = {};
                      rawMaterials.forEach(m => initialUsage[m.id] = '');
                      setClosingUsages(initialUsage);
                      setShowClosingModal(true);
                    }} 
                    className="flex-1 sm:flex-none justify-center bg-orange-500 text-white px-5 py-3.5 rounded-2xl font-black hover:bg-orange-600 transition shadow-lg shadow-orange-100 flex items-center gap-2 text-xs sm:text-sm"
                  >
                    <Calendar size={18} /> Close Day
                  </button>
                  <button 
                    onClick={() => { setEditingRawId(null); setRawForm({ name: '', quantity: 0, unit: 'kg' }); setShowRawForm(true); }} 
                    className="flex-1 sm:flex-none justify-center bg-amber-600 text-white px-5 py-3.5 rounded-2xl font-black hover:bg-amber-700 transition shadow-lg shadow-amber-100 flex items-center gap-2 text-xs sm:text-sm"
                  >
                    <Plus size={18} /> Add Item
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
              <div className="space-y-5 mt-5">
                <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Search Material</label>
                      <div className="relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={inventorySearch}
                          onChange={(e) => setInventorySearch(e.target.value)}
                          placeholder="Search by material name"
                          className="w-full bg-gray-50 border-0 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-amber-500 font-bold text-sm"
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Unit</label>
                      <select
                        value={inventoryUnitFilter}
                        onChange={(e) => setInventoryUnitFilter(e.target.value)}
                        className="w-full bg-gray-50 border-0 rounded-xl py-3 px-4 focus:ring-2 focus:ring-amber-500 font-bold text-sm"
                      >
                        <option value="all">All Units</option>
                        {inventoryUnits.map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Stock Status</label>
                      <select
                        value={inventoryStatusFilter}
                        onChange={(e) => setInventoryStatusFilter(e.target.value)}
                        className="w-full bg-gray-50 border-0 rounded-xl py-3 px-4 focus:ring-2 focus:ring-amber-500 font-bold text-sm"
                      >
                        <option value="all">All</option>
                        <option value="in">In Stock</option>
                        <option value="low">Low Stock</option>
                        <option value="out">Out of Stock</option>
                      </select>
                    </div>
                    <div className="md:col-span-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Sort By</label>
                      <select
                        value={inventorySort}
                        onChange={(e) => setInventorySort(e.target.value)}
                        className="w-full bg-gray-50 border-0 rounded-xl py-3 px-4 focus:ring-2 focus:ring-amber-500 font-bold text-sm"
                      >
                        <option value="name-asc">Name (A-Z)</option>
                        <option value="name-desc">Name (Z-A)</option>
                        <option value="qty-high">Quantity (High-Low)</option>
                        <option value="qty-low">Quantity (Low-High)</option>
                      </select>
                    </div>
                    <div className="md:col-span-1">
                      <button
                        onClick={() => {
                          setInventorySearch('');
                          setInventoryUnitFilter('all');
                          setInventoryStatusFilter('all');
                          setInventorySort('name-asc');
                        }}
                        className="w-full p-3 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition"
                        title="Reset inventory filters"
                      >
                        <XCircle size={18} className="mx-auto" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[2rem] sm:rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="p-6 font-black text-gray-400 text-[10px] uppercase tracking-widest">Material Name</th>
                        <th className="p-6 font-black text-gray-400 text-[10px] uppercase tracking-widest text-center">Measurement Unit</th>
                        <th className="p-6 font-black text-gray-400 text-[10px] uppercase tracking-widest text-center">Quantity Available</th>
                        <th className="p-6 font-black text-gray-400 text-[10px] uppercase tracking-widest text-center">Status</th>
                        <th className="p-6 text-center font-black text-gray-400 text-[10px] uppercase tracking-widest">Manage</th>
                        <th className="p-6 text-right font-black text-gray-400 text-[10px] uppercase tracking-widest">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredRawMaterials.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition group">
                          <td className="p-6">
                            <p className="font-black text-gray-900 text-lg leading-tight">{item.name}</p>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Item ID #{item.id}</p>
                          </td>
                          <td className="p-6 text-center">
                            <span className="text-xs font-black px-3 py-1 bg-gray-100 text-gray-500 rounded-full uppercase">{item.unit}</span>
                          </td>
                          <td className="p-6 text-center">
                            <span className={`text-xl font-black ${item.quantity <= 0 ? 'text-red-500' : item.quantity < 5 ? 'text-orange-500' : 'text-gray-900'}`}>{item.quantity}</span>
                          </td>
                          <td className="p-6 text-center">
                            <span className={`text-[10px] font-black px-4 py-2 rounded-full ${item.quantity <= 0 ? 'bg-red-50 text-red-700' : item.quantity < 5 ? 'bg-orange-50 text-orange-700 animate-pulse' : 'bg-amber-50 text-amber-700'}`}>
                              {item.quantity <= 0 ? 'OUT OF STOCK' : item.quantity < 5 ? 'LOW STOCK' : 'IN STOCK'}
                            </span>
                          </td>
                          <td className="p-6 text-center">
                            <button onClick={() => handleRawEdit(item)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-black text-xs uppercase tracking-wider hover:bg-slate-200 transition cursor-pointer">
                              Manage Stock
                            </button>
                          </td>
                            <td className="p-6 text-right">
                              <div className="flex gap-2 justify-end opacity-100">
                                <button onClick={() => handleRawEdit(item)} className="p-2 bg-blue-100 text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-600 hover:text-white hover:border-blue-600 transition cursor-pointer"><Edit2 size={18} /></button>
                                <button onClick={() => handleRawDelete(item.id)} className="p-2 bg-red-100 text-red-700 border border-red-200 rounded-xl hover:bg-red-600 hover:text-white hover:border-red-600 transition cursor-pointer"><Trash2 size={18} /></button>
                              </div>
                            </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-100">
                  {filteredRawMaterials.map(item => (
                    <div key={item.id} className="p-5 flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-black text-gray-900 text-lg leading-tight">{item.name}</p>
                          <div className="flex items-center gap-2 mt-2">
                             <span className={`text-[9px] font-black px-2 py-1 rounded-full ${item.quantity <= 0 ? 'bg-red-50 text-red-700' : item.quantity < 5 ? 'bg-orange-50 text-orange-700' : 'bg-amber-50 text-amber-700'}`}>
                                {item.quantity <= 0 ? 'OUT OF STOCK' : item.quantity < 5 ? 'LOW STOCK' : 'IN STOCK'}
                             </span>
                             <span className="text-[9px] font-black px-2 py-1 bg-gray-100 text-gray-500 rounded-full uppercase">{item.unit}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">In Stock</p>
                          <p className={`text-2xl font-black ${item.quantity < 5 ? 'text-red-500' : 'text-gray-900'}`}>{item.quantity}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleRawEdit(item)} className="flex-1 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-xs cursor-pointer">Manage Stock</button>
                        <button onClick={() => handleRawEdit(item)} className="flex-1 bg-gray-50 text-blue-600 font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-xs cursor-pointer"><Edit2 size={14} /> Edit</button>
                        <button onClick={() => handleRawDelete(item.id)} className="flex-1 bg-gray-50 text-red-500 font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-xs cursor-pointer"><Trash2 size={14} /> Delete</button>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredRawMaterials.length === 0 && (
                  <div className="text-center py-20 px-6">
                     <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package size={28} className="text-gray-300" />
                     </div>
                     <p className="text-gray-400 font-bold text-sm">No inventory items match your filters.</p>
                     <p className="text-[10px] text-gray-300 mt-1 uppercase tracking-widest">Try resetting filters or add new materials.</p>
                  </div>
                )}
                </div>
              </div>
            ) : (
              <div className="mt-5 bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden animate-in slide-in-from-right duration-500">
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


        {/* ===== CUSTOMER RELATIONSHIP TAB ===== */}
        {activeTab === 'customers' && (
          <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-8">
              <div>
                <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">Customer Relationship</h1>
                <p className="text-sm sm:text-base text-gray-500 font-medium">Manage your guest database and history.</p>
              </div>
              <button 
                onClick={handleExportCustomers}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-black text-white px-8 py-4 rounded-3xl font-black hover:bg-gray-800 transition shadow-xl shadow-gray-200 cursor-pointer"
              >
                <Download size={20} /> Export Database
              </button>
            </div>

            {/* Customer Filter Bar */}
            <div className="bg-white p-4 sm:p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-wrap gap-4 items-end">
               <div className="flex-1 min-w-[200px]">
                 <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block ml-1">Search Customer</label>
                 <div className="relative">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                   <input 
                     type="text" 
                     placeholder="Name or mobile..."
                     value={customerSearch}
                     onChange={(e) => setCustomerSearch(e.target.value)}
                     className="w-full bg-gray-50 border-0 rounded-2xl py-3.5 pl-11 pr-4 focus:ring-2 focus:ring-amber-500 font-bold text-sm transition"
                   />
                 </div>
               </div>
               <div className="w-full sm:w-64">
                 <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block ml-1">Filter By Behavior</label>
                 <div className="flex bg-gray-50 p-1.5 rounded-2xl">
                    <button onClick={() => setCustomerSort('frequent')} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-xl transition ${customerSort === 'frequent' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Frequent</button>
                    <button onClick={() => setCustomerSort('recent')} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-xl transition ${customerSort === 'recent' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Recent</button>
                    <button onClick={() => setCustomerSort('sparse')} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-xl transition ${customerSort === 'sparse' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Sparse</button>
                 </div>
               </div>
            </div>

            {/* Customers Table */}
            <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left min-w-[600px] sm:min-w-0">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="p-6 font-black text-gray-400 text-[10px] uppercase tracking-widest">Customer Profile</th>
                      <th className="p-6 font-black text-gray-400 text-[10px] uppercase tracking-widest text-center">Contact</th>
                      <th className="p-6 font-black text-gray-400 text-[10px] uppercase tracking-widest text-center">Loyalty Points</th>
                      <th className="p-6 font-black text-gray-400 text-[10px] uppercase tracking-widest text-center">Total Value</th>
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
                            {Math.round(Number(c.loyaltyPoints || 0))}
                           </span>
                        </td>
                        <td className="p-6 text-center">
                          <p className="text-sm font-black text-gray-900">Rs {Number(c.totalSpend || 0).toLocaleString('en-IN')}</p>
                        </td>
                        <td className="p-6 text-center">
                          <span className={`inline-block w-8 h-8 rounded-full flex items-center justify-center font-black ${c.visitCount > 5 ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'bg-gray-100 text-gray-500'}`}>
                           {Number(c.visitCount || 0)}
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
          </div>
        )}

        {/* ===== HOTEL & TABLES TAB ===== */}
        {activeTab === 'hotel' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in slide-in-from-bottom duration-500 pb-20">
            {/* Hotel details */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">Hotel Settings</h1>
              <p className="text-sm sm:text-base text-gray-500 font-medium mb-8">Manage identity, tax, and service parameters.</p>
              
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
                    <input type="number" step="0.1" value={restaurant.taxPercentage ?? 0} onChange={e => setRestaurant({ ...restaurant, taxPercentage: e.target.value ? parseFloat(e.target.value) : 0 })} className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-amber-500 outline-none transition" />
                  </div>
                  <div>
                    <label className="font-bold text-[10px] uppercase tracking-widest text-gray-400 mb-2 block">Service Charge (%)</label>
                    <input type="number" step="0.1" value={restaurant.serviceCharge ?? 0} onChange={e => setRestaurant({ ...restaurant, serviceCharge: e.target.value ? parseFloat(e.target.value) : 0 })} className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-amber-500 outline-none transition" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-amber-600 text-white py-4 rounded-2xl font-black hover:bg-amber-700 cursor-pointer transition text-lg shadow-lg shadow-amber-100">Update Hotel Info</button>
              </form>
            </div>

            {/* Table Management */}
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Table Management</h2>
                  <p className="text-sm sm:text-base text-gray-500 font-medium">Control floor capacity and status.</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button onClick={handleAutoAddTable} className="flex-1 sm:flex-none justify-center bg-amber-600 text-white px-6 py-3.5 rounded-2xl font-black hover:bg-amber-700 transition shadow-lg shadow-amber-100 flex items-center gap-2 cursor-pointer text-sm">
                    <Plus size={18} /> Quick Add
                  </button>
                  <button onClick={() => setShowTableForm(true)} className="bg-gray-900 text-white p-3.5 rounded-2xl hover:bg-gray-800 transition shadow-lg shadow-gray-200 cursor-pointer"><Plus size={22} /></button>
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
                    <button type="button" onClick={() => setShowTableForm(false)} className="bg-gray-100 text-gray-500 font-bold px-4 py-3.5 rounded-xl hover:bg-gray-200 transition cursor-pointer">X</button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {tables.map(t => (
                  <div key={t.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative group hover:border-amber-200 transition overflow-hidden">
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
                            onClick={() => handlePrintQR(t)} 
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
          <div className="animate-in fade-in duration-500 pb-20">
            <div className="mb-10">
              <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">Customer Reviews</h1>
              <p className="text-sm sm:text-base text-gray-500 font-medium mt-1">Direct feedback from your diners.</p>
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
                        <span className="text-[8px] font-black text-gray-400 w-4">{d.rating}*</span>
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
          </div>
        )}
      
      {/* Payment Modal */}
      {confirmPaymentId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="p-6 bg-amber-50 rounded-full mb-6">
                  <CheckCircle className="text-amber-600" size={48} />
                </div>
                <h3 className="text-3xl font-black text-gray-900 tracking-tight">Professional Settlement</h3>
                <p className="text-gray-400 font-bold text-sm mt-2">Finalize bill with discount & tax</p>
              </div>

              <div className="space-y-6 mb-10">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block ml-1">Discount (Rs)</label>
                    <input 
                      type="number" 
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      className="w-full bg-gray-50 border-0 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-amber-500 font-bold text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block ml-1">Tax (%)</label>
                    <input 
                      type="number" 
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                      className="w-full bg-gray-50 border-0 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-amber-500 font-bold text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-3 block ml-1 text-center">Select Payment Method</label>
                  <div className="grid grid-cols-3 gap-3">
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
                </div>
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
                body, html { margin: 0; height: 100% !important; overflow: hidden !important; }
                #root { visibility: hidden !important; height: 100mm !important; overflow: hidden !important; }
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
              {restaurant.ownerName && <div style={{ fontSize: '10px' }}>Owner: {restaurant.ownerName}</div>}
            </div>

            <div className="bill-hr"></div>
            
            <div className="flex-between">
              <span>Bill No: {getBillRef(printingSession)}</span>
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
              <span>Rs {printingSession.subtotal.toFixed(2)}</span>
            </div>
            {restaurant.taxPercentage > 0 && (
              <div className="flex-between">
                <span>GST ({restaurant.taxPercentage}%)</span>
                <span>Rs {printingSession.taxAmount.toFixed(2)}</span>
              </div>
            )}
            {restaurant.serviceCharge > 0 && (
              <div className="flex-between">
                <span>Service Charge ({restaurant.serviceCharge}%)</span>
                <span>Rs {printingSession.serviceChargeAmount.toFixed(2)}</span>
              </div>
            )}
            
            <div className="bill-hr"></div>
            
            <div className="flex-between font-black" style={{ fontSize: '16px' }}>
              <span>GRAND TOTAL</span>
              <span>Rs {printingSession.total.toFixed(2)}</span>
            </div>

            <div className="bill-hr"></div>
            
            <div className="text-center" style={{ marginTop: '10px' }}>
              <div>THANK YOU! VISIT AGAIN</div>
              <div style={{ fontSize: '8px', color: '#666', marginTop: '4px' }}>serversundaram POS</div>
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
                body, html { margin: 0; height: 100% !important; overflow: hidden !important; }
                #root { visibility: hidden !important; height: 100mm !important; overflow: hidden !important; }
                #qr-print-parent, #qr-print-parent * { visibility: visible !important; }
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
                src={printingQRImage || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(printingQRTable.qrCodeUrl)}`} 
                alt="Table QR Code"
                style={{ width: '200px', height: '200px' }}
              />
            </div>
            
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#333', marginTop: '10px' }}>{restaurant.name}</div>
            <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>Powered by serversundaram</div>
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
                    src={printingQRImage || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(printingQRTable.qrCodeUrl)}`} 
                    alt="Table QR"
                    className="w-full h-full object-contain"
                  />
                </div>
                
                <button 
                  onClick={() => handlePrintQR(printingQRTable)} 
                  className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-black transition flex items-center justify-center gap-2"
                >
                  <Printer size={18} /> Print for Table
                </button>
              </div>
           </div>
         </div>
      )}

      {/* Recipe Management Modal */}
      {showRecipeModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-2xl w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-3xl font-black text-gray-900 tracking-tight">Recipe Definition</h3>
                <p className="text-amber-600 font-black text-xs uppercase tracking-widest mt-1">Item: {targetMenuItem?.name}</p>
              </div>
              <button onClick={() => setShowRecipeModal(false)} className="p-3 bg-gray-50 text-gray-400 rounded-full hover:bg-gray-100 transition"><Trash2 size={24} /></button>
            </div>

            <div className="space-y-6 mb-10 h-[400px] overflow-y-auto pr-4 scrollbar-hide">
              {currentRecipe.map((ingredient, index) => (
                <div key={index} className="flex gap-4 items-end bg-gray-50 p-6 rounded-3xl border border-gray-100 group transition">
                  <div className="flex-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block ml-1">Ingredient</label>
                    <select 
                      value={ingredient.materialId}
                      onChange={(e) => {
                        const newRecipe = [...currentRecipe];
                        newRecipe[index].materialId = Number(e.target.value);
                        setCurrentRecipe(newRecipe);
                      }}
                      className="w-full bg-white border-0 rounded-2xl py-3.5 px-4 focus:ring-2 focus:ring-amber-500 font-bold text-sm shadow-sm"
                    >
                      <option value="">Select Material</option>
                      {rawMaterials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                    </select>
                  </div>
                  <div className="w-32">
                    <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block ml-1">Quantity</label>
                    <input 
                      type="number" 
                      step="0.001"
                      value={ingredient.quantityRequired}
                      onChange={(e) => {
                        const newRecipe = [...currentRecipe];
                        newRecipe[index].quantityRequired = Number(e.target.value);
                        setCurrentRecipe(newRecipe);
                      }}
                      className="w-full bg-white border-0 rounded-2xl py-3.5 px-4 focus:ring-2 focus:ring-amber-500 font-bold text-sm shadow-sm"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      const newRecipe = currentRecipe.filter((_, i) => i !== index);
                      setCurrentRecipe(newRecipe);
                    }}
                    className="p-3.5 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}

              <button 
                onClick={() => setCurrentRecipe([...currentRecipe, { materialId: '', quantityRequired: 0 }])}
                className="w-full py-6 border-4 border-dashed border-gray-100 rounded-[2rem] text-gray-400 font-black flex items-center justify-center gap-3 hover:bg-gray-50 transition uppercase tracking-widest text-xs"
              >
                <Plus size={24} /> Add Raw Material to Recipe
              </button>
            </div>

            <div className="flex gap-4 mt-auto">
              <button 
                onClick={handleSaveRecipe}
                className="flex-1 bg-black text-white font-black py-5 rounded-2xl hover:bg-gray-800 transition shadow-xl shadow-gray-200"
              >
                Confirm Recipe Mapping
              </button>
              <button 
                onClick={() => setShowRecipeModal(false)}
                className="bg-gray-100 text-gray-500 font-black py-5 px-10 rounded-2xl hover:bg-gray-200 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);
};

export default AdminMenuManager;
