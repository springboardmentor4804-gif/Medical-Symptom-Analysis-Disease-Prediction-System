"use client";

import { motion } from "framer-motion";
import { AnimatedSection, AnimatedStagger, AnimatedStaggerItem } from "./AnimatedSection";
import { Brain, Zap, Shield, Activity, Smile } from "lucide-react";
import healthcareIllustration from "@/assets/healthcare-illustration.png";

const benefits = [
  {
    icon: Brain,
    title: "AI-driven insights",
    description:
      "Machine learning models transform raw data into clear, actionable health insights.",
    color: "primary",
  },
  {
    icon: Zap,
    title: "Fast medical record access",
    description:
      "Retrieve complete patient histories instantly with intelligent search and filters.",
    color: "secondary",
  },
  {
    icon: Shield,
    title: "Secure healthcare environment",
    description:
      "Enterprise-grade encryption, access controls, and compliance-ready infrastructure.",
    color: "accent",
  },
  {
    icon: Activity,
    title: "Real-time health monitoring",
    description: "Live dashboards and alerts keep care teams informed around the clock.",
    color: "primary",
  },
  {
    icon: Smile,
    title: "Improved patient experience",
    description: "Simpler scheduling, clear communication, and personalized care journeys.",
    color: "secondary",
  },
];

const colorMap = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  accent: "bg-accent/10 text-accent",
};

export function WhyChoose() {
  return (
    <section id="why-choose" className="section-padding bg-muted/30">
      <div className="container-landing">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <AnimatedSection direction="left">
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/10 to-secondary/10" />
              <div className="relative rounded-3xl bg-card p-3 shadow-xl shadow-primary/10 floating">
                <img
                  src={healthcareIllustration.src}
                  alt="Healthcare professionals using AI-powered medical platform"
                  className="w-full rounded-2xl"
                  loading="lazy"
                />
              </div>
            </div>
          </AnimatedSection>

          <div>
            <AnimatedSection className="mb-10">
              <span className="mb-4 inline-block rounded-full bg-accent/10 px-4 py-1.5 text-sm font-semibold text-accent">
                Why Choose Us
              </span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Why Choose This Platform
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Built for modern care teams that demand security, speed, and intelligent support.
              </p>
            </AnimatedSection>

            <AnimatedStagger className="space-y-4" staggerDelay={0.12}>
              {benefits.map((benefit) => (
                <AnimatedStaggerItem key={benefit.title}>
                  <div className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-x-1 hover:shadow-md hover:shadow-primary/5">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${colorMap[benefit.color as keyof typeof colorMap]}`}
                    >
                      <benefit.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{benefit.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                </AnimatedStaggerItem>
              ))}
            </AnimatedStagger>
          </div>
        </div>
      </div>
    </section>
  );
}
