"use client";

import { AnimatedSection } from "./AnimatedSection";
import { Heart, Activity, FileText, Calendar, Pill, MessageSquare } from "lucide-react";

const floatingCards = [
  {
    icon: Heart,
    label: "Heart Rate",
    value: "72 BPM",
    color: "primary",
    position: "top-10 -left-8",
  },
  {
    icon: Activity,
    label: "Blood Pressure",
    value: "120/80",
    color: "secondary",
    position: "top-24 -right-10",
  },
  {
    icon: FileText,
    label: "Health Score",
    value: "94/100",
    color: "accent",
    position: "bottom-32 -left-10",
  },
  {
    icon: Calendar,
    label: "Appointment",
    value: "Tomorrow",
    color: "primary",
    position: "bottom-16 -right-8",
  },
  {
    icon: Pill,
    label: "Medication Alert",
    value: "8:00 AM",
    color: "secondary",
    position: "top-1/2 -left-14",
  },
  {
    icon: MessageSquare,
    label: "Medical Summary",
    value: "Updated",
    color: "accent",
    position: "bottom-8 left-1/2 -translate-x-1/2",
  },
];

const colorMap = {
  primary: "bg-primary/10 text-primary border-primary/20",
  secondary: "bg-secondary/10 text-secondary border-secondary/20",
  accent: "bg-accent/10 text-accent border-accent/20",
};

export function Showcase() {
  return (
    <section id="showcase" className="section-padding relative overflow-hidden bg-background">
      {/* Background gradient orbs */}
      <div className="pointer-events-none absolute top-0 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/5 to-secondary/5 blur-3xl" />

      <div className="container-landing relative z-10">
        <AnimatedSection className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
            AI Showcase
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            AI Healthcare Showcase
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            A central AI assistant surrounded by live health cards, giving every patient a complete
            picture at a glance.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.2}>
          <div className="relative mx-auto max-w-4xl">
            {/* Central AI assistant mockup */}
            <div className="relative mx-auto max-w-2xl rounded-3xl border border-border bg-card p-8 shadow-2xl shadow-primary/10">
              <div className="flex items-center gap-4 border-b border-border pb-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg">
                  <svg
                    className="h-7 w-7"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2a3 3 0 0 0-3 3v14a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M12 18h.01" />
                    <path d="M12 14h.01" />
                    <path d="M12 10h.01" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">MedAssist AI Assistant</h3>
                  <p className="text-sm text-muted-foreground">Always learning, always helping</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-success" />
                  </span>
                  <span className="text-sm font-medium text-success">Online</span>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 2a3 3 0 0 0-3 3v14a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                      <path d="M12 18h.01" />
                      <path d="M12 14h.01" />
                      <path d="M12 10h.01" />
                    </svg>
                  </div>
                  <div className="rounded-2xl rounded-tl-none bg-muted p-4 text-sm text-foreground">
                    Hello, I&apos;ve analyzed your recent vitals and noticed your sleep quality has
                    improved 12% this week. Keep maintaining your current routine.
                  </div>
                </div>

                <div className="flex items-start gap-3 justify-end">
                  <div className="rounded-2xl rounded-tr-none bg-primary p-4 text-sm text-primary-foreground">
                    That&apos;s great news. Can you show me my heart rate trends?
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 2a3 3 0 0 0-3 3v14a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                      <path d="M12 18h.01" />
                      <path d="M12 14h.01" />
                      <path d="M12 10h.01" />
                    </svg>
                  </div>
                  <div className="rounded-2xl rounded-tl-none bg-muted p-4 text-sm text-foreground">
                    Your resting heart rate has remained stable at 68-72 BPM over the past 14 days.
                    Here is a summary card for your records.
                  </div>
                </div>
              </div>

              {/* Mock chart inside assistant */}
              <div className="mt-6 rounded-2xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Heart Rate Trend</span>
                  <span className="text-xs text-muted-foreground">Last 14 days</span>
                </div>
                <div className="flex h-24 items-end gap-2">
                  {[68, 70, 69, 72, 71, 73, 70, 69, 71, 72, 70, 68, 69, 71].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-primary/30 transition-all hover:bg-primary"
                      style={{ height: `${((h - 60) / 20) * 100}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Floating info cards */}
            {floatingCards.map((card, index) => (
              <div
                key={card.label}
                className={`absolute hidden rounded-2xl border bg-card p-3 shadow-lg lg:flex lg:items-center lg:gap-3 ${colorMap[card.color as keyof typeof colorMap]} ${card.position} ${index % 2 === 0 ? "floating" : "floating-delayed"}`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/50">
                  <card.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium opacity-80">{card.label}</p>
                  <p className="text-sm font-bold">{card.value}</p>
                </div>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
