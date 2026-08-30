'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FadeIn, ScaleIn, StaggerContainer, StaggerItem, HoverCard } from '@/components/motion/MotionWrapper';

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
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300/90 bg-white/90 px-8 py-4 text-base font-bold text-slate-800 shadow-sm backdrop-blur-md transition-all duration-200 hover:bg-slate-100 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  <span>Sign In</span>
                </Link>
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
            {/* Ambient Backlight Glow */}
            <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-emerald-500/20 via-teal-400/15 to-cyan-500/20 blur-2xl animate-soft-pulse" />

            {/* Main Image Showcase Card */}
            <div className="relative overflow-hidden rounded-[2.25rem] border border-slate-200/90 bg-white/80 p-4 sm:p-5 shadow-[0_25px_60px_-15px_rgba(16,185,129,0.2)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">

              {/* Image Container */}
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

                {/* Floating Top-Left Badge */}
                <div className="absolute left-4 top-4 flex items-center gap-2.5 rounded-full border border-white/20 bg-slate-950/70 px-4 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-md">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>AI Symptom Engine Active</span>
                </div>

                {/* Floating Bottom Overlay Card */}
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

              {/* Mini Stats Banner under Image */}
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
            <Link href="/register" className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400">Get Started</Link>
            <Link href="/login" className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400">Sign In</Link>
            <a href="#" className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400">Privacy Policy</a>
            <a href="#" className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400">Terms of Service</a>
          </nav>
        </div>

        <p className="mt-8 text-center sm:text-left text-xs font-medium text-slate-400 dark:text-slate-500">
          © {new Date().getFullYear()} MedAssist AI. All rights reserved. Built for intelligent healthcare decision support.
        </p>
      </footer>
    </div>
  );
}
