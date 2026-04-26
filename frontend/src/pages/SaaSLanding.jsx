import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  ChefHat,
  Clock3,
  CreditCard,
  Headphones,
  Mail,
  MapPin,
  Menu,
  Phone,
  QrCode,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  TrendingUp,
  Users,
  UtensilsCrossed,
  X,
  BarChart3,
  Zap,
  Globe,
  Lock,
  ChevronDown,
  ChevronUp,
  PlayCircle,
  Award,
  Layers
} from 'lucide-react';

/* ─── Data ─────────────────────────────────────────────────── */
const heroStats = [
  { label: 'Restaurants Active', value: '300+', color: '#6366f1' },
  { label: 'Orders Processed', value: '2.4M+', color: '#0ea5e9' },
  { label: 'Avg Checkout Time', value: '42 sec', color: '#10b981' },
  { label: 'Support Uptime', value: '99.9%', color: '#f59e0b' }
];

const featureBlocks = [
  {
    title: 'Streamline Order Management',
    body: 'Never lose track of an order again. All your customer orders—from dine-in to takeout—are organized and easily accessible in one place. Speed up service and keep your kitchen running smoothly.',
    image: '/food_hero_banner.png',
    chip: 'Orders',
    gradient: 'from-indigo-500 to-blue-600'
  },
  {
    title: 'Optimize Table Reservations',
    body: 'Maximize seating efficiency with real-time table tracking and reservations. Reduce wait times and ensure no table sits empty during peak hours.',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1400&q=80',
    chip: 'Tables',
    gradient: 'from-emerald-500 to-teal-600'
  },
  {
    title: 'Effortless Menu Management',
    body: 'Easily add, edit, or remove items from your menu on the go. Highlight specials, update prices, and keep everything in sync across all platforms.',
    image: '/food_placeholder.png',
    chip: 'Menu',
    gradient: 'from-violet-500 to-purple-600'
  }
];

const featureGrid = [
  { title: 'QR Code Menu', desc: 'Contactless ordering flow with live menu availability.', icon: QrCode, color: '#6366f1' },
  { title: 'Payment Gateway', desc: 'Fast and secure checkout with Stripe and Razorpay support.', icon: CreditCard, color: '#0ea5e9' },
  { title: 'Staff Roles & Access', desc: 'Owner, admin, kitchen, and captain panels with clear permissions.', icon: Users, color: '#10b981' },
  { title: 'Kitchen Tickets (KOT)', desc: 'Readable KOT workflow that reduces missed items during peak hours.', icon: ChefHat, color: '#f59e0b' },
  { title: 'POS + Billing', desc: 'Quick billing, tax handling, and printable receipts in one place.', icon: Store, color: '#ef4444' },
  { title: 'Reports & Insights', desc: 'Daily sales, top dishes, and margin trends for smarter decisions.', icon: BarChart3, color: '#8b5cf6' },
  { title: 'Custom Floor Plans', desc: 'Design your restaurant\'s layout with drag-and-drop table management.', icon: Layers, color: '#06b6d4' },
  { title: 'Real-time Analytics', desc: 'Live dashboard with revenue trends, peak hours, and order status.', icon: TrendingUp, color: '#f97316' }
];

const testimonials = [
  {
    quote: 'It has completely transformed how we operate. Managing orders, tables, and staff all from one platform has reduced our workload and made everything run more smoothly.',
    name: 'Raghav Menon',
    role: 'Owner, Bayleaf Bistro',
    rating: 5,
    avatar: 'RM'
  },
  {
    quote: 'The QR Code menu and payment integration have made a huge difference. Customers love the ease, and we\'ve seen faster table turnover since implementation.',
    name: 'Nisha Kapoor',
    role: 'Manager, Urban Tadka',
    rating: 5,
    avatar: 'NK'
  },
  {
    quote: 'We\'re able to track every order in real time, keep our menu updated, and quickly manage payments. It\'s like having an extra set of hands in the restaurant.',
    name: 'Sanjay Iyer',
    role: 'Owner, South Lane Eatery',
    rating: 5,
    avatar: 'SI'
  }
];

