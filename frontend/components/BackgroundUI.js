'use client';

export default function BackgroundUI() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden select-none">
      {/* LIGHT THEME BACKGROUND ENGINE */}
      <div className="dark:hidden absolute inset-0 bg-[#f4f7fb]">
        {/* Subtle Light Mesh Ambient Radial Glows */}
        <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_15%_15%,rgba(16,185,129,0.05),transparent_40%),radial-gradient(circle_at_85%_25%,rgba(14,165,233,0.04),transparent_35%),radial-gradient(circle_at_50%_75%,rgba(20,184,166,0.03),transparent_45%)]" />

        {/* Light Mode Technical Slate Dot Matrix */}
        <div
          className="absolute inset-0 opacity-[0.4] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_25%,#000_50%,transparent_100%)]"
          style={{
            backgroundImage: `radial-gradient(rgba(148, 163, 184, 0.35) 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Light Mode Engineering Grid Lines */}
        <div
          className="absolute inset-0 opacity-[0.15] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_35%,#000_40%,transparent_100%)]"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(203, 213, 225, 0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(203, 213, 225, 0.4) 1px, transparent 1px)`,
            backgroundSize: '96px 96px',
          }}
        />

        {/* Light Mode Ambient Floating Soft Orbs */}
        <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-emerald-500/6 blur-[140px] animate-float-soft" />
        <div className="absolute top-[35%] -right-32 h-[30rem] w-[30rem] rounded-full bg-sky-500/5 blur-[150px] animate-float-medium" />
        <div className="absolute bottom-10 left-[20%] h-[26rem] w-[26rem] rounded-full bg-teal-500/4 blur-[140px] animate-float-soft" />

        {/* Light Mode Subtle ECG Pulse Flow */}
        <div className="absolute top-1/4 left-0 right-0 h-40 opacity-[0.05] pointer-events-none overflow-hidden flex items-center">
          <svg className="w-full h-16 text-emerald-600 animate-ecg-flow" viewBox="0 0 1200 100" preserveAspectRatio="none" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M0,50 L280,50 L290,20 L300,80 L310,30 L320,65 L330,50 L580,50 L590,15 L600,85 L610,25 L620,70 L630,50 L1200,50" />
          </svg>
        </div>

        {/* Light Mode Geometric Ring Contour */}
        <div className="absolute top-24 right-1/4 h-[32rem] w-[32rem] rounded-full border border-slate-300/40 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_30%,transparent_100%)] pointer-events-none" />
      </div>

      {/* DARK THEME BACKGROUND ENGINE */}
      <div className="hidden dark:block absolute inset-0 bg-[#020617]">
        {/* Subtle Dark Mesh Ambient Radial Glows */}
        <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_15%_15%,rgba(16,185,129,0.07),transparent_45%),radial-gradient(circle_at_85%_25%,rgba(20,184,166,0.06),transparent_40%),radial-gradient(circle_at_50%_75%,rgba(14,165,233,0.05),transparent_50%)]" />

        {/* Dark Mode Technical Slate Dot Matrix */}
        <div
          className="absolute inset-0 opacity-[0.3] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_25%,#000_50%,transparent_100%)]"
          style={{
            backgroundImage: `radial-gradient(rgba(51, 65, 85, 0.6) 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Dark Mode Engineering Grid Lines */}
        <div
          className="absolute inset-0 opacity-[0.12] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_35%,#000_40%,transparent_100%)]"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(30, 41, 59, 0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(30, 41, 59, 0.6) 1px, transparent 1px)`,
            backgroundSize: '96px 96px',
          }}
        />

        {/* Dark Mode Ambient Floating Soft Orbs */}
        <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-emerald-500/10 blur-[150px] animate-float-soft" />
        <div className="absolute top-[35%] -right-32 h-[30rem] w-[30rem] rounded-full bg-teal-500/8 blur-[160px] animate-float-medium" />
        <div className="absolute bottom-10 left-[20%] h-[26rem] w-[26rem] rounded-full bg-cyan-500/6 blur-[150px] animate-float-soft" />

        {/* Dark Mode Subtle ECG Pulse Flow */}
        <div className="absolute top-1/4 left-0 right-0 h-40 opacity-[0.06] pointer-events-none overflow-hidden flex items-center">
          <svg className="w-full h-16 text-emerald-400 animate-ecg-flow" viewBox="0 0 1200 100" preserveAspectRatio="none" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M0,50 L280,50 L290,20 L300,80 L310,30 L320,65 L330,50 L580,50 L590,15 L600,85 L610,25 L620,70 L630,50 L1200,50" />
          </svg>
        </div>

        {/* Dark Mode Geometric Ring Contour */}
        <div className="absolute top-24 right-1/4 h-[32rem] w-[32rem] rounded-full border border-slate-800/60 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_30%,transparent_100%)] pointer-events-none" />
      </div>
    </div>
  );
}
