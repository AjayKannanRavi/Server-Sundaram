import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../api/api';
import {
  ShoppingCart, Search, X, Plus, Minus, Star, ChefHat,
  Leaf, Flame, Clock, ChevronDown, CheckCircle, SlidersHorizontal,
  ArrowLeft, Sparkles
} from 'lucide-react';

// (categoryEmoji utility removed)

// ─── Food image fallback using Unsplash keywords ────────────────────────────
const getFoodImage = (item) => {
  if (item.imageUrl) return item.imageUrl;
  const name = item.name.toLowerCase();
  const keywordMap = [
    { keywords: ['pizza'], url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80' },
    { keywords: ['burger', 'sandwich'], url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80' },
    { keywords: ['pasta', 'spaghetti', 'noodle'], url: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400&q=80' },
    { keywords: ['salad', 'caesar'], url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80' },
    { keywords: ['steak', 'beef', 'meat'], url: 'https://images.unsplash.com/photo-1558030006-450675393462?w=400&q=80' },
    { keywords: ['chicken', 'grilled'], url: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c3?w=400&q=80' },
    { keywords: ['fish', 'seafood', 'salmon'], url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&q=80' },
    { keywords: ['soup', 'broth'], url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80' },
    { keywords: ['cake', 'dessert', 'chocolate', 'brownie', 'lava'], url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80' },
    { keywords: ['ice cream', 'gelato'], url: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=400&q=80' },
    { keywords: ['coffee', 'latte', 'cappuccino', 'espresso'], url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80' },
    { keywords: ['juice', 'smoothie', 'shake'], url: 'https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?w=400&q=80' },
    { keywords: ['cola', 'soda', 'pepsi', 'coca', 'sprite'], url: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400&q=80' },
    { keywords: ['tea', 'chai'], url: 'https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?w=400&q=80' },
    { keywords: ['bread', 'toast', 'garlic'], url: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400&q=80' },
    { keywords: ['rice', 'biryani', 'fried rice'], url: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400&q=80' },
    { keywords: ['curry', 'paneer', 'dal'], url: 'https://images.unsplash.com/photo-1455619452474-d2be8b1019ce?w=400&q=80' },
    { keywords: ['spring roll', 'dumpling', 'wrap'], url: 'https://images.unsplash.com/photo-1541014741259-de529411b96a?w=400&q=80' },
    { keywords: ['fries', 'chips'], url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80' },
    { keywords: ['mushroom'], url: 'https://images.unsplash.com/photo-1607116776099-9a08b6a4f02c?w=400&q=80' },
  ];
  for (const { keywords, url } of keywordMap) {
    if (keywords.some(k => name.includes(k))) return url;
  }
  return '/food_placeholder.png';
};

// ─── Cart Item Row ────────────────────────────────────────────────────────────
const CartItem = ({ item, onIncrease, onDecrease, onRemove }) => (
  <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
    <img src={getFoodImage(item)} alt={item.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" onError={e => { e.target.src = '/food_placeholder.png'; }} />
    <div className="flex-1 min-w-0">
      <p className="font-bold text-gray-900 text-sm truncate">{item.name}</p>
      <p className="text-xs text-gray-400 font-medium">₹{item.price.toLocaleString('en-IN')} each</p>
    </div>
    <div className="flex items-center gap-2">
      <button onClick={() => onDecrease(item.id)} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition cursor-pointer">
        <Minus size={12} />
      </button>
      <span className="w-6 text-center font-black text-gray-900 text-sm">{item.quantity}</span>
      <button onClick={() => onIncrease(item.id)} className="w-7 h-7 rounded-full bg-amber-100 hover:bg-amber-500 hover:text-white flex items-center justify-center transition cursor-pointer">
        <Plus size={12} />
      </button>
    </div>
    <div className="w-14 text-right">
      <p className="font-black text-gray-900 text-sm">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
      <button onClick={() => onRemove(item.id)} className="text-[10px] text-red-400 hover:text-red-600 font-bold cursor-pointer transition">Remove</button>
    </div>
  </div>
);

// ─── Menu Item Card ───────────────────────────────────────────────────────────
const MenuCard = ({ item, cartQty, onAdd, onIncrease, onDecrease }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const isBestSeller = item.price > 300 || item.name.toLowerCase().includes('special'); 

  return (
    <div className="group relative rounded-[2rem] overflow-hidden shadow-2xl transition-all duration-500 hover:scale-[1.03] active:scale-95 h-[220px] sm:h-[260px] bg-[#0D0D0D] border border-white/5">
      {/* Background Image */}
      {!imgLoaded && (
        <div className="absolute inset-0 bg-gray-900 animate-pulse z-0" />
      )}
      <img
        src={getFoodImage(item)}
        alt={item.name}
        className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 group-hover:scale-110 group-hover:rotate-1 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setImgLoaded(true)}
        onError={e => { e.target.src = '/food_placeholder.png'; setImgLoaded(true); }}
        loading="lazy"
      />
      
      {/* Immersive Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-95 group-hover:opacity-100 transition-opacity duration-500" />

      {/* "Best Seller" Badge */}
      {isBestSeller && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-amber-400 text-gray-900 font-black text-[8px] uppercase tracking-widest px-3 py-1.5 rounded-full shadow-xl transform -rotate-2">
          <Star size={10} fill="currentColor" /> Best Seller
        </div>
      )}

      {/* Content Area */}
      <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-end z-10">
        <div className="transform transition-all duration-500 group-hover:-translate-y-2">
          <h3 className="text-white font-serif italic text-base sm:text-xl leading-tight mb-1">
            {item.name}
          </h3>
          <div className="flex items-center gap-2 mb-4">
             <span className="text-amber-400 font-black text-xs sm:text-sm">₹{item.price.toLocaleString('en-IN')}</span>
             <span className="w-1 h-1 bg-white/30 rounded-full" />
             <span className="text-white/40 font-bold text-[9px] sm:text-[10px] uppercase tracking-widest italic">Premium Dish</span>
          </div>
        </div>

        {/* Action Row */}
        <div className="transform transition-all duration-500 opacity-90 group-hover:opacity-100">
          {cartQty === 0 ? (
            <button
              onClick={(e) => { e.stopPropagation(); onAdd(item); }}
              className="w-full bg-white hover:bg-amber-400 text-gray-900 font-black text-[10px] sm:text-xs py-3 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 shadow-2xl active:scale-95"
            >
              <Plus size={14} strokeWidth={3} /> Add to Cart
            </button>
          ) : (
            <div className="flex items-center bg-white/10 backdrop-blur-md rounded-2xl p-1 gap-1 border border-white/20">
              <button 
                onClick={(e) => { e.stopPropagation(); onDecrease(item.id); }} 
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/10 hover:bg-red-500/80 flex items-center justify-center transition active:scale-90"
              >
                <Minus size={14} className="text-white" strokeWidth={3} />
              </button>
              <span className="font-black text-white text-xs sm:text-sm w-8 sm:w-10 text-center">{cartQty}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); onIncrease(item.id); }} 
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white hover:bg-amber-400 flex items-center justify-center transition active:scale-90"
              >
                <Plus size={14} className="text-gray-900" strokeWidth={3} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Cart Panel (slide-up) ────────────────────────────────────────────────────
const CartPanel = ({ cart, total, onClose, onIncrease, onDecrease, onRemove, onPlaceOrder, placing }) => {
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div
        className="bg-white w-full max-w-lg rounded-t-3xl shadow-2xl"
        style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-50">
          <div>
            <h2 className="text-xl font-black text-gray-900">Your Cart</h2>
            <p className="text-xs text-gray-400 font-medium">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center cursor-pointer transition">
            <X size={18} className="text-gray-600" />
          </button>
        </div>

        {/* Items */}
        <div className="overflow-y-auto flex-1 px-6">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <ShoppingCart size={40} className="text-gray-200" />
              <p className="text-gray-400 font-bold text-sm">Your cart is empty</p>
              <button onClick={onClose} className="text-amber-600 font-black text-sm">Browse Menu</button>
            </div>
          ) : (
            cart.map(item => (
              <CartItem key={item.id} item={item} onIncrease={onIncrease} onDecrease={onDecrease} onRemove={onRemove} />
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-6 border-t border-gray-50 bg-white">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-500 font-bold text-sm">Order Total</span>
              <span className="font-black text-2xl text-gray-900">₹{total.toLocaleString('en-IN')}</span>
            </div>
            <button
              onClick={onPlaceOrder}
              disabled={placing}
              className="w-full bg-amber-500 hover:bg-amber-600 active:scale-98 disabled:opacity-60 text-white font-black py-4 rounded-2xl text-base transition-all cursor-pointer shadow-lg shadow-amber-100 flex items-center justify-center gap-2"
            >
              {placing ? (
                <><span className="animate-spin">⚙️</span> Placing Order...</>
              ) : (
                <><CheckCircle size={20} /> Place Order · ₹{total.toLocaleString('en-IN')}</>
              )}
            </button>
            <p className="text-center text-xs text-gray-400 font-medium mt-3">Your order will go directly to the kitchen</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Confirmation Modal ───────────────────────────────────────────────────────
const ConfirmModal = ({ title, message, onConfirm, onCancel, confirmText = 'Confirm', confirmColor = 'bg-red-500' }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
    <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
      <h2 className="text-lg font-black text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-500 font-medium text-sm mb-6 leading-relaxed">{message}</p>
      <div className="flex gap-3">
        <button onClick={onConfirm} className={`flex-1 ${confirmColor} text-white font-black py-3 rounded-2xl cursor-pointer transition hover:opacity-90`}>{confirmText}</button>
        <button onClick={onCancel} className="flex-1 bg-gray-100 text-gray-700 font-black py-3 rounded-2xl cursor-pointer transition hover:bg-gray-200">Cancel</button>
      </div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const CustomerMenu = () => {
  const { hotelId: urlHotelId } = useParams();
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get('tableId');
  const navigate = useNavigate();
  const hotelId = urlHotelId; // Consistency

  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [showCart, setShowCart] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [restaurantName, setRestaurantName] = useState("Loading...");
  const searchRef = useRef(null);

  useEffect(() => {
    if (!tableId) return;
    const customerData = localStorage.getItem('customer');
    const today = new Date().toISOString().split('T')[0];
    
    if (!customerData) {
      const loginUrl = `/${hotelId}/login?tableId=${tableId}`;
      navigate(loginUrl);
      return;
    }

    try {
      const session = JSON.parse(customerData);
      // If different table or different day, require fresh login
      const sessionDate = session.lastVisitedDate ? session.lastVisitedDate.split('T')[0] : '';
      if (String(session.lastTableUsed) !== String(tableId) || sessionDate !== today || (hotelId && String(session.hotelId) !== String(hotelId))) {
          localStorage.removeItem('customer');
          const loginUrl = `/${hotelId}/login?tableId=${tableId}`;
          navigate(loginUrl);
      } else {
          setCustomer(session);
      }
    } catch (e) {
      localStorage.removeItem('customer');
      const loginUrl = `/${hotelId}/login?tableId=${tableId}`;
      navigate(loginUrl);
    }
  }, [tableId, navigate]);

  useEffect(() => { if (!tableId) return; fetchMenu(); }, [tableId]);

  const fetchMenu = async () => {
    try {
      const headers = { 'X-Hotel-Id': hotelId || customer?.hotelId };
      const [catRes, itemRes, restRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/menu/categories`, { headers }),
        axios.get(`${API_BASE_URL}/menu`, { headers }),
        axios.get(`${API_BASE_URL}/restaurant`, { headers }).catch(() => ({ data: { name: "ServeSmart Restaurant" } }))
      ]);
      setCategories(catRes.data);
      setMenuItems(itemRes.data.filter(i => i.available));
      setRestaurantName(restRes.data?.name || "ServeSmart Restaurant");
    } catch (err) { console.error('Error fetching menu', err); }
  };

  // Cart helpers
  const addToCart = useCallback((item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      return existing
        ? prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const increaseQty = useCallback((id) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: i.quantity + 1 } : i));
  }, []);

  const decreaseQty = useCallback((id) => {
    setCart(prev => {
      const updated = prev.map(i => i.id === id ? { ...i, quantity: i.quantity - 1 } : i);
      return updated.filter(i => i.quantity > 0);
    });
  }, []);

  const removeFromCart = useCallback((id) => {
    setCart(prev => prev.filter(i => i.id !== id));
  }, []);

  const placeOrder = async () => {
    if (cart.length === 0 || placing) return;
    setPlacing(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/orders`, {
        tableId: parseInt(tableId),
        customerName: customer?.name,
        customerPhone: customer?.mobileNumber,
        items: cart.map(i => ({ menuItemId: i.id, quantity: i.quantity }))
      }, {
        headers: {
          'X-Hotel-Id': hotelId || customer?.hotelId
        }
      });
      setCart([]);
      setShowCart(false);
      const trackerUrl = `/${hotelId}/tracker?orderId=${res.data.id}&tableId=${tableId}`;
      navigate(trackerUrl);
    } catch (err) {
      console.error('Error placing order', err);
      alert('Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  // Derived values
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartQtyMap = Object.fromEntries(cart.map(i => [i.id, i.quantity]));

  const filteredItems = menuItems
    .filter(item => activeCategory === 'all' || item.category?.id === activeCategory)
    .filter(item => {
      const q = search.toLowerCase();
      return !q || item.name.toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

  if (!tableId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8 gap-6">
        <div className="text-5xl">📱</div>
        <h1 className="text-2xl font-black text-gray-900 text-center">Invalid Table</h1>
        <p className="text-gray-500 text-center font-medium">Please scan the QR code on your table to access the menu.</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors ${darkMode ? 'bg-[#0D0D0D] text-white' : 'bg-gray-50'}`}>
      {/* ── Hero Header ─────────────────────────────────────── */}
      <div className={`relative ${darkMode ? 'bg-[#0D0D0D]' : 'bg-white'} border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'} sticky top-0 z-30 shadow-sm transition-all duration-300 h-16 flex items-center`}>
        <div className="px-4 w-full flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/30">
                <ChefHat size={16} className="text-white" />
              </div>
              <h1 className={`font-serif italic text-lg sm:text-xl ${darkMode ? 'text-amber-400' : 'text-gray-900'} leading-none`}>{restaurantName}</h1>
            </div>
            <p className={`text-[10px] font-bold ${darkMode ? 'text-gray-500' : 'text-gray-400'} ml-10 -mt-1`}>Table {tableId}</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search toggle */}
            <button
              onClick={() => { setShowSearch(!showSearch); setTimeout(() => searchRef.current?.focus(), 100); }}
              className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}
            >
              {showSearch ? <X size={16} /> : <Search size={16} />}
            </button>

            {/* Dark mode */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition text-sm ${darkMode ? 'bg-yellow-400 text-gray-900' : 'bg-gray-800 text-white'}`}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>

            {/* Cart */}
            <button
              onClick={() => setShowCart(true)}
              className={`relative flex items-center gap-1.5 px-3 py-2 rounded-2xl cursor-pointer transition font-black text-sm ${itemCount > 0 ? 'bg-amber-500 text-white shadow-md shadow-amber-100' : darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
            >
              <ShoppingCart size={16} />
              {itemCount > 0 ? (
                <span>{itemCount}</span>
              ) : null}
            </button>
          </div>
        </div>

        {/* Search bar (expandable) */}
        {showSearch && (
          <div className="px-4 pb-3">
            <div className={`flex items-center gap-2 rounded-2xl border-2 px-3 py-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100 focus-within:border-amber-400'} transition`}>
              <Search size={16} className="text-gray-400 flex-shrink-0" />
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search dishes..."
                className={`flex-1 bg-transparent outline-none font-medium text-sm ${darkMode ? 'text-white placeholder-gray-500' : 'text-gray-800 placeholder-gray-400'}`}
              />
              {search && (
                <button onClick={() => setSearch('')} className="cursor-pointer">
                  <X size={14} className="text-gray-400" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Hero Banner ─────────────────────────────────────── */}
      {!search && activeCategory === 'all' && (
        <div className="relative h-48 sm:h-56 overflow-hidden">
          <img src="/food_hero_banner.png" alt="Menu" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-black/20 to-transparent flex flex-col justify-end p-6 pb-8">
            <div className="flex items-center gap-2 mb-2 text-amber-400">
               <span className="h-[1px] w-8 bg-amber-400" />
               <span className="text-[10px] font-black uppercase tracking-[0.3em]">AUTHENTIC PUNJABI DHABA</span>
            </div>
            <h2 className="text-white font-serif italic text-4xl sm:text-5xl leading-tight mb-2">Explore Our Menu</h2>
            <p className="text-white/60 font-medium text-xs sm:text-sm max-w-xs leading-relaxed">Delicious flavors crafted with passion and fresh ingredients.</p>
          </div>
        </div>
      )}

      {/* ── Category Filter ──────────────────────────────────── */}
      <div className={`${darkMode ? 'bg-[#0D0D0D]/90' : 'bg-white/90'} backdrop-blur-md border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'} sticky top-16 z-20 shadow-sm transition-all`}>
        <div className="flex gap-4 px-4 py-4 overflow-x-auto no-scrollbar md:justify-center">
          <button
            onClick={() => setActiveCategory('all')}
            className={`flex-shrink-0 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 cursor-pointer border-2 ${activeCategory === 'all'
                ? 'bg-amber-500 border-amber-500 text-white shadow-xl shadow-amber-500/40 active:scale-95'
                : darkMode ? 'bg-transparent border-gray-800 text-gray-500 hover:border-amber-500/50 hover:text-amber-400' : 'bg-transparent border-gray-100 text-gray-500 hover:border-amber-500/30 hover:text-amber-600'
              }`}
          >
            All Items
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 cursor-pointer border-2 ${activeCategory === cat.id
                  ? 'bg-amber-500 border-amber-500 text-white shadow-xl shadow-amber-500/40 active:scale-95'
                  : darkMode ? 'bg-transparent border-gray-800 text-gray-500 hover:border-amber-500/50 hover:text-amber-400' : 'bg-transparent border-gray-100 text-gray-500 hover:border-amber-500/30 hover:text-amber-600'
                }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Sort + Results bar ───────────────────────────────── */}
      <div className={`px-4 py-2.5 flex justify-between items-center ${darkMode ? 'bg-[#0D0D0D]' : 'bg-white'} border-b ${darkMode ? 'border-gray-800' : 'border-gray-50'}`}>
        <p className={`text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
          {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
          {search && <span> for "<span className="text-amber-600">{search}</span>"</span>}
        </p>
        <div className="relative">
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className={`flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-xl cursor-pointer transition ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}
          >
            <SlidersHorizontal size={12} /> Sort
            <ChevronDown size={12} className={`transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
          </button>
          {showSortMenu && (
            <div className={`absolute right-0 top-9 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl border shadow-xl z-20 overflow-hidden min-w-[150px]`}>
              {[
                { value: 'default', label: '✨ Featured' },
                { value: 'price-asc', label: '💰 Price: Low to High' },
                { value: 'price-desc', label: '💎 Price: High to Low' },
                { value: 'name', label: '🔤 Name (A-Z)' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setSortBy(opt.value); setShowSortMenu(false); }}
                  className={`w-full text-left px-4 py-3 text-xs font-bold cursor-pointer transition ${sortBy === opt.value
                      ? 'bg-amber-500 text-white'
                      : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Menu Grid ────────────────────────────────────────── */}
      <main className="p-4 sm:p-8 pb-32">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="text-5xl">🔍</div>
            <div className="text-center">
              <p className={`font-black text-lg ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>No items found</p>
              <p className={`text-sm font-medium mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {search ? `Try a different search term` : `No items in this category`}
              </p>
            </div>
            {search && (
              <button onClick={() => setSearch('')} className="text-amber-600 font-black text-sm">Clear Search</button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-6">
            {filteredItems.map(item => (
              <MenuCard
                key={item.id}
                item={item}
                cartQty={cartQtyMap[item.id] || 0}
                onAdd={addToCart}
                onIncrease={increaseQty}
                onDecrease={decreaseQty}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Sticky Cart Button ────────────────────────────────── */}
      {itemCount > 0 && !showCart && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-20" style={{ background: darkMode ? 'linear-gradient(to top, #0D0D0D 60%, transparent)' : 'linear-gradient(to top, #f9fafb 60%, transparent)' }}>
          <button
            onClick={() => setShowCart(true)}
            className="w-full bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-black py-4 rounded-2xl shadow-xl shadow-amber-100/60 flex items-center justify-between px-5 cursor-pointer transition-all"
          >
            <div className="bg-amber-600/50 rounded-xl w-8 h-8 flex items-center justify-center text-sm font-black">{itemCount}</div>
            <span className="text-base">View Cart</span>
            <span className="text-base font-black">₹{total.toLocaleString('en-IN')}</span>
          </button>
        </div>
      )}

      {/* ── Cart Panel ───────────────────────────────────────── */}
      {showCart && (
        <CartPanel
          cart={cart}
          total={total}
          onClose={() => setShowCart(false)}
          onIncrease={increaseQty}
          onDecrease={decreaseQty}
          onRemove={(id) => { removeFromCart(id); if (cart.length <= 1) setShowCart(false); }}
          onPlaceOrder={placeOrder}
          placing={placing}
        />
      )}

      {/* ── Confirm Clear Modal ──────────────────────────────── */}
      {confirmClear && (
        <ConfirmModal
          title="Clear Cart?"
          message="This will remove all items from your cart."
          confirmText="Clear All"
          confirmColor="bg-red-500"
          onConfirm={() => { setCart([]); setConfirmClear(false); setShowCart(false); }}
          onCancel={() => setConfirmClear(false)}
        />
      )}

      {/* Click outside sort menu */}
      {showSortMenu && <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />}
    </div>
  );
};

export default CustomerMenu;
