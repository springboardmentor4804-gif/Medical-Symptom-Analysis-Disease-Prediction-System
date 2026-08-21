"use client";

import { AnimatedSection, AnimatedStagger, AnimatedStaggerItem } from "./AnimatedSection";
import { FileText, Bot, ClipboardList, Calendar, BarChart3, Siren } from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Patient Records",
    description:
      "Centralized digital records with secure access, complete history, and smart organization for every patient.",
    color: "primary",
  },
  {
    icon: Bot,
    title: "AI Health Assistant",
    description:
      "Intelligent virtual assistant that answers health questions, suggests next steps, and supports clinical decisions.",
    color: "secondary",
  },
  {
    icon: ClipboardList,
    title: "Medical Reports",
    description:
      "Generate, store, and share detailed medical reports with clear insights and automated summaries.",
    color: "accent",
  },
  {
    icon: Calendar,
    title: "Appointments",
    description:
      "Schedule, manage, and remind patients about appointments with an intuitive calendar interface.",
    color: "primary",
  },
  {
    icon: BarChart3,
    title: "Health Analytics",
    description:
      "Transform health data into actionable visual dashboards for providers and patients.",
    color: "secondary",
  },
  {
    icon: Siren,
    title: "Emergency Support",
    description: "AI will be used for emergency if you need something sudden.",
    color: "accent",
  },
];

const colorMap = {
  primary: "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground",
  secondary:
    "bg-secondary/10 text-secondary group-hover:bg-secondary group-hover:text-secondary-foreground",
  accent: "bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground",
};

export function Highlights() {
  return (
    <section id="highlights" className="section-padding bg-muted/30">
      <div className="container-landing">
        <AnimatedSection className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
            Platform Highlights
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Everything Healthcare Needs
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            A complete suite of tools designed to streamline care delivery, improve outcomes, and
            elevate the patient experience.
          </p>
        </AnimatedSection>

        <AnimatedStagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.1}>
          {features.map((feature) => (
            <AnimatedStaggerItem key={feature.title}>
              <div className="group h-full rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/5">
                <div
                  className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 ${colorMap[feature.color as keyof typeof colorMap]}`}
                >
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            </AnimatedStaggerItem>
          ))}
        </AnimatedStagger>
      </div>
    </section>
  );
}
