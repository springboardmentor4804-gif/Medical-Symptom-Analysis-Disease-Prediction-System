"use client";

import { AnimatedSection, AnimatedStagger, AnimatedStaggerItem } from "./AnimatedSection";
import { UserCircle, Search, FileCheck, HeartPulse } from "lucide-react";

const steps = [
  {
    icon: UserCircle,
    title: "Patient Information",
    description:
      "Capture and organize complete patient profiles, histories, and preferences in one secure place.",
    color: "primary",
  },
  {
    icon: Search,
    title: "Health Analysis",
    description:
      "AI analyzes symptoms, vitals, and records to surface patterns and potential risks.",
    color: "secondary",
  },
  {
    icon: FileCheck,
    title: "Medical Recommendations",
    description:
      "Receive evidence-based suggestions and personalized care plans for better outcomes.",
    color: "accent",
  },
  {
    icon: HeartPulse,
    title: "Health Monitoring",
    description:
      "Track recovery, adherence, and wellness metrics over time with continuous feedback.",
    color: "primary",
  },
];

const colorMap = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  accent: "bg-accent/10 text-accent",
};

export function Workflow() {
  return (
    <section id="workflow" className="section-padding bg-background">
      <div className="container-landing">
        <AnimatedSection className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full bg-secondary/10 px-4 py-1.5 text-sm font-semibold text-secondary">
            How It Works
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Healthcare Workflow
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            A simple, connected path from patient intake to ongoing health management.
          </p>
        </AnimatedSection>

        <AnimatedStagger
          className="relative grid gap-8 md:grid-cols-2 lg:grid-cols-4"
          staggerDelay={0.15}
        >
          {steps.map((step, index) => (
            <AnimatedStaggerItem key={step.title}>
              <div className="relative flex h-full flex-col items-center text-center">
                {/* Connecting line for desktop */}
                {index < steps.length - 1 && (
                  <div className="absolute top-10 left-1/2 hidden h-0.5 w-full bg-gradient-to-r from-border via-primary/30 to-border lg:block" />
                )}

                <div className="relative z-10 mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-card shadow-lg shadow-primary/5 transition-all duration-300 hover:scale-105">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-xl ${colorMap[step.color as keyof typeof colorMap]}`}
                  >
                    <step.icon className="h-7 w-7" />
                  </div>
                  <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                </div>

                <h3 className="text-xl font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </AnimatedStaggerItem>
          ))}
        </AnimatedStagger>
      </div>
    </section>
  );
}
