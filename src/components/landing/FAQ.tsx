"use client";

import { AnimatedSection } from "./AnimatedSection";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is AI healthcare?",
    answer:
      "AI healthcare applies artificial intelligence to medical data, enabling faster diagnosis, predictive insights, personalized treatment plans, and streamlined administrative tasks for better patient outcomes.",
  },
  {
    question: "How does digital health management work?",
    answer:
      "Digital health management consolidates patient records, appointments, lab results, and monitoring devices into a single platform, making it easier for providers and patients to stay aligned on care.",
  },
  {
    question: "Is patient information secure?",
    answer:
      "Yes. The platform uses enterprise-grade encryption, role-based access controls, audit logging, and compliance-aligned infrastructure to protect sensitive health information at every layer.",
  },
  {
    question: "Can healthcare providers collaborate?",
    answer:
      "Absolutely. Care teams can share notes, coordinate treatment plans, and communicate securely within the platform, ensuring every provider has the context they need.",
  },
  {
    question: "What devices can integrate with the platform?",
    answer:
      "MedAssist AI supports a wide range of wearable devices, smart monitors, and EHR systems through standardized interoperability protocols, bringing all health data into one unified view.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="section-padding bg-background">
      <div className="container-landing max-w-3xl">
        <AnimatedSection className="mb-12 text-center">
          <span className="mb-4 inline-block rounded-full bg-accent/10 px-4 py-1.5 text-sm font-semibold text-accent">
            FAQ
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to know about the platform.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.2}>
          <Accordion
            type="single"
            collapsible
            className="rounded-2xl border border-border bg-card p-2 shadow-sm"
          >
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="px-4 last:border-b-0">
                <AccordionTrigger className="text-base font-semibold text-foreground hover:text-primary hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </AnimatedSection>
      </div>
    </section>
  );
}
