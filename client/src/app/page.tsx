'use client';
// Force deployment update

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API_URL } from './config';
import ReviewForm from '../components/ReviewForm';
import ReviewDisplay from '../components/ReviewDisplay';
import RazorpaySubscriptionButton from '../components/RazorpaySubscriptionButton';

export default function Home() {
  const router = useRouter();
  const [reviews, setReviews] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [reviewContext, setReviewContext] = useState({ location: 'your area' });

  const handleGenerate = async (data: any) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/generate-reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Generation failed');
      const result = await res.json();
      setReviews(result);
      if (data.location) setReviewContext({ location: data.location });
    } catch (error) {
      console.error(error);
      alert('Something went wrong. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = (amount: string, planName: string) => {
    // This is a client-side integration for demo purposes.
    // In production, you should create an order on your backend.

    const options = {
      key: "YOUR_RAZORPAY_KEY_ID", // ⚠️ REPLACE WITH YOUR REAL KEY ID
      amount: amount,
      currency: "INR",
      name: "Retner SmartReview",
      description: planName,
      image: "https://cdn-icons-png.flaticon.com/512/3523/3523063.png",
      handler: function (response: any) {
        // Payment Success
        window.location.href = "https://chat.whatsapp.com/FYs6S3BV0tq4taqdO7CBcL";
      },
      prefill: {
        name: "",
        email: "",
        contact: ""
      },
      theme: {
        color: "#8b5cf6"
      }
    };

    if (typeof (window as any).Razorpay !== 'undefined') {
      const rzp1 = new (window as any).Razorpay(options);
      rzp1.open();
    } else {
      alert("Razorpay SDK failed to load. Please refresh.");
    }

    // console.log("Manual payment disabled in favor of subscription button.");
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', overflowX: 'hidden' }}>

      {/* Load Razorpay Script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>

      <style dangerouslySetInnerHTML={{
        __html: `
        .nav-links { display: flex; gap: 20px; align-items: center; }
        .mobile-fab { display: none; }
        .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; }
        
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .pricing-grid { grid-template-columns: 1fr; }
          .mobile-fab { 
            display: flex !important; 
            position: fixed; 
            bottom: 20px; 
            left: 50%; 
            transform: translateX(-50%); 
            width: 90%; 
            max-width: 400px;
            background: linear-gradient(90deg, #8b5cf6, #ec4899); 
            padding: 16px 24px; 
            border-radius: 50px; 
            justify-content: space-between; 
            align-items: center; 
            box-shadow: 0 10px 30px rgba(139, 92, 246, 0.4); 
            z-index: 9999;
            font-weight: bold;
            cursor: pointer;
            border: 1px solid rgba(255,255,255,0.2);
            animation: pulse-glow 2s infinite;
          }
        }
        @keyframes pulse-glow {
          0% { box-shadow: 0 10px 30px rgba(139, 92, 246, 0.4); transform: translateX(-50%) scale(1); }
          50% { box-shadow: 0 10px 40px rgba(236, 72, 153, 0.6); transform: translateX(-50%) scale(1.02); }
          100% { box-shadow: 0 10px 30px rgba(139, 92, 246, 0.4); transform: translateX(-50%) scale(1); }
        }
      `}} />

      {/* Navbar */}
      <nav style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', background: 'linear-gradient(90deg, #8b5cf6, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          GMB SmartReview
        </div>
        <div className="nav-links">
          <a href="#features" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Features</a>
          <a href="#demo" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Live Demo</a>
          {/* Login Removed as requested */}
          <a href="#pricing" className="btn-primary" style={{ textDecoration: 'none', padding: '8px 16px', fontSize: '0.9rem' }}>
            Get Access
          </a>
        </div>
      </nav>

      {/* Floating Action Button (Mobile Only) */}
      {/* Floating Action Button (Mobile Only) - Commented out as it uses the old payment method
      <div className="mobile-fab" onClick={() => handlePayment("9900", "Lifetime Access - Mobile")}>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
          <span style={{ fontSize: '0.8rem', color: '#fcd34d' }}>Limited Time Offer</span>
          <span style={{ fontSize: '1.1rem' }}>
            <span style={{ textDecoration: 'line-through', opacity: 0.7, marginRight: '8px', fontSize: '0.9rem' }}>₹599</span>
            ₹99 Only
          </span>
        </div>
        <div style={{ background: 'white', color: '#8b5cf6', padding: '8px 16px', borderRadius: '20px', fontSize: '0.9rem' }}>
          Buy Now ➔
        </div>
      </div>
      */}

      {/* Hero Section */}
      <header style={{ padding: '80px 20px', position: 'relative', overflow: 'hidden' }}>
        {/* Background Glow */}
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%, -50%)', width: '500px', height: '500px', background: '#8b5cf6', filter: 'blur(150px)', opacity: 0.15, zIndex: 0 }}></div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '50px' }}>

          {/* Left Content */}
          <div style={{ flex: '1 1 500px', textAlign: 'left' }}>
            <div style={{ display: 'inline-block', padding: '5px 15px', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', fontSize: '0.8rem', marginBottom: '20px', color: '#a78bfa', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
              🚀 #1 Google Review Tool in India
            </div>
            <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: '800', lineHeight: 1.1, marginBottom: '20px' }}>
              Turn Customers into <br />
              <span className="gradient-text">5-Star Advocates</span>
            </h1>
            <p style={{ fontSize: '1.2rem', color: '#94a3b8', marginBottom: '40px', lineHeight: 1.6, maxWidth: '500px' }}>
              Create authentic, AI-powered reviews in seconds. Boost your GMB ranking instantly.
            </p>
            <div style={{ display: 'flex', gap: '15px' }}>
              <a href="#pricing" className="btn-primary" style={{ fontSize: '1.1rem', padding: '12px 30px', textDecoration: 'none' }}>
                Buy Now @ ₹99
              </a>
              <a href="#demo" className="btn-secondary" style={{ fontSize: '1.1rem', padding: '12px 30px', textDecoration: 'none', background: 'rgba(255,255,255,0.05)' }}>
                Try Demo
              </a>
            </div>
          </div>

          {/* Right Visual: Smart Card Mockup */}
          <div style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center', perspective: '1000px' }}>
            <div className="glass-panel" style={{
              width: '320px',
              padding: '30px',
              background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px',
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              transform: 'rotateY(-10deg) rotateX(5deg)',
              transition: 'transform 0.3s ease'
            }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'rotateY(0deg) rotateX(0deg) scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'rotateY(-10deg) rotateX(5deg)'}
            >
              <div style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '5px' }}>GMB SmartReview</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '20px' }}>Scan to Review Us</div>

              <div style={{ background: 'white', padding: '10px', borderRadius: '10px', display: 'inline-block', marginBottom: '20px' }}>
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://client-theta-flame.vercel.app/r/retner-785&color=000000"
                  alt="Review QR Code"
                  style={{ width: '180px', height: '180px', display: 'block' }}
                />
              </div>

              <div style={{ fontSize: '0.9rem', color: '#fbbf24', marginBottom: '10px' }}>⭐⭐⭐⭐⭐</div>
              <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                "Loved the service! Highly recommend to everyone."
              </p>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '10px' }}>Powered by Retner</div>
            </div>
          </div>

        </div>
      </header>

      {/* Stats Bar */}
      <div style={{ background: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '20px 0' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '20px', textAlign: 'center' }}>
          <div>
            <div className="gradient-text" style={{ fontSize: '2rem', fontWeight: 'bold' }}>5,000+</div>
            <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Happy Customers</div>
          </div>
          <div>
            <div className="gradient-text" style={{ fontSize: '2rem', fontWeight: 'bold' }}>250k+</div>
            <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Reviews Generated</div>
          </div>
          <div>
            <div className="gradient-text" style={{ fontSize: '2rem', fontWeight: 'bold' }}>4.9/5</div>
            <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Average Rating</div>
          </div>
          <div>
            <div className="gradient-text" style={{ fontSize: '2rem', fontWeight: 'bold' }}>#1</div>
            <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>AI Review Tool</div>
          </div>
        </div>
      </div>

      {/* How It Works (Steps) */}
      <section style={{ padding: '80px 20px', background: '#0f172a' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '60px' }}>3 Simple Steps to <span className="gradient-text">Success</span></h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>

            {/* Step 1 */}
            <div style={{ position: 'relative' }}>
              <div className="glass-panel" style={{ padding: '30px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src="/assets/step1.png" alt="Scan QR" style={{ width: '100%', maxWidth: '250px', borderRadius: '15px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.1)' }} />
                <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>1. Scan QR Code</h3>
                <p style={{ color: '#94a3b8', lineHeight: '1.6' }}>
                  Customer scans the unique QR code placed on your <b>reception or table</b>. No app download needed.
                </p>
              </div>
              <div style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', background: '#8b5cf6', padding: '5px 15px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>STEP 1</div>
            </div>

            {/* Step 2 */}
            <div style={{ position: 'relative' }}>
              <div className="glass-panel" style={{ padding: '30px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src="/assets/step2.png" alt="Choose Review" style={{ width: '100%', maxWidth: '250px', borderRadius: '15px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.1)' }} />
                <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>2. Choose Review</h3>
                <p style={{ color: '#94a3b8', lineHeight: '1.6' }}>
                  AI suggests 5 positive reviews based on their visit. They tap the <b>"Select & Post"</b> button to copy.
                </p>
              </div>
              <div style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', background: '#ec4899', padding: '5px 15px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>STEP 2</div>
            </div>

            {/* Step 3 */}
            <div style={{ position: 'relative' }}>
              <div className="glass-panel" style={{ padding: '30px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src="/assets/step3_v2.png" alt="Auto Redirect" style={{ width: '100%', maxWidth: '250px', borderRadius: '15px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.1)' }} />
                <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>3. Auto-Redirect</h3>
                <p style={{ color: '#94a3b8', lineHeight: '1.6' }}>
                  We automatically open your Google Review page. Customer just <b>Pastes & Submits</b>. Done!
                </p>
              </div>
              <div style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', background: '#10b981', padding: '5px 15px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>STEP 3</div>
            </div>

          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" style={{ padding: '80px 20px', background: '#1e293b' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '60px' }}>Why <span className="gradient-text">SmartReview?</span></h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
            {/* Feature 1 */}
            <div className="glass-panel" style={{ padding: '30px', background: 'rgba(15, 23, 42, 0.6)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '15px' }}>🤖</div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>AI Review Writer</h3>
              <p style={{ color: '#94a3b8' }}>Customers don't know what to write? Our AI suggests 5 distinct review styles for them to choose from.</p>
            </div>
            {/* Feature 2 */}
            <div className="glass-panel" style={{ padding: '30px', background: 'rgba(15, 23, 42, 0.6)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '15px' }}>📱</div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>QR Code Studio</h3>
              <p style={{ color: '#94a3b8' }}>Generate beautiful, printable QR cards for your counter. Customers scan, select a review, and post in seconds.</p>
            </div>
            {/* Feature 3 */}
            <div className="glass-panel" style={{ padding: '30px', background: 'rgba(15, 23, 42, 0.6)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '15px' }}>📈</div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Smart Analytics</h3>
              <p style={{ color: '#94a3b8' }}>Track how many people scan, copy reviews, and actually visit your Google page to optimize your funnels.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Real Results Section */}
      <section style={{ padding: '80px 20px', background: '#1e293b' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>Real Growth, <span className="gradient-text">Real Results</span></h2>
          <p style={{ color: '#94a3b8', marginBottom: '50px', fontSize: '1.2rem' }}>
            See how our partners increased their calls and customer engagement in just a few months.
          </p>

          <div className="glass-panel" style={{ padding: '20px', display: 'inline-block' }}>
            <img
              src="/assets/results_comparison.png"
              alt="GMB Performance Before and After"
              style={{ width: '100%', maxWidth: '900px', borderRadius: '10px', display: 'block' }}
            />
          </div>
        </div>
      </section>

      {/* Social Proof / Testimonials */}
      <section style={{ padding: '80px 20px', background: '#0f172a' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '10px' }}>Trusted by <span className="gradient-text">Local Businesses</span></h2>
          <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '50px' }}>Join hundreds of store owners growing their online reputation.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>

            {/* Testimonial 1 */}
            <div className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>RJ</div>
                <div>
                  <div style={{ fontWeight: 'bold' }}>Rajesh Jewelers</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Ahmedabad</div>
                </div>
              </div>
              <p style={{ color: '#e2e8f0', fontSize: '0.95rem', lineHeight: '1.5' }}>
                "Since using SmartReview, my Google reviews have doubled! Customers love the variety of options because it feels natural to them. Best tool for local shops."
              </p>
              <div style={{ color: '#facc15' }}>⭐⭐⭐⭐⭐</div>
            </div>

            {/* Testimonial 2 */}
            <div className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>SC</div>
                <div>
                  <div style={{ fontWeight: 'bold' }}>Style Cuts Salon</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Mumbai</div>
                </div>
              </div>
              <p style={{ color: '#e2e8f0', fontSize: '0.95rem', lineHeight: '1.5' }}>
                "The QR Code Studio is amazing. I printed a card for my reception, and clients just scan and post. No more awkward requests for reviews!"
              </p>
              <div style={{ color: '#facc15' }}>⭐⭐⭐⭐⭐</div>
            </div>

            {/* Testimonial 3 */}
            <div className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>TC</div>
                <div>
                  <div style={{ fontWeight: 'bold' }}>Taste of China</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Delhi</div>
                </div>
              </div>
              <p style={{ color: '#e2e8f0', fontSize: '0.95rem', lineHeight: '1.5' }}>
                "Finally a tool that understands Indian customers. The AI suggestions are spot on. My restaurant rating went from 4.2 to 4.7 in just 2 months."
              </p>
              <div style={{ color: '#facc15' }}>⭐⭐⭐⭐⭐</div>
            </div>

          </div>
        </div>
      </section>

      {/* Pricing Section (High Conversion) */}
      <section id="pricing" style={{ padding: '80px 20px', background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '3rem', marginBottom: '20px' }}>Choose Your Growth Plan 🚀</h2>
          <p style={{ color: '#94a3b8', marginBottom: '60px', fontSize: '1.2rem' }}>
            Whether you just want reviews or a full digital transformation.
          </p>

          <div className="pricing-grid">

            {/* PLAN 1: Review Tool */}
            <div className="glass-panel" style={{ padding: '40px 30px', border: '1px solid rgba(255,255,255,0.1)', position: 'relative', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '1.2rem', color: '#a78bfa', marginBottom: '10px' }}>Lifetime Review Tool</div>
              <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '20px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: '5px' }}>
                <span style={{ fontSize: '1rem', marginTop: '10px' }}>₹</span>99
                <span style={{ fontSize: '1.5rem', textDecoration: 'line-through', color: '#64748b', marginLeft: '10px' }}>599</span>
              </div>

              <ul style={{ textAlign: 'left', margin: '0 auto 40px', maxWidth: '250px', display: 'flex', flexDirection: 'column', gap: '15px', flex: 1, fontSize: '0.95rem' }}>
                <li>✅ Unlimited AI Reviews</li>
                <li>✅ QR Code Studio</li>
                <li>✅ Basic Analytics</li>
                <li>✅ Community Access</li>
                <li>✅ <b>Multiple Styles</b> & Regional Language Support</li>
              </ul>

              <RazorpaySubscriptionButton />
            </div>

            {/* PLAN 2: Grow Your Shop */}
            <div className="glass-panel" style={{ padding: '40px 30px', border: '2px solid #ec4899', boxShadow: '0 0 30px rgba(236, 72, 153, 0.2)', position: 'relative', transform: 'scale(1.05)', zIndex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, background: '#ec4899', color: 'white', padding: '5px 15px', borderRadius: '0 10px 0 10px', fontWeight: 'bold', fontSize: '0.8rem' }}>
                BEST VALUE
              </div>
              <div style={{ fontSize: '1.2rem', color: '#f472b6', marginBottom: '10px' }}>Grow Your Shop</div>
              <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '20px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: '5px' }}>
                <span style={{ fontSize: '1rem', marginTop: '10px' }}>₹</span>7,500
              </div>
              <div style={{ fontSize: '1rem', textDecoration: 'line-through', color: '#64748b', marginBottom: '20px' }}>
                was ₹10,000
              </div>

              <ul style={{ textAlign: 'left', margin: '0 auto 40px', maxWidth: '250px', display: 'flex', flexDirection: 'column', gap: '15px', flex: 1, fontSize: '0.95rem' }}>
                <li>✅ <b>Includes Review Tool</b></li>
                <li>✅ GMB Profile Optimization</li>
                <li>✅ 5-10 Keywords Ranking</li>
                <li>✅ Review Reply Management</li>
                <li>✅ 5 Custom Graphic Posts</li>
                <li>✅ 1 Month Support</li>
              </ul>

              <button
                onClick={() => handlePayment("750000", "Grow Your Shop Plan")}
                className="btn-primary"
                style={{ width: '100%', padding: '15px', fontSize: '1.1rem', fontWeight: 'bold', borderRadius: '12px', background: 'linear-gradient(90deg, #ec4899, #8b5cf6)' }}
              >
                Start Growing @ ₹7,500
              </button>
            </div>

            {/* PLAN 3: Business Website */}
            <div className="glass-panel" style={{ padding: '40px 30px', border: '1px solid rgba(255,255,255,0.1)', position: 'relative', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '1.2rem', color: '#4ade80', marginBottom: '10px' }}>Business Website</div>
              <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '20px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: '5px' }}>
                <span style={{ fontSize: '1rem', marginTop: '10px' }}>₹</span>9,999
              </div>
              <div style={{ fontSize: '1rem', color: '#64748b', marginBottom: '20px' }}>
                Professional Presence
              </div>

              <ul style={{ textAlign: 'left', margin: '0 auto 40px', maxWidth: '250px', display: 'flex', flexDirection: 'column', gap: '15px', flex: 1, fontSize: '0.95rem' }}>
                <li>✅ 5-Page Professional Website</li>
                <li>✅ Mobile Responsive Design</li>
                <li>✅ SEO Optimized Structure</li>
                <li>✅ Contact Form & Whatsapp</li>
                <li>✅ Free Domain for 1 Year</li>
              </ul>

              <button
                onClick={() => handlePayment("999900", "Business Website Plan")}
                className="btn-primary"
                style={{ width: '100%', padding: '15px', fontSize: '1.1rem', fontWeight: 'bold', borderRadius: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                Order Website
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" style={{ padding: '80px 20px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span style={{ color: '#ec4899', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Live Demo</span>
            <h2 style={{ fontSize: '2.5rem', marginTop: '10px' }}>See the Magic in Action</h2>
            <p style={{ color: '#94a3b8' }}>Fill out the form below to see how we generate personalized reviews for your business.</p>
          </div>

          <div style={{ background: 'rgba(30, 41, 59, 0.5)', borderRadius: '24px', padding: '40px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <ReviewForm onSubmit={handleGenerate} loading={loading} />

            {reviews && (
              <div style={{ marginTop: '40px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '40px' }}>
                <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#4ade80' }}>✨ Generated Suggestions</h3>
                <ReviewDisplay
                  reviews={reviews}
                  businessName="Local Business"
                  location={reviewContext.location}
                  businessId="demo"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '60px 20px', background: '#020617', borderTop: '1px solid rgba(255,255,255,0.1)', color: '#64748b' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '40px' }}>
          <div style={{ maxWidth: '300px' }}>
            <h3 style={{ color: 'white', marginBottom: '15px' }}>GMB SmartReview</h3>
            <p style={{ fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '20px' }}>Helping local businesses grow their online reputation with AI.</p>
            <div style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>
              <p style={{ marginBottom: '5px' }}>📧 <a href="mailto:kodemindstech@gmail.com" style={{ color: '#cbd5e1', textDecoration: 'none' }}>kodemindstech@gmail.com</a></p>
              <p>📞 <a href="tel:+918239061209" style={{ color: '#cbd5e1', textDecoration: 'none' }}>+91 8239061209</a></p>
            </div>
          </div>
          <div>
            <h4 style={{ color: 'white', marginBottom: '15px' }}>Legal</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
              <a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>Privacy Policy</a>
              <a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>Terms of Service</a>
              <a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>Refund Policy</a>
              <a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>Contact Us</a>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '60px', fontSize: '0.9rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
          &copy; {new Date().getFullYear()} Retner. All rights reserved.
        </div>
      </footer>

    </div >
  );
}
