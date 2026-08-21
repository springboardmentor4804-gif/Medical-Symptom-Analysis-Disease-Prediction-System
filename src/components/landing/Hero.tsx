"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  Calendar,
  FileText,
  Heart,
  MessageSquare,
  Users,
  Stethoscope,
  ShieldCheck,
  Clock,
} from "lucide-react";
import heroDashboard from "@/assets/hero-dashboard.png";

const stats = [
  {
    value: 10,
    suffix: "K+",
    label: "Patients Supported",
    icon: Users,
    color: "primary",
  },
  {
    value: 250,
    suffix: "+",
    label: "Healthcare Professionals",
    icon: Stethoscope,
    color: "secondary",
  },
  {
    value: 99.8,
    suffix: "%",
    label: "Platform Reliability",
    icon: ShieldCheck,
    color: "accent",
    decimals: 1,
  },
  {
    value: 24,
    suffix: "/7",
    label: "AI Assistance",
    icon: Clock,
    color: "primary",
  },
];

const colorMap = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  accent: "bg-accent/10 text-accent",
};

export function Hero() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section
      id="hero"
      className="relative min-h-screen overflow-hidden bg-background pt-24 pb-16 lg:pt-32 lg:pb-24"
    >
      {/* Floating background shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-primary/5 floating" />
        <div className="absolute top-40 right-20 h-96 w-96 rounded-full bg-secondary/5 floating-delayed" />
        <div className="absolute bottom-20 left-1/4 h-64 w-64 rounded-full bg-accent/5 floating-slow" />
        <div className="absolute top-1/3 right-1/3 h-48 w-48 rounded-full bg-primary/5 floating" />
        <div className="absolute bottom-1/3 left-10 h-32 w-32 rounded-full bg-secondary/5 floating-delayed" />
      </div>

      <div className="container-landing relative z-10">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left content */}
          <div className="text-center lg:text-left transition-all duration-700 ease-out">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              AI-Powered Healthcare Platform
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl animate-fade-in">
              Smarter Healthcare <span className="text-gradient-primary">Begins Here</span>
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              An AI-powered healthcare ecosystem designed to simplify patient care, enhance medical
              workflows, and provide intelligent health insights.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground lg:justify-start">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Heart className="h-4 w-4" />
                </div>
                <span>Patient-first care</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                  <Activity className="h-4 w-4" />
                </div>
                <span>Real-time analytics</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <Users className="h-4 w-4" />
                </div>
                <span>Seamless collaboration</span>
              </div>
            </div>
          </div>

          {/* Right dashboard illustration */}
          <div className="relative transition-all duration-700 ease-out">
            <div className="relative rounded-3xl glass-card p-3 shadow-2xl shadow-primary/10">
              <img
                src={heroDashboard.src}
                alt="Modern healthcare dashboard with patient records, analytics, and AI assistant"
                className="w-full rounded-2xl"
                loading="eager"
              />

              {/* Floating stat cards using custom CSS float animations */}
              <div className="absolute -top-4 -left-4 rounded-2xl bg-card p-4 shadow-lg shadow-primary/10 floating">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Heart className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Heart Rate</p>
                    <p className="text-lg font-bold text-foreground">72 BPM</p>
                  </div>
                </div>
              </div>

              <div className="absolute -right-4 top-1/4 rounded-2xl bg-card p-4 shadow-lg shadow-secondary/10 floating-delayed">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Next Appointment</p>
                    <p className="text-sm font-semibold text-foreground">Today, 2:30 PM</p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 rounded-2xl bg-card p-4 shadow-lg shadow-accent/10 floating-slow">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">AI Assistant</p>
                    <p className="text-sm font-semibold text-foreground">Ready to help</p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -right-4 rounded-2xl bg-card p-4 shadow-lg shadow-primary/10 floating">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Reports</p>
                    <p className="text-sm font-semibold text-foreground">12 generated</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats embedded directly in Hero */}
        <div className="mt-16 border-t border-border/50 pt-12">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5"
              >
                <div
                  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${colorMap[stat.color as keyof typeof colorMap]}`}
                >
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="text-3xl font-bold tracking-tight text-foreground">
                  <span>
                    {stat.value}
                    {stat.suffix}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
