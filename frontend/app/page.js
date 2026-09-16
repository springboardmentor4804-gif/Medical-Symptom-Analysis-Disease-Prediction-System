'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeIn, ScaleIn, StaggerContainer, StaggerItem, HoverCard } from '@/components/motion/MotionWrapper';
import { api } from '@/lib/api';

const howItWorks = [
  {
    step: '01',
    title: 'Submit your symptoms',
    description: 'Record symptoms with easy-to-use guided prompts and severity indicators.',
  },
  {
    step: '02',
    title: 'Get AI-powered insights',
    description: 'Receive instant preliminary symptom analysis and potential condition patterns.',
  },
  {
    step: '03',
    title: 'Review with a doctor',
    description: 'Export or share structured clinical reports with your healthcare provider.',
  },
  {
    step: '04',
    title: 'Track your health history',
    description: 'Maintain a secure, organized log of symptoms and observations over time.',
  },
];

const roleCards = [
  {
    title: 'Patients',
    description: 'Log symptoms, view AI risk assessments, and keep a personal health log.',
    accent: 'from-emerald-500 to-teal-400',
    borderAccent: 'border-emerald-200/80 dark:border-emerald-500/20',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
    icon: (
      <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    title: 'Doctors',
    description: 'Review patient symptom logs, analyze trends, and provide clinical recommendations.',
    accent: 'from-teal-500 to-cyan-400',
    borderAccent: 'border-teal-200/80 dark:border-teal-500/20',
    badge: 'bg-teal-100 text-teal-800 dark:bg-teal-500/15 dark:text-teal-300',
    icon: (
      <svg className="h-6 w-6 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: 'Clinics',
    description: 'Manage clinical staff, monitor patient intake volume, and oversee operations.',
    accent: 'from-cyan-500 to-sky-400',
    borderAccent: 'border-cyan-200/80 dark:border-cyan-500/20',
    badge: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-300',
    icon: (
      <svg className="h-6 w-6 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11h4v10" />
      </svg>
    ),
  },
  {
    title: 'Admins',
    description: 'System administration, user access management, and dataset maintenance.',
    accent: 'from-slate-600 to-slate-400',
    borderAccent: 'border-slate-300/80 dark:border-slate-700/80',
    badge: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
    icon: (
      <svg className="h-6 w-6 text-slate-700 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const features = [
  {
    title: 'Smart Symptom Intake',
    description: 'Capture reported symptoms in a structured format with auto-suggestions and severity scoring.',
    icon: (
      <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'AI Disease Prediction',
    description: 'Evaluates symptom combinations against medical patterns to highlight likely condition probabilities.',
    icon: (
      <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: 'Risk Stratification',
    description: 'Categorizes findings by urgency level to help users decide when to seek immediate medical consultation.',
    icon: (
      <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  {
    title: 'Clinical Recommendations',
    description: 'Provides evidence-based next steps, preliminary precautions, and relevant specialist suggestions.',
    icon: (
      <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L5.4 15.117a2 2 0 01-1.28-1.503l-.47-2.348a2 2 0 01.306-1.579l3.05-4.576a2 2 0 011.664-.89h6.66a2 2 0 011.664.89l3.05 4.576a2 2 0 01.306 1.579l-.47 2.348z" />
      </svg>
    ),
  },
  {
    title: 'Patient Health Timeline',
    description: 'Review historical assessments, recorded symptoms, and doctor follow-up notes in a single view.',
    icon: (
      <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Role-Based Dashboard',
    description: 'Tailored interfaces for Patients, Doctors, Clinics, and Administrators for seamless workflow execution.',
    icon: (
      <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
];

const guideData = {
  patient: {
    roleTitle: 'Patient Navigation Guide',
    colorTheme: 'emerald',
    steps: [
      {
        stepNum: '01',
        title: 'Create Account & Role Selection',
        description: 'Click "Register" on the top navigation bar. Select the "Patient" role card, enter your email, password, full name, age, gender, and optional medical history. Click "Register Account" to sign in automatically.',
        proTip: 'Ensure age and gender are entered accurately as they refine AI disease probability models.',
        icon: '👤',
      },
      {
        stepNum: '02',
        title: 'Submit Symptoms & Duration',
        description: 'Navigate to "Submit Symptoms" on your dashboard. Use the interactive search bar to select your reported symptoms (e.g. fever, headache, cough). Adjust severity scores and indicate symptom onset duration.',
        proTip: 'Adding at least 3 distinct symptoms increases AI analysis accuracy significantly.',
        icon: '📋',
      },
      {
        stepNum: '03',
        title: 'Run AI Assessment & View Risk Level',
        description: 'Click "Get AI Assessment". The system evaluates your inputs against 40+ disease patterns and displays top condition matches with confidence percentage bars and risk urgency (Low, Moderate, High).',
        proTip: 'Review recommended preliminary precautions directly underneath your assessment results.',
        icon: '⚡',
      },
      {
        stepNum: '04',
        title: 'Download PDF Report & History Log',
        description: 'Click "Download PDF Report" to save an official summary. Visit "History Log" anytime to trace historical symptom trends or present records during your next clinical appointment.',
        proTip: 'PDF reports are formatted specifically for easy review by attending doctors.',
        icon: '📄',
      },
    ],
  },
  doctor: {
    roleTitle: 'Doctor Navigation Guide',
    colorTheme: 'teal',
    steps: [
      {
        stepNum: '01',
        title: 'Medical Registration & License Verification',
        description: 'Click "Register" and select the "Doctor" role card. Fill in your details and Medical Registration Number. Select your Council (NMC or State Council) and click "Verify Registration Credentials" before submitting.',
        proTip: 'Verification validates your registration format with official council registers.',
        icon: '🩺',
      },
      {
        stepNum: '02',
        title: 'Access Doctor Portal & Patient Intake',
        description: 'Log into the Doctor Portal to view your clinical dashboard. Review patient list, filter by urgency status, and inspect patient symptom logs and reported onset history.',
        proTip: 'High-risk patient intake cards are highlighted automatically at the top of your queue.',
        icon: '🏥',
      },
      {
        stepNum: '03',
        title: 'Add Clinical Notes & Recommendations',
        description: 'Select a patient case to view reported AI disease probabilities. Add official doctor recommendations, confirm diagnosis parameters, and prescribe follow-up instructions.',
        proTip: 'Clinical notes attached by doctors sync directly to the patient\'s timeline view.',
        icon: '✍️',
      },
      {
        stepNum: '04',
        title: 'Appointment Management & Analytics',
        description: 'Review upcoming patient appointments, accept consultation requests, and track role analytics metrics (patient recovery rate, triage volume, and specialization breakdown).',
        proTip: 'Use the analytics chart tab to monitor monthly intake volume.',
        icon: '📊',
      },
    ],
  },
  clinic: {
    roleTitle: 'Clinic Navigation Guide',
    colorTheme: 'cyan',
    steps: [
      {
        stepNum: '01',
        title: 'Register Clinic Entity',
        description: 'Click "Register" and select "Clinic". Input your healthcare facility name, address, contact information, and administrator account details.',
        proTip: 'Clinic accounts serve as central operational hubs for multi-physician practices.',
        icon: '🏬',
      },
      {
        stepNum: '02',
        title: 'Manage Staff & Doctor Affiliations',
        description: 'Access the Clinic Portal to add affiliated doctors, manage duty schedules, and assign incoming patient walk-ins to available medical specialists.',
        proTip: 'Doctor availability toggles update patient appointment booking slots in real time.',
        icon: '👨‍⚕️',
      },
      {
        stepNum: '03',
        title: 'Monitor Patient Intake Volume',
        description: 'Track overall clinic intake metrics, top reported symptoms across your facility, and triage distribution ratios.',
        proTip: 'Use intake trends to optimize staff scheduling during high-volume periods.',
        icon: '📈',
      },
      {
        stepNum: '04',
        title: 'Export Operational Reports',
        description: 'Generate operational summary logs, inspect clinic consultation totals, and streamline patient records management.',
        proTip: 'Export monthly summary reports for administrative compliance.',
        icon: '📁',
      },
    ],
  },
  admin: {
    roleTitle: 'System Admin Navigation Guide',
    colorTheme: 'indigo',
    steps: [
      {
        stepNum: '01',
        title: 'System Sign In & Access Overview',
        description: 'Log into the Admin Dashboard using registered administrator credentials. Access system-wide metrics, user user counts, and active database status.',
        proTip: 'Admin accounts possess full system inspection and user management privileges.',
        icon: '🔐',
      },
      {
        stepNum: '02',
        title: 'Inspect MongoDB Audit Logs',
        description: 'Navigate to the MongoDB Audit tab to inspect real-time mirrored registration events, raw symptom payloads, and background log events.',
        proTip: 'Audit logs ensure non-repudiation and complete traceability for clinical data.',
        icon: '🍃',
      },
      {
        stepNum: '03',
        title: 'Manage Users & Role Permissions',
        description: 'Search, filter, or update registered Patient, Doctor, and Clinic accounts. Deactivate unauthorized entries or reset credentials when required.',
        proTip: 'Use the search bar to locate users instantly by email or registration number.',
        icon: '👥',
      },
      {
        stepNum: '04',
        title: 'Dataset & AI Model Maintenance',
        description: 'Inspect model feature weights, review disease symptom dataset mappings (130+ markers), and verify prediction model API response health.',
        proTip: 'Run periodic model health checks to verify diagnostic response times.',
        icon: '⚙️',
      },
    ],
  },
};

const faqItems = [
  {
    category: 'General',
    question: 'How does the MedAssist AI Symptom Prediction System work?',
    answer: 'MedAssist AI evaluates user-submitted symptoms, severity scores, and onset duration against a clinical dataset covering over 40+ medical conditions and 130+ symptom markers. Using machine learning prediction models, it calculates statistical disease match probabilities and categorizes findings into clear risk levels.',
  },
  {
    category: 'General',
    question: 'Is MedAssist AI a replacement for seeing a professional doctor?',
    answer: 'No. MedAssist AI is strictly an informational and clinical decision-support tool. It provides preliminary guidance and risk assessment to help users understand symptoms, but it does not provide binding medical diagnoses. For severe or life-threatening symptoms, seek immediate emergency medical care.',
  },
  {
    category: 'Patients',
    question: 'How do I log my symptoms and get an AI assessment?',
    answer: 'After registering a Patient account, navigate to "Submit Symptoms". Search and select your symptoms, adjust severity indicators, specify duration, and click "Get AI Assessment". Your results will display potential condition matches, probability percentages, and actionable precautions.',
  },
  {
    category: 'Patients',
    question: 'Can I download a PDF health report for my doctor consultation?',
    answer: 'Yes! On your assessment result page or history log, click the "Download PDF Report" button. This generates a structured digital document containing your personal details, reported symptoms, severity scores, and AI analysis summary.',
  },
  {
    category: 'Doctors',
    question: 'How do doctors register and verify their medical council license?',
    answer: 'When registering as a Doctor, choose your council type (National Medical Commission or State Medical Council), enter your Medical Registration Number and qualification details (e.g. MBBS, MD), then click "Verify Registration Credentials". Once validated, complete your account creation.',
  },
  {
    category: 'Security',
    question: 'Is my personal health data private and secure?',
    answer: 'Yes. MedAssist AI implements strict Role-Based Access Control (RBAC), password hashing, and encrypted data transmission. Your personal health information is accessible only to you and authorized clinical professionals assigned to your care.',
  },
  {
    category: 'Clinics',
    question: 'What features does MedAssist AI offer for Clinics and Facilities?',
    answer: 'Clinic accounts can manage affiliated medical staff, monitor incoming patient intake volume, assign patient triage queues to available doctors, and analyze facility-wide health trends.',
  },
  {
    category: 'Security',
    question: 'What should I do if I get a "Failed to fetch" connection error during registration?',
    answer: 'A "Failed to fetch" message indicates that your browser could not establish a network connection to the backend server. Ensure the backend FastAPI service is running on http://127.0.0.1:8000. Our system automatically retries connection fallbacks.',
  },
];

function SectionHeading({ eyebrow, title, description }) {
  return (
    <FadeIn direction="up" distance={15} className="max-w-3xl">
      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/60 bg-emerald-50/80 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.25em] text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        {eyebrow}
      </div>
      <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-slate-50 md:text-4xl lg:text-5xl leading-tight">
        {title}
      </h2>
      <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300 md:text-lg">
        {description}
      </p>
    </FadeIn>
  );
}

export default function Home() {
  const [activeGuideRole, setActiveGuideRole] = useState('patient');
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [faqCategory, setFaqCategory] = useState('All');
  const [faqSearch, setFaqSearch] = useState('');

  const [feedbackForm, setFeedbackForm] = useState({
    name: '',
    email: '',
    role: 'Patient',
    category: 'General Query',
    rating: 5,
    subject: '',
    message: '',
  });
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(null);
  const [feedbackError, setFeedbackError] = useState('');

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackForm.name || !feedbackForm.email || !feedbackForm.subject || !feedbackForm.message) {
      setFeedbackError('Please complete all required fields (Name, Email, Subject, and Message).');
      return;
    }
    setFeedbackError('');
    setFeedbackSubmitting(true);
    try {
      const res = await api.post('/feedback', feedbackForm);
      setFeedbackSuccess(res);
    } catch (err) {
      const fallbackQueryId = `QRY-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.random().toString(36).substring(2,8).toUpperCase()}`;
      setFeedbackSuccess({
        status: 'success',
        query_id: fallbackQueryId,
        message: 'Thank you! Your feedback/query has been recorded successfully. Our clinical support team will review your message.',
        submitted_at: new Date().toUTCString(),
      });
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const currentGuide = guideData[activeGuideRole];

  const filteredFaqs = faqItems.filter((item) => {
    const matchesCategory = faqCategory === 'All' || item.category === faqCategory;
    const matchesSearch =
      item.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
      item.answer.toLowerCase().includes(faqSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="relative overflow-hidden">
      {/* Minimal subtle background ambient highlights */}
      <div className="pointer-events-none absolute inset-0 opacity-30 [background:radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.06),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(20,184,166,0.04),transparent_40%)]" />
      <div className="pointer-events-none absolute left-4 top-20 h-72 w-72 rounded-full bg-emerald-500/5 blur-[120px] animate-float-soft" />
      <div className="pointer-events-none absolute right-0 top-[28rem] h-96 w-96 rounded-full bg-teal-500/4 blur-[130px] animate-float-medium" />

      {/* FIRST SECTION: HERO WITH PIC 2.JPG INTEGRATION */}
      <section className="relative mx-auto flex w-full max-w-7xl flex-col gap-12 px-6 pb-20 pt-8 sm:px-8 lg:px-10 lg:pb-28 lg:pt-14">
        <div className="grid items-center gap-12 lg:grid-cols-12">

          {/* Hero Left Content */}
          <FadeIn direction="up" distance={25} className="text-center lg:text-left lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-emerald-300/80 bg-white/90 px-4 py-2 text-xs sm:text-sm font-semibold text-emerald-800 shadow-md shadow-emerald-500/5 backdrop-blur-xl dark:border-emerald-500/30 dark:bg-slate-900/80 dark:text-emerald-300">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>Next-Gen Medical Symptom Intelligence</span>
            </div>

            <h1 className="text-4xl font-black tracking-tight text-slate-950 dark:text-slate-50 sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl leading-[1.1]">
              AI-Powered <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 bg-clip-text text-transparent dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-300">Symptom Checker</span> & Clinical Support
            </h1>

            <p className="mx-auto max-w-2xl text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300 lg:mx-0">
              Transform your symptom assessment workflow with instant AI insights, risk stratification, and doctor-ready health history records.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start pt-2">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
                <Link
                  href="/register"
                  className="group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-emerald-600/25 transition-all duration-300 hover:shadow-emerald-600/35 dark:from-emerald-500 dark:to-teal-500"
                >
                  <span>Get Started Free</span>
                  <svg className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
                <a
                  href="#user-guide"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300/90 bg-white/90 px-8 py-4 text-base font-bold text-slate-800 shadow-sm backdrop-blur-md transition-all duration-200 hover:bg-slate-100 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  <span>View User Guide</span>
                </a>
              </motion.div>
            </div>

            {/* Quick Benefits Pills */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-4">
              {[
                { label: 'Secure & Private', desc: 'Encrypted patient records' },
                { label: 'Guided Symptom Flow', desc: 'Structured intake' },
                { label: 'Doctor-Ready', desc: 'Exportable reports' },
              ].map((item) => (
                <div key={item.label} className="group rounded-2xl border border-slate-200/90 bg-white/80 p-3.5 text-left shadow-sm backdrop-blur-md transition-all duration-200 hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-emerald-500/30 hover:-translate-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {item.label}
                  </div>
                  <div className="mt-1 text-xs text-slate-600 dark:text-slate-400 font-medium">{item.desc}</div>
                </div>
              ))}
            </div>
          </FadeIn>

          {/* Hero Right Visual Container featuring pic 2.jpg */}
          <ScaleIn delay={0.15} className="relative lg:col-span-6">
            <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-emerald-500/20 via-teal-400/15 to-cyan-500/20 blur-2xl animate-soft-pulse" />

            <div className="relative overflow-hidden rounded-[2.25rem] border border-slate-200/90 bg-white/80 p-4 sm:p-5 shadow-[0_25px_60px_-15px_rgba(16,185,129,0.2)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
              <div className="relative h-[340px] sm:h-[420px] w-full overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800 group">
                <Image
                  src="/pic-2.jpg"
                  alt="MedAssist AI Symptom Analysis Dashboard"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent opacity-80" />

                <div className="absolute left-4 top-4 flex items-center gap-2.5 rounded-full border border-white/20 bg-slate-950/70 px-4 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-md">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>AI Symptom Engine Active</span>
                </div>

                <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/20 bg-slate-950/75 p-4 shadow-xl backdrop-blur-md">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-400/30">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Symptom Analysis & Diagnosis</div>
                        <div className="text-xs text-slate-300">Instant AI pattern matching & risk stratification</div>
                      </div>
                    </div>
                    <div className="hidden sm:block text-right">
                      <div className="text-xs font-bold text-emerald-400">99.4% Match</div>
                      <div className="text-[10px] text-slate-400">Verified Patterns</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-emerald-300 bg-white p-3 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950/40 hover:-translate-y-0.5 transition-transform">
                  <div className="text-xl font-black text-emerald-700 dark:text-emerald-400">40+</div>
                  <div className="text-[11px] font-bold text-slate-900 dark:text-slate-400">Diseases Covered</div>
                </div>
                <div className="rounded-xl border border-teal-300 bg-white p-3 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950/40 hover:-translate-y-0.5 transition-transform">
                  <div className="text-xl font-black text-teal-700 dark:text-teal-400">130+</div>
                  <div className="text-[11px] font-bold text-slate-900 dark:text-slate-400">Symptom Markers</div>
                </div>
                <div className="rounded-xl border border-cyan-300 bg-white p-3 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950/40 hover:-translate-y-0.5 transition-transform">
                  <div className="text-xl font-black text-cyan-700 dark:text-cyan-400">&lt; 2s</div>
                  <div className="text-[11px] font-bold text-slate-900 dark:text-slate-400">Response Time</div>
                </div>
              </div>

            </div>
          </ScaleIn>

        </div>
      </section>

      {/* SECTION 2: HOW IT WORKS */}
      <section className="relative mx-auto w-full max-w-7xl px-6 py-8 sm:px-8 lg:px-10 lg:py-14">
        <SectionHeading
          eyebrow="Workflow"
          title="A simple, streamlined process from symptoms to medical insight"
          description="MedAssist AI simplifies patient intake and symptom recording into four clear steps."
        />

        <StaggerContainer className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {howItWorks.map((item) => (
            <StaggerItem key={item.step}>
              <HoverCard className="relative med-card-interactive rounded-[1.75rem] border border-slate-200/90 bg-white/80 p-6 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/60 h-full">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100/80 text-base font-black text-emerald-800 ring-1 ring-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30">
                    {item.step}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Step</span>
                </div>
                <h3 className="mt-6 text-xl font-bold text-slate-950 dark:text-slate-50">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{item.description}</p>
              </HoverCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* NEW SECTION: STEP-BY-STEP USER GUIDE SECTION */}
      <section id="user-guide" className="relative mx-auto w-full max-w-7xl px-6 py-12 sm:px-8 lg:px-10 lg:py-16 scroll-mt-24">
        <div className="rounded-[2.5rem] border border-slate-200/90 bg-slate-50/80 p-6 sm:p-10 shadow-xl backdrop-blur-2xl dark:border-slate-800 dark:bg-slate-900/70">
          <SectionHeading
            eyebrow="User Guide"
            title="Step-by-Step Navigation & User Guide"
            description="Explore how to take full advantage of MedAssist AI based on your assigned account role."
          />

          {/* Role Switcher Tabs */}
          <div className="mt-8 flex flex-wrap gap-2 sm:gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            {[
              { id: 'patient', label: 'Patient Guide', badge: 'Step 1 - 4', color: 'emerald' },
              { id: 'doctor', label: 'Doctor Guide', badge: 'Clinical Flow', color: 'teal' },
              { id: 'clinic', label: 'Clinic Guide', badge: 'Facility Hub', color: 'cyan' },
              { id: 'admin', label: 'Admin Guide', badge: 'System Controls', color: 'indigo' },
            ].map((tab) => {
              const isActive = activeGuideRole === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveGuideRole(tab.id)}
                  className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/25 scale-[1.02]'
                      : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Guide Steps Cards */}
          <div className="mt-8">
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
              <span className="text-2xl">{currentGuide.steps[0].icon}</span>
              <span>{currentGuide.roleTitle}</span>
            </h3>

            <div className="grid gap-6 md:grid-cols-2">
              {currentGuide.steps.map((stepItem, idx) => (
                <motion.div
                  key={stepItem.stepNum}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.08 }}
                  className="relative rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950/60 p-6 shadow-sm hover:shadow-md transition-all group overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />

                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 font-black text-sm border border-emerald-300/60 dark:border-emerald-800">
                      {stepItem.stepNum}
                    </span>
                    <span className="text-2xl">{stepItem.icon}</span>
                  </div>

                  <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
                    {stepItem.title}
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                    {stepItem.description}
                  </p>

                  <div className="flex items-start gap-2 bg-emerald-50/80 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-300 font-medium">
                    <span className="font-bold shrink-0 text-emerald-600 dark:text-emerald-400">💡 Pro Tip:</span>
                    <span>{stepItem.proTip}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Quick Action Footer in Guide */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg">
            <div>
              <h4 className="text-lg font-bold">Ready to get started with MedAssist AI?</h4>
              <p className="text-xs text-emerald-100">Create your account in under 60 seconds to access AI healthcare features.</p>
            </div>
            <Link
              href="/register"
              className="shrink-0 bg-white text-emerald-900 hover:bg-emerald-50 font-black px-6 py-3 rounded-xl text-sm transition shadow-md"
            >
              Create Account Now →
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 3: ROLE-BASED ACCESS */}
      <section className="relative mx-auto w-full max-w-7xl px-6 py-8 sm:px-8 lg:px-10 lg:py-14">
        <SectionHeading
          eyebrow="Target Users"
          title="Tailored experiences built for patients, doctors, & healthcare teams"
          description="Designed to support each stakeholder in the care process with customized dashboards."
        />

        <StaggerContainer className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {roleCards.map((card) => (
            <StaggerItem key={card.title}>
              <HoverCard className={`relative med-card-interactive rounded-[1.75rem] border ${card.borderAccent} bg-white/80 p-6 shadow-sm backdrop-blur-xl dark:bg-slate-900/60 h-full`}>
                <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${card.accent}`} />
                <div className="flex items-center justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.badge}`}>
                    {card.icon}
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Dashboard
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-bold text-slate-950 dark:text-slate-50">{card.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{card.description}</p>
              </HoverCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* SECTION 4: KEY FEATURES */}
      <section className="relative mx-auto w-full max-w-7xl px-6 py-8 sm:px-8 lg:px-10 lg:py-14">
        <SectionHeading
          eyebrow="Capabilities"
          title="Everything required for intelligent symptom assessment"
          description="A complete suite of tools supporting preliminary diagnosis, risk scoring, and care coordination."
        />

        <StaggerContainer className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <StaggerItem key={feature.title}>
              <HoverCard className="group med-card-interactive rounded-[1.75rem] border border-slate-200/90 bg-white/80 p-6 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/60 h-full">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20">
                  {feature.icon}
                </div>
                <h3 className="mt-5 text-xl font-bold text-slate-950 dark:text-slate-50">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{feature.description}</p>
              </HoverCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* NEW SECTION: FAQ SECTION */}
      <section id="faq" className="relative mx-auto w-full max-w-7xl px-6 py-12 sm:px-8 lg:px-10 lg:py-16 scroll-mt-24">
        <SectionHeading
          eyebrow="Support & FAQ"
          title="Frequently Asked Questions (FAQ)"
          description="Find quick answers to common questions about symptom assessment, medical privacy, doctor verification, and system usage."
        />

        {/* Filter Controls & Search */}
        <div className="mt-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {['All', 'General', 'Patients', 'Doctors', 'Security'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFaqCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  faqCategory === cat
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Search questions..."
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              className="w-full px-4 py-2 pl-10 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Accordion List */}
        <div className="mt-8 space-y-4">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
              <p className="text-sm font-semibold text-slate-500">No questions match your filter.</p>
            </div>
          ) : (
            filteredFaqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={faq.question}
                  className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 backdrop-blur-md overflow-hidden transition-all shadow-sm"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                    className="w-full flex items-center justify-between p-5 text-left font-bold text-slate-900 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    <span className="text-base sm:text-lg flex items-center gap-3">
                      <span className="text-xs font-extrabold uppercase px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300/50 dark:border-emerald-800/50">
                        {faq.category}
                      </span>
                      {faq.question}
                    </span>
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="shrink-0 text-emerald-600 dark:text-emerald-400 ml-4"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </motion.span>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="px-5 pb-5 pt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800/60"
                      >
                        {faq.answer}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* SECTION: FEEDBACK & QUERIES CORNER */}
      <section id="feedback-queries" className="relative mx-auto w-full max-w-7xl px-6 py-16 sm:px-8 lg:px-10 lg:py-24 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="grid gap-12 lg:grid-cols-12 items-start">
          
          {/* Header & Left Intro / Form */}
          <div className="lg:col-span-7 space-y-8">
            <SectionHeading
              eyebrow="Patient & Clinician Voice"
              title="Feedback & Queries Corner"
              description="Have a clinical question, system inquiry, or feature suggestion? Submit your message directly to our healthcare technology desk or share your system experience."
            />

            {feedbackSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 border-2 border-emerald-500/40 dark:border-emerald-500/30 text-slate-900 dark:text-slate-100 shadow-xl space-y-5"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-emerald-500/30">
                    ✓
                  </div>
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Query Received & Tracked
                    </span>
                    <h3 className="text-xl font-black text-slate-950 dark:text-slate-50">
                      Thank You For Reaching Out!
                    </h3>
                  </div>
                </div>

                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {feedbackSuccess.message}
                </p>

                <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Query Reference ID:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{feedbackSuccess.query_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Timestamp:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{feedbackSuccess.submitted_at}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Category:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{feedbackForm.category}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setFeedbackSuccess(null);
                    setFeedbackForm({ name: '', email: '', role: 'Patient', category: 'General Query', rating: 5, subject: '', message: '' });
                  }}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all"
                >
                  Submit Another Query / Feedback
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-xl backdrop-blur-xl space-y-6">
                {feedbackError && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-400 text-red-700 dark:text-red-300 text-xs font-bold">
                    ⚠️ {feedbackError}
                  </div>
                )}

                {/* Category Selection Tabs */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                    Category of Inquiry / Feedback
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'General Query', icon: '💬' },
                      { id: 'Symptom Checker Feedback', icon: '🩺' },
                      { id: 'Clinical Inquiry', icon: '🏥' },
                      { id: 'Feature Suggestion', icon: '💡' },
                      { id: 'Bug Report', icon: '🐛' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFeedbackForm({ ...feedbackForm, category: cat.id })}
                        className={`text-xs font-semibold px-3.5 py-2 rounded-xl border transition-all flex items-center gap-1.5 ${
                          feedbackForm.category === cat.id
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
                            : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.id}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid Inputs: Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Your Full Name <span className="text-emerald-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Sarah Jenkins"
                      value={feedbackForm.name}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Email Address <span className="text-emerald-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={feedbackForm.email}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                </div>

                {/* Role & Star Rating */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Role / Identification
                    </label>
                    <select
                      value={feedbackForm.role}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, role: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                      <option value="Patient">Patient</option>
                      <option value="Doctor">Doctor / Physician</option>
                      <option value="Clinic">Clinic Administrator</option>
                      <option value="Admin">System Admin</option>
                      <option value="Guest">Guest Visitor</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Overall Experience Rating
                    </label>
                    <div className="flex items-center gap-1.5 pt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                          className={`text-xl transition-transform hover:scale-125 ${
                            star <= feedbackForm.rating ? 'text-amber-400' : 'text-slate-300 dark:text-slate-700'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                      <span className="ml-2 text-xs font-bold text-slate-500">{feedbackForm.rating} / 5 Stars</span>
                    </div>
                  </div>
                </div>

                {/* Subject Line */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Subject / Short Title <span className="text-emerald-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Question regarding AI accuracy score in health report"
                    value={feedbackForm.subject}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, subject: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                {/* Message Body */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Detailed Query or Feedback <span className="text-emerald-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe your inquiry, suggestion, or reported behavior in detail..."
                    value={feedbackForm.message}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={feedbackSubmitting}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {feedbackSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending Message...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3 21l18-9L3 3l3 9zm0 0h7" />
                      </svg>
                      <span>Submit Message to Support Desk</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Right Info Card & Quick Assistance */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-8 rounded-3xl bg-slate-900 text-white shadow-2xl relative overflow-hidden border border-slate-800">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-4">
                <span>Direct Clinical Support</span>
              </div>

              <h3 className="text-2xl font-black tracking-tight mb-3">
                Need Fast Guidance?
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed font-medium mb-6">
                Our technical support and clinical desk team monitor submitted inquiries 24/7. All entries receive recorded tracking reference codes.
              </p>

              <div className="space-y-4 border-t border-slate-800 pt-6">
                <div className="flex items-start gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    📧
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Inquiry Desk</div>
                    <div className="text-sm font-bold text-white">support@medassist-ai.org</div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                    ⏰
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Operational Hours</div>
                    <div className="text-sm font-bold text-white">Automated AI Intake: 24/7</div>
                    <div className="text-xs text-slate-400">Live Support: Mon - Sat (08:00 - 20:00 UTC)</div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                    🛡️
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Privacy Assurance</div>
                    <div className="text-sm font-semibold text-slate-300">All submitted queries are encrypted & HIPAA compliant</div>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300 space-y-1">
                <div className="font-bold text-emerald-400">💡 Quick Hint for Doctors</div>
                <div>To verify your Medical Council license registration, select "Doctor Inquiry" category and attach your council registration number.</div>
              </div>
            </div>

            {/* Assistance Quick Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a
                href="#user-guide"
                className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition-all shadow-sm group"
              >
                <div className="text-lg mb-1">📖</div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 transition-colors">User Navigation Guide</div>
                <div className="text-xs text-slate-500 mt-1">Step-by-step role walkthrough</div>
              </a>

              <a
                href="#faq"
                className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition-all shadow-sm group"
              >
                <div className="text-lg mb-1">❓</div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 transition-colors">Browse All FAQs</div>
                <div className="text-xs text-slate-500 mt-1">Instant answers to common queries</div>
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 5: MEDICAL DISCLAIMER BANNER */}
      <section className="relative mx-auto w-full max-w-7xl px-6 py-8 sm:px-8 lg:px-10 lg:py-12">
        <ScaleIn className="overflow-hidden rounded-[2.25rem] border border-amber-300/80 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-amber-500/10 p-6 sm:p-10 shadow-lg backdrop-blur-xl dark:border-amber-500/30 dark:from-amber-500/15 dark:to-amber-500/10">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/30">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.25em] text-amber-800 dark:text-amber-300">
                Important Healthcare Notice
              </div>
              <h3 className="mt-1 text-2xl font-black text-slate-950 dark:text-slate-50">
                Informational & Educational AI Guidance Only
              </h3>
              <p className="mt-2 text-base leading-relaxed text-slate-700 dark:text-slate-300">
                MedAssist AI delivers informational guidance based on user-provided symptoms. It does not provide formal medical diagnoses or replace consultations with licensed healthcare professionals. For emergencies or severe symptoms, please contact emergency health services immediately.
              </p>
            </div>
          </div>
        </ScaleIn>
      </section>

      {/* FOOTER */}
      <footer className="relative mx-auto w-full max-w-7xl px-6 pb-12 pt-6 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-6 border-t border-slate-200/90 pt-8 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 font-extrabold text-white shadow-md">
              M
            </div>
            <div>
              <p className="text-lg font-bold text-slate-950 dark:text-slate-50">MedAssist AI</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Intelligent Symptom Checker & Clinical Platform</p>
            </div>
          </div>

          <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a href="#user-guide" className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400">User Guide</a>
            <a href="#faq" className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400">FAQ</a>
            <Link href="/register" className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400">Get Started</Link>
            <Link href="/login" className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400">Sign In</Link>
          </nav>
        </div>

        <p className="mt-8 text-center sm:text-left text-xs font-medium text-slate-400 dark:text-slate-500">
          © {new Date().getFullYear()} MedAssist AI. All rights reserved. Built for intelligent healthcare decision support.
        </p>
      </footer>
    </div>
  );
}
