import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Building2, User, Mail, Lock, Eye, EyeOff,
  Phone, MapPin, CheckCircle, ArrowRight,
  Share2, ExternalLink, Zap, Star, ShieldCheck,
  UtensilsCrossed, ChefHat, Users, CreditCard
} from 'lucide-react';
import { API_BASE_URL } from '../api/api';

const PLANS = [
  { id: 'STARTER', label: 'Starter', price: '₹1,099/mo', desc: 'Up to 5 tables', icon: Zap, color: '#6366f1' },
  { id: 'CLASSIC', label: 'Classic', price: '₹1,499/mo', desc: 'Up to 20 tables', icon: Star, color: '#0ea5e9' },
  { id: 'PREMIUM', label: 'Premium', price: '₹2,499/mo', desc: 'Unlimited tables', icon: ShieldCheck, color: '#10b981' },
];

const SIDEBAR_FEATURES = [
  { title: 'Multi-Tenant Isolation', desc: 'Secure, private data environment for your restaurant.', icon: ShieldCheck },
  { title: 'Server Sundaram Control Panel', desc: 'Manage your entire business from one place.', icon: ChefHat },
  { title: 'Seamless Onboarding', desc: 'Go live in less than 60 seconds.', icon: Zap },
];

const HotelRegistration = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const initialPlan = queryParams.get('plan') || 'CLASSIC';

  const [step, setStep] = useState(1);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [regHotelId, setRegHotelId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showKitchenPassword, setShowKitchenPassword] = useState(false);
  const [showCaptainPassword, setShowCaptainPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    ownerName: '',
    contactNumber: '',
    ownerEmail: '',
    ownerPassword: '',
    gstNumber: '',
    planType: initialPlan,
    adminUsername: '',
    adminPassword: '',
    kitchenUsername: '',
    kitchenPassword: '',
    captainUsername: '',
    captainPassword: ''
  });

  const [errors, setErrors] = useState({});

  const set = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateStep1 = () => {
    const e = {};
    if (!formData.name.trim()) e.name = 'Restaurant name is required';
    if (!formData.address.trim()) e.address = 'Address is required';
    if (!formData.ownerName.trim()) e.ownerName = 'Owner name is required';
    if (!formData.contactNumber.trim()) e.contactNumber = 'Phone number is required';
    if (!formData.ownerEmail.trim()) e.ownerEmail = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ownerEmail)) e.ownerEmail = 'Enter a valid email address';
    if (!formData.ownerPassword.trim()) e.ownerPassword = 'Password is required';
    else if (formData.ownerPassword.length < 6) e.ownerPassword = 'Password must be at least 6 characters';
    return e;
  };

  const validateStep3 = () => {
    const e = {};
    if (!formData.adminUsername.trim()) e.adminUsername = 'Admin username is required';
    if (!formData.adminPassword.trim()) e.adminPassword = 'Admin password is required';
    if (!formData.kitchenUsername.trim()) e.kitchenUsername = 'Kitchen username is required';
    if (!formData.kitchenPassword.trim()) e.kitchenPassword = 'Kitchen password is required';
    if (!formData.captainUsername.trim()) e.captainUsername = 'Captain username is required';
    if (!formData.captainPassword.trim()) e.captainPassword = 'Captain password is required';
    return e;
  };

  const handleNextStep1 = (e) => {
    e.preventDefault();
    const validationErrors = validateStep1();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstErrorEl = document.querySelector('[data-error]');
      firstErrorEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setStep(2);
  };

  const handleProcessPayment = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setStep(3);
    }, 2500);
  };

  const handleSubmitFinal = async (e) => {
    e.preventDefault();
    const validationErrors = validateStep3();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstErrorEl = document.querySelector('[data-error]');
      firstErrorEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        restaurant: {
          name: formData.name,
          ownerName: formData.ownerName,
          ownerEmail: formData.ownerEmail,
          ownerPassword: formData.ownerPassword,
          contactNumber: formData.contactNumber,
          address: formData.address,
          gstNumber: formData.gstNumber,
          planType: formData.planType
        },
        ownerEmail: formData.ownerEmail,
        adminUsername: formData.adminUsername,
        adminPassword: formData.adminPassword,
        kitchenUsername: formData.kitchenUsername,
        kitchenPassword: formData.kitchenPassword,
        captainUsername: formData.captainUsername,
        captainPassword: formData.captainPassword
      };
      const response = await axios.post(`${API_BASE_URL}/saas/hotels`, payload);
      setRegHotelId(response.data.hotelId);
    } catch (err) {
      console.error('Registration Error:', err.response?.data || err.message);
      const errorMessage = err.response?.data?.message || 'Registration failed. Please check your details and try again.';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const baseUrl = window.location.origin;

  // ── Success screen ──
  if (regHotelId) {
    const links = [
      { label: 'Owner Admin Login', path: `/${regHotelId}/owner/login`, color: '#6366f1' },
      { label: 'Manager Admin Panel', path: `/${regHotelId}/admin/login`, color: '#0ea5e9' },
      { label: 'Kitchen Display', path: `/${regHotelId}/kitchen/login`, color: '#10b981' },
      { label: 'Captain Dashboard', path: `/${regHotelId}/captain/login`, color: '#f59e0b' },
    ];
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8faff 0%, #eef2ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'Inter','Outfit',sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');`}</style>
        <div style={{ maxWidth: 560, width: '100%', background: 'white', borderRadius: 28, boxShadow: '0 20px 80px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', padding: '40px 40px 32px', textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, background: 'rgba(255,255,255,0.15)', borderRadius: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <CheckCircle size={36} color="white" />
            </div>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: 'white', margin: '0 0 8px', letterSpacing: '-0.03em' }}>You're Live! 🎉</h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15, fontWeight: 600 }}>{formData.name} is now on Server Sundaram</p>
          </div>

          <div style={{ padding: '32px 40px 40px' }}>
            {/* Credentials */}
            <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#94a3b8', marginBottom: 12 }}>Your Credentials</p>
            <div style={{ background: '#f8fafc', borderRadius: 16, padding: '16px 20px', marginBottom: 8, border: '1px solid #e8ecf4' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#94a3b8', marginBottom: 4 }}>Hotel ID</p>
                  <p style={{ fontSize: 18, fontWeight: 900, color: '#6366f1' }}>{regHotelId}</p>
                </div>
                <button onClick={() => copyToClipboard(String(regHotelId))} style={{ background: '#eef2ff', border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 11, fontWeight: 800, color: '#6366f1', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Copy</button>
              </div>
            </div>
            {[
              { label: 'Owner Admin', u: formData.ownerEmail, p: formData.ownerPassword },
              { label: 'Manager / Admin', u: formData.adminUsername, p: formData.adminPassword },
              { label: 'Kitchen Staff', u: formData.kitchenUsername, p: formData.kitchenPassword },
              { label: 'Captain / Waiter', u: formData.captainUsername, p: formData.captainPassword },
            ].map(c => (
              <div key={c.label} style={{ background: '#f8fafc', borderRadius: 14, padding: '12px 18px', marginBottom: 8, border: '1px solid #e8ecf4' }}>
                <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#94a3b8', marginBottom: 6 }}>{c.label}</p>
                <p style={{ fontSize: 12, fontWeight: 700, fontFamily: 'monospace', color: '#334155' }}>
                  <span style={{ color: '#6366f1' }}>{c.u}</span> &nbsp;·&nbsp; {c.p}
                </p>
              </div>
            ))}

            {/* Access Links */}
            <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#94a3b8', margin: '20px 0 12px' }}>Access Links</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {links.map(link => (
                <div key={link.label} style={{ background: '#f8fafc', border: '1px solid #e8ecf4', borderRadius: 14, padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#94a3b8', marginBottom: 3 }}>{link.label}</p>
                    <p style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>{baseUrl}{link.path}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => copyToClipboard(`${baseUrl}${link.path}`)} style={{ background: 'white', border: '1px solid #e8ecf4', borderRadius: 8, padding: '6px 8px', cursor: 'pointer' }}><Share2 size={13} color="#64748b" /></button>
                    <button onClick={() => window.open(link.path, '_blank')} style={{ background: 'white', border: '1px solid #e8ecf4', borderRadius: 8, padding: '6px 8px', cursor: 'pointer' }}><ExternalLink size={13} color="#64748b" /></button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate(`/${regHotelId}/owner/login`)}
              style={{ width: '100%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: 18, padding: '18px', fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
            >
              Enter Owner Dashboard <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Registration form ──
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8faff 0%, #eef2ff 100%)', display: 'flex', alignItems: 'stretch', fontFamily: "'Inter','Outfit',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .reg-input {
          width: 100%;
          background: #f8fafc;
          border: 1.5px solid #e8ecf4;
          border-radius: 14px;
          padding: 14px 18px;
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
          outline: none;
          transition: all 0.2s;
          font-family: inherit;
        }
        .reg-input:focus {
          border-color: #6366f1;
          background: white;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }
        .reg-input.error { border-color: #ef4444; background: #fff5f5; }
        .reg-input.error:focus { box-shadow: 0 0 0 3px rgba(239,68,68,0.1); }
        .reg-input::placeholder { color: #cbd5e1; }
        .reg-label {
          display: block;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: #94a3b8;
          margin-bottom: 8px;
        }
        .reg-error {
          font-size: 11px;
          font-weight: 700;
          color: #ef4444;
          margin-top: 5px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .plan-card {
          border: 2px solid #e8ecf4;
          border-radius: 16px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
          background: #f8fafc;
          position: relative;
          text-align: center;
        }
        .plan-card.selected {
          border-color: #6366f1;
          background: #eef2ff;
          box-shadow: 0 4px 18px rgba(99,102,241,0.15);
        }
        .plan-card:hover:not(.selected) { border-color: #c7d2fe; background: white; }
        .submit-btn {
          width: 100%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          border-radius: 18px;
          padding: 18px;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 8px 28px rgba(99,102,241,0.35);
          transition: all 0.2s;
          font-family: inherit;
        }
        .submit-btn:hover { transform: translateY(-2px); box-shadow: 0 14px 36px rgba(99,102,241,0.45); }
        .submit-btn:active { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }
        .section-title {
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.22em;
          color: #6366f1;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
        }
        .section-title::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(to right, #e8ecf4, transparent);
        }
        .cred-box {
          background: #f8fafc;
          border: 1px solid #e8ecf4;
          border-radius: 18px;
          padding: 20px 22px;
        }
        .cred-box-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }
        .cred-icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .input-wrap { position: relative; }
        .eye-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          display: flex;
          padding: 4px;
        }
        .eye-btn:hover { color: #6366f1; }
      `}</style>

      {/* ── LEFT DARK SIDEBAR ── */}
      <div style={{
        width: 360,
        minWidth: 320,
        flexShrink: 0,
        background: 'linear-gradient(160deg, #0f172a 0%, #1e1b4b 60%, #0f172a 100%)',
        padding: '40px 36px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflow: 'hidden'
      }} className="hidden lg:flex">
        {/* BG glows */}
        <div style={{ position: 'absolute', top: -100, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -60, width: 250, height: 250, borderRadius: '50%', background: 'rgba(139,92,246,0.12)', filter: 'blur(80px)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 52 }}>
            <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UtensilsCrossed size={20} color="white" />
            </div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.22em', color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>Restaurant POS</p>
              <p style={{ fontSize: 16, fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>Server Sundaram</p>
            </div>
          </div>

          {/* Headline */}
          <h2 style={{ fontSize: 34, fontWeight: 900, color: 'white', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 20 }}>
            Create your<br />
            <span style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>restaurant account.</span>
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 40 }}>
            Join the ecosystem of digital-first hospitality partners across India.
          </p>

          {/* Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {SIDEBAR_FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 11, background: 'rgba(99,102,241,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <Icon size={16} color="#818cf8" />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.9)', marginBottom: 3 }}>{f.title}</p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        <p style={{ position: 'relative', zIndex: 1, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.28em', color: 'rgba(255,255,255,0.2)' }}>
          Built by Server Sundaram Technologies
        </p>
      </div>

      {/* ── RIGHT FORM ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '40px 32px' }}>
        <div style={{ maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>

          {/* Header */}
          <div style={{ marginBottom: 36 }}>
            {/* Mobile logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }} className="lg:hidden">
              <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UtensilsCrossed size={16} color="white" />
              </div>
              <p style={{ fontSize: 15, fontWeight: 900, color: '#0f172a' }}>Server Sundaram</p>
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 8 }}>
              Create your account
            </h1>
            <p style={{ fontSize: 15, color: '#64748b', fontWeight: 500 }}>
              Fill in all the details below to register your restaurant on Server Sundaram.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
              <p style={{ fontSize: 13, color: '#64748b' }}>Already registered?</p>
              <button
                type="button"
                onClick={() => navigate('/admin/login')}
                style={{ fontSize: 13, fontWeight: 700, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Login here →
              </button>
            </div>
          </div>

          {/* Stepper Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
             {[1, 2, 3].map(s => (
               <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 8 }}>
                 <div style={{ 
                   width: 32, height: 32, borderRadius: '50%', 
                   background: step >= s ? '#6366f1' : '#e2e8f0', 
                   color: step >= s ? 'white' : '#64748b',
                   display: 'flex', alignItems: 'center', justifyContent: 'center',
                   fontSize: 14, fontWeight: 800, flexShrink: 0,
                   transition: 'all 0.3s'
                 }}>
                   {step > s ? <CheckCircle size={16} color="white" /> : s}
                 </div>
                 {s < 3 && <div style={{ height: 2, background: step > s ? '#6366f1' : '#e2e8f0', flex: 1, transition: 'all 0.3s' }} />}
               </div>
             ))}
          </div>

          {step === 1 && (
            <form onSubmit={handleNextStep1} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              
              {/* ── Section 1: Plan Selection ── */}
              <div>
                <p className="section-title"><CreditCard size={14} />Subscription Plan</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {PLANS.map(p => {
                    const Icon = p.icon;
                    const selected = formData.planType === p.id;
                    return (
                      <div
                        key={p.id}
                        className={`plan-card${selected ? ' selected' : ''}`}
                        onClick={() => setFormData(prev => ({ ...prev, planType: p.id }))}
                      >
                        {selected && (
                          <div style={{ position: 'absolute', top: 10, right: 10 }}>
                            <CheckCircle size={16} color="#6366f1" />
                          </div>
                        )}
                        <div style={{ width: 36, height: 36, borderRadius: 11, background: selected ? p.color : '#f1f5f9', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, transition: 'all 0.2s' }}>
                          <Icon size={17} color={selected ? 'white' : '#94a3b8'} />
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 800, color: selected ? '#4338ca' : '#334155', letterSpacing: '-0.01em' }}>{p.label}</p>
                        <p style={{ fontSize: 15, fontWeight: 900, color: selected ? '#6366f1' : '#64748b', marginTop: 2 }}>{p.price}</p>
                        <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{p.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Section 2: Restaurant Identity ── */}
              <div>
                <p className="section-title"><Building2 size={14} />Restaurant Identity</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div data-error={errors.name ? 'true' : undefined}>
                    <label className="reg-label">Restaurant Name *</label>
                    <input
                      className={`reg-input${errors.name ? ' error' : ''}`}
                      value={formData.name}
                      onChange={set('name')}
                      placeholder="e.g. The Grand Pavilion"
                    />
                    {errors.name && <p className="reg-error">⚠ {errors.name}</p>}
                  </div>

                  <div data-error={errors.address ? 'true' : undefined}>
                    <label className="reg-label">Physical Address *</label>
                    <textarea
                      className={`reg-input${errors.address ? ' error' : ''}`}
                      value={formData.address}
                      onChange={set('address')}
                      placeholder="Street, Area, City, State..."
                      rows={3}
                      style={{ resize: 'vertical' }}
                    />
                    {errors.address && <p className="reg-error">⚠ {errors.address}</p>}
                  </div>

                  <div>
                    <label className="reg-label">GST Number (Optional)</label>
                    <input
                      className="reg-input"
                      value={formData.gstNumber}
                      onChange={set('gstNumber')}
                      placeholder="e.g. 29ABCDE1234F1Z5"
                    />
                  </div>
                </div>
              </div>

              {/* ── Section 3: Owner Details ── */}
              <div>
                <p className="section-title"><User size={14} />Owner Details</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div data-error={errors.ownerName ? 'true' : undefined}>
                      <label className="reg-label">Owner Name *</label>
                      <input
                        className={`reg-input${errors.ownerName ? ' error' : ''}`}
                        value={formData.ownerName}
                        onChange={set('ownerName')}
                        placeholder="Full name"
                      />
                      {errors.ownerName && <p className="reg-error">⚠ {errors.ownerName}</p>}
                    </div>
                    <div data-error={errors.contactNumber ? 'true' : undefined}>
                      <label className="reg-label">Phone Number *</label>
                      <input
                        className={`reg-input${errors.contactNumber ? ' error' : ''}`}
                        value={formData.contactNumber}
                        onChange={set('contactNumber')}
                        placeholder="10-digit mobile"
                        type="tel"
                      />
                      {errors.contactNumber && <p className="reg-error">⚠ {errors.contactNumber}</p>}
                    </div>
                  </div>

                  <div data-error={errors.ownerEmail ? 'true' : undefined}>
                    <label className="reg-label">Owner Email *</label>
                    <input
                      className={`reg-input${errors.ownerEmail ? ' error' : ''}`}
                      value={formData.ownerEmail}
                      onChange={set('ownerEmail')}
                      placeholder="your@email.com"
                      type="email"
                      autoComplete="email"
                    />
                    {errors.ownerEmail && <p className="reg-error">⚠ {errors.ownerEmail}</p>}
                  </div>

                  <div data-error={errors.ownerPassword ? 'true' : undefined}>
                    <label className="reg-label">Owner Password *</label>
                    <div className="input-wrap">
                      <input
                        className={`reg-input${errors.ownerPassword ? ' error' : ''}`}
                        value={formData.ownerPassword}
                        onChange={set('ownerPassword')}
                        placeholder="••••••••"
                        type={showOwnerPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        style={{ paddingRight: 44 }}
                      />
                      <button type="button" className="eye-btn" onClick={() => setShowOwnerPassword(v => !v)}>
                        {showOwnerPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                    {errors.ownerPassword && <p className="reg-error">⚠ {errors.ownerPassword}</p>}
                  </div>
                </div>
              </div>

              <div>
                <button type="submit" className="submit-btn" style={{ background: 'linear-gradient(135deg, #0f172a, #334155)', color: 'white', boxShadow: '0 8px 28px rgba(15, 23, 42, 0.25)' }}>
                  Continue to Payment <ArrowRight size={18} />
                </button>
              </div>

            </form>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, textAlign: 'center', padding: '40px 0' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', border: '1px solid #e0e7ff' }}>
                <CreditCard size={40} color="#6366f1" />
              </div>
              <div>
                <h3 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.02em' }}>Complete Payment</h3>
                <p style={{ fontSize: 15, color: '#64748b' }}>
                  You have selected the <strong>{PLANS.find(p => p.id === formData.planType)?.label}</strong> plan.
                </p>
                <div style={{ marginTop: 24, padding: '24px', background: 'white', borderRadius: 16, border: '1.5px solid #e8ecf4', display: 'inline-block', minWidth: 280, boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
                   <p style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#94a3b8', marginBottom: 8 }}>Amount to pay</p>
                   <p style={{ fontSize: 36, fontWeight: 900, color: '#6366f1', letterSpacing: '-0.03em' }}>{PLANS.find(p => p.id === formData.planType)?.price}</p>
                </div>
              </div>
              
              <div style={{ marginTop: 16 }}>
                <button 
                  onClick={handleProcessPayment} 
                  className="submit-btn" 
                  disabled={isProcessingPayment}
                  style={{ background: isProcessingPayment ? '#e2e8f0' : 'linear-gradient(135deg, #10b981, #059669)', color: isProcessingPayment ? '#64748b' : 'white', maxWidth: 360, margin: '0 auto', boxShadow: isProcessingPayment ? 'none' : '0 8px 28px rgba(16, 185, 129, 0.35)' }}
                >
                  {isProcessingPayment ? (
                    <>
                      <div style={{ width: 18, height: 18, border: '3px solid rgba(100,116,139,0.4)', borderTopColor: '#64748b', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                      Processing...
                    </>
                  ) : (
                    <>Pay Now (Dummy Gateway)</>
                  )}
                </button>
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 16, fontWeight: 600 }}>We'll add the live API key later.</p>
              </div>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmitFinal} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              
              <div style={{ background: '#ecfdf5', border: '1.5px solid #a7f3d0', padding: '16px 20px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
                 <CheckCircle size={28} color="#10b981" />
                 <div>
                   <p style={{ fontSize: 15, fontWeight: 900, color: '#065f46' }}>Payment Successful!</p>
                   <p style={{ fontSize: 13, color: '#047857', fontWeight: 500, marginTop: 2 }}>Please configure your staff credentials to finish registration.</p>
                 </div>
              </div>

              {/* ── Section 4: Staff Credentials ── */}
              <div>
                <p className="section-title"><Users size={14} />Staff Credentials</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                  {/* Admin */}
                  <div className="cred-box">
                    <div className="cred-box-header">
                      <div className="cred-icon" style={{ background: '#eef2ff' }}>
                        <Lock size={15} color="#6366f1" />
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>Admin Credentials</p>
                        <p style={{ fontSize: 11, color: '#94a3b8' }}>Restaurant manager access</p>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div data-error={errors.adminUsername ? 'true' : undefined}>
                        <label className="reg-label">Username *</label>
                        <input className={`reg-input${errors.adminUsername ? ' error' : ''}`} value={formData.adminUsername} onChange={set('adminUsername')} placeholder="admin_user" autoComplete="off" />
                        {errors.adminUsername && <p className="reg-error">⚠ {errors.adminUsername}</p>}
                      </div>
                      <div data-error={errors.adminPassword ? 'true' : undefined}>
                        <label className="reg-label">Password *</label>
                        <div className="input-wrap">
                          <input className={`reg-input${errors.adminPassword ? ' error' : ''}`} value={formData.adminPassword} onChange={set('adminPassword')} placeholder="••••••••" type={showAdminPassword ? 'text' : 'password'} autoComplete="new-password" style={{ paddingRight: 44 }} />
                          <button type="button" className="eye-btn" onClick={() => setShowAdminPassword(v => !v)}>{showAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                        </div>
                        {errors.adminPassword && <p className="reg-error">⚠ {errors.adminPassword}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Kitchen */}
                  <div className="cred-box">
                    <div className="cred-box-header">
                      <div className="cred-icon" style={{ background: '#f0fdf4' }}>
                        <ChefHat size={15} color="#16a34a" />
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>Kitchen Credentials</p>
                        <p style={{ fontSize: 11, color: '#94a3b8' }}>KOT display & order queue</p>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div data-error={errors.kitchenUsername ? 'true' : undefined}>
                        <label className="reg-label">Username *</label>
                        <input className={`reg-input${errors.kitchenUsername ? ' error' : ''}`} value={formData.kitchenUsername} onChange={set('kitchenUsername')} placeholder="kitchen_user" autoComplete="off" />
                        {errors.kitchenUsername && <p className="reg-error">⚠ {errors.kitchenUsername}</p>}
                      </div>
                      <div data-error={errors.kitchenPassword ? 'true' : undefined}>
                        <label className="reg-label">Password *</label>
                        <div className="input-wrap">
                          <input className={`reg-input${errors.kitchenPassword ? ' error' : ''}`} value={formData.kitchenPassword} onChange={set('kitchenPassword')} placeholder="••••••••" type={showKitchenPassword ? 'text' : 'password'} autoComplete="new-password" style={{ paddingRight: 44 }} />
                          <button type="button" className="eye-btn" onClick={() => setShowKitchenPassword(v => !v)}>{showKitchenPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                        </div>
                        {errors.kitchenPassword && <p className="reg-error">⚠ {errors.kitchenPassword}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Captain */}
                  <div className="cred-box">
                    <div className="cred-box-header">
                      <div className="cred-icon" style={{ background: '#fff7ed' }}>
                        <Users size={15} color="#ea580c" />
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>Captain Credentials</p>
                        <p style={{ fontSize: 11, color: '#94a3b8' }}>Floor staff & order relay</p>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div data-error={errors.captainUsername ? 'true' : undefined}>
                        <label className="reg-label">Username *</label>
                        <input className={`reg-input${errors.captainUsername ? ' error' : ''}`} value={formData.captainUsername} onChange={set('captainUsername')} placeholder="captain_user" autoComplete="off" />
                        {errors.captainUsername && <p className="reg-error">⚠ {errors.captainUsername}</p>}
                      </div>
                      <div data-error={errors.captainPassword ? 'true' : undefined}>
                        <label className="reg-label">Password *</label>
                        <div className="input-wrap">
                          <input className={`reg-input${errors.captainPassword ? ' error' : ''}`} value={formData.captainPassword} onChange={set('captainPassword')} placeholder="••••••••" type={showCaptainPassword ? 'text' : 'password'} autoComplete="new-password" style={{ paddingRight: 44 }} />
                          <button type="button" className="eye-btn" onClick={() => setShowCaptainPassword(v => !v)}>{showCaptainPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                        </div>
                        {errors.captainPassword && <p className="reg-error">⚠ {errors.captainPassword}</p>}
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              <div>
                <button type="submit" className="submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div style={{ width: 18, height: 18, border: '3px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                      Finalizing Account...
                    </>
                  ) : (
                    <>Create Restaurant Account <ArrowRight size={18} /></>
                  )}
                </button>
              </div>

            </form>
          )}

          <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
        </div>
      </div>

      <p style={{ display: 'none' }}>Server Sundaram · PaaS Multi-Tenant Solution</p>
    </div>
  );
};

export default HotelRegistration;
