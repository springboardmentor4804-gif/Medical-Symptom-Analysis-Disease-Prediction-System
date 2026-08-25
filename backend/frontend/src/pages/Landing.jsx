import React, {useEffect} from 'react'
import { Link } from 'react-router-dom'

function Icon({name}){
  const icons = {
    analysis: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="9" stroke="#0b79ff" strokeWidth="1.5" fill="rgba(11,121,255,0.06)"/>
        <path d="M7 13h3v4H7v-4zM14 7h3v10h-3V7z" fill="#0b79ff"/>
      </svg>
    ),
    shield: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2l7 3v5c0 5-3.5 9.5-7 11-3.5-1.5-7-6-7-11V5l7-3z" fill="#06a77d"/>
      </svg>
    ),
    history: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 6v6l4 2" stroke="#ff7a59" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="12" r="9" stroke="#ff7a59" strokeWidth="1.5" fill="rgba(255,122,89,0.06)"/>
      </svg>
    ),
  }
  return icons[name] || null
}

export default function Landing(){
  useEffect(()=>{
    const el = document.querySelector('.hero-card')
    if(el) el.classList.add('entered')
  },[])

  return (
    <div className="landing-page">
      <section className="hero container">
        <div className="hero-copy">
          <span className="eyebrow">Trusted clinical AI for better care</span>
          <h1>AI-powered healthcare, personalized for every patient.</h1>
          <p className="lead">MedAssist AI supports patients and care teams with symptom analysis, disease prediction, risk scoring, health history tracking, and tailored recommendations.</p>
          <div className="hero-cta">
            <Link to="/register" className="btn primary">Get Started</Link>
            <Link to="/login" className="btn ghost">Sign In</Link>
          </div>
          <div className="trust">
            <div><strong>24/7</strong> AI-assisted insights</div>
            <div><strong>HIPAA</strong>-aware security</div>
            <div><strong>Real-time</strong> clinical guidance</div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-card">
            <svg className="hero-illustration" viewBox="0 0 480 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="heroTitle heroDesc">
              <title id="heroTitle">Healthcare dashboard illustration</title>
              <desc id="heroDesc">Stylized health analytics and patient support illustration.</desc>
              <defs>
                <linearGradient id="heroGrad" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="#0b79ff" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#06a77d" stopOpacity="0.7" />
                </linearGradient>
                <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="16" stdDeviation="24" floodColor="#0b79ff" floodOpacity="0.12" />
                </filter>
              </defs>
              <rect x="0" y="0" width="480" height="360" rx="32" fill="#eef5ff" />
              <rect x="32" y="32" width="416" height="296" rx="26" fill="#fff" filter="url(#softShadow)" />
              <rect x="56" y="64" width="340" height="28" rx="12" fill="#0b79ff" opacity="0.12" />
              <rect x="56" y="106" width="340" height="22" rx="10" fill="#0b79ff" opacity="0.08" />
              <rect x="56" y="142" width="212" height="18" rx="9" fill="#06a77d" opacity="0.18" />
              <rect x="56" y="176" width="172" height="14" rx="7" fill="#0b79ff" opacity="0.16" />
              <rect x="262" y="142" width="134" height="98" rx="18" fill="#eff8f5" />
              <circle cx="330" cy="214" r="36" fill="#0b79ff" opacity="0.14" />
              <circle cx="330" cy="214" r="24" fill="#0b79ff" />
              <rect x="56" y="214" width="220" height="86" rx="18" fill="#f8fbff" />
              <rect x="82" y="236" width="132" height="14" rx="7" fill="#0b79ff" opacity="0.2" />
              <rect x="82" y="260" width="94" height="12" rx="6" fill="#0b79ff" opacity="0.12" />
              <rect x="212" y="236" width="86" height="28" rx="14" fill="url(#heroGrad)" />
              <path d="M292 240 L340 240 Q354 240 354 254 L354 282 Q354 296 340 296 L292 296" fill="#0b79ff" opacity="0.08" />
              <path d="M292 256 L332 256" stroke="#0b79ff" strokeWidth="4" strokeLinecap="round" />
              <path d="M292 274 L332 274" stroke="#0b79ff" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
              <rect x="346" y="62" width="70" height="128" rx="18" fill="#eef5ff" />
              <rect x="362" y="82" width="38" height="38" rx="10" fill="#0b79ff" opacity="0.18" />
              <rect x="362" y="132" width="38" height="12" rx="6" fill="#0b79ff" opacity="0.14" />
              <circle cx="377" cy="232" r="50" fill="#06a77d" opacity="0.12" />
              <path d="M360 220 L377 250 L398 216" fill="none" stroke="#06a77d" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </section>

      <section id="features" className="features container">
        <h2>Key Capabilities</h2>
        <p className="muted">Comprehensive AI tools to support clinical workflows and empower patients.</p>
        <div className="feature-grid">
          <div className="feature-card"><Icon name="analysis"/><h4>Symptom Analysis</h4><p>Transform patient input into structured clinical insights that highlight critical concerns.</p></div>
          <div className="feature-card"><Icon name="analysis"/><h4>Disease Prediction</h4><p>AI models identify likely conditions and explain key signals.</p></div>
          <div className="feature-card"><Icon name="shield"/><h4>Risk Assessment</h4><p>Personalized risk scores help care teams act before conditions worsen.</p></div>
          <div className="feature-card"><Icon name="history"/><h4>Medical History</h4><p>Centralized history tracking keeps diagnoses, treatments, and encounters organized.</p></div>
          <div className="feature-card"><Icon name="analysis"/><h4>Health Analytics</h4><p>Track population trends and patient outcomes with clear visual reporting.</p></div>
          <div className="feature-card"><Icon name="analysis"/><h4>AI Recommendations</h4><p>Receive tailored next-step actions and educational guidance for every case.</p></div>
          <div className="feature-card"><Icon name="shield"/><h4>Secure Records</h4><p>Encrypted medical data with audit-ready access controls for providers and patients.</p></div>
        </div>
      </section>

      <section id="how-it-works" className="how container">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step"><strong>1.</strong> Create a patient or provider account to get started.</div>
          <div className="step"><strong>2.</strong> Record symptoms through guided intake or chat-style entry.</div>
          <div className="step"><strong>3.</strong> AI analyzes symptoms and patient context instantly.</div>
          <div className="step"><strong>4.</strong> Receive prioritized predictions, risk scores, and next steps.</div>
        </div>
      </section>

      <section className="stats container">
        <h2>Trusted by care teams and patients</h2>
        <div className="stat-grid">
          <div className="stat"><strong>98%</strong><span>Provider workflow satisfaction</span></div>
          <div className="stat"><strong>24/7</strong><span>AI-assisted clinical support</span></div>
          <div className="stat"><strong>3M+</strong><span>Symptom analyses processed</span></div>
        </div>
      </section>

      <section className="testimonials container">
        <h2>What users say</h2>
        <div className="test-grid">
          <div className="test-card">“MedAssist helped me capture my symptoms clearly and feel prepared for my appointment.” <em>— Patient</em></div>
          <div className="test-card">“The summaries make it easy to prioritize patients and coordinate care quickly.” <em>— Provider</em></div>
          <div className="test-card">“The secure records and AI insights boost confidence in every follow-up.” <em>— Care coordinator</em></div>
        </div>
      </section>

      <section className="roles container">
        <h2>For Patients & Providers</h2>
        <div className="role-grid">
          <div className="role-card">
            <h3>Patient</h3>
            <p>Record symptoms, monitor risk scores, and access personalized guidance for your care journey.</p>
            <Link to="/register" className="btn outline">Register</Link>
          </div>
          <div className="role-card">
            <h3>Healthcare Provider</h3>
            <p>Review patient summaries, trusted AI insights, and clinical recommendations in one place.</p>
            <Link to="/register" className="btn outline">Register</Link>
          </div>
        </div>
      </section>

      <section id="about" className="about container">
        <h2>About MedAssist AI</h2>
        <p>Our mission is to improve healthcare outcomes with trustworthy AI that augments clinical decision-making and empowers patients through timely, personalized insights.</p>
      </section>

      <section className="faq container">
        <h2>FAQ</h2>
        <details><summary>Is my data secure?</summary><p>Yes — data is encrypted both in transit and at rest, with role-based access to protect patients and providers.</p></details>
        <details><summary>Can I use this for clinical diagnosis?</summary><p>MedAssist AI is decision support software and should be used alongside professional clinical judgment.</p></details>
      </section>

      <footer id="contact" className="site-footer">
        <div className="container footer-inner">
          <div className="col">
            <strong>MedAssist AI</strong>
            <p>Trusted AI for better healthcare.</p>
          </div>
          <div className="col">
            <h4>Quick Links</h4>
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#about">About</a>
          </div>
          <div className="col">
            <h4>Contact</h4>
            <div>support@medassist.ai</div>
            <div>+1 (555) 123-4567</div>
          </div>
        </div>
        <div className="copyright">© {new Date().getFullYear()} MedAssist AI. All rights reserved.</div>
      </footer>
    </div>
  )
}