const faqs = [
  { q: 'How quickly can we go live?', a: 'Most restaurants go live in 1-3 days based on menu size, printer setup, and team onboarding schedule. Our implementation team walks you through every step.' },
  { q: 'Can I manage multiple outlets?', a: 'Yes. Each outlet has isolated operations with centralized visibility for owner-level monitoring. Add unlimited outlets under one account.' },
  { q: 'Do you support training and setup?', a: 'Yes. We include guided onboarding, role-based walkthroughs, video tutorials, and 30 days of post-launch priority support.' },
  { q: 'Can we migrate from our current POS?', a: 'Yes. Menu and basic catalog migration is supported during onboarding with our implementation team at no extra cost.' },
  { q: 'Does it work on mobile devices?', a: 'Absolutely. The entire platform is mobile-responsive. Staff panels, POS, and dashboards work seamlessly on tablets and smartphones.' }
];

const pricingFeatures = [
  'Unlimited orders & tables',
  'QR menu + full customer flow',
  'Role-based staff logins',
  'Kitchen order tickets (KOT)',
  'POS + billing with tax handling',
  'Sales reports & item analytics',
  'Custom floor plan builder',
  'Priority onboarding support'
];

/* ─── Animated Counter ──────────────────────────────────────── */
function AnimatedNumber({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const observed = useRef(false);

  useEffect(() => {
    const num = parseFloat(target.replace(/[^0-9.]/g, ''));
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !observed.current) {
          observed.current = true;
          let start = 0;
          const duration = 1800;
          const step = (timestamp) => {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(ease * num));
            if (progress < 1) requestAnimationFrame(step);
            else setCount(num);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {count}{target.includes('M') ? 'M' : ''}{suffix}
    </span>
  );
}

/* ─── Component ─────────────────────────────────────────────── */
const SaaSLanding = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ fontFamily: "'Inter', 'Outfit', sans-serif" }} className="min-h-screen overflow-x-hidden bg-white text-slate-900">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        * { box-sizing: border-box; }

        .hero-bg {
          background: linear-gradient(135deg, #f8faff 0%, #eef2ff 40%, #f0f4ff 70%, #fafbff 100%);
        }
        .purple-glow {
          background: radial-gradient(ellipse 60% 50% at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 70%);
        }
        .dashboard-frame {
          background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%);
          border-radius: 20px;
          box-shadow: 0 0 0 1px rgba(99,102,241,0.2), 0 40px 100px rgba(15,23,42,0.35), 0 0 80px rgba(99,102,241,0.12);
          overflow: hidden;
        }
        .dashboard-topbar {
          background: linear-gradient(90deg, #1e293b, #0f172a);
          height: 36px;
          display: flex;
          align-items: center;
          padding: 0 16px;
          gap: 6px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .dot { width: 10px; height: 10px; border-radius: 50%; }
        .dot-red { background: #ff5f56; }
        .dot-yellow { background: #ffbd2e; }
        .dot-green { background: #27c93f; }
        .topbar-url {
          margin-left: 10px;
          background: rgba(255,255,255,0.07);
          border-radius: 6px;
          padding: 3px 12px;
          font-size: 10px;
          color: rgba(255,255,255,0.4);
          flex: 1;
          max-width: 240px;
        }
        .float-badge {
          animation: floatY 3s ease-in-out infinite;
        }
        .float-badge-delay {
          animation: floatY 3s ease-in-out infinite;
          animation-delay: 1.5s;
        }
        @keyframes floatY {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .hero-pill {
          background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1));
          border: 1px solid rgba(99,102,241,0.25);
        }
        .cta-primary {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
          box-shadow: 0 8px 30px rgba(99,102,241,0.4), 0 2px 8px rgba(99,102,241,0.2);
          transition: all 0.3s ease;
        }
        .cta-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 40px rgba(99,102,241,0.5), 0 4px 12px rgba(99,102,241,0.3);
        }
        .cta-primary:active { transform: translateY(0); }
        .cta-secondary {
          background: white;
          border: 1.5px solid #e2e8f0;
          transition: all 0.25s ease;
        }
        .cta-secondary:hover { background: #f8fafc; border-color: #cbd5e1; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
        .stat-chip {
          background: white;
          border: 1px solid #e8ecf4;
          border-radius: 16px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
        }
        .section-badge {
          background: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08));
          border: 1px solid rgba(99,102,241,0.2);
          color: #6366f1;
        }
        .feature-card {
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 20px;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.03);
        }
        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.08);
          border-color: #e2e8f0;
        }
        .control-card {
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 24px;
          overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(0,0,0,0.04);
        }
        .control-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 50px rgba(0,0,0,0.1);
        }
        .testimonial-card {
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 20px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.04);
          transition: all 0.3s ease;
        }
        .testimonial-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(0,0,0,0.08);
        }
        .pricing-dark {
          background: linear-gradient(145deg, #0f172a 0%, #1e293b 100%);
          border-radius: 28px;
        }
        .faq-item {
          border: 1px solid #f1f5f9;
          border-radius: 16px;
          transition: all 0.25s ease;
        }
        .faq-item:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
        .faq-open { border-color: rgba(99,102,241,0.2); background: rgba(99,102,241,0.02); }
        .nav-scrolled {
          background: rgba(255,255,255,0.96);
          box-shadow: 0 1px 24px rgba(0,0,0,0.06);
          backdrop-filter: blur(20px);
        }
        .nav-top { background: rgba(255,255,255,0.85); backdrop-filter: blur(20px); }
        .avatar-chip {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 13px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          flex-shrink: 0;
        }
        .glow-indigo {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }
        .trusted-logos {
          display: flex;
          gap: 32px;
          align-items: center;
          overflow: hidden;
        }
        .logo-pill {
          background: white;
          border: 1px solid #e8ecf4;
          border-radius: 12px;
          padding: 10px 20px;
          font-size: 13px;
          font-weight: 700;
          color: #64748b;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .scrolling-track {
          animation: scrollLeft 25s linear infinite;
        }
        @keyframes scrollLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav
        className={`fixed inset-x-0 top-0 z-50 border-b ${scrolled ? 'nav-scrolled border-slate-100' : 'nav-top border-transparent'}`}
        style={{ transition: 'all 0.3s ease' }}
      >
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3"
          >
            <div
              className="flex h-[42px] w-[42px] items-center justify-center rounded-xl text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              <UtensilsCrossed size={18} />
            </div>
            <div className="leading-tight text-left">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Restaurant POS</p>
              <p className="text-[15px] font-black text-slate-950">Server Sundaram</p>
            </div>
          </button>

          {/* Center links */}
          <div className="hidden items-center gap-7 text-[14px] font-semibold text-slate-600 lg:flex">
            <a href="#features" className="transition-colors hover:text-slate-900">Features</a>
            <a href="#control" className="transition-colors hover:text-slate-900">How it Works</a>
            <a href="#pricing" className="transition-colors hover:text-slate-900">Pricing</a>
            <a href="#faq" className="transition-colors hover:text-slate-900">FAQ</a>
            <a href="#contact" className="transition-colors hover:text-slate-900">Contact</a>
          </div>

          {/* CTA */}
          <div className="hidden items-center gap-3 sm:flex">
            <button
              onClick={() => navigate('/admin/login')}
              className="rounded-xl px-5 py-2.5 text-[14px] font-bold text-slate-700 cta-secondary"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/register')}
              className="rounded-xl px-5 py-2.5 text-[14px] font-bold text-white cta-primary"
            >
              Get Started →
            </button>
          </div>

          <button
            onClick={() => setIsMenuOpen(v => !v)}
            className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm lg:hidden"
          >
            {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="border-t border-slate-100 bg-white px-4 py-5 lg:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-2 text-[14px] font-semibold text-slate-700">
              {['features', 'control', 'pricing', 'faq', 'contact'].map(id => (
                <a
                  key={id}
                  href={`#${id}`}
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-lg px-3 py-2.5 capitalize hover:bg-slate-50"
                >
                  {id === 'control' ? 'How it Works' : id.charAt(0).toUpperCase() + id.slice(1)}
                </a>
              ))}
              <div className="mt-3 grid grid-cols-2 gap-3">
                <button
                  onClick={() => navigate('/admin/login')}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="rounded-xl px-4 py-3 font-bold text-white cta-primary"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <main>
        {/* ── HERO ── */}
        <section className="hero-bg relative overflow-hidden px-4 pb-0 pt-28 sm:px-6 lg:px-8 lg:pt-32">
          <div className="purple-glow absolute inset-0 pointer-events-none" />
          {/* Glow orbs */}
          <div className="glow-indigo" style={{ width: 600, height: 600, background: 'rgba(99,102,241,0.09)', top: -200, right: -100 }} />
          <div className="glow-indigo" style={{ width: 400, height: 400, background: 'rgba(139,92,246,0.07)', bottom: 0, left: -100 }} />

          <div className="relative mx-auto max-w-7xl">
            {/* Top badge */}
            <div className="mb-6 flex justify-center">
              <span className="hero-pill inline-flex items-center gap-2 rounded-full px-5 py-2 text-[12px] font-bold uppercase tracking-[0.2em] text-indigo-700">
                <Sparkles size={12} /> Restaurant POS software made simple
              </span>
            </div>

            {/* Headline */}
            <h1
              className="mx-auto max-w-4xl text-center font-black leading-[1.02] tracking-[-0.04em] text-slate-950"
              style={{ fontSize: 'clamp(2.6rem, 6vw, 4.2rem)' }}
            >
              Restaurant POS software{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                made simple!
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-center text-[17px] leading-8 text-slate-500">
              Easily manage orders, menus, and tables in one place. Save time, reduce errors, and grow your business faster.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                onClick={() => navigate('/register')}
                className="inline-flex items-center gap-2.5 rounded-2xl px-7 py-4 text-[15px] font-bold text-white cta-primary"
              >
                Start 30 Days Trial <ArrowRight size={18} />
              </button>
              <button
                onClick={() => navigate('/admin/login')}
                className="inline-flex items-center gap-2.5 rounded-2xl px-7 py-4 text-[15px] font-bold text-slate-700 cta-secondary"
              >
                Login to Dashboard
              </button>
            </div>

            {/* Stats row */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-5">
              {heroStats.map(s => (
                <div key={s.label} className="stat-chip px-5 py-3 text-center">
                  <p
                    className="text-[22px] font-black tracking-[-0.03em]"
                    style={{ color: s.color }}
                  >
                    {s.value}
                  </p>
                  <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{s.label}</p>
                </div>
              ))}
            </div>

            {/* ── PRODUCT DASHBOARD MOCKUP ── */}
            <div className="relative mt-14 mx-auto" style={{ maxWidth: 1000 }}>
              {/* Floating badges */}
              <div
                className="float-badge absolute -left-6 top-20 z-10 hidden sm:block"
                style={{
                  background: 'white',
                  borderRadius: 16,
                  padding: '12px 18px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  border: '1px solid #f1f5f9'
                }}
              >
                <p style={{ fontSize: 10, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Live Revenue</p>
                <p style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginTop: 2 }}>₹ 48,290</p>
                <p style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>↑ 18% vs yesterday</p>
              </div>

              <div
                className="float-badge-delay absolute -right-6 top-16 z-10 hidden sm:block"
                style={{
                  background: 'white',
                  borderRadius: 16,
                  padding: '12px 18px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  border: '1px solid #f1f5f9'
                }}
              >
                <p style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Orders Today</p>
                <p style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginTop: 2 }}>124</p>
                <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                  {['#10b981', '#10b981', '#10b981', '#f59e0b', '#6366f1'].map((c, i) => (
                    <div key={i} style={{ width: 6, height: 24, borderRadius: 3, background: c, opacity: 0.7 + i * 0.06 }} />
                  ))}
                </div>
              </div>

              <div
                className="float-badge absolute -right-4 bottom-16 z-10 hidden lg:block"
                style={{
                  background: 'white',
                  borderRadius: 16,
                  padding: '12px 18px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  border: '1px solid #f1f5f9'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={16} color="white" strokeWidth={3} />
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Order Completed</p>
                    <p style={{ fontSize: 11, color: '#64748b' }}>Table 7 • ₹ 567</p>
                  </div>
                </div>
              </div>

              {/* Browser frame */}
              <div className="dashboard-frame">
                {/* Browser topbar */}
                <div className="dashboard-topbar">
                  <div className="dot dot-red" />
                  <div className="dot dot-yellow" />
                  <div className="dot dot-green" />
                  <div className="topbar-url">app.serversundaram.in/dashboard</div>
                </div>
                {/* Actual dashboard screenshot */}
                <div style={{ lineHeight: 0 }}>
                  <img
                    src="/dashboard_preview.png"
                    alt="Server Sundaram Dashboard - Live product preview"
                    style={{ width: '100%', display: 'block', maxHeight: 540, objectFit: 'cover', objectPosition: 'top' }}
                  />
                </div>
              </div>

              {/* Bottom fade gradient so it blends into next section */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '40%',
                  background: 'linear-gradient(to top, #f8faff 0%, transparent 100%)',
                  pointerEvents: 'none',
                  borderRadius: '0 0 20px 20px'
                }}
              />
            </div>
          </div>
        </section>

        {/* ── TRUSTED BY ── */}
        <section className="overflow-hidden border-y border-slate-100 bg-slate-50 py-8">
          <p className="mb-6 text-center text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">
            Trusted by restaurants across India
          </p>
          <div style={{ display: 'flex', overflow: 'hidden' }}>
            <div className="scrolling-track" style={{ display: 'flex', gap: 20, paddingRight: 20 }}>
              {[
                'Bayleaf Bistro', 'Urban Tadka', 'South Lane Eatery', 'Spice Garden',
                'The Grand Kitchen', 'Mani\'Z Kitchen', 'Chai Tapri', 'Biryani Palace',
                'Bayleaf Bistro', 'Urban Tadka', 'South Lane Eatery', 'Spice Garden',
                'The Grand Kitchen', 'Mani\'Z Kitchen', 'Chai Tapri', 'Biryani Palace'
              ].map((n, i) => (
                <div key={i} className="logo-pill">{n}</div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CONTROL / HOW IT WORKS ── */}
        <section id="control" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <span className="section-badge inline-block rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.25em]">
                Take Control
              </span>
              <h2
                className="mt-4 font-black tracking-[-0.04em] text-slate-950"
                style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)' }}
              >
                Built to run the floor,{' '}
                <span className="text-slate-400">not just display numbers.</span>
              </h2>
              <p className="mt-4 text-[16px] leading-8 text-slate-500">
                Every feature connects your team — from the front desk to the kitchen — so nothing falls through the cracks.
              </p>
            </div>

            <div className="mt-14 grid gap-8 lg:grid-cols-3">
              {featureBlocks.map((block, i) => (
                <article key={block.title} className="control-card">
                  <div style={{ position: 'relative', height: 220, overflow: 'hidden' }}>
                    <img
                      src={block.image}
                      alt={block.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: `linear-gradient(to top, rgba(15,23,42,0.55) 0%, transparent 60%)`
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 16,
                        left: 16
                      }}
                    >
                      <span
                        className={`inline-block rounded-full bg-gradient-to-r ${block.gradient} px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white`}
                      >
                        {block.chip}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-[20px] font-black tracking-[-0.02em] text-slate-950">{block.title}</h3>
                    <p className="mt-3 text-[14px] leading-7 text-slate-500">{block.body}</p>
                    <div className="mt-5 flex items-center gap-1.5 text-[13px] font-bold text-indigo-600">
                      Learn more <ArrowRight size={14} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES GRID ── */}
        <section id="features" className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <span className="section-badge inline-block rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.25em]">
                Powerful Features
              </span>
              <h2
                className="mt-4 font-black tracking-[-0.04em] text-slate-950"
                style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)' }}
              >
                Powerful Features Built to Elevate Your Restaurant Operations
              </h2>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {featureGrid.map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="feature-card p-6">
                    <div
                      className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
                      style={{ background: `${item.color}14` }}
                    >
                      <Icon size={22} style={{ color: item.color }} />
                    </div>
                    <h3 className="text-[16px] font-black tracking-[-0.02em] text-slate-950">{item.title}</h3>
                    <p className="mt-2 text-[13px] leading-6 text-slate-500">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <span className="section-badge inline-block rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.25em]">
                Testimonials
              </span>
              <h2
                className="mt-4 font-black tracking-[-0.04em] text-slate-950"
                style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)' }}
              >
                What Restaurant Owners Are Saying
              </h2>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {testimonials.map(item => (
                <article key={item.name} className="testimonial-card p-7">
                  {/* Stars */}
                  <div className="mb-4 flex gap-1">
                    {[...Array(item.rating)].map((_, i) => (
                      <Star key={i} size={14} fill="#f59e0b" stroke="none" />
                    ))}
                  </div>
                  <p className="text-[14px] leading-7 text-slate-600">"{item.quote}"</p>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="avatar-chip">{item.avatar}</div>
                    <div>
                      <p className="text-[14px] font-black text-slate-950">{item.name}</p>
                      <p className="text-[12px] font-semibold text-slate-400">{item.role}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section id="pricing" className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <span className="section-badge inline-block rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.25em]">
                Simple Pricing
              </span>
              <h2
                className="mt-4 font-black tracking-[-0.04em] text-slate-950"
                style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)' }}
              >
                One transparent plan. Everything included.
              </h2>
              <p className="mt-4 text-[16px] text-slate-500">
                No hidden fees, no feature gating. Get everything you need for daily restaurant operations.
              </p>
            </div>

            <div className="mt-12 mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
              {/* Features list */}
              <div
                className="rounded-3xl p-8"
                style={{ background: 'white', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-indigo-600">What's Included</p>
                <h3 className="mt-3 text-[28px] font-black tracking-[-0.03em] text-slate-950">Everything your team needs</h3>
                <p className="mt-3 text-[14px] leading-7 text-slate-500">
                  From QR menus to advanced analytics — one plan covers it all for daily operations.
                </p>
                <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                  {pricingFeatures.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-[13px] font-semibold text-slate-700">
                      <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
                        <Check size={12} className="text-emerald-600" strokeWidth={3} />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Price card */}
              <div className="pricing-dark flex flex-col justify-between p-8 text-white">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-indigo-300">Monthly Plan</p>
                  <div className="mt-4 flex items-end gap-2">
                    <span className="text-[56px] font-black leading-none tracking-[-0.04em]">₹1,499</span>
                  </div>
                  <p className="mt-2 text-[14px] text-slate-400">Per outlet / month. Billed monthly.</p>

                  <div className="mt-6 space-y-3 text-[14px] text-slate-300">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck size={15} className="text-indigo-400 flex-shrink-0" />
                      Secure setup and fully isolated tenant data
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Headphones size={15} className="text-indigo-400 flex-shrink-0" />
                      Priority support during your first 30 days
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Zap size={15} className="text-indigo-400 flex-shrink-0" />
                      Go live in as little as 24 hours
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Globe size={15} className="text-indigo-400 flex-shrink-0" />
                      Works on desktop, tablet & mobile
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    onClick={() => navigate('/register')}
                    className="flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-[15px] font-bold text-white cta-primary"
                  >
                    Start 30 Day Free Trial <ArrowRight size={17} />
                  </button>
                  <p className="mt-3 text-center text-[12px] text-slate-500">No credit card required to get started</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <span className="section-badge inline-block rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.25em]">
                FAQ
              </span>
              <h2
                className="mt-4 font-black tracking-[-0.04em] text-slate-950"
                style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)' }}
              >
                Your questions, answered
              </h2>
            </div>

            <div className="mt-10 space-y-3">
              {faqs.map((faq, i) => {
                const isOpen = openFaq === i;
                return (
                  <div key={faq.q} className={`faq-item bg-white ${isOpen ? 'faq-open' : ''}`}>
                    <button
                      onClick={() => setOpenFaq(isOpen ? -1 : i)}
                      className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                    >
                      <p className="text-[15px] font-bold text-slate-950">{faq.q}</p>
                      {isOpen
                        ? <ChevronUp size={18} className="flex-shrink-0 text-indigo-600" />
                        : <ChevronDown size={18} className="flex-shrink-0 text-slate-400" />
                      }
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-5">
                        <p className="text-[14px] leading-7 text-slate-500">{faq.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── CONTACT / CTA BANNER ── */}
        <section id="contact" className="bg-slate-50 px-4 pb-20 pt-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {/* Final CTA band */}
            <div
              className="mb-12 overflow-hidden rounded-3xl p-10 text-center text-white"
              style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%)',
                boxShadow: '0 20px 60px rgba(99,102,241,0.35)'
              }}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-indigo-200">Ready to launch?</p>
              <h2 className="mt-3 text-[clamp(2rem,4vw,2.8rem)] font-black tracking-[-0.03em]">
                Start your free 30-day trial today
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-[16px] text-indigo-100">
                No credit card needed. Set up in minutes. Scale as you grow.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button
                  onClick={() => navigate('/register')}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-4 text-[15px] font-bold text-indigo-700 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                >
                  Get Started Free <ArrowRight size={17} />
                </button>
                <button
                  onClick={() => navigate('/admin/login')}
                  className="inline-flex items-center gap-2 rounded-2xl border-2 border-white/30 bg-white/10 px-7 py-4 text-[15px] font-bold text-white backdrop-blur-sm hover:bg-white/20 transition-all"
                >
                  Login to Dashboard
                </button>
              </div>
            </div>

            {/* Contact details */}
            <div
              className="grid gap-6 rounded-3xl p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-10"
              style={{ background: 'white', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}
            >
              <div>
                <span className="section-badge inline-block rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.25em]">
                  Contact
                </span>
                <h2 className="mt-4 text-[28px] font-black tracking-[-0.03em] text-slate-950">
                  Let us help you launch faster
                </h2>
                <p className="mt-3 max-w-xl text-[14px] leading-7 text-slate-500">
                  Talk to our onboarding team for setup, migration, and staff training plans tailored to your restaurant format.
                </p>
                <div className="mt-6 space-y-3 text-[14px] font-semibold text-slate-700">
                  <p className="flex items-center gap-2.5"><Mail size={15} className="text-indigo-500" /> contact@serversundaram.in</p>
                  <p className="flex items-center gap-2.5"><Phone size={15} className="text-indigo-500" /> +91 90000 00000</p>
                  <p className="flex items-center gap-2.5"><MapPin size={15} className="text-indigo-500" /> Chennai, India</p>
                </div>
              </div>

              <img
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80"
                alt="Restaurant team"
                className="h-60 w-full rounded-2xl object-cover lg:h-full"
              />
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-100 bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              <UtensilsCrossed size={15} />
            </div>
            <div>
              <p className="text-[13px] font-black text-slate-900">Server Sundaram</p>
              <p className="text-[11px] text-slate-400">© 2026. All rights reserved.</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            <button className="hover:text-slate-700 transition-colors">Privacy</button>
            <button className="hover:text-slate-700 transition-colors">Terms</button>
            <button className="hover:text-slate-700 transition-colors">Support</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SaaSLanding;
